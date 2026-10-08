import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Users } from "../../users/entities/user.entity";
import { Permission } from "../../users/entities/permission.entity";

@Entity()
export class Role {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    role: string

    @Column()
    description: string

    @OneToMany(() => Users ,(user) => user.role)
    user: Users[]

    @OneToMany(() => Permission ,(Permission) => Permission.role)
    Permission: Permission[]
}
 