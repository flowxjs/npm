import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { cacheable } from '@flowx/redis';
;import { ConfigEntity } from './config.mysql.entity';
import { TUpdateInput } from './config.dto';

@injectable()
export class ConfigService {
  @inject('MySQL') connection: Connection;

  async update(options: TUpdateInput) {
    if (!options.domain) throw new Error('domain字段缺失');
    const configsRepository = this.connection.getRepository(ConfigEntity);
    const configs = await configsRepository.findOne();
    if (!configs) throw new Error('找不到配置');
    configs.close = !!options.close;
    configs.domain = options.domain;
    configs.loginType = options.loginType;
    configs.packageCacheExpireTime = options.packageCacheExpireTime || 0;
    configs.registries = JSON.stringify(options.registries);
    configs.scopes = JSON.stringify(options.scopes);
    return this.connection.getRepository(ConfigEntity).save(configs);
  }

  @cacheable('configs')
  async query() {
    const configsRepository = this.connection.getRepository(ConfigEntity);
    const configs = await configsRepository.findOne();
    return {
      close: configs.close,
      domain: configs.domain,
      loginType: configs.loginType,
      packageCacheExpireTime: configs.packageCacheExpireTime,
      registries: JSON.parse(configs.registries) as string[],
      scopes: JSON.parse(configs.scopes) as string[],
    } 
  }
}