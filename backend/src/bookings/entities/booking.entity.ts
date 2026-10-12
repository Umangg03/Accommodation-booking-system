import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Customers } from "../../customers/entities/customer.entity";
import { BookingStatus } from "./booking_status.entity";
import { Accommodation } from "../../accommodations/entities/accommodation.entity";
import { Company } from "../../companies/entities/company.entity";

@Entity()
export class Booking {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    check_in: Date;

    @Column()
    cheek_out: Date;

    @ManyToOne(()=> Customers ,(customer)=> customer.booking)
    customer: Customers

    @ManyToOne(() => Company, (company) => company.bookings, { nullable: true })
    @JoinColumn({ name: "companyId" })
    company: Company

    @ManyToOne(()=>BookingStatus,(status)=>status.booking)
    status: BookingStatus;

    @ManyToOne(()=>Accommodation ,(accommodation)=>accommodation.booking)
    accommodation: Accommodation;
}
    