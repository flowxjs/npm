import { TypeContainer } from '@flowx/container';
import { Http, THttpDefaultContext } from '@flowx/http';
import { useMySQLEntity } from './modules/mysql.entities';
import { Observer, Observable } from '@reactivex/rxjs';
import { Connection } from 'typeorm';
import { MYSQL_CONFIGS } from './app.config';

// Base Controllers:
import { TestController } from './modules/test/test.controller';

// Adapter Http Controllers:
import { HttpUserController } from './adapters/http/controller/user.controller';
import { HttpExtraController } from './adapters/http/controller/extra.controller';

import * as bodyParser from 'koa-bodyparser';

const container = new TypeContainer();
const http = new Http<THttpContext>(container);

container.useEffect((observer: Observer<string>) => {
  let connection: Connection;
  useMySQLEntity(container, MYSQL_CONFIGS).then((conn: Connection) => {
    connection = conn;
    observer.next('MySQL connected.');
  }).catch(e => observer.error(e)).finally(() => observer.complete());
  return Observable.create((observer: Observer<string>) => {
    if (connection) {
      connection.close();
      observer.next('MySQL closed.');
      observer.complete();
    }
    observer.complete();
  })
});

// Register Base Controller:
container.useController(TestController);

// Register Http COntrollers:
http.useController(HttpUserController);
http.useController(HttpExtraController);

// http.use(bodyParser());
// http.use(async (ctx, next) => {
//   container.logger.info(ctx.request.path, ctx.request.method, ctx.request.body);
//   await next();
// });

// Start All Service.
container.bootstrap();

export interface THttpContext extends THttpDefaultContext {};