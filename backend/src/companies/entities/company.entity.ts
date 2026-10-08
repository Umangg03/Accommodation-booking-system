import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm"
import { Customers } from "../../customers/entities/customer.entity"
import { Users } from "../../users/entities/user.entity"

@Entity()
export class Company {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    address: string

    @Column()
    industry: string

    @OneToMany(()=> Customers, (customer)=> customer.company)
    customer: Customers[]

    @ManyToMany(()=> Users, (user) => user.companies)
    users: Users[]
}