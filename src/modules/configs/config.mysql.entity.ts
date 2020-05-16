import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { DATABASE_NAME } from '../../app.bootstrap';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_configs',
})
export class DependencyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'bool'
  })
  close: boolean;

  @Column({
    type: 'text',
  })
  registries: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  domain: string;

  @Column({
    type: 'text'
  })
  loginType: string;

  @Column({
    type: 'text',
  })
  scopes: string;
}