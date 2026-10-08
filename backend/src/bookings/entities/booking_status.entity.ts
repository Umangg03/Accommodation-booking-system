import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Booking } from "./booking.entity";

@Entity()
export class BookingStatus {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string;
    
    @OneToMany(()=>Booking, (booking)=>booking.status)
    booking: Booking[];
}
