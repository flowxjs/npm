import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { Controller, Get, Params, useException, BadRequestException, Put, useMiddleware, useGuard, Body, Delete, Ctx, NotAcceptableException } from '@flowx/http';
import { DecodeURIComponentPipe } from '../pipes/decodeURIComponent';
import { inject } from 'inversify';
import { PackageService } from '../../../modules/package/package.service';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { Connection } from 'typeorm';
import { UserException } from '../exceptions/user.exception';
import { Authorization } from '../middlewares/authorize';
import { IsLogined } from '../guards/is-logined';
import { VersionEntity } from '../../../modules/version/version.mysql.entity';
import { VersionService } from '../../../modules/version/version.service';
import { TagEntity } from '../../../modules/tags/tags.mysql.entity';
import { TagService } from '../../../modules/tags/tags.service';
import { getCache } from '@flowx/redis';
import { THttpContext } from '../../../app.bootstrap';

@Controller('/-/package')
@useException(UserException)
export class HttpDistTagController {
  @inject('MySQL') private connection: Connection;
  @inject(PackageService) private PackageService: PackageService;
  @inject(VersionService) private VersionService: VersionService;
  @inject(TagService) private TagService: TagService;

  @Get('/@:pkgname/dist-tags')
  async List(@Params('pkgname', DecodeURIComponentPipe) pkgname: string) {
    const scope = '@' + pkgname.split('/')[0];
    const name = pkgname.split('/')[1];
    const PackageRepository = this.connection.getRepository(PackageEntity);
    const Package = await this.PackageService.info(PackageRepository, scope, name);
    if (!Package) throw new BadRequestException('找不到模块');
    return Package["dist-tags"];
  }

  @Get('/@:pkgname/dist-tags/:tag')
  async Single(
    @Params('pkgname', DecodeURIComponentPipe) pkgname: string,
    @Params('tag') tag: string
  ) {
    const tags = await this.List(pkgname);
    return tags[tag];
  }

  @Put('/@:pkgname/dist-tags/:tag')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useMiddleware(BodyParser({ strict: false }))
  async Add(
    @Params('pkgname', DecodeURIComponentPipe) pkgname: string,
    @Params('tag') tag: string,
    @Body() body: string,
    @Ctx() ctx: Koa.ParameterizedContext<any, THttpContext>
  ) {
    const scope = '@' + pkgname.split('/')[0];
    const name = pkgname.split('/')[1];
    const PackageRepository = this.connection.getRepository(PackageEntity);
    const VersionRepository = this.connection.getRepository(VersionEntity);
    const TagRepository = this.connection.getRepository(TagEntity);
    const Package = await this.PackageService.findByScopeAndName(PackageRepository, scope, name);
    if (!Package) throw new BadRequestException('找不到模块');
    if (Package.uid !== ctx.user.id) throw new NotAcceptableException('您没有权限操作');
    const version = await this.VersionService.findByPidAndCode(VersionRepository, Package.id, body);
    if (!version) throw new BadRequestException('找不到版本');
    const Tag = await this.TagService.getByPidAndNameSpace(TagRepository, Package.id, tag);
    if (!Tag) {
      await this.TagService.add(TagRepository, version.id, Package.id, tag);
    } else {
      Tag.vid = version.id;
      await TagRepository.save(Tag);
    }
    await getCache(PackageService, 'info').build(PackageRepository, scope, name);
  }

  @Delete('/@:pkgname/dist-tags/:tag')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  async Delete(
    @Params('pkgname', DecodeURIComponentPipe) pkgname: string,
    @Params('tag') tag: string,
    @Ctx() ctx: Koa.ParameterizedContext<any, THttpContext>
  ) {
    const scope = '@' + pkgname.split('/')[0];
    const name = pkgname.split('/')[1];
    const PackageRepository = this.connection.getRepository(PackageEntity);
    const VersionRepository = this.connection.getRepository(VersionEntity);
    const TagRepository = this.connection.getRepository(TagEntity);
    const Package = await this.PackageService.findByScopeAndName(PackageRepository, scope, name);
    if (!Package) throw new BadRequestException('找不到模块');
    if (Package.uid !== ctx.user.id) throw new NotAcceptableException('您没有权限操作');
    const Tag = await this.TagService.getByPidAndNameSpace(TagRepository, Package.id, tag);
    if (!Tag) throw new BadRequestException('找不到dist-tag:' + tag);
    if (tag === 'latest') {
      const version = await this.VersionService.findLatestVersionExculeVid(VersionRepository, Tag.vid);
      if (!version) throw new BadRequestException('不能删除这个Tag:' + tag);
      Tag.vid = version.id;
      await TagRepository.save(Tag);
    } else {
      await TagRepository.delete(Tag);
    }
    await getCache(PackageService, 'info').build(PackageRepository, scope, name);
  }
}