import { TypeRedis } from '@flowx/redis';
import { TypeContainer } from '@flowx/container';
import { REDIS_CONFIGS } from './app.config';

export function SetupRedis(container: TypeContainer) {
  return new TypeRedis(container, REDIS_CONFIGS);
}