import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Users } from './user.entity';

@Entity('company_users_users')
export class CompanyMembership {
  @PrimaryColumn({ name: 'usersId' })
  usersId: number;

  @ManyToOne(() => Users, (user) => user.companyMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usersId', referencedColumnName: 'id' })
  user: Users;

  @PrimaryColumn({ name: 'companyId' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId', referencedColumnName: 'id' })
  company: Company;

  @Column({ type: 'varchar', default: 'USER' })
  role: string;
}
