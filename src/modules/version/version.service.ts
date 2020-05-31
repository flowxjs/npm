import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { VersionEntity } from './version.mysql.entity';
import { PackageEntity } from '../package/package.mysql.entity';

@injectable()
export class VersionService {
  @inject('MySQL') connection: Connection;

  findVersionsByPid(
    repository: Repository<VersionEntity>, 
    pid: PackageEntity['id']
  ) {
    return repository.createQueryBuilder().where({
      packageId: pid,
    }).getMany();
  }
}