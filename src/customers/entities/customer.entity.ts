import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'customer' })
export class Customer {
    constructor(name: string) {
        this.name = name;
    }

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 300 })
    name: string;
}
