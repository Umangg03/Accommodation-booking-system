import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { Location } from "../../location/entities/location.entity";
import { AccommodationType } from "./accommodation_type.entity";
import { Booking } from "../../bookings/entities/booking.entity";

@Entity()
export class Accommodation {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string;
    
    @Column({ type: "double precision" })
    price_per_night: number;

    @ManyToOne(() => AccommodationType,(acc_type)=>acc_type.accommodation)
    accommodation_type : AccommodationType;

    @ManyToOne(()=> Location,(location)=>location.accommodation)
    location: Location;

    @OneToMany(() => Booking, (booking) => booking.accommodation)
    booking: Booking[];
}
