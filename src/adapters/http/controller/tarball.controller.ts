import { unlinkSync, existsSync, createReadStream } from 'fs-extra';
import path from 'path';
import { Controller, Delete, Params, BadGatewayException, Get, NotFoundException } from '@flowx/http';
import { inject } from 'inversify';
import { TypeRedis } from '@flowx/redis';
import { NFS } from '../../../app.config';

@Controller('/-/download')
export class HttpTarBallController {
  @inject('Redis') private redis: TypeRedis;

  @Get('/@:scope/:pkgname/:version')
  async Download(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
  ) {
    scope = '@' + scope;
    const tarballDictionary = path.resolve(NFS, scope, pkgname);
    const tarballFilename = path.resolve(tarballDictionary, version);
    if (!tarballFilename.endsWith('.tgz')) throw new BadGatewayException('invaild package suffix extion.');
    if (!existsSync(tarballFilename)) throw new NotFoundException('找不到模块包');
    return createReadStream(tarballFilename);
  }

  @Delete('/@:scope/:pkgname/:version/-rev/:rev')
  async DeleteTarball(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Params('rev') rev: string
  ) {
    scope = '@' + scope;
    const revRedis = await this.redis.get(rev);
    if (revRedis !== scope + '/' + pkgname) {
      throw new BadGatewayException('非法操作');
    }
    this.deleteFile(scope, pkgname, version);
    await this.redis.del(rev);
    return {
      _id: `${scope}/${pkgname}@${version}`,
      _rev: rev
    }
  }

  deleteFile(
    scope: string,
    pkgname: string,
    version: string,
  ) {
    const tarballDictionary = path.resolve(NFS, scope, pkgname);
    const tarballFilename = path.resolve(tarballDictionary, version);
    if (existsSync(tarballFilename)) {
      unlinkSync(tarballFilename);
    }
  }
}