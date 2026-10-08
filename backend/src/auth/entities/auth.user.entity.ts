import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity()
export class AuthUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Column({ nullable: true })
  selectedCompanyId: number;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpires: Date;

  @Column({ name: 'refreshTokenn', nullable: true })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpires: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}