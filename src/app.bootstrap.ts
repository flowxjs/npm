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
import { HttpPackageController } from './adapters/http/controller/package.controller';

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
http.useController(HttpPackageController);

// http.use(bodyParser());
// http.use(async (ctx, next) => {
//   if (ctx.method === 'GET') {
//     container.logger.warn(ctx.request.path, ctx.request.method, ctx.query);
//   } else {
//     require('fs').writeFileSync(
//       require('path').resolve(process.cwd(), 'delete-single.log'), 
//       `pathname: ${ctx.request.path}\nmethod: ${ctx.request.method}\n${JSON.stringify(ctx.request.body, null, 2)}`, 
//       'utf8'
//     );
//   }
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