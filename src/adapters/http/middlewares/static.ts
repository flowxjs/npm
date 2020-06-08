import Koa from 'koa';
import { ServerResponse } from 'http';
import { HttpMiddleware, NotFoundException } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { injectable } from 'inversify';
import createError from 'http-errors';
import { join, resolve, normalize, sep, parse, basename, extname } from 'path';
import pathIsAbsolute from 'path-is-absolute';
import fs from 'mz/fs';
import { THEME } from '../../../app.config';

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

interface TStaticSendOptions {
  root?: string,
  index?: string,
  maxage?: number,
  maxAge?: number,
  immutable?: boolean,
  hidden?: boolean,
  format?: boolean,
  extensions?: string[],
  brotli?: boolean,
  gzip?: boolean,
  fallback?: boolean,
  setHeaders?: (res: ServerResponse, key: string, value: fs.Stats) => void,
}

@injectable()
export class HistoryStaticMiddleware<C extends Koa.ParameterizedContext<any, THttpContext>> implements HttpMiddleware<C> {
  async use(ctx: C, next: Koa.Next) {
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return await next();
    const session = ctx.headers['npm-session'];
    const userAgent = ctx.headers['user-agent'];
    if (session || /npm\/\d+\.\d+\.\d+/.test(userAgent) || /node\/v\d+\.\d+\.\d+/.test(userAgent)) return await next();
    if (!fs.existsSync(THEME)) throw new NotFoundException();
    await this.send(ctx, ctx.path, {
      root: THEME,
      index: 'index.html',
      maxAge: 2 * 60 * 60 * 1000,
      gzip: true,
      fallback: true,
    });
  }

  async send(ctx: C, path: string, opts: TStaticSendOptions = {}) {
    const root = opts.root ? normalize(resolve(opts.root)) : '';
    const trailingSlash = path[path.length - 1] === '/';
    path = path.substr(parse(path).root.length);
    const index = opts.index;
    const maxage = opts.maxage || opts.maxAge || 0;
    const immutable = opts.immutable || false;
    const hidden = opts.hidden || false;
    const format = opts.format !== false;
    const extensions = Array.isArray(opts.extensions) ? opts.extensions : false;
    const brotli = opts.brotli !== false;
    const gzip = opts.gzip !== false;
    const setHeaders = opts.setHeaders;
    const fallback = opts.fallback;

    if (setHeaders && typeof setHeaders !== 'function') {
      throw new TypeError('option setHeaders must be function')
    }

    // normalize path
    path = decode(path);

    if (!path) return ctx.throw(400, 'failed to decode');

    // index file support
    if (index && trailingSlash) path += index;

    path = this.resolvePath(root, path);

    // hidden file support, ignore
    if (!hidden && isHidden(root, path)) return;

    let encodingExt = '';
    // serve brotli file when possible otherwise gzipped file when possible
    if (ctx.acceptsEncodings('br', 'identity') === 'br' && brotli && (await fs.exists(path + '.br'))) {
      path = path + '.br';
      ctx.set('Content-Encoding', 'br');
      ctx.res.removeHeader('Content-Length');
      encodingExt = '.br';
    } else if (ctx.acceptsEncodings('gzip', 'identity') === 'gzip' && gzip && (await fs.exists(path + '.gz'))) {
      path = path + '.gz';
      ctx.set('Content-Encoding', 'gzip');
      ctx.res.removeHeader('Content-Length');
      encodingExt = '.gz';
    }
    if (extensions && !/\./.exec(basename(path))) {
      const list = [].concat(extensions);
      for (let i = 0; i < list.length; i++) {
        let ext = list[i];
        if (typeof ext !== 'string') {
          throw new TypeError('option extensions must be array of strings or false');
        }
        if (!/^\./.exec(ext)) ext = `.${ext}`;
        if (await fs.exists(`${path}${ext}`)) {
          path = `${path}${ext}`;
          break;
        }
      }
    }

    // stat
    let stats: fs.Stats;
    try {
      stats = await fs.stat(path);

      // Format the path to serve static file servers
      // and not require a trailing slash for directories,
      // so that you can do both `/directory` and `/directory/`
      if (stats.isDirectory()) {
        if (format && index) {
          path += `/${index}`
          stats = await fs.stat(path)
        } else {
          return
        }
      }
    } catch (err) {
      const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];
      if (notfound.includes(err.code) && fallback) {
        path = resolve(opts.root, opts.index);
        if (!fs.existsSync(path)) throw createError(404, err);
        stats = await fs.stat(path);
      }
      if (!stats) {
        throw createError(404, err)
      }
    }

    if (setHeaders) setHeaders(ctx.res, path, stats);

    // stream
    ctx.set('Content-Length', stats.size + '');
    if (!ctx.response.get('Last-Modified')) ctx.set('Last-Modified', stats.mtime.toUTCString())
    if (!ctx.response.get('Cache-Control')) {
      const directives = [`max-age=${(maxage / 1000 | 0)}`]
      if (immutable) {
        directives.push('immutable')
      }
      ctx.set('Cache-Control', directives.join(','))
    }
    if (!ctx.type) ctx.type = type(path, encodingExt)
    ctx.body = fs.createReadStream(path)

    return path;
  }

  private resolvePath(rootPath: string, relativePath?: string): string {
    let path = relativePath;
    let root = rootPath;
    // root is optional, similar to root.resolve
    if (!relativePath) {
      path = rootPath;
      root = process.cwd();
    }

    if (root == null) {
      throw new TypeError('argument rootPath is required');
    }

    if (typeof root !== 'string') {
      throw new TypeError('argument rootPath must be a string');
    }

    if (path == null) {
      throw new TypeError('argument relativePath is required');
    }

    if (typeof path !== 'string') {
      throw new TypeError('argument relativePath must be a string')
    }

    // containing NULL bytes is malicious
    if (path.indexOf('\0') !== -1) {
      throw createError(400, 'Malicious Path')
    }

    // path should never be absolute
    if (pathIsAbsolute.posix(path) || pathIsAbsolute.win32(path)) {
      throw createError(400, 'Malicious Path')
    }
    
    // path outside root
    if (UP_PATH_REGEXP.test(normalize('.' + sep + path))) {
      throw createError(403)
    }

    // join the relative path
    return normalize(join(resolve(root), path))
  }
}

/**
 * Check if it's hidden.
 */

function isHidden (root: string, path: string) {
  const _path = path.substr(root.length).split(sep);
  for (let i = 0; i < _path.length; i++) {
    if (_path[i][0] === '.') return true;
  }
  return false
}

/**
 * Decode `path`.
 */

function decode (path: string) {
  try {
    return decodeURIComponent(path);
  } catch (err) {}
}

/**
 * File type.
 */

function type (file: string, ext: string) {
  return ext !== '' ? extname(basename(file, ext)) : extname(file)
}