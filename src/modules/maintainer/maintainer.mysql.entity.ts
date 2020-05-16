import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_maintainer',
})
@Index(['pid', 'uid'], {
  unique: true,
})
export class MaintainerEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  pid: PackageEntity['id'];

  @Column({
    type: 'integer',
  })
  uid: UserEntity['id'];

  @Column({
    type: 'bool',
    default: false,
  })
  isDeleted: boolean;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}