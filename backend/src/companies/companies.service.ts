import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  create(createCompanyDto: CreateCompanyDto) {
    if (this.isSuperCompanyName(createCompanyDto.name)) {
      throw new BadRequestException('That company name is reserved.');
    }
    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  async findAll() {
    const companies = await this.companyRepository.find({
      order: { id: 'ASC' },
    });
    return companies.filter((company) => !this.isSuperCompanyName(company.name));
  }

  async findOne(id: number) {
    const company = await this.companyRepository.findOneBy({ id });
    if (!company || this.isSuperCompanyName(company.name)) {
      throw new NotFoundException(`Company with id ${id} not found`);
    }
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    if (
      updateCompanyDto.name !== undefined &&
      this.isSuperCompanyName(updateCompanyDto.name)
    ) {
      throw new BadRequestException('That company name is reserved.');
    }
    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    return this.companyRepository.remove(company);
  }

  private isSuperCompanyName(name: string) {
    const superCompanyName = process.env.COMPANY_NAME?.trim();
    return Boolean(
      superCompanyName &&
        name.trim().toLowerCase() === superCompanyName.toLowerCase(),
    );
  }
}
