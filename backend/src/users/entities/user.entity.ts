import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { Role } from "./role.entity";
import { AuthUser } from "../../auth/entities/auth.user.entity";
import { Company } from "../../companies/entities/company.entity";

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

    @ManyToMany(() => Company, (company) => company.users)
    @JoinTable({
        name: "company_users_users",
        joinColumn: { name: "usersId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "companyId", referencedColumnName: "id" },
    })
    companies: Company[];
}
