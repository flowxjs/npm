import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { UserException } from '../exceptions/user.exception';
import { TUserLoginInput, TUserLoginOutput, TUserInfoOutput } from '../dto/user.dto';
import { UserService } from '../../../modules/user/user.service';
import { AccountPipe } from '../pipes/account';
import { buildCache, deleteCache } from '@flowx/redis';
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
import { Connection } from 'typeorm';
import { UserEntity } from '../../../modules/user/user.mysql.entity';

@Controller('/-/user')
@useException(UserException)
export class HttpUserController {
  @inject('MySQL') private connection: Connection;
  @inject(UserService) private UserService: UserService;

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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.userInfo(userRepository, body.name, 0);
    if (user) {
      if (!user.status) throw new BadRequestException('用户禁止登录');
      if (ctx.authPassword) {
        if (!this.UserService.checkPassword(user.password, user.salt, ctx.authPassword)) {
          throw new BadRequestException('密码错误，无法登录。');
        }
      }
      await this.UserService.changePassword(userRepository, user.id, body.password);
      await this.UserService.update(userRepository, user.id, { avatar: undefined, email: body.email, nickname: body.name });
    } else {
      await this.UserService.insert(userRepository, body.name, body.password, body.email, 0, body.name, undefined);
    }
    await buildCache(UserService, 'userInfo', userRepository, body.name, 0);
    return {
      ok: true,
      id: body._id,
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.userInfo(userRepository, account, referer);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.deleteUser(userRepository, id);
    if (user.affected) {
      await deleteCache(UserService, 'userInfo', userRepository, user.raw.account, user.raw.referer);
    }
    return {
      ok: true,
      id: 'org.couchdb.user:' + user.raw.account,
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.setupAdmin(userRepository, id);
    await buildCache(UserService, 'userInfo', userRepository, user.account, user.referer);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.cancelAdmin(userRepository, id);
    await buildCache(UserService, 'userInfo', userRepository, user.account, user.referer);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.forbid(userRepository, id);
    await buildCache(UserService, 'userInfo', userRepository, user.account, user.referer);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.unForbid(userRepository, id);
    await buildCache(UserService, 'userInfo', userRepository, user.account, user.referer);
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
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.logout(userRepository, ctx.user.id);
    await buildCache(UserService, 'userInfo', userRepository, user.account, user.referer);
  }
}