import request from 'request';
import url from 'url';
import { injectable } from 'inversify';

@injectable()
export class PackageService {
  fetch(prefix: string, pathname: string) {
    const uri = url.resolve(prefix, pathname);
    return new Promise(resolve => {
      request.get(uri, (err: Error, response: request.Response, body: string) => {
        if (err) return resolve();
        if (response.statusCode >= 300 || response.statusCode < 200) return resolve();
        try {
          const data = JSON.parse(body);
          if (data.error) return resolve();
          data._npm_source_referer = uri;
          resolve(data);
        } catch(e) {
          resolve();
        }
      })
    })
  }

  async anyFetch(prefixes: string[], pathname: string) {
    for (let i = 0; i < prefixes.length; i++) {
      const data = await this.fetch(prefixes[i], pathname);
      if (data) return data;
    }
  }
}