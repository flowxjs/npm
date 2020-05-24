import Koa from 'koa';
import { CanActivate } from '@flowx/http';
import { injectable } from 'inversify';
import { THttpContext } from '../../../app.bootstrap';

@injectable()
export class IsAdmin<T extends Koa.ParameterizedContext<any, THttpContext>> implements CanActivate<T> {

  async canActivate(ctx: T) {
    if (!ctx.user) return false;
    return !!ctx.user.isAdmin;
  }
}