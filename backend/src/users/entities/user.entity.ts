import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { Role } from "./role.entity";
import { AuthUser } from "../../auth/entities/auth.user.entity";
import { Company } from "../../companies/entities/company.entity";
import { CompanyMembership } from "./company-membership.entity";

@Entity()
export class Users {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @ManyToOne(()=> Role,(role) => role.user)
    role: Role;

    @OneToMany(()=> AuthUser,(Auth)=>Auth.user)
    userId: AuthUser[];

    @OneToMany(() => CompanyMembership, (membership) => membership.user)
    companyMemberships?: CompanyMembership[];

    companies: Company[];

}
