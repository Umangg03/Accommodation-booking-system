import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Company } from '../companies/entities/company.entity';
import { Role } from './entities/role.entity';
import { Users } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let roleRepository: {
    findOneBy: jest.Mock;
  };
  let companyRepository: {
    findBy: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      create: jest.fn((user) => user),
      findOne: jest.fn(),
      save: jest.fn(async (user) => user),
    };
    roleRepository = {
      findOneBy: jest.fn(async () => ({ id: 2, role: 'User' })),
    };
    companyRepository = {
      findBy: jest.fn(async () => [{ id: 1 }, { id: 2 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: companyRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes a new user password before saving', async () => {
    await service.create({
      name: 'Jay',
      email: 'jay@gmail.com',
      password: 'jay@2005',
      companyIds: [1, 2],
    });

    const savedUser = userRepository.save.mock.calls[0][0] as Users;
    expect(savedUser.password).not.toBe('jay@2005');
    expect(savedUser.companies).toEqual([{ id: 1 }, { id: 2 }]);
    await expect(bcrypt.compare('jay@2005', savedUser.password)).resolves.toBe(true);
  });

  it('requires at least one company when creating a user', async () => {
    await expect(
      service.create({
        name: 'Jay',
        email: 'jay@gmail.com',
        password: 'jay@2005',
        companyIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects company ids that do not exist', async () => {
    companyRepository.findBy.mockResolvedValue([{ id: 1 }]);

    await expect(
      service.create({
        name: 'Jay',
        email: 'jay@gmail.com',
        password: 'jay@2005',
        companyIds: [1, 3],
      }),
    ).rejects.toThrow('Company ids do not exist: 3');
  });

  it('hashes a changed password before saving', async () => {
    const user = {
      id: 1,
      name: 'Jay',
      email: 'jay@gmail.com',
      password: 'old-password-hash',
      role: { id: 1 },
    } as Users;
    userRepository.findOne.mockResolvedValue(user);

    await service.update(1, { password: 'new-password' });

    expect(user.password).not.toBe('new-password');
    await expect(bcrypt.compare('new-password', user.password)).resolves.toBe(true);
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });
});
