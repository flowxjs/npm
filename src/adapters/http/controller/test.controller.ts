import { Controller, Get } from '@flowx/http';

@Controller('/test')
export class HttpTestController {
  @Get('/login')
  Login() {
    return 'hello world'
  }

  @Get('/check')
  Done() {
    return { 
      account: 'evio-account', 
      avatar: '//www.gravatar.com/avatar/6bab7c91a03d47fe1aa5b5b6b6f8cc55', 
      email: '8802430@qq.com', 
      token: 'asdfasfdsafasfdsaf', 
      nickname: '沈赟杰' 
    }
  }
}