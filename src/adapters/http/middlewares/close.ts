import { Next, Context } from "koa";
import { TypeServiceInjection } from '@flowx/container';
import { ConfigService } from '../../../modules/configs/config.service';
import { BadGatewayException } from "@flowx/http";

export async function WebsiteClosed(ctx: Context, next: Next) {
  const configs = await TypeServiceInjection.get(ConfigService).query();
  if (!configs.close) return await next();
  throw new BadGatewayException('Sorry, this website is closed.');
}