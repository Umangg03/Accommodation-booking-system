import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    DeleteDateColumn,
    JoinTable,
    JoinColumn,
} from "typeorm";
import { Company } from "../../companies/entities/company.entity";
import { Booking } from "../../bookings/entities/booking.entity";

@Entity()
export class Customers {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    phone: string;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @ManyToMany(() => Company, (company) => company.customers)
    @JoinTable({
        name: "customer_companies",
        joinColumn: { name: "customerId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "companyId", referencedColumnName: "id" },
    })
    companies: Company[]

    @ManyToOne(() => Company, { nullable: true })
    @JoinColumn({ name: "companyId" })
    legacyCompany?: Company

    @OneToMany(() => Booking, (booking) => booking.customer)
    booking: Booking[]
}
