import { injectable, inject } from 'inversify';
import { Context } from '@flowx/container';
import { TestService } from './test.service';

@injectable()
export class TestController {
  @inject(TestService) private readonly test: TestService;

  sum(ctx: Context, a: number, b: number) {
    return this.test.sum(a, b);
  }
}