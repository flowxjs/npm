import { TypeORM } from '@flowx/typeorm';
import { TypeContainer } from '@flowx/container';
import { MYSQL_CONFIGS, DOMAIN, REDIS_CONFIGS } from './app.config';

// ORM Modules:
import { ConfigEntity } from './modules/configs/config.mysql.entity';
import { DependencyEntity } from './modules/dependencies/dependency.mysql.entity';
import { KeywordEntity } from './modules/keywords/keyword.mysql.entity';
import { MaintainerEntity } from './modules/maintainer/maintainer.mysql.entity';
import { PackageEntity } from './modules/package/package.mysql.entity';
import { UserEntity } from './modules/user/user.mysql.entity';
import { VersionEntity } from './modules/version/version.mysql.entity';
import { ThirdpartyEntity } from './modules/thirdparty/thirdparty.mysql.entity';
import { TagEntity } from './modules/tags/tags.mysql.entity';

export function SetupMySQL(container: TypeContainer, orm: TypeORM) {
  const [setMySQLBinding, setMySQLInitializer] = orm.useConnection({
    type: "mysql",
    host: MYSQL_CONFIGS.host,
    port: MYSQL_CONFIGS.port,
    username: MYSQL_CONFIGS.username,
    password: MYSQL_CONFIGS.password,
    database: MYSQL_CONFIGS.database,
    entities: [
      ConfigEntity,
      DependencyEntity,
      KeywordEntity,
      MaintainerEntity,
      PackageEntity,
      UserEntity,
      VersionEntity,
      ThirdpartyEntity,
      TagEntity
    ],
    synchronize: true,
    // logging: true,
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
      configs.loginType = 0;
      configs.registries = '["https://registry.npmjs.org/"]';
      configs.scopes = '["@node"]';
      await connection.manager.save(configs);
      container.logger.warn('', 'Default configuration added in %dms.', Date.now() - time);
    } else {
      container.logger.warn('Count', 'Skip add default configuration process.');
    }
  });
}