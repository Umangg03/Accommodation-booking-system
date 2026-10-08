import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Company } from '../companies/entities/company.entity';
import { Customers } from '../customers/entities/customer.entity';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './entities/booking_status.entity';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(BookingStatus), useValue: {} },
        { provide: getRepositoryToken(Accommodation), useValue: {} },
        { provide: getRepositoryToken(Customers), useValue: {} },
        { provide: getRepositoryToken(Company), useValue: {} },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
