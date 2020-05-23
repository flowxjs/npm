import { Observable } from '@reactivex/rxjs';

function a(source: Observable<string>) {
  return source.map<string, string>(value => {
    return value.substring(1);
  })
}

function b(source: Observable<string>) {
  return source.map<string, number>(value => {
    return Number(value);
  })
}

Observable.of(':123').pipe(a, b).subscribe(value => console.log('result', value))