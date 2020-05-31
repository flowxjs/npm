import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { cacheable } from '@flowx/redis';
import { ThirdpartyEntity } from './thirdparty.mysql.entity';

@injectable()
export class ThirdPartyService {
  @inject('MySQL') connection: Connection;

  insert(
    repository: Repository<ThirdpartyEntity>, 
    name: string, 
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    const thirdparty = new ThirdpartyEntity();
    thirdparty.ctime = new Date();
    thirdparty.doneUrl = doneUrl;
    thirdparty.loginUrl = loginUrl;
    thirdparty.namespace = name;
    thirdparty.loginTimeExpire = loginTimeExpire;
    thirdparty.checkTimeDelay = checkTimeDelay;
    thirdparty.utime = new Date();
    return repository.save(thirdparty);
  }

  async delete(
    repository: Repository<ThirdpartyEntity>, 
    id: number
  ) {
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    return await repository.delete(thirdparty);
  }

  async update(
    repository: Repository<ThirdpartyEntity>, 
    id: number, 
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    thirdparty.loginUrl = loginUrl;
    thirdparty.doneUrl = doneUrl;
    thirdparty.loginTimeExpire = loginTimeExpire;
    thirdparty.checkTimeDelay = checkTimeDelay;
    return await repository.save(thirdparty);
  }

  @cacheable('thirdparty:${1}')
  async query(
    repository: Repository<ThirdpartyEntity>, 
    id: number
  ) {
    const thirdparty = await repository.findOne(id, {
      where: {
        isDeleted: false,
      }
    });
    if (!thirdparty) throw new Error('找不到第三方插件');
    return {
      loginUrl: thirdparty.loginUrl,
      doneUrl: thirdparty.doneUrl,
      loginTimeExpire: thirdparty.loginTimeExpire,
      checkTimeDelay: thirdparty.checkTimeDelay,
    }
  }
}