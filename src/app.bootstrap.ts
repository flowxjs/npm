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
import { HttpPublishController } from './adapters/http/controller/publish.controller';
import { HttpUnPublishController } from './adapters/http/controller/unpublish.controller';
import { HttpTarBallController } from './adapters/http/controller/tarball.controller';
import { HttpFetchController } from './adapters/http/controller/fetch.controller';
import { HttpOwnerController } from './adapters/http/controller/owner.controller';
import { HttpDistTagController } from './adapters/http/controller/dist-tag.controller';

// orm:
import { UserEntity } from './modules/user/user.mysql.entity';

import bodyParser from 'koa-bodyparser';

const container = new TypeContainer();
const http = new Http<THttpContext>(container);
const orm = new TypeORM(container);

// closed middleware.
http.use(WebsiteClosed);

// 安装 Redis
SetupRedis(container);

// 安装 MySQL
SetupMySQL(container, orm);

// Register Http Controllers:
http.useController(HttpUserController);
http.useController(HttpExtraController);
http.useController(HttpTestController);
http.useController(HttpPublishController);
http.useController(HttpUnPublishController);
http.useController(HttpTarBallController);
http.useController(HttpFetchController);
http.useController(HttpOwnerController);
http.useController(HttpDistTagController);

http.use(bodyParser());
http.use(async (ctx, next) => {
  const session = ctx.headers['npm-session'];
  const method = ctx.method;
  const pathname = ctx.request.path;
  const filename = require('path').resolve(process.cwd(), 'logs', `${session}:${method}:${pathname}.log`.replace(/\//g, '#'));
  if (['GET', 'DELETE'].indexOf(method) === -1) {
    require('fs').writeFileSync(filename, `Body: ${JSON.stringify(ctx.request.body, null, 2)}`, 'utf8');
  } else {
    require('fs').writeFileSync(filename, `Query: ${JSON.stringify(ctx.query, null, 2)}`, 'utf8');
  }
  await next();
});

// Start All Service.
container.bootstrap();

export interface THttpContext extends THttpDefaultContext {
  authType?: string,
  authToken?: string,
  authUsername?: string,
  authPassword?: string,
  authReferer: number,
  user?: UserEntity,
};