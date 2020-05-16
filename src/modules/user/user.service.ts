import * as randomstring from 'randomstring';
import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from './user.mysql.entity';
import sha1 from 'sha1';


@injectable()
export class UserService {
  @inject('MySQL') connection: Connection;

  /**
   * 查询用户
   * @param account 账号
   */
  findUserByAccount(account: string) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({
      isDeleted: false,
      account,
    }).getOne();
  }

  /**
   * 新增用户数据
   * @param account 账号
   * @param password 密码
   * @param nickname 昵称
   * @param email 邮箱
   * @param avatar 头像
   * @param referer 来源
   */
  insert(account: string, password: string, nickname: string, email: string, avatar: string, referer: string, id?: number) {
    const user = new UserEntity();
    user.account = account;
    user.avatar = avatar;
    user.ctime = new Date();
    user.email = email;
    user.nickname = nickname;
    user.salt = randomstring.generate(5);
    user.password = sha1(user.salt + password);
    user.referer = referer;
    user.utime = new Date();
    if (id) user.id = id;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 更新用户数据
   * @param id 
   * @param data 
   */
  update(id: number, data: { 
    avatar?: string,
    email?: string,
    nickname?: string,
  }) {
    const user = new UserEntity();
    if (data.avatar) user.avatar = data.avatar;
    if (data.email) user.email = data.email;
    if (data.nickname) user.nickname = data.nickname;
    user.utime = new Date();
    user.id = id;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 设置用户为管理员
   * @param id 
   */
  setAdmin(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.isAdmin = true;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 取消用户管理员
   * @param id 
   */
  clearAdmin(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.isAdmin = false;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 删除用户（非物理删除）
   * @param id 
   */
  deleteUser(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.isDeleted = true;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 找回用户
   * @param id 
   */
  revokeuser(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.isDeleted = false;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 禁止用户登陆
   * @param id 
   */
  forbid(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.status = 0;
    return this.connection.getRepository(UserEntity).save(user);
  }
  
  /**
   * 恢复用户登陆
   * @param id 
   */
  unForbid(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.status = 1;
    return this.connection.getRepository(UserEntity).save(user);
  }
}