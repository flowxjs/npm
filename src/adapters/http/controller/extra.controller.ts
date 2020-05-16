import * as BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, useException, Post, Body, Url, HttpCode, useMiddleware } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';

@Controller('/-/v1')
@useException(logException)
export class HttpExtraController {
  @inject('Http') private http: Http<THttpContext>;

  @Post('/login')
  @useMiddleware(BodyParser())
  @HttpCode(404)
  Login(@Body() body: { hostname: string }, @Url() url: string) {
    this.http.logger.info(url, '', body);
    return 'not found';
  }
}