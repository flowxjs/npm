import { TypeContainer } from '@flowx/container';
import { Http, THttpDefaultContext } from '@flowx/http';

// Base Controllers:
import { TestController } from './modules/test/test.controller';

// Adapter Http Controllers:
import { HttpTestController } from './adapters/http/controller/test.controller';

const container = new TypeContainer();
const http = new Http<THttpContext>(container);

// Register Base Controller:
container.useController(TestController);

// Register Http COntrollers:
http.useController(HttpTestController);

// Start All Service.
container.bootstrap();

export interface THttpContext extends THttpDefaultContext {};