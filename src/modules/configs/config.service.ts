import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { cacheable } from '@flowx/redis';
;import { ConfigEntity } from './config.mysql.entity';
import { TUpdateInput } from './config.dto';

@injectable()
export class ConfigService {
  @inject('MySQL') connection: Connection;

  async update(
    repository: Repository<ConfigEntity>,
    options: TUpdateInput
  ) {
    if (!options.domain) throw new Error('domain字段缺失');
    const configs = await repository.findOne();
    if (!configs) throw new Error('找不到配置');
    configs.close = !!options.close;
    configs.domain = options.domain;
    configs.loginType = options.loginType;
    configs.packageCacheExpireTime = options.packageCacheExpireTime || 0;
    configs.registries = JSON.stringify(options.registries);
    configs.scopes = JSON.stringify(options.scopes);
    return await repository.save(configs);
  }

  @cacheable('configs')
  async query(repository: Repository<ConfigEntity>) {
    const configs = await repository.findOne();
    if (!configs) throw new Error('找不到配置数据');
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