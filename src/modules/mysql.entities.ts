import { TypeContainer } from '@flowx/container';
import { createConnection } from "typeorm";

import { DOMAIN } from '../app.config';

import { ConfigEntity } from './configs/config.mysql.entity';
import { DependencyEntity } from './dependencies/dependency.mysql.entity';
import { KeywrodEntity } from './keywords/keyword.mysql.entity';
import { MaintainerEntity } from './maintainer/maintainer.mysql.entity';
import { PackageEntity } from './package/package.mysql.entity';
import { UserEntity } from './user/user.mysql.entity';
import { VersionEntity } from './version/version.mysql.entity';

export async function useMySQLEntity(container: TypeContainer, options: {
  host: string,
  port: number,
  username: string,
  password: string,
  database: string,
}) {
  const connection = await createConnection({
    type: "mysql",
    host: options.host,
    port: options.port,
    username: options.username,
    password: options.password,
    database: options.database,
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
  const count = await connection.manager.count(ConfigEntity);
  container.logger.warn('Count', 'configs table has %d data chunk.', count);
  if (count === 0) {
    const configs = new ConfigEntity();
    configs.close = false;
    configs.domain = DOMAIN;
    configs.loginType = 'default';
    configs.registries = '["http://registry.npmjs.org/"]';
    configs.scopes = '["@node"]';
    await connection.manager.save(configs);
    container.logger.warn('', 'configs has been added.');
  }
  container.injection.bind('MySQL').toConstantValue(connection);
  return connection;
}