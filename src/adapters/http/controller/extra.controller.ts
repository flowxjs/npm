import { ParameterizedContext } from 'koa';
import request from 'request';
import url from 'url';
import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { TypeRedis, buildCache } from '@flowx/redis';
import { THttpContext } from '../../../app.bootstrap';
import { TPackageInput, TPackageNormalizeOutput } from '../dto/package.dto';
import { ConfigService } from '../../../modules/configs/config.service';
import { ThirdPartyService } from '../../../modules/thirdparty/thirdparty.service';
import { UserService } from '../../../modules/user/user.service';
import { PackageService } from '../../../modules/package/package.service';
import { HttpPackageController } from './package.controller';
import { Authorization } from '../middlewares/authorize';
import { IsLogined } from '../guards/is-logined';
import { Connection } from 'typeorm';
import { ConfigEntity } from '../../../modules/configs/config.mysql.entity';
import { ThirdpartyEntity } from '../../../modules/thirdparty/thirdparty.mysql.entity';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { 
  Controller, 
  Http, 
  useException, 
  Post, Body, Put, Params, Get, Ctx, Headers, Query,
  useMiddleware, 
  BadRequestException, 
  HttpCode,
  Redirect,
  useGuard
} from '@flowx/http';
import { UserException } from '../exceptions/user.exception';

/**
 * package uri mode
 *  - `/vue`                    /:pkgname
 *  - `/vue/1.0.0`              /:pkgname/:version
 *  - `/@nelts%2fnelts`         /@:scope
 *  - `/@nelts%2fnelts/1.0.0`   /@:scope/:version
 *  - `/@nelts/nelts`           /@:scope/:pkgname
 *  - `/@nelts/nelts/1.0.0`     /@:scope/:pkgname/:version
 */


enum PACKAGE_URI_MODE {
  NO_SCOPE = '/:pkgname',
  NO_SCOPE_WITH_VESION = '/:pkgname/:version',
  SCOPE_COMPOSITION = '/@:scope',
  SCOPE_COMPOSITION_WITH_VERSION = '/@:scope/:version',
  SCOPE_NORMALIZE = '/@:scope/:pkgname',
  SCOPE_NORMALIZE_WITH_VERSION = '/@:scope/:pkgname/:version',
}

@Controller()
@useException(UserException)
export class HttpExtraController {
  @inject('MySQL') private connection: Connection;
  @inject('Http') private http: Http<THttpContext>;
  @inject('Redis') private redis: TypeRedis;
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(ThirdPartyService) private ThirdPartyService: ThirdPartyService;
  @inject(UserService) private UserService: UserService;
  @inject(PackageService) private PackageService: PackageService;
  @inject(HttpPackageController) HttpPackageController: HttpPackageController;

  @Get()
  configs() {
    return this.ConfigService.query(this.connection.getRepository(ConfigEntity));
  }

  /**
   * 通过Body可以获取到数据 { hostname: 'shenyunjiedeMacBook-Pro.local' }
   * 如果返回404状态码，那么将走默认的行为。
   * 如果我们返回字段 { loginUrl: string, doneUrl: string } 那么将走web登录模式。
   * 可以拿到npm-session作为唯一标识
   */
  @Post('/-/v1/login')
  @useMiddleware(BodyParser())
  async Login(
    @Ctx() ctx: ParameterizedContext<THttpContext>, 
    @Body() body: { hostname: string },
    @Headers('npm-session') session: string
  ) {
    const configRepository = this.connection.getRepository(ConfigEntity);
    const thirdpartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const configs = await this.ConfigService.query(configRepository);
    if (!configs.loginType) {
      ctx.status = 404;
      return 'Using default login type.';
    }
    if (!session) throw new BadRequestException('请使用NPM的命令行工具登录');
    const thirdparty = await this.ThirdPartyService.query(thirdpartyRepository, configs.loginType);
    await this.redis.set(`thirdparty:${session}`, body.hostname, thirdparty.loginTimeExpire);
    return {
      loginUrl: url.resolve(configs.domain, `/-/v1/weblogin/authorize?session=${session}&hostname=${encodeURIComponent(body.hostname)}`),
      doneUrl: url.resolve(configs.domain, `/-/v1/weblogin/check?session=${session}`),
    }
  }
 
  /**
   * Method: GET
   * 将打开一个浏览器加载这个页面
   * 可用于二维码登录
   * 可以直接返回HTML或者跳转
   */
  @Get('/-/v1/weblogin/authorize')
  @HttpCode(200)
  @Redirect()
  // http://127.0.0.1:3000/-/v1/weblogin/authorize
  async WebLoginAuthorize(
    @Query('session') session: string,
    @Query('hostname') hostname: string
  ) {
    const configRepository = this.connection.getRepository(ConfigEntity);
    const thirdpartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const configs = await this.ConfigService.query(configRepository);
    if (!configs.loginType) throw new BadRequestException('系统不允许使用外部授权');
    const thirdparty = await this.ThirdPartyService.query(thirdpartyRepository, configs.loginType);
    return {
      url: thirdparty.loginUrl.replace('{session}', session),
    }
  }

  /**
   * Method: GET
   * 检测登录结果
   * 状态码如果是200 那么必须返回一个token
   * 状态码如果是202 那么将会轮询重试，但是你可以通过header中设置retry-after来设定重试间隔
   * 成功的话我们需要将用户的token记录下来
   */
  @Get('/-/v1/weblogin/check')
  async WebLoginChecker(
    @Ctx() ctx: ParameterizedContext<THttpContext>,
    @Query('session') session: string
  ) {
    const configRepository = this.connection.getRepository(ConfigEntity);
    const thirdpartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const userRepository = this.connection.getRepository(UserEntity);
    const redisData = await this.redis.get<string>(`thirdparty:${session}`);
    if (!redisData) throw new BadRequestException('找不到请求结果或者请求已过期');
    const configs = await this.ConfigService.query(configRepository);
    if (!configs.loginType) throw new BadRequestException('系统不允许使用外部授权');
    const thirdparty = await this.ThirdPartyService.query(thirdpartyRepository, configs.loginType);
    const res = await new Promise<{ 
      status: number, 
      content?: { account: string, avatar: string, email: string, token: string, nickname?: string } 
    }>((resolve, reject) => {
      request.get(
        thirdparty.doneUrl.replace('{session}', session), 
        (err: Error, response: request.Response, body: string) => {
          if (err) return reject(err);
          if (!body) return resolve({ status: 202 });
          try{ resolve({
            status: 200,
            content: JSON.parse(body),
          }); } catch(e) {
            reject(e);
          }
        }
      )
    })
    // 当202状态下，需要添加一个`retry-after`头部变量
    // 用于延迟尝试获得结果
    if (res.status === 202) ctx.set('retry-after', thirdparty.checkTimeDelay + '');
    if (res.status === 200) {
      // 删除登录时候的redis缓存标识位
      await this.redis.del(`thirdparty:${session}`);
      // 插入数据库
      const user = await this.UserService.insert(
        userRepository,
        res.content.account, 
        res.content.token,
        res.content.email,
        configs.loginType,
        res.content.nickname,
        res.content.avatar,
      );
      // 更新缓存
      await buildCache(UserService, 'userInfo', userRepository, res.content.account, configs.loginType);
      res.content.token = user.password;
    }
    ctx.status = res.status;
    return res.content || {};
  }

  /**
   * 根据token查看当前用户账号
   * @param ctx 
   */
  @Get('/-/whoami')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  Whoami(@Ctx() ctx: ParameterizedContext<any, THttpContext>) {
    return {
      username: ctx.user.account,
    }
  }

  /**
   * 获取当前模块
   * /:pkgname
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.NO_SCOPE)
  async getPackageNoScope(@Params('pkgname') pkgname: string) {
    return this.getPackage({ pkgname });
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
  ) {
    return this.getPackage({ pkgname, version });
  }

  /**
   * 获取当前模块
   * /@:scope
   * @param pkgname 
   */
  @Get(PACKAGE_URI_MODE.SCOPE_COMPOSITION)
  async getPackageComposition(@Params('scope') scope: string) {
    const value = decodeURIComponent(scope);
    const chunk = value.split('/');
    return this.getPackage({ scope: chunk[0], pkgname: chunk[1] });
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
    });
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
  ) {
    return this.getPackage({ scope, pkgname, version });
  }

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

  private async togglePackageActions(ctx: THttpContext, body: TPackageInput, value: { scope: string, pkgname: string, version?: string }): Promise<TPackageNormalizeOutput> {
    const res = await this.HttpPackageController.publish(ctx.user, value, body);
    return {
      ok: true,
    }
  }

  private async getPackage(options: {scope?: string, pkgname: string, version?: string}) {
    let pathname: string;
    const configRepository = this.connection.getRepository(ConfigEntity);
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
    return await this.PackageService.anyFetch(prefixes, pathname);
  }
}