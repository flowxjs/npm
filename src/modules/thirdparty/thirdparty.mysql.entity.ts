import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_thirdparty',
})
export class ThirdpartyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  namespace: string;

  @Column({
    type: 'text',
  })
  loginUrl: string;

  @Column({
    type: 'text',
  })
  doneUrl: string;

  @Column({
    type: 'integer',
    default: 60
  })
  loginTimeExpire: number;

  @Column({
    type: 'integer',
    default: 2
  })
  checkTimeDelay: number;

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