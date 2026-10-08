import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Customers } from "../../customers/entities/customer.entity";
import { BookingStatus } from "./booking_status.entity";
import { Accommodation } from "../../accommodations/entities/accommodation.entity";

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

    @ManyToOne(()=>BookingStatus,(status)=>status.booking)
    status: BookingStatus;

    @ManyToOne(()=>Accommodation ,(accommodation)=>accommodation.booking)
    accommodation: Accommodation;
}
    