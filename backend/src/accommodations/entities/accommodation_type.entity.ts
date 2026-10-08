import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Accommodation } from "../../accommodations/entities/accommodation.entity";

@Entity()
export class AccommodationType {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(()=> Accommodation,(accommodation)=>accommodation.accommodation_type)
    accommodation: Accommodation[];
}
