import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, HttpCode, useException, Put, useMiddleware, Body, Get, Params } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';
import { TUserLoginInput, TUserLoginOutput, TUserInfoOutput } from './user.dto';

@Controller('/-/user')
@useException(logException)
export class HttpUserController {
  @inject('Http') private http: Http<THttpContext>;

  @HttpCode(201)
  @useMiddleware(BodyParser())
  @Put('/org.couchdb.user::account')
  async AddUser(@Body() body: TUserLoginInput): Promise<TUserLoginOutput> {
    const rev = Buffer.from(body.name + ':' + body.password, 'utf8').toString('base64');
    this.http.logger.warn('AddUser', 'Body: ', body);
    return {
      ok: true,
      id: body._id,
      rev
    }
  }

  @HttpCode(201)
  @Get('/org.couchdb.user::account')
  async userInfo(@Params('account') account: string): Promise<TUserInfoOutput> {
    this.http.logger.warn('UserInfo', 'Params: ', account);
    return {
      account,
      name: account,
      email: account + '@vip.qq.com',
      avatar: 'https://s.gravatar.com/avatar/6bab7c91a03d47fe1aa5b5b6b6f8cc55?size=50&default=retro',
    }
  }
}