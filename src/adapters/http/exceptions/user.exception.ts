import * as Koa from 'koa';
import { HttpErrorException } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { injectable } from 'inversify';

@injectable()
export class UserException implements HttpErrorException<Koa.ParameterizedContext<any,THttpContext>> {
  catch(ctx: Koa.ParameterizedContext<any, THttpContext>) {
    ctx.logger.error('User.Service.Exception:' + ctx.status, '', ctx.error.stack || ctx.error.message);
    ctx.body = {
      error: ctx.body,
      reason: ctx.body,
      code: 'EOTP',
    }
  }
}