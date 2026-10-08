import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { ILike, In, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { Role } from './entities/role.entity';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { roleId, companyIds, name, email, password } = createUserDto;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      throw new BadRequestException('Select at least one company for the user.');
    }
    const companies = await this.findCompanies(companyIds);
    const role = roleId
      ? await this.roleRepository.findOneBy({ id: roleId })
      : await this.roleRepository.findOneBy({ role: ILike('User') });

    if (!role) {
      throw new NotFoundException(
        roleId ? `Role with id ${roleId} not found` : 'Default User role not found',
      );
    }

    const user = this.userRepository.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      companies,
    });
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find({
      relations: { role: true, companies: true },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true, companies: true },
    });

    if (!user) {
      throw new NotFoundException(`User With Id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: { role: true, companies: true },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    const { roleId, companyIds, name, email, password } = updateUserDto;
    if (name !== undefined) {
      user.name = name;
    }
    if (email !== undefined) {
      user.email = email;
    }
    if (password !== undefined) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (roleId !== undefined) {
      const role = await this.roleRepository.findOneBy({ id: roleId });
      if (!role) {
        throw new NotFoundException(`Role with id ${roleId} not found`);
      }
      user.role = role;
    }
    if (companyIds !== undefined) {
      user.companies = await this.findCompanies(companyIds);
    }
    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return await this.userRepository.remove(user);
  }

  private async findCompanies(companyIds: number[]) {
    if (
      !Array.isArray(companyIds) ||
      companyIds.some(
        (companyId) => !Number.isInteger(companyId) || companyId <= 0,
      )
    ) {
      throw new BadRequestException('Company ids must be an array of positive integers');
    }

    const uniqueIds = [...new Set(companyIds)];
    const companies = uniqueIds.length
      ? await this.companyRepository.findBy({ id: In(uniqueIds) })
      : [];

    if (companies.length !== uniqueIds.length) {
      const foundIds = new Set(companies.map((company) => company.id));
      const missingIds = uniqueIds.filter((companyId) => !foundIds.has(companyId));
      throw new BadRequestException(
        `Company ids do not exist: ${missingIds.join(', ')}`,
      );
    }

    return companies;
  }
}
