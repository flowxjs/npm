import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { TypeRedis } from '@flowx/redis';
import { ConfigService } from '../../../modules/configs/config.service';
import { PackageService } from '../../../modules/package/package.service';
import { ConfigEntity } from '../../../modules/configs/config.mysql.entity';
import { UserException } from '../exceptions/user.exception';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { PACKAGE_URI_MODE } from '../dto/package.router.enum';
import { HistoryStaticMiddleware } from '../middlewares/static';
import { 
  Controller, 
  useException, 
  Params, Get, Query,
  NotFoundException,
  useMiddleware
} from '@flowx/http';

@Controller()
@useException(UserException)
@useMiddleware(HistoryStaticMiddleware)
export class HttpFetchController {
  @inject('MySQL') private connection: Connection;
  @inject('Redis') private redis: TypeRedis;
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(PackageService) private PackageService: PackageService;

  /**
   * 获取当前模块
   * /:pkgname
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.NO_SCOPE)
  async getPackageNoScope(
    @Params('pkgname') pkgname: string,
    @Query('write') write?: 'true'
  ) {
    return this.getPackage({ pkgname }, write === 'true');
  }

  /**
   * 获取当前模块
   * /:pkgname/:version
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.NO_SCOPE_WITH_VESION)
  async getPackageNoScopeWithVersion(
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Query('write') write?: 'true'
  ) {
    return this.getPackage({ pkgname, version }, write === 'true');
  }

  /**
   * 获取当前模块
   * /@:scope
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.SCOPE_COMPOSITION)
  async getPackageComposition(
    @Params('scope') scope: string,
    @Query('write') write?: 'true'
  ) {
    const value = decodeURIComponent(scope);
    const chunk = value.split('/');
    return this.getPackage({ scope: chunk[0], pkgname: chunk[1] }, write === 'true');
  }

  /**
   * 获取当前模块
   * /@:scope/:pkgname
   * /@:scope/:version
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.SCOPE_NORMALIZE)
  async getPackageCompositionOrWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Query('write') write?: 'true'
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
    return this.getPackage({
      scope: _scope,
      pkgname: _pkgname,
      version: _version,
    }, write === 'true');
  }

  /**
   * 获取当前模块
   * /@:scope/:pkgname/:version
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.SCOPE_NORMALIZE_WITH_VERSION)
  async getPackageWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Query('write') write?: 'true'
  ) {
    return this.getPackage({ scope, pkgname, version }, write === 'true');
  }

  private async getPackage(options: {scope?: string, pkgname: string, version?: string}, write: boolean) {
    let pathname: string;
    const configRepository = this.connection.getRepository(ConfigEntity);
    const packageRepository = this.connection.getRepository(PackageEntity);
    const { scope, pkgname, version } = options;
    const configs = await this.ConfigService.query(configRepository);
    const prefixes = configs.registries;
    if (scope) {
      if (version) {
        pathname = `@${scope}/${pkgname}/${version}`;
      } else {
        pathname = `@${scope}/${pkgname}`;
      }
    } else {
      if (version) {
        pathname = `/${pkgname}/${version}`;
      } else {
        pathname = `/${pkgname}`;
      }
    }

    if (!scope) return await this.PackageService.anyFetch(prefixes, pathname);
    if (configs.scopes.indexOf('@' + scope) === -1) return await this.PackageService.anyFetch(prefixes, pathname);
    const local = await this.PackageService.info(packageRepository, '@' + scope, pkgname);
    if (local) {
      // http://127.0.0.1:3000/@node/find-my-way
      if (version) {
        if (!local.versions[version]) throw new NotFoundException('找不到模块版本');
        return local.versions[version];
      }
      if (write) {
        // 如果使用write写入
        await this.redis.set(local._rev, '@' + scope + '/' + pkgname, 30);
      }
      return local;
    } 
    return await this.PackageService.anyFetch(prefixes, pathname);
  }
}