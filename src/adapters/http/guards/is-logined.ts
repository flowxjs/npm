import Koa from 'koa';
import { CanActivate } from '@flowx/http';
import { injectable, inject } from 'inversify';
import { THttpContext } from '../../../app.bootstrap';
import { UserService } from '../../../modules/user/user.service';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { Connection } from 'typeorm';

@injectable()
export class IsLogined<T extends Koa.ParameterizedContext<any, THttpContext>> implements CanActivate<T> {
  @inject('MySQL') private connection: Connection;
  @inject(UserService) private UserService: UserService;

  async canActivate(ctx: T) {
    if (!ctx.authType) return false;
    switch (ctx.authType) {
      case 'Basic': 
        const [BasicActive, BasicUser] = await this.checkBasicAuthorize(ctx.authUsername, ctx.authPassword);
        if (BasicActive) ctx.user = BasicUser;
        return BasicActive;
      case 'Bearer': 
        const [BearerActive, BearerUser] = await this.checkBearerAuthorize(ctx.authToken);
        if (BearerActive) ctx.user = BearerUser;
        return BearerActive;
    }
    return false;
  }

  private async checkBasicAuthorize(username: string, password: string): Promise<[boolean, UserEntity?]> {
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.findActiveUserByAccount(userRepository, username, 0);
    if (!user) return [false];
    return [this.UserService.checkPassword(user.password, user.salt, password), user];
  }

  private async checkBearerAuthorize(token: string): Promise<[boolean, UserEntity?]> {
    const userRepository = this.connection.getRepository(UserEntity);
    const user = await this.UserService.findActiveUserByToken(userRepository, token);
    if (!user) return [false];
    return [true, user];
  }
}