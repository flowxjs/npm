import { injectable, inject } from 'inversify';
import { Context } from '@flowx/container';
import { UserService } from './user.service';
import { ConfigService } from '../configs/config.service';

@injectable()
export class UserController {
  @inject(UserService) private readonly service: UserService;

  /**
   * 密码登录
   * @param ctx 
   * @param account 账号
   * @param password 密码
   * @param email 邮箱
   * @param nickname 昵称
   * @param avatar 头像
   * @param referer 来源
   */
  async passwordlogin(ctx: Context, account: string,  password: string, email: string, nickname?: string, avatar?: string, referer?: string) {
    const user = await this.service.findAllUserByAccount(account);
    if (!user) return await this.service.insert(account, password, email, nickname, avatar, referer);
    if (!user.status) throw new Error('用户禁止登录');
    if (!this.service.checkPassword(user.password, user.salt, password)) throw new Error('密码错误，无法登录。');
    if (user.isDeleted) await this.service.revokeUser(user.id);
    await this.service.changePassword(user.id, password);
    return await this.service.update(user.id, { avatar, email, nickname });
  }

  /**
   * 用户信息
   * @param account 
   */
  userInfo(ctx: Context, account: string) {
    return this.service.userInfo(account);
  }
}