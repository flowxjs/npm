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
   * 通过账号以及来源查询用户信息
   * @cacheable
   * @param account 
   */
  @cacheable('user:account:${0}:${1}')
  userInfo(account: string, referer: number) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({ account, referer }).getOne();
  }

  /**
   * 通过账号以及来源查询有效用户
   * @param account 账号
   */
  findActiveUserByAccount(account: string, referer: number) {
    const userRepository = this.connection.getRepository(UserEntity);
    return userRepository.createQueryBuilder().where({
      isDeleted: false,
      account, referer,
    }).getOne();
  }

  /**
   * 通过ID查询用户
   * @param id 
   */
  async findUserByID(id: number) {
    const userRepository = this.connection.getRepository(UserEntity);
    return await userRepository.findOne(id);
  }

  /**
   * 新增用户数据
   * @param account 账号
   * @param password 密码或者token
   * @param nickname 昵称
   * @param email 邮箱
   * @param avatar 头像
   * @param referer 来源
   */
  async insert(
    account: string, 
    password: string, 
    email: string, 
    referer: number,
    nickname?: string, 
    avatar?: string,
  ) {
    let user = await this.userInfo(account, referer);
    if (user) {
      if (user.isDeleted) {
        user = await this.revokeUser(user.id);
      }
    } else {
      user = new UserEntity();
      user.ctime = new Date();
    }
    user.account = account;
    user.avatar = avatar || url(email);
    user.email = email;
    user.nickname = nickname || account;
    user.salt = randomstring.generate(5);
    user.password = referer === 0 ? sha1(user.salt + password) : password;
    user.referer = referer;
    user.utime = new Date();
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 更新用户数据
   * @param id 
   * @param data 
   */
  async update(id: number, data: { 
    avatar?: string,
    email?: string,
    nickname?: string,
  }) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    if (data.avatar) user.avatar = data.avatar;
    if (data.email) {
      user.email = data.email;
      if (!data.avatar) data.avatar = url(data.email);
    }
    if (data.avatar) user.avatar = data.avatar;
    if (data.nickname) user.nickname = data.nickname;
    user.utime = new Date();
    user.id = id;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 设置用户为管理员
   * @param id 
   */
  async setupAdmin(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    user.isAdmin = true;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 取消用户管理员
   * @param id 
   */
  async cancelAdmin(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    user.isAdmin = false;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 删除用户（非物理删除）
   * @param id 
   */
  async deleteUser(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    user.isDeleted = true;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 找回用户
   * @param id 
   */
  async revokeUser(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    user.isDeleted = false;
    return this.connection.getRepository(UserEntity).save(user);
  }

  /**
   * 禁止用户登陆
   * @param id 
   */
  async forbid(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
    user.status = 0;
    return this.connection.getRepository(UserEntity).save(user);
  }
  
  /**
   * 恢复用户登陆
   * @param id 
   */
  async unForbid(id: number) {
    const user = await this.findUserByID(id);
    if (!user) throw new Error('找不到用户');
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
    if (!user) throw new Error('找不到用户');
    user.salt = randomstring.generate(5);
    user.password = sha1(user.salt + password);
    return await this.connection.getRepository(UserEntity).save(user);
  }
}