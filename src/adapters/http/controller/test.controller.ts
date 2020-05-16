import { inject } from 'inversify';
import { Controller, Get, Query, Http, HttpCode, Header, ParseIntegerPipe, useException } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { TestController } from '../../../modules/test/test.controller';
import { logException } from '../exceptions/log.exception';

@Controller()
@useException(logException)
export class HttpTestController {
  @inject('Http') private http: Http<THttpContext>;

  @Get()
  @HttpCode(201)
  @Header('TypeServiceSum', 'a + b')
  async sum(
    @Query('a', ParseIntegerPipe) a: number, 
    @Query('b', ParseIntegerPipe) b: number,
  ): Promise<string> {
    const value = await this.http.portal<number, TestController>(TestController, 'sum', a, b);
    return `a + b = ${value}`;
  }
}