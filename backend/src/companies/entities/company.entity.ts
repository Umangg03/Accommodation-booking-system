import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from "typeorm"
import { Customers } from "../../customers/entities/customer.entity"
import { CompanyMembership } from "../../users/entities/company-membership.entity"
import { Booking } from "../../bookings/entities/booking.entity"

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

    @ManyToMany(() => Customers, (customer) => customer.companies)
    customers: Customers[]

    @OneToMany(() => CompanyMembership, (membership) => membership.company)
    memberships: CompanyMembership[];

    @OneToMany(() => Booking, (booking) => booking.company)
    bookings: Booking[];
}