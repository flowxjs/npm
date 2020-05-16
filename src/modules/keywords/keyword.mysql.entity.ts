import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';
import { DATABASE_NAME } from '../../app.bootstrap';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_keyword',
})
@Index(['vid', 'word'], {
  unique: true,
})
export class KeywrodEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    length: 11,
  })
  vid: VersionEntity['id'];

  @Column({
    type: 'varchar',
    length: 40,
  })
  word: string;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}