import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { cacheable } from '@flowx/redis';
import { ThirdpartyEntity } from './thirdparty.mysql.entity';

@injectable()
export class ThirdPartyService {
  @inject('MySQL') connection: Connection;

  insert(name: string, loginUrl: string, doneUrl: string, loginTimeExpire: number, checkTimeDelay: number) {
    const thirdparty = new ThirdpartyEntity();
    thirdparty.ctime = new Date();
    thirdparty.doneUrl = doneUrl;
    thirdparty.isDeleted = false;
    thirdparty.loginUrl = loginUrl;
    thirdparty.namespace = name;
    thirdparty.loginTimeExpire = loginTimeExpire;
    thirdparty.checkTimeDelay = checkTimeDelay;
    thirdparty.utime = new Date();
    return this.connection.getRepository(ThirdpartyEntity).save(thirdparty);
  }

  async delete(id: number) {
    const thirdPartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const thirdparty = await thirdPartyRepository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    thirdparty.isDeleted = true;
    return await this.connection.getRepository(ThirdpartyEntity).save(thirdparty);
  }

  async update(id: number, loginUrl: string, doneUrl: string, loginTimeExpire: number, checkTimeDelay: number) {
    const thirdPartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const thirdparty = await thirdPartyRepository.findOne(id);
    if (!thirdparty) throw new Error('找不到第三方插件');
    thirdparty.loginUrl = loginUrl;
    thirdparty.doneUrl = doneUrl;
    thirdparty.loginTimeExpire = loginTimeExpire;
    thirdparty.checkTimeDelay = checkTimeDelay;
    return await this.connection.getRepository(ThirdpartyEntity).save(thirdparty);
  }

  @cacheable('thirdparty:${0}')
  async query(id: number) {
    const thirdPartyRepository = this.connection.getRepository(ThirdpartyEntity);
    const thirdparty = await thirdPartyRepository.findOne(id, {
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