import { ParameterizedContext } from 'koa';
import request from 'request';
import url from 'url';
import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { TypeRedis, getCache } from '@flowx/redis';
import { THttpContext } from '../../../app.bootstrap';
import { ConfigService } from '../../../modules/configs/config.service';
import { ThirdPartyService } from '../../../modules/thirdparty/thirdparty.service';
import { UserService } from '../../../modules/user/user.service';
import { HttpPublishController } from './publish.controller';
import { Authorization } from '../middlewares/authorize';
import { IsLogined } from '../guards/is-logined';
import { Connection } from 'typeorm';
import { ConfigEntity } from '../../../modules/configs/config.mysql.entity';
import { ThirdpartyEntity } from '../../../modules/thirdparty/thirdparty.mysql.entity';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { UserException } from '../exceptions/user.exception';
import { 
  Controller, 
  useException, 
  Post, Body, Get, Ctx, Headers, Query,
  useMiddleware, 
  BadRequestException, 
  HttpCode,
  Redirect,
  useGuard,
} from '@flowx/http';

@Controller()
@useException(UserException)
export class HttpExtraController {
  @inject('MySQL') private connection: Connection;
  @inject('Redis') private redis: TypeRedis;
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(ThirdPartyService) private ThirdPartyService: ThirdPartyService;
  @inject(UserService) private UserService: UserService;
  @inject(HttpPublishController) HttpPublishController: HttpPublishController;

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
    await this.redis.set(`thirdparty:${session}`, {
      hostname: body.hostname,
    }, thirdparty.loginTimeExpire);
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
      url: thirdparty.loginUrl
        .replace('{AppId}', thirdparty.extra.login.appid)
        .replace('{Session}', session),
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
        decodeURIComponent(thirdparty.doneUrl).replace('{Session}', session), 
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
      console.log(res.content)
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
      await getCache(UserService, 'userInfo').build(userRepository, res.content.account, configs.loginType);
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
}