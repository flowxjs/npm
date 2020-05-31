import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_keyword',
})
@Index(['vid', 'word'], {
  unique: true,
})
export class KeywordEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  vid: VersionEntity['id'];

  @OneToOne(type => VersionEntity, version => version.id)
  @JoinColumn({ name: 'vid' })
  Version: VersionEntity;

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