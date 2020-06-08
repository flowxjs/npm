import fs from 'fs';
import path from 'path';
import { ensureDirSync } from 'fs-extra';
import { ConnectionOptions } from 'typeorm';
import { RedisOptions } from 'ioredis';

interface TPKG {
  nfs: string,
  domain: string,
  theme: string,
  mysql: ConnectionOptions,
  redis: RedisOptions & {
    memory: boolean,
  }
  thirdparty: {
    [namespace: string]: any,
  }
}

const pkgfile = path.resolve(process.cwd(), 'npm.config.json');
if (!fs.existsSync(pkgfile)) {
  throw new Error('Cannot find the package.json in ' + pkgfile);
}

const pkg: TPKG = require(pkgfile);

export const NFS = path.resolve(process.cwd(), pkg.nfs);
export const DATABASE_NAME = pkg.mysql.database;
export const MYSQL_CONFIGS = pkg.mysql;
export const DOMAIN = pkg.domain;
export const THIRDPARTIES = pkg.thirdparty;
export const THEME = path.resolve(process.cwd(),pkg.theme);
export const REDIS_CONFIGS = Object.assign(pkg.redis, {
  keyPrefix: DATABASE_NAME + ':',
});

ensureDirSync(NFS);