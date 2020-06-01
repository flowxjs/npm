import randomstring from 'randomstring';
import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
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
  @cacheable('user:account:${1}:${2}')
  userInfo(
    repository: Repository<UserEntity>, 
    account: string, 
    referer: number
  ) {
    return repository.createQueryBuilder().where({ account, referer }).getOne();
  }

  /**
   * 通过账号以及来源查询有效用户
   * @param account 账号
   */
  findActiveUserByAccount(
    repository: Repository<UserEntity>, 
    account: string, 
    referer: number
  ) {
    return repository.createQueryBuilder().where({
      account, referer,
    }).getOne();
  }

  /**
   * 通过ID查询用户
   * @param id 
   */
  async findUserByID(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    return await repository.findOne(id);
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
    repository: Repository<UserEntity>, 
    account: string, 
    password: string, 
    email: string, 
    referer: number,
    nickname?: string, 
    avatar?: string,
  ) {
    let user = await this.userInfo(repository, account, referer);
    if (!user) {
      user = new UserEntity();
      user.ctime = new Date();
    }
    user.account = account;
    user.avatar = avatar || url(email);
    user.email = email;
    user.nickname = nickname || account;
    user.salt = randomstring.generate(5);
    user.password = referer === 0 ? sha1(user.salt + password) : sha1(user.salt + password + referer);
    user.referer = referer;
    user.utime = new Date();
    return await repository.save(user);
  }

  /**
   * 更新用户数据
   * @param id 
   * @param data 
   */
  async update(
    repository: Repository<UserEntity>, 
    id: number, 
    data: { 
      avatar?: string,
      email?: string,
      nickname?: string,
    }
  ) {
    const user = await this.findUserByID(repository, id);
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
    return await repository.save(user);
  }

  /**
   * 设置用户为管理员
   * @param id 
   */
  async setupAdmin(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    user.isAdmin = true;
    return await repository.save(user);
  }

  /**
   * 取消用户管理员
   * @param id 
   */
  async cancelAdmin(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    user.isAdmin = false;
    return await repository.save(user);
  }

  /**
   * 删除用户（非物理删除）
   * @param id 
   */
  async deleteUser(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    return await repository.delete(user);
  }

  /**
   * 禁止用户登陆
   * @param id 
   */
  async forbid(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    user.status = 0;
    return await repository.save(user);
  }
  
  /**
   * 恢复用户登陆
   * @param id 
   */
  async unForbid(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    user.status = 1;
    return await repository.save(user);
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
  async changePassword(
    repository: Repository<UserEntity>, 
    id: number, 
    password: string
  ) {
    const user = await this.findUserByID(repository, id);
    if (!user) throw new Error('找不到用户');
    user.salt = randomstring.generate(5);
    user.password = sha1(user.salt + password);
    return await repository.save(user);
  }

  findActiveUserByToken(
    repository: Repository<UserEntity>, 
    token: string
  ) {
    return repository.createQueryBuilder().where({
      password: token,
    }).andWhere('referer>0').getOne();
  }

  async logout(
    repository: Repository<UserEntity>, 
    id: number
  ) {
    const user = await this.changePassword(repository, id, randomstring.generate(10));
    return await repository.save(user);
  }
}