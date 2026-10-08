import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AccessTokenPayload } from '../auth/access-token.guard';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Company } from '../companies/entities/company.entity';
import { Customers } from '../customers/entities/customer.entity';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './entities/booking_status.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingStatus)
    private readonly statusRepository: Repository<BookingStatus>,
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    @InjectRepository(Customers)
    private readonly customerRepository: Repository<Customers>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    user: AccessTokenPayload,
  ) {
    const checkIn = new Date(createBookingDto.checkIn);
    const checkOut = new Date(createBookingDto.checkOut);
    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkIn < new Date(new Date().setUTCHours(0, 0, 0, 0)) ||
      checkOut <= checkIn
    ) {
      throw new BadRequestException(
        'Check-in must be today or later, and check-out must be after check-in.',
      );
    }

    const accommodation = await this.accommodationRepository.findOne({
      where: { id: createBookingDto.accommodationId },
      relations: { accommodation_type: true, location: true },
    });
    if (!accommodation) {
      throw new NotFoundException(
        `Accommodation with id ${createBookingDto.accommodationId} not found`,
      );
    }

    const existingBookings = await this.bookingRepository.find({
      where: { accommodation: { id: accommodation.id } },
      relations: { status: true },
    });
    const overlaps = existingBookings.some((booking) => {
      const bookingCheckIn = new Date(booking.check_in);
      const bookingCheckOut = new Date(booking.cheek_out);
      return checkIn < bookingCheckOut && checkOut > bookingCheckIn;
    });
    if (overlaps) {
      throw new BadRequestException(
        'This accommodation is already booked for the selected dates.',
      );
    }

    const company = await this.companyRepository.findOneBy({
      id: user.companyId,
    });
    if (!company) {
      throw new NotFoundException('The selected company no longer exists.');
    }

    let customer = await this.customerRepository.findOne({
      where: { email: user.username, company: { id: company.id } },
    });
    if (!customer) {
      customer = this.customerRepository.create({
        name: user.name,
        email: user.username,
        phone: createBookingDto.phone.trim(),
        company,
      });
    } else {
      customer.name = user.name;
      customer.phone = createBookingDto.phone.trim();
    }
    customer = await this.customerRepository.save(customer);

    let status = await this.statusRepository.findOneBy({
      name: ILike('Pending'),
    });
    if (!status) {
      status = await this.statusRepository.save(
        this.statusRepository.create({
          name: 'Pending',
        }),
      );
    }

    const booking = this.bookingRepository.create({
      check_in: checkIn,
      cheek_out: checkOut,
      customer,
      accommodation,
      status,
    });
    return this.bookingRepository.save(booking);
  }

  async findAll(user: AccessTokenPayload) {
    const customer = await this.customerRepository.findOne({
      where: {
        email: user.username,
        company: { id: user.companyId },
      },
    });
    if (!customer) {
      return [];
    }

    return this.bookingRepository.find({
      where: { customer: { id: customer.id } },
      relations: {
        accommodation: {
          accommodation_type: true,
          location: true,
        },
        status: true,
      },
      order: { check_in: 'DESC' },
    });
  }

}
