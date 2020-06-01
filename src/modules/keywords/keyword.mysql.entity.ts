import { Entity, Column, PrimaryGeneratedColumn, Index, JoinColumn, ManyToOne } from "typeorm";
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
    nullable: true,
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

  @ManyToOne(type => VersionEntity, version => version.Keywords)
  @JoinColumn({ name: 'vid' })
  Version: VersionEntity;
}