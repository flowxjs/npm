import crypto from 'crypto';
import path from 'path';
import BodyParser from 'koa-bodyparser';
import { ensureDirSync, writeFileSync, removeSync } from 'fs-extra';
import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { NFS } from '../../../app.config';
import { TPackageInput, TPackageNormalizeOutput } from '../dto/package.dto';
import { UserException } from '../exceptions/user.exception';
import { MaintainerService } from '../../../modules/maintainer/maintainer.service';
import { PackageService } from '../../../modules/package/package.service';
import { THttpContext } from '../../../app.bootstrap';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { MaintainerEntity } from '../../../modules/maintainer/maintainer.mysql.entity';
import { DependencyEntity } from '../../../modules/dependencies/dependency.mysql.entity';
import { VersionEntity } from '../../../modules/version/version.mysql.entity';
import { VersionService } from '../../../modules/version/version.service';
import { DependenciesService } from '../../../modules/dependencies/dependencies.service';
import { KeywordEntity } from '../../../modules/keywords/keyword.mysql.entity';
import { KeywordService } from '../../../modules/keywords/keyword.service';
import { TagService } from '../../../modules/tags/tags.service';
import { TagEntity } from '../../../modules/tags/tags.mysql.entity';
import { ConfigService } from '../../../modules/configs/config.service';
import { ConfigEntity } from '../../../modules/configs/config.mysql.entity';
import { getCache } from '@flowx/redis';
import { PACKAGE_URI_MODE } from '../dto/package.router.enum';
import { Authorization } from '../middlewares/authorize';
import { IsLogined } from '../guards/is-logined';
import { 
  Controller, 
  useException, 
  Body, Put, Params, Ctx,
  useMiddleware, 
  BadRequestException, 
  useGuard,
} from '@flowx/http';

@Controller()
@useException(UserException)
export class HttpPublishController {
  @inject('MySQL') connection: Connection;
  @inject(MaintainerService) private MaintainerService: MaintainerService;
  @inject(PackageService) private PackageService: PackageService;
  @inject(VersionService) private VersionService: VersionService;
  @inject(DependenciesService) private DependenciesService: DependenciesService;
  @inject(KeywordService) private KeywordService: KeywordService;
  @inject(TagService) private TagService: TagService;
  @inject(ConfigService) private ConfigService: ConfigService;

  @Put(PACKAGE_URI_MODE.SCOPE_COMPOSITION)
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useMiddleware(BodyParser())
  packageActionComposition(
    @Params('scope') scope: string,
    @Body() body: TPackageInput,
    @Ctx() ctx: THttpContext
  ): Promise<TPackageNormalizeOutput> {
    const value = decodeURIComponent(scope);
    const chunk = value.split('/');
    return this.togglePackageActions(ctx, body, {
      scope: chunk[0],
      pkgname: chunk[1],
    });
  }

  @Put(PACKAGE_URI_MODE.SCOPE_NORMALIZE)
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useMiddleware(BodyParser())
  packageActionCompositionOrWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Body() body: TPackageInput,
    @Ctx() ctx: THttpContext
  ) {
    let _scope: string, _pkgname: string, _version: string;
    if (/^\d+\.\d+\.\d+(\-.+)?$/.test(pkgname)) {
      const value = decodeURIComponent(scope);
      const chunk = value.split('/');
      _version = pkgname;
      _scope = chunk[0];
      _pkgname = chunk[1];
    } else {
      _scope = scope;
      _pkgname = pkgname;
    }
    return this.togglePackageActions(ctx, body, {
      scope: _scope,
      pkgname: _pkgname,
      version: _version,
    });
  }

  @Put(PACKAGE_URI_MODE.SCOPE_NORMALIZE_WITH_VERSION)
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useMiddleware(BodyParser())
  packageActionWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Body() body: TPackageInput,
    @Ctx() ctx: THttpContext
  ) {
    return this.togglePackageActions(ctx, body, { scope, pkgname, version });
  }

  private async togglePackageActions(
    ctx: THttpContext, 
    body: TPackageInput, 
    value: { scope: string, pkgname: string, version?: string }
  ): Promise<TPackageNormalizeOutput> {
    await this.publish(ctx.user, value, body);
    return {
      ok: true,
    }
  }

  private async publish(user: THttpContext['user'], meta: {
    scope: string;
    pkgname: string;
    version?: string;
  }, pkg: TPackageInput) {
    const filename = Object.keys(pkg._attachments)[0];
    const version = Object.keys(pkg.versions)[0];
    const distTags = pkg['dist-tags'] || {};
    const attachment = pkg._attachments[filename];
    
    if (meta.version && meta.version !== version) {
      throw new BadRequestException('错误的版本');
    }

    meta.scope = '@' + meta.scope;

    // 将上传的包的base64数据转换成Buffer流
    // 以便使用fs存储到磁盘上
    const tarballBuffer = Buffer.from(attachment.data, 'base64');
    const tarballDictionary = path.resolve(NFS, meta.scope, meta.pkgname);
    const tarballFilename = path.resolve(tarballDictionary, version + '.tgz');
    const tarbalDBPath = path.resolve('/', meta.scope, meta.pkgname, version + '.tgz');
    if (tarballBuffer.length !== attachment.length) {
      throw new BadRequestException(`size_wrong: Attachment size ${attachment.length} not match download size ${tarballBuffer.length}`);
    }

    // 创建 tarball 的 Buffer 流的 shasum 编码
    const shasum = this.createShasumCode(tarballBuffer);

    // 检测shasum编码是否合法
    if (pkg.versions[version].dist.shasum !== shasum) {
      throw new BadRequestException(`shasum_wrong: Attachment shasum ${shasum} not match download size ${pkg.versions[version].dist.shasum}`);
    }

    // 修改tarball地址
    // pkg.versions[version].dist.tarball = url.resolve(DOMAIN, '/-/download/' + meta.scope + '/' + meta.pkgname + '/' + version);

    // 创建事务处理
    const runner = this.connection.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    const PackageRepository = runner.manager.getRepository(PackageEntity);
    const MaintainerRepository = runner.manager.getRepository(MaintainerEntity);
    const DependenciesRepository = runner.manager.getRepository(DependencyEntity);
    const VersionRepository = runner.manager.getRepository(VersionEntity);
    const KeywordRepository = runner.manager.getRepository(KeywordEntity);
    const TagRepository = runner.manager.getRepository(TagEntity);
    const ConfigsRepository = runner.manager.getRepository(ConfigEntity);

    const events: (() => void)[] = [];

    const configs = await this.ConfigService.query(ConfigsRepository);

    if (configs.scopes.indexOf(meta.scope) === -1) {
      throw new BadRequestException(`你没有私有源${meta.scope}的发布权限`);
    }

    try {
      const packageExists = !!(await this.PackageService.findByPathname(PackageRepository, meta.scope + '/' + meta.pkgname));
      let PackageChunk = await this.PackageService.insert(PackageRepository, meta.scope + '/' + meta.pkgname, user.id);

      // 当已存在模块
      // 检测当前用户是否具有发布权限
      if (packageExists) {
        const maintainerCount = await this.MaintainerService.getCountByPidAndUid(MaintainerRepository, PackageChunk.id, user.id);
        if (maintainerCount === 0) throw new BadRequestException('你没有权限提交此模块');
      }

      // 检测版本提交的合法性
      // 如果我们存在 ['1.5.3', '1.5.5', '1.6.4', '2.1.5']这些版本
      // 那么我们可以提交的版本有 ['1.5.6', '1.6.5', '1.7.0', '2.1.6', '2.0.9']等
      // 不能提交的版本有 ['1.5.4', '1.6.4', '2.1.5', '2.0.8'] 等
      if (!(await this.VersionService.canVersionPublish(VersionRepository, PackageChunk.id, version))) {
        throw new BadRequestException('当前版本不能被发布，请升级版本后重试!');
      }

      ////////////////////////////////////////////////////
      // 开始入库
      ////////////////////////////////////////////////////

      // 插入协同开发者
      const maintainer = await this.MaintainerService.add(MaintainerRepository, PackageChunk.id, user.id);
      PackageChunk.Maintainers.push(maintainer);

      // 插入版本
      const Version = await this.VersionService.insert(
        VersionRepository,
        user.id,
        PackageChunk.id,
        version,
        JSON.stringify(pkg.versions[version].bugs),
        pkg.description,
        pkg.versions[version].homepage,
        pkg.versions[version].license,
        pkg.versions[version].readme,
        JSON.stringify(pkg.versions[version].repository),
        shasum,
        tarbalDBPath,
        pkg.versions[version].dist.integrity,
        attachment.length
      );
      PackageChunk.Versions.push(Version);

      // 添加各种依赖
      Version.Dependencies.push(...await this.DependenciesService.autoAddMany(DependenciesRepository, pkg.versions[version].dependencies || {}, null, Version.id));
      Version.Dependencies.push(...await this.DependenciesService.autoAddMany(DependenciesRepository, pkg.versions[version].devDependencies || {}, 'dev', Version.id));
      Version.Dependencies.push(...await this.DependenciesService.autoAddMany(DependenciesRepository, pkg.versions[version].peerDependencies || {}, 'peer', Version.id));
      Version.Dependencies.push(...await this.DependenciesService.autoAddMany(DependenciesRepository, pkg.versions[version].optionalDependencies || {}, 'optional', Version.id));
      Version.Dependencies.push(...await this.DependenciesService.autoAddMany(DependenciesRepository, pkg.versions[version].bundledDenpendencies || {}, 'bundled', Version.id));

      // 添加关键字
      Version.Keywords.push(...await this.KeywordService.autoAddMany(KeywordRepository, Version.id, pkg.versions[version].keywords || []));

      // 保存版本信息
      await VersionRepository.save(Version);
      
      // 保存模块
      await PackageRepository.save(PackageChunk);

      // 添加dist-tags
      PackageChunk.Tags.push(...await this.TagService.autoAddMany(TagRepository, VersionRepository, PackageChunk.id, distTags));

      // 更新外键
      await PackageRepository.save(PackageChunk);

      await getCache(PackageService, 'info').build(PackageRepository, meta.scope, meta.pkgname);
      ensureDirSync(tarballDictionary);
      writeFileSync(tarballFilename, tarballBuffer);
      events.push(() => removeSync(tarballFilename));

      await runner.commitTransaction();
    } catch(e) {
      await runner.rollbackTransaction();
      let i = events.length;
      while (i--) events[i]();
      throw e;
    } finally {
      await runner.release();
    }
  }

  /**
   * 数据源SHA1加密
   * @param tarballBuffer {Buffer} 数据源Buffer
   * @returns string
   */
  createShasumCode(tarballBuffer: Buffer) {
    const shasum = crypto.createHash('sha1');
    shasum.update(tarballBuffer);
    return shasum.digest('hex');
  }
}