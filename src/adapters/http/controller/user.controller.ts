import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { UserException } from '../exceptions/user.exception';
import { TUserLoginInput, TUserLoginOutput, TUserInfoOutput } from './user.dto';
import { UserService } from '../../../modules/user/user.service';
import { ConfigService } from '../../../modules/configs/config.service';
import { AccountPipe } from '../pipes/account';
import { buildCache } from '@flowx/redis';
import { 
  Controller, 
  HttpCode, 
  useException, 
  Put, Get, Delete,
  Body, Params,
  useMiddleware,
  BadRequestException,
  ParseIntegerPipe
} from '@flowx/http';

@Controller('/-/user')
@useException(UserException)
export class HttpUserController {
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(UserService) private UserService: UserService;

  @HttpCode(201)
  @useMiddleware(BodyParser())
  @Put('/org.couchdb.user:account')
  // shell: npm login --registry=http://127.0.0.1:3000
  async AddUser(@Body() body: TUserLoginInput): Promise<TUserLoginOutput> {
    if (!body.email) return;
    const rev = Buffer.from(body.name + ':' + body.password, 'utf8').toString('base64');
    const user = await this.UserService.userInfo(body.name, 0);
    if (user) {
      if (!user.status) throw new BadRequestException('用户禁止登录');
      if (!this.UserService.checkPassword(user.password, user.salt, body.password)) throw new BadRequestException('密码错误，无法登录。');
      if (user.isDeleted) await this.UserService.revokeUser(user.id);
      await this.UserService.changePassword(user.id, body.password);
      await this.UserService.update(user.id, { avatar: undefined, email: body.email, nickname: body.name });
    } else {
      await this.UserService.insert(body.name, body.password, body.email, 0, body.name, undefined);
    }
    await buildCache(UserService, 'userInfo', body.name);
    return {
      ok: true,
      id: body._id,
      rev
    }
  }

  @HttpCode(201)
  @Get('/org.couchdb.user:account')
  // http: http://0.0.0.0:3000/-/user/org.couchdb.user:evio
  async UserInfo(@Params('account', AccountPipe) account: string): Promise<TUserInfoOutput> {
    const user = await this.UserService.userInfo(account, 0);
    if (!user) throw new BadRequestException('找不到用户');
    return {
      account,
      name: user.nickname,
      email: user.email,
      avatar: user.avatar,
    }
  }

  @HttpCode(200)
  @Delete('/org.couchdb.user:id(\\d+)')
  async DeleteUser(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.deleteUser(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }
}