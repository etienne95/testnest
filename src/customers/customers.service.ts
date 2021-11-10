import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerMapper } from './customers.mapper';
import { CustomerDTO } from './dto/customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    private readonly mapper: CustomerMapper,) {
  }

  create(dto: CustomerDTO): Promise<CustomerDTO> {
    return this.repo
      .save(this.mapper.dtoToEntity(dto))
      .then((e) => this.mapper.entityToDto(e));
  }

  findAll(): Promise<Customer[]> {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.find();
  }

  public async update(id: string, dto: CustomerDTO) {
    return await this.repo.update(id, dto);
  }

  public async remove(id: string) {
    const entityToRemove = await this.repo.findOne(id);
    return await this.repo.remove(entityToRemove);
  }
}
