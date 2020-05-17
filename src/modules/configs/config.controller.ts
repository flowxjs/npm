import { injectable, inject } from 'inversify';
import { Context } from '@flowx/container';
import { ConfigService } from './config.service';

@injectable()
export class ConfigController {
  @inject(ConfigService) private readonly service: ConfigService;

  configs(ctx: Context) {
    return this.service.query();
  }
}