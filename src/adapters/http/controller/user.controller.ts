import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { UserException } from '../exceptions/user.exception';
import { TUserLoginInput, TUserLoginOutput, TUserInfoOutput } from '../dto/user.dto';
import { UserService } from '../../../modules/user/user.service';
import { AccountPipe } from '../pipes/account';
import { buildCache } from '@flowx/redis';
import { Authorization } from '../middlewares/authorize';
import { IsLogined } from '../guards/is-logined';
import { IsAdmin } from '../guards/is-admin';
import { 
  Controller, 
  HttpCode, 
  useException, 
  Put, Get, Delete, Post,
  Body, Params,
  useMiddleware,
  BadRequestException,
  ParseIntegerPipe,
  useGuard,
  Ctx
} from '@flowx/http';
import { ParameterizedContext } from 'koa';
import { THttpContext } from '../../../app.bootstrap';

@Controller('/-/user')
@useException(UserException)
export class HttpUserController {
  @inject(UserService) private UserService: UserService;
  @inject(IsLogined) private IsLogined: IsLogined<Koa.ParameterizedContext<any, THttpContext>>;

  /**
   * 添加用户或者用户登录
   * @param body 
   */
  @HttpCode(201)
  @useMiddleware(BodyParser())
  @useMiddleware(Authorization)
  @Put('/org.couchdb.user:account')
  // shell: npm login --registry=http://127.0.0.1:3000
  async AddUser(
    @Body() body: TUserLoginInput, 
    @Ctx() ctx: Koa.ParameterizedContext<any, THttpContext>
  ): Promise<TUserLoginOutput> {
    if (!body.email) return;
    const rev = Buffer.from(body.name + ':' + body.password, 'utf8').toString('base64');
    const user = await this.UserService.userInfo(body.name, 0);
    if (user) {
      if (!user.status) throw new BadRequestException('用户禁止登录');
      if (ctx.authPassword) {
        if (!this.UserService.checkPassword(user.password, user.salt, ctx.authPassword)) {
          throw new BadRequestException('密码错误，无法登录。');
        }
      }
      if (user.isDeleted) await this.UserService.revokeUser(user.id);
      await this.UserService.changePassword(user.id, body.password);
      await this.UserService.update(user.id, { avatar: undefined, email: body.email, nickname: body.name });
    } else {
      await this.UserService.insert(body.name, body.password, body.email, 0, body.name, undefined);
    }
    await buildCache(UserService, 'userInfo', body.name, 0);
    return {
      ok: true,
      id: body._id,
      rev
    }
  }

  /**
   * 获取用户信息
   * @param account 
   * @param referer
   */
  @HttpCode(201)
  @Get('/:referer(\\d+)/org.couchdb.user:account')
  // http: http://0.0.0.0:3000/-/user/0/org.couchdb.user:evio
  async UserInfo(
    @Params('account', AccountPipe) account: string,
    @Params('referer', ParseIntegerPipe) referer: number = 0
  ): Promise<TUserInfoOutput> {
    const user = await this.UserService.userInfo(account, referer);
    if (!user) throw new BadRequestException('找不到用户');
    return {
      account,
      name: user.nickname,
      email: user.email,
      avatar: user.avatar,
    }
  }

  /**
   * 删除用户
   * @param id 
   */
  @HttpCode(200)
  @Delete('/org.couchdb.user:id(\\d+)')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async DeleteUser(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.deleteUser(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 恢复用户
   * @param id 
   */
  @HttpCode(200)
  @Post('/org.couchdb.user:id(\\d+)')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async RevokeUser(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.revokeUser(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 设置管理员
   * @param id 
   */
  @HttpCode(200)
  @Put('/org.couchdb.user:id(\\d+)/admin')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async SetUserAdmin(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.setupAdmin(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 取消管理员
   * @param id 
   */
  @HttpCode(200)
  @Delete('/org.couchdb.user:id(\\d+)/admin')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async CancelUserAdmin(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.cancelAdmin(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 禁止登录
   * @param id 
   */
  @HttpCode(200)
  @Put('/org.couchdb.user:id(\\d+)/forbid')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async setUserForbid(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.forbid(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 取消禁止登录
   * @param id 
   */
  @HttpCode(200)
  @Delete('/org.couchdb.user:id(\\d+)/forbid')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @useGuard(IsAdmin)
  async cancelUserForbid(@Params('id', AccountPipe, ParseIntegerPipe) id: number) {
    const user = await this.UserService.unForbid(id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.account,
    }
  }

  /**
   * 退出登录
   * @param ctx 
   */
  @Delete('/token/:token')
  @useMiddleware(Authorization)
  @useGuard(IsLogined)
  @HttpCode(201)
  async Logout(@Ctx() ctx:ParameterizedContext<any, THttpContext>) {
    const user = await this.UserService.logout(ctx.user.id);
    await buildCache(UserService, 'userInfo', user.account, user.referer);
  }
}