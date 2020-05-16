import * as BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, HttpCode, useException, Put, useMiddleware, Body } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';
import { TUserLoginInput, TUserLoginOutput } from './user.dto';

@Controller('/-/user')
@useException(logException)
export class HttpUserController {
  @inject('Http') private http: Http<THttpContext>;

  @HttpCode(201)
  @useMiddleware(BodyParser())
  @Put('/org.couchdb.user::account')
  async AddUser(@Body() body: TUserLoginInput): Promise<TUserLoginOutput> {
    this.http.logger.warn('AddUser', 'Body: ', body);
    return {
      ok: true,
      id: body._id,
      rev: 'aaaa'
    }
  }
}