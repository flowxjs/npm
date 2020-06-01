import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { MaintainerEntity } from './maintainer.mysql.entity';

@injectable()
export class MaintainerService {
  @inject('MySQL') connection: Connection;
  
  findByPid(
    repository: Repository<MaintainerEntity>, 
    pid: MaintainerEntity['pid']
  ) {
    return repository.createQueryBuilder().where({
      pid
    }).getMany();
  }

  getCountByPidAndUid(
    repository: Repository<MaintainerEntity>, 
    pid: MaintainerEntity['pid'], 
    uid: MaintainerEntity['uid']
  ) {
    return repository.createQueryBuilder().where({
      pid, uid: uid
    }).getCount();
  }

  async add(
    repository: Repository<MaintainerEntity>, 
    pid: MaintainerEntity['pid'], 
    uid: MaintainerEntity['uid']
  ) {
    const maintainer = await repository.createQueryBuilder().where({
      pid, uid: uid
    }).getOne();
    if (!maintainer) {
      const mainer = new MaintainerEntity();
      mainer.ctime = new Date();
      mainer.pid = pid;
      mainer.uid = uid;
      mainer.utime = new Date();
      return await repository.save(mainer);
    }
    return maintainer;
  }

  async delete(
    repository: Repository<MaintainerEntity>, 
    pid: MaintainerEntity['pid']
  ) {
    const [maintainers, count] = await repository.createQueryBuilder().where({ 
      pid
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(maintainers.map(maintainer => repository.delete(maintainer)));
  }
}