import { injectable, inject } from 'inversify';
import { Context } from '@flowx/container';
import { UserService } from './user.service';

@injectable()
export class UserController {
  @inject(UserService) private readonly user: UserService;

  use() {
    
  }
}