import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Location } from '../location/entities/location.entity';
import { AccommodationsService } from './accommodations.service';
import { Accommodation } from './entities/accommodation.entity';
import { AccommodationType } from './entities/accommodation_type.entity';

describe('AccommodationsService', () => {
  let service: AccommodationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            create: jest.fn((entity) => entity),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccommodationsService>(AccommodationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
