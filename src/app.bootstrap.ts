// Base imports:
import { TypeContainer } from '@flowx/container';
import { Http, THttpDefaultContext } from '@flowx/http';
import { TypeORM } from '@flowx/typeorm';
import { SetupMySQL } from './app.mysql';
import { SetupRedis } from './app.redis';
import { WebsiteClosed } from './adapters/http/middlewares/close';

// Adapter Http Controllers:
import { HttpUserController } from './adapters/http/controller/user.controller';
import { HttpExtraController } from './adapters/http/controller/extra.controller';
import { HttpTestController } from './adapters/http/controller/test.controller';

// orm:
import { UserEntity } from './modules/user/user.mysql.entity';

// import bodyParser from 'koa-bodyparser';

const container = new TypeContainer();
const http = new Http<THttpContext>(container);
const orm = new TypeORM(container);

// closed middleware.
http.use(WebsiteClosed);

// 安装 Redis
SetupRedis(container);

// 安装 MySQL
SetupMySQL(container, orm);

// Register Http COntrollers:
http.useController(HttpUserController);
http.useController(HttpExtraController);
http.useController(HttpTestController);

// http.use(bodyParser());
// http.use(async (ctx, next) => {
//   container.logger.info(ctx.request.path, ctx.request.method, ctx.request.body);
//   await next();
// });

// Start All Service.
container.bootstrap();

export interface THttpContext extends THttpDefaultContext {
  authType?: string,
  authToken?: string,
  authUsername?: string,
  authPassword?: string,
  user?: UserEntity,
};