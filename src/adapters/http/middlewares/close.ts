import { Next, Context } from "koa";
import { TypeServiceInjection } from '@flowx/container';
import { ConfigService } from '../../../modules/configs/config.service';
import { BadGatewayException } from "@flowx/http";
import { Connection } from "typeorm";
import { ConfigEntity } from "../../../modules/configs/config.mysql.entity";

export async function WebsiteClosed(ctx: Context, next: Next) {
  const connection = TypeServiceInjection.get<Connection>('MySQL');
  const configsRepository = connection.getRepository(ConfigEntity);
  const configs = await TypeServiceInjection.get(ConfigService).query(configsRepository).catch(e => {
    if (e.message === '找不到配置数据') return {close : false};
    throw e;
  });
  if (!configs.close) return await next();
  const error = new BadGatewayException('Sorry, this website is closed.');
  ctx.status = error.getStatus();
  throw error;
}