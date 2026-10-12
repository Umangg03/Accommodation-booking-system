import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Customers } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customers)
    private readonly customerRepository: Repository<Customers>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    companyId: number,
    isAdmin: boolean,
  ) {
    if (!isAdmin && createCustomerDto.companyIds !== undefined) {
      throw new BadRequestException(
        'Only an admin can assign a customer to multiple companies.',
      );
    }
    const companies = isAdmin
      ? await this.resolveCompanies(createCustomerDto.companyIds)
      : await this.resolveCompanies([companyId]);
    const duplicate = await this.findCustomerWithEmailInCompanies(
      createCustomerDto.email,
      companies.map((company) => company.id),
    );
    if (duplicate) {
      throw new ConflictException(
        'A customer with this email already exists in one of the selected companies.',
      );
    }

    const customer = this.customerRepository.create({
      name: createCustomerDto.name,
      email: createCustomerDto.email,
      phone: createCustomerDto.phone,
      companies,
    });
    return this.hideSuperCompany(await this.customerRepository.save(customer));
  }

  async findAll(companyId?: number) {
    const customers = await this.customerRepository.find({
      where: companyId ? { companies: { id: companyId } } : {},
      relations: { companies: true },
      order: { name: 'ASC' },
    });
    return customers
      .map((customer) => this.hideSuperCompany(customer, companyId))
      .filter((customer) => customer.companies.length > 0);
  }

  async findOne(id: number, companyId?: number) {
    const customer = await this.customerRepository.findOne({
      where: companyId ? { id, companies: { id: companyId } } : { id },
      relations: { companies: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found.`);
    }
    const visibleCustomer = this.hideSuperCompany(customer, companyId);
    if (visibleCustomer.companies.length === 0) {
      throw new NotFoundException(`Customer with id ${id} not found.`);
    }
    return visibleCustomer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    companyId?: number,
    isAdmin = false,
  ) {
    const customer = await this.customerRepository.findOne({
      where: companyId ? { id, companies: { id: companyId } } : { id },
      relations: { companies: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found.`);
    }

    if (!isAdmin && updateCustomerDto.companyIds !== undefined) {
      throw new BadRequestException(
        'Only an admin can change a customer company assignment.',
      );
    }
    const assignedCompanies =
      updateCustomerDto.companyIds === undefined
        ? customer.companies
        : await this.resolveCompanies(updateCustomerDto.companyIds);

    if (updateCustomerDto.email) {
      const duplicate = await this.findCustomerWithEmailInCompanies(
        updateCustomerDto.email,
        assignedCompanies.map((company) => company.id),
        id,
      );
      if (duplicate) {
        throw new ConflictException(
          'A customer with this email already exists in one of the assigned companies.',
        );
      }
    }

    Object.assign(customer, {
      name: updateCustomerDto.name ?? customer.name,
      email: updateCustomerDto.email ?? customer.email,
      phone: updateCustomerDto.phone ?? customer.phone,
      companies: assignedCompanies,
    });
    return this.hideSuperCompany(
      await this.customerRepository.save(customer),
      companyId,
    );
  }

  async remove(id: number, companyId?: number) {
    const customer = await this.customerRepository.findOne({
      where: companyId ? { id, companies: { id: companyId } } : { id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found.`);
    }
    await this.customerRepository.softRemove(customer);
    return { id, deleted: true };
  }

  private async resolveCompanies(companyIds?: number[]) {
    if (!companyIds?.length) {
      throw new BadRequestException(
        'Assign the customer to at least one company.',
      );
    }
    const companies = await this.companyRepository.findBy({
      id: In(companyIds),
    });
    const superCompanyName = process.env.COMPANY_NAME?.trim().toLowerCase();
    const allowedCompanies = companies.filter(
      (company) =>
        !superCompanyName ||
        company.name.trim().toLowerCase() !== superCompanyName,
    );
    if (allowedCompanies.length !== companyIds.length) {
      throw new BadRequestException(
        'One or more selected companies are invalid.',
      );
    }
    return allowedCompanies;
  }

  private async findCustomerWithEmailInCompanies(
    email: string,
    companyIds: number[],
    excludeCustomerId?: number,
  ) {
    if (companyIds.length === 0) return undefined;
    const customers = await this.customerRepository.find({
      where: { email: this.emailEquals(email) },
      relations: { companies: true },
    });
    return customers.find(
      (customer) =>
        customer.id !== excludeCustomerId &&
        customer.companies.some((company) => companyIds.includes(company.id)),
    );
  }

  private emailEquals(email: string) {
    return Raw((alias) => `LOWER(${alias}) = LOWER(:email)`, { email });
  }

  private hideSuperCompany<T extends { companies: Company[] }>(
    customer: T,
    companyId?: number,
  ): T {
    const superCompanyName = process.env.COMPANY_NAME?.trim();
    return {
      ...customer,
      companies: customer.companies.filter(
        (company) =>
          (!companyId || company.id === companyId) &&
          (!superCompanyName ||
            company.name.trim().toLowerCase() !==
              superCompanyName.toLowerCase()),
      ),
    };
  }
}
