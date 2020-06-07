import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { Controller, Ctx, Put, useMiddleware, Body, Get, Headers, BadGatewayException } from '@flowx/http';
import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { ConfigEntity } from '../../../modules/configs/config.mysql.entity';
import { THttpContext } from '../../../app.bootstrap';
import { ConfigService } from '../../../modules/configs/config.service';
import { UserService } from '../../../modules/user/user.service';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { TypeRedis } from '@flowx/redis';
import Sha1 from 'sha1';

interface TInitData {
  registries: string[],
  scope: string[],
  username: string,
  password: string,
  email: string,
  hash: string,
}

@Controller('/-/init')
export class HttpTestController {
  @inject('MySQL') private connection: Connection;
  @inject('Redis') private redis: TypeRedis;
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(UserService) private UserService: UserService;

  @Get('/npc')
  async IsNpc(@Headers('npm-session') session: string) {
    const hash = Sha1(Date.now() + '');
    await this.redis.set('setup:' + session, hash, 30);
    return {
      ok: true,
      hash
    }
  }

  @Put('/configs')
  @useMiddleware(BodyParser())
  async InitConfigs(
    @Ctx() ctx: Koa.ParameterizedContext<any, THttpContext>,
    @Body() body: TInitData,
    @Headers('npm-session') session: string
  ) {
    const value = await this.redis.get('setup:' + session);
    value && await this.redis.del('setup:' + session);
    if (value !== body.hash) throw new BadGatewayException();
    const count = await this.connection.manager.count(ConfigEntity);
    ctx.logger.warn('Count', 'configs table has %d data chunk.', count);
    if (count === 0) {
      const time = Date.now();
      const runner = this.connection.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();
      const ConfigsRepository = runner.manager.getRepository(ConfigEntity);
      const UserRepository = runner.manager.getRepository(UserEntity);
      try {
        await this.ConfigService.init(ConfigsRepository, body.registries, body.scope);
        const user = await this.UserService.insert(UserRepository, body.username, body.password, body.email, 0);
        await this.UserService.setupAdmin(UserRepository, user.id);
        await runner.commitTransaction();
        ctx.logger.warn('', 'Default configuration added in %dms.', Date.now() - time);
      } catch(e) {
        await runner.rollbackTransaction();
        throw e;
      } finally {
        await runner.release();
      }
    } else {
      ctx.logger.warn('Count', 'Skip add default configuration process.');
    }
  }
}