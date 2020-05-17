import { injectable } from 'inversify';
import { PipeLineTransform } from '@flowx/http';
import { Observable } from '@reactivex/rxjs';

@injectable()
export class AccountPipe implements PipeLineTransform {
  transform(source: Observable<string>) {
    return source.map<string, string>(value => value.substring(1));
  }
}