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
    icon: string,
    AppId: string,
    AppSecret: string,
    CorpId: string,
    name: string, 
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    let thirdparty = await repository.createQueryBuilder().where({ code }).getOne();
    if (thirdparty) {
      return await this.update(
        repository,
        thirdparty.id,
        icon, AppId, AppSecret, CorpId, loginUrl, doneUrl,loginTimeExpire, checkTimeDelay
      );
    }
    thirdparty = new ThirdpartyEntity();
    thirdparty.code = code;
    thirdparty.icon = icon;
    thirdparty.CorpId = CorpId;
    thirdparty.AppId = AppId;
    thirdparty.AppSecret = AppSecret;
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
    icon: string,
    AppId: string,
    AppSecret: string,
    CorpId: string,
    loginUrl: string, 
    doneUrl: string, 
    loginTimeExpire: number, 
    checkTimeDelay: number
  ) {
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    thirdparty.icon = icon;
    thirdparty.CorpId = CorpId;
    thirdparty.AppId = AppId;
    thirdparty.AppSecret = AppSecret;
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
    const thirdparty = await repository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    return {
      icon: thirdparty.icon,
      AppId: thirdparty.AppId,
      AppSecret: thirdparty.AppSecret,
      CorpId: thirdparty.CorpId,
      loginUrl: thirdparty.loginUrl,
      doneUrl: thirdparty.doneUrl,
      loginTimeExpire: thirdparty.loginTimeExpire,
      checkTimeDelay: thirdparty.checkTimeDelay,
    }
  }
}