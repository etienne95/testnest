export class CustomerDTO implements Readonly<CustomerDTO>{
    constructor(name: string) {
        this.name = name;
    }
    id: string;
    name: string;
}