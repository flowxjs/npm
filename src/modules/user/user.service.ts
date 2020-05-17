import * as randomstring from 'randomstring';
import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { cacheable } from '@flowx/redis';
import { UserEntity } from './user.mysql.entity';
import { url } from 'gravatar';
import sha1 from 'sha1';


@injectable()
export class UserService {
  @inject('MySQL') connection: Connection;

  /**
   * 通过账号查询用户信息
   * @cacheable
   * @param account 
   */
  @cacheable('user:${0}')
  userInfo(account: string) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({ account }).getOne();
  }

  /**
   * 通过账号查询有效用户
   * @param account 账号
   */
  findActiveUserByAccount(account: string) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({
      isDeleted: false,
      account,
    }).getOne();
  }

  /**
   * 通过账号查询所有用户 无论有效与否
   * @param account 账号
   */
  findAllUserByAccount(account: string) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({
      account,
    }).getOne();
  }

  /**
   * 通过账号查询无效用户
   * @param account 账号
   */
  findUnActiveUserByAccount(account: string) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({
      isDeleted: true,
      account,
    }).getOne();
  }

  /**
   * 通过ID查询用户
   * @param id 
   */
  findUserByID(id: number) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({ id }).getOne();
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
  insert(account: string, password: string, email: string, nickname?: string, avatar?: string, referer?: string) {
    const user = new UserEntity();
    user.account = account;
    user.avatar = avatar || url(email);
    user.ctime = new Date();
    user.email = email;
    user.nickname = nickname || account;
    user.salt = randomstring.generate(5);
    user.password = sha1(user.salt + password);
    user.referer = referer;
    user.utime = new Date();
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
    if (data.email) {
      user.email = data.email;
      if (!data.avatar) data.avatar = url(data.email);
    }
    if (data.nickname) user.nickname = data.nickname;
    user.utime = new Date();
    user.id = id;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 设置用户为管理员
   * @param id 
   */
  setupAdmin(id: number) {
    const user = new UserEntity();
    user.id = id;
    user.isAdmin = true;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 取消用户管理员
   * @param id 
   */
  cancelAdmin(id: number) {
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
  revokeUser(id: number) {
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

  /**
   * 检测密码是否正确
   * @param pass 数据库加密密码
   * @param salt 盐
   * @param password 密码
   */
  checkPassword(pass: string, salt: string, password: string) {
    return sha1(salt + password) === pass;
  }

  /**
   * 修改密码
   * @param id 
   * @param password 
   */
  async changePassword(id: number, password: string) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到该用户');
    user.salt = randomstring.generate(5);
    user.password = sha1(user.salt + password);
    return await this.connection.getRepository(UserEntity).save(user);
  }
}