import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
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
    type: 'text'
  })
  extra: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  code: string;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}