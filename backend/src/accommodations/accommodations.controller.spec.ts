import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';
import { Accommodation } from './entities/accommodation.entity';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { AccommodationType } from './entities/accommodation_type.entity';
import { Location } from '../location/entities/location.entity';
import { Booking } from '../bookings/entities/booking.entity';

describe('AccommodationsController', () => {
  let controller: AccommodationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccommodationsController],
      providers: [
        AccommodationsService,
        {
          provide: getRepositoryToken(AccommodationType),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Location),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Accommodation),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        AccessTokenGuard,
        AdminRoleGuard,
      ],
    }).compile();

    controller = module.get<AccommodationsController>(AccommodationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
