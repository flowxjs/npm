import { injectable } from 'inversify';
import { PipeLineTransform } from '@flowx/http';
import { Observable } from '@reactivex/rxjs';

@injectable()
export class DecodeURIComponentPipe implements PipeLineTransform {
  transform(source: Observable<string>) {
    return source.map<string, string>(value => decodeURIComponent(value));
  }
}