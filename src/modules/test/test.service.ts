import { injectable } from 'inversify';

@injectable()
export class TestService {
  sum(a: number, b: number) {
    return a + b;
  }
}