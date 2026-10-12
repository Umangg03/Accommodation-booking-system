import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { Company } from '../companies/entities/company.entity';
import { CompanyRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './entities/role.entity';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { roleId, companyIds, companyRoles, name, email, password } =
      createUserDto;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      throw new BadRequestException('Select at least one company for the user.');
    }
    const companies = await this.findCompanies(companyIds);
    const assignments = this.resolveCompanyRoles(
      companies.map(({ id }) => Number(id)),
      companyRoles,
    );
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
    });
    const saved = await this.userRepository.save(user);
    await this.saveCompanyRoles(saved.id, assignments);
    return {
      ...this.withoutPassword(saved),
      companies,
      companyRoles: assignments,
    };
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: { role: true, companyMemberships: { company: true } },
      order: { id: 'ASC' },
    });
    return users
      .filter((user) => !this.isPlatformAdmin(user))
      .map((user) => this.withoutPassword(user));
  }

  async findOne(id: number) {
    const user = await this.findUserWithMemberships(id);
    if (!user) {
      throw new NotFoundException(`User With Id ${id} not found`);
    }
    return this.withoutPassword(user);
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { role: true, companyMemberships: { company: true } },
    });
    if (user) {
      user.companies = (user.companyMemberships ?? []).map(
        (membership) => membership.company,
      );
    }
    return user;
  }

  async findCompanyRole(userId: number, companyId: number) {
    const rows = (await this.userRepository.manager.query(
      `SELECT "role" FROM "company_users_users"
       WHERE "usersId" = $1 AND "companyId" = $2`,
      [userId, companyId],
    )) as Array<{ role: string }>;
    return rows[0]?.role;
  }

  async updatePassword(userId: number, password: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User With Id ${userId} not found`);
    }
    user.password = await bcrypt.hash(password, 10);
    await this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserWithMemberships(id);
    if (!user) {
      throw new NotFoundException(`User With Id ${id} not found`);
    }
    const { roleId, companyIds, companyRoles, name, email, password } =
      updateUserDto;
    const previousRoles = new Map(
      (user.companyMemberships ?? []).map((membership) => [
        Number(membership.companyId),
        membership.role,
      ]),
    );
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
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

    const saved = await this.userRepository.save(user);
    if (companyIds !== undefined || companyRoles !== undefined) {
      const companies =
        companyIds === undefined
          ? (user.companyMemberships ?? [])
              .filter(
                (membership) =>
                  !this.isSuperCompanyName(membership.company.name),
              )
              .map((membership) => membership.company)
          : await this.findCompanies(companyIds);
      const companyIdList = companies.map(({ id: companyId }) =>
        Number(companyId),
      );
      const assignments =
        companyRoles === undefined
          ? companyIdList.map((companyId) => ({
              companyId,
              role: previousRoles.get(companyId) ?? 'USER',
            }))
          : this.resolveCompanyRoles(companyIdList, companyRoles);

      if (companyIds !== undefined) {
        const superCompanyId = this.getSuperCompanyId(
          user.companyMemberships ?? [],
        );
        await this.userRepository.manager.query(
          `DELETE FROM "company_users_users"
           WHERE "usersId" = $1
             AND NOT ("companyId" = ANY($2))
             AND ("companyId" <> $3 OR $3 IS NULL)`,
          [saved.id, companyIdList, superCompanyId ?? null],
        );
      }
      await this.saveCompanyRoles(saved.id, assignments);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User With Id ${id} not found`);
    }
    await this.userRepository.remove(user);
    return { id, deleted: true };
  }

  private findUserWithMemberships(id: number) {
    return this.userRepository.findOne({
      where: { id },
      relations: { role: true, companyMemberships: { company: true } },
    });
  }

  private resolveCompanyRoles(
    companyIds: number[],
    companyRoles?: CompanyRoleDto[],
  ) {
    const assignments = new Map(
      (companyRoles ?? []).map(({ companyId, role }) => [
        Number(companyId),
        role.toUpperCase(),
      ]),
    );
    if (assignments.size !== (companyRoles ?? []).length) {
      throw new BadRequestException('A company can only be assigned one role.');
    }
    for (const companyId of assignments.keys()) {
      if (!companyIds.includes(companyId)) {
        throw new BadRequestException(
          'Company roles can only be set for an assigned company.',
        );
      }
    }
    return companyIds.map((companyId) => ({
      companyId,
      role: assignments.get(companyId) ?? 'USER',
    }));
  }

  private async saveCompanyRoles(
    userId: number,
    assignments: Array<{ companyId: number; role: string }>,
  ) {
    for (const { companyId, role } of assignments) {
      await this.userRepository.manager.query(
        `INSERT INTO "company_users_users" ("usersId", "companyId", "role")
         VALUES ($1, $2, $3)
         ON CONFLICT ("usersId", "companyId")
         DO UPDATE SET "role" = EXCLUDED."role"`,
        [userId, companyId, role],
      );
    }
  }

  private withoutPassword(user: Users) {
    const {
      password,
      companyMemberships = [],
      ...safeUser
    } = user;
    void password;
    const visibleMemberships = companyMemberships.filter(
      (membership) => !this.isSuperCompanyName(membership.company.name),
    );
    return {
      ...safeUser,
      companies: visibleMemberships.map((membership) => membership.company),
      companyRoles: visibleMemberships.map((membership) => ({
        companyId: Number(membership.companyId),
        role: membership.role,
      })),
    };
  }

  private async findCompanies(companyIds: number[]) {
    if (
      !Array.isArray(companyIds) ||
      companyIds.some(
        (companyId) => !Number.isInteger(companyId) || companyId <= 0,
      )
    ) {
      throw new BadRequestException(
        'Company ids must be an array of positive integers',
      );
    }

    const uniqueIds = [...new Set(companyIds)];
    const companies = uniqueIds.length
      ? await this.companyRepository.findBy({ id: In(uniqueIds) })
      : [];

    if (companies.length !== uniqueIds.length) {
      const foundIds = new Set(companies.map((company) => company.id));
      const missingIds = uniqueIds.filter(
        (companyId) => !foundIds.has(companyId),
      );
      throw new BadRequestException(
        `Company ids do not exist: ${missingIds.join(', ')}`,
      );
    }

    if (companies.some((company) => this.isSuperCompanyName(company.name))) {
      throw new BadRequestException(
        'The configured super company cannot be assigned to users.',
      );
    }
    return companies;
  }

  private isSuperCompanyName(name: string) {
    const superCompanyName = process.env.COMPANY_NAME?.trim();
    return Boolean(
      superCompanyName &&
        name.trim().toLowerCase() === superCompanyName.toLowerCase(),
    );
  }

  private isPlatformAdmin(user: Users) {
    if (user.role?.role?.trim().toUpperCase() === 'ADMIN') {
      return true;
    }
    return (user.companyMemberships ?? []).some(
      (membership) =>
        this.isSuperCompanyName(membership.company.name) &&
        membership.role.trim().toUpperCase() === 'ADMIN',
    );
  }

  private getSuperCompanyId(memberships: NonNullable<Users['companyMemberships']>) {
    return memberships.find((membership) =>
      this.isSuperCompanyName(membership.company.name),
    )?.companyId;
  }
}
