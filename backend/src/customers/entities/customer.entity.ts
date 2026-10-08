import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
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

    @ManyToOne(()=> Company ,(company)=> company.customer)
    company: Company

    @OneToMany(() => Booking, (booking) => booking.customer)
    booking: Booking[]
}
