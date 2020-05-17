// Base imports:
import { TypeContainer } from '@flowx/container';
import { Http, THttpDefaultContext } from '@flowx/http';
import { TypeORM } from '@flowx/typeorm';
import { MYSQL_CONFIGS, DOMAIN } from './app.config';

// Base Controllers:
import { TestController } from './modules/test/test.controller';
import { PackageController } from './modules/package/package.controller';

// Adapter Http Controllers:
import { HttpUserController } from './adapters/http/controller/user.controller';
import { HttpExtraController } from './adapters/http/controller/extra.controller';

// ORM Modules:
import { ConfigEntity } from './modules/configs/config.mysql.entity';
import { DependencyEntity } from './modules/dependencies/dependency.mysql.entity';
import { KeywrodEntity } from './modules/keywords/keyword.mysql.entity';
import { MaintainerEntity } from './modules/maintainer/maintainer.mysql.entity';
import { PackageEntity } from './modules/package/package.mysql.entity';
import { UserEntity } from './modules/user/user.mysql.entity';
import { VersionEntity } from './modules/version/version.mysql.entity';

// import * as bodyParser from 'koa-bodyparser';

const container = new TypeContainer();
const http = new Http<THttpContext>(container);
const orm = new TypeORM(container);

// Setup MySQL:
const [setMySQLBinding, setMySQLInitializer] = orm.useEntity({
  type: "mysql",
  host: MYSQL_CONFIGS.host,
  port: MYSQL_CONFIGS.port,
  username: MYSQL_CONFIGS.username,
  password: MYSQL_CONFIGS.password,
  database: MYSQL_CONFIGS.database,
  entities: [
    ConfigEntity,
    DependencyEntity,
    KeywrodEntity,
    MaintainerEntity,
    PackageEntity,
    UserEntity,
    VersionEntity
  ],
  synchronize: true,
  logging: true,
});
setMySQLBinding('MySQL');
setMySQLInitializer(async connection => {
  const count = await connection.manager.count(ConfigEntity);
  container.logger.warn('Count', 'configs table has %d data chunk.', count);
  if (count === 0) {
    const time = Date.now();
    const configs = new ConfigEntity();
    configs.close = false;
    configs.domain = DOMAIN;
    configs.loginType = 'default';
    configs.registries = '["http://registry.npmjs.org/"]';
    configs.scopes = '["@node"]';
    await connection.manager.save(configs);
    container.logger.warn('', 'Default configuration added in %dms.', Date.now() - time);
  } else {
    container.logger.warn('Count', 'Skip add default configuration process.');
  }
});

// Register Base Controller:
container.useController(TestController);
container.useController(PackageController);

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