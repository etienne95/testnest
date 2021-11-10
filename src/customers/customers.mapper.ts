import { Injectable } from '@nestjs/common';
import { CustomerDTO } from './dto/customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerMapper {
  dtoToEntity(dto: CustomerDTO): Customer {
    return new Customer(dto.name);
  }

  entityToDto(customer: Customer): CustomerDTO {
    return new CustomerDTO(customer.name);
  }
}
