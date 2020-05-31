import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { MaintainerEntity } from './maintainer.mysql.entity';

@injectable()
export class MaintainerService {
  @inject('MySQL') connection: Connection;

  async add(pid: MaintainerEntity['pid'], uid: MaintainerEntity['uid']) {
    const repository = this.connection.getRepository(MaintainerEntity);
    const maintainer = await repository.createQueryBuilder().where({
      pid, uid
    }).getOne();
    if (!maintainer) {
      const mainer = new MaintainerEntity();
      mainer.ctime = new Date();
      mainer.isDeleted = false;
      mainer.pid = pid;
      mainer.uid = uid;
      mainer.utime = new Date();
      return await repository.save(mainer);
    }
    if (maintainer.isDeleted) {
      maintainer.isDeleted = false;
      maintainer.utime = new Date();
      return repository.save(maintainer);
    }
    return maintainer;
  }

  async delete(pid: MaintainerEntity['pid']) {
    const repository = this.connection.getRepository(MaintainerEntity);
    const [maintainers, count] = await repository.createQueryBuilder().where({ 
      pid, isDeleted: false 
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(maintainers.map(maintainer => {
      maintainer.isDeleted = true;
      maintainer.utime = new Date();
      return repository.save(maintainer);
    }));
  }
}