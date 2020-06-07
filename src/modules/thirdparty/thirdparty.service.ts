import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { cacheable } from '@flowx/redis';
import { ThirdpartyEntity } from './thirdparty.mysql.entity';

@injectable()
export class ThirdPartyService {
  @inject('MySQL') connection: Connection;

  async insert(
    repository: Repository<ThirdpartyEntity>, 
    code: string,
    extra: string,
    name: string, 
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    let thirdparty = await repository.createQueryBuilder().where({ code }).getOne();
    if (thirdparty) return thirdparty;
    thirdparty = new ThirdpartyEntity();
    thirdparty.code = code;
    thirdparty.extra = extra;
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
    extra: string,
    name: string,
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    thirdparty.extra = extra;
    thirdparty.namespace = name;
    thirdparty.loginUrl = loginUrl;
    thirdparty.doneUrl = doneUrl;
    thirdparty.loginTimeExpire = loginTimeExpire;
    thirdparty.checkTimeDelay = checkTimeDelay;
    thirdparty.utime = new Date();
    return await repository.save(thirdparty);
  }

  @cacheable('thirdparty:${1}')
  async query(
    repository: Repository<ThirdpartyEntity>, 
    id: number
  ) {
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    return {
      extra: JSON.parse(thirdparty.extra),
      loginUrl: thirdparty.loginUrl,
      doneUrl: thirdparty.doneUrl,
      loginTimeExpire: thirdparty.loginTimeExpire,
      checkTimeDelay: thirdparty.checkTimeDelay,
    }
  }
}