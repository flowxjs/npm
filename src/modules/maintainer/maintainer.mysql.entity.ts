import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.bootstrap';

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
    length: 11,
  })
  pid: PackageEntity['id'];

  @Column({
    type: 'integer',
    length: 11,
  })
  uid: UserEntity['id'];

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}