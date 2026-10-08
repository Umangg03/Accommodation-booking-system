import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Accommodation } from "../../accommodations/entities/accommodation.entity";

@Entity()
export class Location {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    area: string;
    
    @Column()
    city: string;
    
    @Column()
    country: string;

    @OneToMany(()=> Accommodation ,(accommodation)=>accommodation.location)
    accommodation: Accommodation[];
}
