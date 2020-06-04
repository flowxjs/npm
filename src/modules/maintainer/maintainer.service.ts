import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { MaintainerEntity } from './maintainer.mysql.entity';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.mysql.entity';

@injectable()
export class MaintainerService {
  @inject('MySQL') private connection: Connection;
  @inject(UserService) private UserService: UserService;
  
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

  async getMaintainerExistsByAccount(
    UserRepository: Repository<UserEntity>,
    MaintainerRepository: Repository<MaintainerEntity>, 
    pid: number,
    account: string,
    referer: number
  ): Promise<[MaintainerEntity?, UserEntity?]> {
    const user = await this.UserService.findActiveUserByAccount(UserRepository, account, referer);
    if (!user) return [];
    const maintainer = await MaintainerRepository.createQueryBuilder().where({
      pid, uid: user.id
    }).getOne();
    return [maintainer, user];
  }
}