import Koa from 'koa';
import { HttpMiddleware } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { injectable } from 'inversify';

@injectable()
export class Authorization<C extends Koa.ParameterizedContext<any, THttpContext>> implements HttpMiddleware<C> {
  async use(ctx: C, next: Koa.Next) {
    const authorization = ctx.headers['authorization'] as string;
    if (!authorization) return await next();
    const { type, value } = this.formatAuthorization(authorization);
    ctx.authType = type;
    switch (type) {
      case 'Bearer': ctx.authToken = value; break;
      case 'Basic':
        const meta = this.base642json(value);
        if (meta) {
          ctx.authUsername = meta.username;
          ctx.authPassword = meta.password;
        }
        break;
    }
    await next();
  }

  private formatAuthorization(key: string) {
    const keys = key.split(' ');
    return {
      type: keys[0],
      value: keys[1],
    }
  }

  private base642json(str: string) {
    const data = Buffer.from(str, 'base64').toString();
    if (!data || data.indexOf(':') === -1) return null;
    const sp = data.split(':');
    return {
      username: sp[0],
      password: sp[1],
    }
  }
}