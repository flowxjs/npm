import * as Koa from 'koa';
import { HttpErrorException } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { injectable } from 'inversify';

@injectable()
export class logException implements HttpErrorException<Koa.ParameterizedContext<any,THttpContext>> {
  catch(ctx: Koa.ParameterizedContext<any, THttpContext>) {
    ctx.logger.error('HttpException', '', ctx.error.stack || ctx.error.message);
    ctx.body = {
      status: ctx.status,
      message: ctx.body,
    }
  }
}