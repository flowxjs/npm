import { TypeORM } from '@flowx/typeorm';
import { TypeContainer } from '@flowx/container';
import { MYSQL_CONFIGS } from './app.config';

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
  const [setMySQLBinding] = orm.useConnection(Object.assign(MYSQL_CONFIGS, {
    type: "mysql",
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
  }));
  setMySQLBinding('MySQL');
  container.logger.info('ORM', 'MySQL configs has been injected');
}