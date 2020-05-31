import { Next, Context } from "koa";
import { TypeServiceInjection } from '@flowx/container';
import { ConfigService } from '../../../modules/configs/config.service';
import { BadGatewayException } from "@flowx/http";
import { Connection } from "typeorm";
import { ConfigEntity } from "../../../modules/configs/config.mysql.entity";

export async function WebsiteClosed(ctx: Context, next: Next) {
  const connection = TypeServiceInjection.get<Connection>('MySQL');
  const configsRepository = connection.getRepository(ConfigEntity);
  const configs = await TypeServiceInjection.get(ConfigService).query(configsRepository);
  if (!configs.close) return await next();
  throw new BadGatewayException('Sorry, this website is closed.');
}