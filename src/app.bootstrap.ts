import { TypeContainer } from '@flowx/container';
import { Http, THttpDefaultContext } from '@flowx/http';
import { useMySQLEntity } from './modules/mysql.entities';
import { Observer, Observable } from '@reactivex/rxjs';
import { Connection } from 'typeorm';
import { MYSQL_CONFIGS } from './app.config';

// Base Controllers:
import { TestController } from './modules/test/test.controller';

// Adapter Http Controllers:
import { HttpTestController } from './adapters/http/controller/test.controller';

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
http.useController(HttpTestController);

// Start All Service.
container.bootstrap();

export interface THttpContext extends THttpDefaultContext {};