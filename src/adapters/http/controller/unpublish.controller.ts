import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { Controller, Put, Delete, Params, Body, BadRequestException, PayloadTooLargeException, Ctx, NotAcceptableException, useMiddleware, useGuard, BadGatewayException } from '@flowx/http';
import { DecodeURIComponentPipe } from '../pipes/decodeURIComponent';
import { TPackageInfomation } from '../../../modules/package/package.dto';
import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { getCache, TypeRedis } from '@flowx/redis';
import { PackageService } from '../../../modules/package/package.service';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { VersionService } from '../../../modules/version/version.service';
import { VersionEntity } from '../../../modules/version/version.mysql.entity';
import { DependencyEntity } from '../../../modules/dependencies/dependency.mysql.entity';
import { KeywordEntity } from '../../../modules/keywords/keyword.mysql.entity';
import { THttpContext } from '../../../app.bootstrap';
import { TagService } from '../../../modules/tags/tags.service';
import { TagEntity } from '../../../modules/tags/tags.mysql.entity';
import { MaintainerService } from '../../../modules/maintainer/maintainer.service';
import { MaintainerEntity } from '../../../modules/maintainer/maintainer.mysql.entity';
import { IsLogined } from '../guards/is-logined';
import { Authorization } from '../middlewares/authorize';

@Controller()
export class HttpUnPublishController {
  @inject('Redis') private redis: TypeRedis;
  @inject('MySQL') private connection: Connection;
  @inject(PackageService) private PackageService: PackageService;
  @inject(VersionService) private VersionService: VersionService;
  @inject(TagService) private TagService: TagService;
  @inject(MaintainerService) private MaintainerService: MaintainerService;

  @Put('/@:pkgname/-rev/:rev')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useMiddleware(BodyParser())
  async UnPublishPackage(
    @Params('pkgname', DecodeURIComponentPipe) pkgname: string,
    @Params('rev') rev: string,
    @Body() body: TPackageInfomation,
    @Ctx() ctx: Koa.ParameterizedContext<any, THttpContext>
  ) {
    const scope = '@' + pkgname.split('/')[0];
    const name = pkgname.split('/')[1];

    const revRedis = await this.redis.get(rev);
    if (revRedis !== scope + '/' + name) {
      throw new BadGatewayException('非法操作');
    }

    const runner = this.connection.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    const PackageRepository = runner.manager.getRepository(PackageEntity);
    const VersionRepository = runner.manager.getRepository(VersionEntity);
    const DependencyRepository = runner.manager.getRepository(DependencyEntity);
    const keywordRepository = runner.manager.getRepository(KeywordEntity);
    const TagRepository = runner.manager.getRepository(TagEntity);
    const MaintainerRepository = runner.manager.getRepository(MaintainerEntity);
    
    const Package = await this.PackageService.findByScopeAndName(PackageRepository, scope, name);
    if (!Package) throw new BadRequestException('找不到模块');
    const versions = await this.VersionService.findVersionsByPid(VersionRepository, Package.id);
    const deletedVersions = this.ComputedUnPublishVersions(versions, body.versions);
    if (deletedVersions.length !== 1) throw new PayloadTooLargeException('删除模块个数过多');
    const tags = await this.TagService.getByVid(TagRepository, deletedVersions[0].id);
    const uid = ctx.user.id;

    // 如果没有在协作者列表中
    // 那么无法删除模块
    const maintainerCount = await this.MaintainerService.getCountByPidAndUid(MaintainerRepository, Package.id, uid);
    if (maintainerCount === 0) throw new NotAcceptableException('你没有权限删除此模块');

    // 如果当前用户既不是模块发布者也不是版本发布者
    // 那么无法删除模块
    if (Package.uid !== uid && deletedVersions[0].uid !== uid) {
      throw new NotAcceptableException('您没有删除模块的权限');
    }
    
    try {
      await this.VersionService.delete(
        VersionRepository, 
        DependencyRepository, 
        keywordRepository, 
        deletedVersions[0].id
      );
      // 如果是latest被删除
      const deleteCallback = await this.TagService.deleteByIds(TagRepository, tags);
      if (deleteCallback) {
        // 那么我们从新从数据库获取更新时间为最新的版本数据
        const latestVersion = await this.VersionService.findLatestVersion(VersionRepository);
        // 重新设置latest版本的版本
        // 以保证latest存在
        // 如果已经没有版本数据
        // 那么我们删除这条数据
        await deleteCallback(latestVersion);
      }
      await getCache(PackageService, 'info').build(PackageRepository, scope, name);
      await runner.commitTransaction();
    } catch(e) {
      await runner.rollbackTransaction();
    } finally {
      await runner.release();
    }
    return {
      ok: true,
      _id: `${scope}/${name}@${deletedVersions[0].code}`,
      name: `${scope}/${name}@${deletedVersions[0].code}`,
      _rev: rev,
    }
  }
  @Delete('/@:pkgname/-rev/:rev')
  DeleteEmptyPackages() {
    
  }

  ComputedUnPublishVersions(
    oldVersions: VersionEntity[], 
    newVersions: TPackageInfomation['versions']
  ) {
    const old_versions = oldVersions;
    const new_versions = Object.keys(newVersions);
    const decreases: VersionEntity[] = [];
    for (let i = 0; i < old_versions.length; i++) {
      const version = old_versions[i];
      if (new_versions.indexOf(version.code) === -1) {
        decreases.push(version);
      }
    }
    return decreases;
  }
}