import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, HttpCode, useException, Put, useMiddleware, Body, Get, Params, NotAcceptableException, BadRequestException } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';
import { TUserLoginInput, TUserLoginOutput, TUserInfoOutput } from './user.dto';
import { ConfigController } from '../../../modules/configs/config.controller';
import { UserController } from '../../../modules/user/user.controller';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { AccountPipe } from '../pipes/account';

@Controller('/-/user')
@useException(logException)
export class HttpUserController {
  @inject('Http') private http: Http<THttpContext>;

  @HttpCode(201)
  @useMiddleware(BodyParser())
  @Put('/org.couchdb.user::account')
  async AddUser(@Body() body: TUserLoginInput): Promise<TUserLoginOutput> {
    if (!body.email) return;
    const rev = Buffer.from(body.name + ':' + body.password, 'utf8').toString('base64');
    const configs: { loginType: string } = await this.http.portal(ConfigController, 'configs');
    if (configs.loginType !== 'default') throw new NotAcceptableException('目前不支持这种登录方式');
    await this.http.portal(UserController, 'passwordlogin', body.name, body.password, body.email, body.name, undefined, 'default');
    return {
      ok: true,
      id: body._id,
      rev
    }
  }

  @HttpCode(201)
  @Get('/org.couchdb.user:account')
  // URL: http://0.0.0.0:3000/-/user/org.couchdb.user:evio
  async userInfo(@Params('account', AccountPipe) account: string): Promise<TUserInfoOutput> {
    const user: UserEntity = await this.http.portal(UserController, 'userInfo', account);
    if (!user) throw new BadRequestException('找不到用户');
    return {
      account,
      name: user.nickname,
      email: user.email,
      avatar: user.avatar,
    }
  }
}