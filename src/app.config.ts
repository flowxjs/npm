import fs from 'fs';
import path from 'path';
import { ensureDirSync } from 'fs-extra';

interface TPKG {
  nfs: string,
  domain: string,
  mysql: {
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
  },
  redis: {
    host: string,
    port: number,
    memory: boolean,
  }
}

const pkgfile = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(pkgfile)) {
  throw new Error('Cannot find the package.json in ' + pkgfile);
}

const pkg: { configs: TPKG } = require(pkgfile);

if (!pkg.configs) {
  throw new Error('pkg missing configs.');
}
export const NFS = path.resolve(process.cwd(), pkg.configs.nfs);
export const DATABASE_NAME = pkg.configs.mysql.database;
export const MYSQL_CONFIGS = {
  host: pkg.configs.mysql.host,
  port: pkg.configs.mysql.port,
  username: pkg.configs.mysql.username,
  password: pkg.configs.mysql.password,
  database: DATABASE_NAME,
}
export const DOMAIN = pkg.configs.domain;
export const REDIS_CONFIGS = {
  host: pkg.configs.redis.host,
  port: pkg.configs.redis.port,
  memory: pkg.configs.redis.memory,
  keyPrefix: DATABASE_NAME + ':',
}

ensureDirSync(NFS);