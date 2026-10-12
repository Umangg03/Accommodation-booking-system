import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { AccessTokenPayload } from '../auth/access-token.guard';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Company } from '../companies/entities/company.entity';
import { Customers } from '../customers/entities/customer.entity';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './entities/booking_status.entity';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

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

  async findAll(user: AccessTokenPayload, requestedCompanyId?: number) {
    const companyId =
      user.role?.toUpperCase() === 'ADMIN'
        ? requestedCompanyId
        : user.companyId;

    const bookings = await this.bookingRepository.find({
      where: companyId ? { company: { id: companyId } } : {},
      relations: {
        customer: true,
        company: true,
        accommodation: {
          accommodation_type: true,
          location: true,
        },
        status: true,
      },
      order: { check_in: 'DESC' },
    });
    return bookings.map((booking) => this.hideSuperCompany(booking));
  }

  async findAllStatuses() {
    let statuses = await this.statusRepository.find({ order: { name: 'ASC' } });
    if (statuses.length === 0) {
      statuses = [
        await this.statusRepository.save(
          this.statusRepository.create({ name: 'Pending' }),
        ),
      ];
    }
    return statuses;
  }

  async createForCustomer(dto: CreateAdminBookingDto, user: AccessTokenPayload) {
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';
    const companyId = isAdmin ? dto.companyId : user.companyId;
    if (!companyId) {
      throw new BadRequestException(
        'A company must be selected when an admin creates a booking.',
      );
    }
    const company = await this.companyRepository.findOneBy({ id: companyId });
    if (
      !company ||
      (process.env.COMPANY_NAME &&
        company.name.trim().toLowerCase() ===
          process.env.COMPANY_NAME.trim().toLowerCase())
    ) {
      throw new NotFoundException(`Company with id ${companyId} not found.`);
    }
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId, companies: { id: companyId } },
      relations: { companies: true },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${dto.customerId} not found.`,
      );
    }

    const accommodation = await this.accommodationRepository.findOneBy({
      id: dto.accommodationId,
    });
    if (!accommodation) {
      throw new NotFoundException(
        `Accommodation with id ${dto.accommodationId} not found.`,
      );
    }

    const status =
      user.role?.toUpperCase() === 'ADMIN' && dto.statusId
        ? await this.statusRepository.findOneBy({ id: dto.statusId })
        : await this.getOrCreatePendingStatus();
    if (!status) {
      throw new NotFoundException(
        `Booking status with id ${dto.statusId} not found.`,
      );
    }
    if (status.name.toLowerCase() === 'canceled') {
      throw new BadRequestException(
        'New bookings cannot be created with the canceled status.',
      );
    }

    const [checkIn, checkOut] = this.validateBookingDates(
      dto.checkIn,
      dto.checkOut,
    );
    await this.ensureNoOverlap(accommodation.id, checkIn, checkOut);

    const booking = this.bookingRepository.create({
      check_in: checkIn,
      cheek_out: checkOut,
      customer,
      company,
      accommodation,
      status,
    });
    return this.hideSuperCompany(await this.bookingRepository.save(booking));
  }

  async update(id: number, dto: UpdateBookingDto, user: AccessTokenPayload) {
    const companyId =
      user.role?.toUpperCase() === 'ADMIN' ? undefined : user.companyId;
    const booking = await this.bookingRepository.findOne({
      where: companyId
        ? { id, company: { id: companyId } }
        : { id },
      relations: {
        customer: true,
        company: true,
        accommodation: true,
        status: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found.`);
    }
    if (!booking.company) {
      throw new NotFoundException(`Company for booking ${id} not found.`);
    }
    if (booking.status.name.toLowerCase() === 'canceled') {
      throw new BadRequestException('Canceled bookings cannot be modified.');
    }

    if (dto.customerId) {
      const customer = await this.customerRepository.findOne({
        where: {
          id: dto.customerId,
          companies: { id: booking.company.id },
        },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with id ${dto.customerId} not found.`,
        );
      }
      booking.customer = customer;
    }

    if (dto.accommodationId) {
      const accommodation = await this.accommodationRepository.findOneBy({
        id: dto.accommodationId,
      });
      if (!accommodation) {
        throw new NotFoundException(
          `Accommodation with id ${dto.accommodationId} not found.`,
        );
      }
      booking.accommodation = accommodation;
    }

    if (dto.statusId) {
      if (user.role?.toUpperCase() !== 'ADMIN') {
        throw new BadRequestException(
          'Only an admin can directly set a booking status. Use the confirm or cancel action.',
        );
      }
      const status = await this.statusRepository.findOneBy({
        id: dto.statusId,
      });
      if (!status) {
        throw new NotFoundException(
          `Booking status with id ${dto.statusId} not found.`,
        );
      }
      if (status.name.toLowerCase() === 'canceled') {
        throw new BadRequestException(
          'Use the cancel endpoint to cancel a booking.',
        );
      }
      booking.status = status;
    }

    const datesChanged =
      (dto.checkIn !== undefined &&
        new Date(dto.checkIn).getTime() !== booking.check_in.getTime()) ||
      (dto.checkOut !== undefined &&
        new Date(dto.checkOut).getTime() !== booking.cheek_out.getTime());
    if (datesChanged) {
      const [checkIn, checkOut] = this.validateBookingDates(
        dto.checkIn ?? booking.check_in.toISOString(),
        dto.checkOut ?? booking.cheek_out.toISOString(),
      );
      await this.ensureNoOverlap(
        booking.accommodation.id,
        checkIn,
        checkOut,
        id,
      );
      booking.check_in = checkIn;
      booking.cheek_out = checkOut;
    } else if (dto.accommodationId) {
      await this.ensureNoOverlap(
        booking.accommodation.id,
        booking.check_in,
        booking.cheek_out,
        id,
      );
    }
    return this.hideSuperCompany(await this.bookingRepository.save(booking));
  }

  async cancel(id: number, user: AccessTokenPayload) {
    const companyId =
      user.role?.toUpperCase() === 'ADMIN' ? undefined : user.companyId;
    const booking = await this.bookingRepository.findOne({
      where: companyId
        ? { id, company: { id: companyId } }
        : { id },
      relations: { status: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found.`);
    }

    let status = await this.statusRepository.findOneBy({
      name: ILike('Canceled'),
    });
    if (!status) {
      status = await this.statusRepository.save(
        this.statusRepository.create({ name: 'Canceled' }),
      );
    }
    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async confirm(id: number, user: AccessTokenPayload) {
    const companyId =
      user.role?.toUpperCase() === 'ADMIN' ? undefined : user.companyId;
    const booking = await this.bookingRepository.findOne({
      where: companyId
        ? { id, company: { id: companyId } }
        : { id },
      relations: { customer: true, company: true, status: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found.`);
    }
    if (booking.status.name.toLowerCase() === 'canceled') {
      throw new BadRequestException('Canceled bookings cannot be confirmed.');
    }

    booking.status = await this.getOrCreateConfirmedStatus();
    return this.hideSuperCompany(
      await this.bookingRepository.save(booking),
    );
  }

  private async getOrCreatePendingStatus() {
    let status = await this.statusRepository.findOneBy({
      name: ILike('Pending'),
    });
    if (!status) {
      status = await this.statusRepository.save(
        this.statusRepository.create({ name: 'Pending' }),
      );
    }

    return status;
  }

  private hideSuperCompany<T extends { company: Company }>(booking: T) {
    const superCompanyName = process.env.COMPANY_NAME?.trim();
    if (
      !superCompanyName ||
      booking.company?.name.trim().toLowerCase() !==
        superCompanyName.toLowerCase()
    ) {
      return booking;
    }
    booking.company.name = 'Company unavailable';
    return booking;
  }

  private async getOrCreateConfirmedStatus() {
    let status = await this.statusRepository.findOneBy({
      name: ILike('Confirmed'),
    });
    if (!status) {
      status = await this.statusRepository.save(
        this.statusRepository.create({ name: 'Confirmed' }),
      );
    }
    return status;
  }

  private validateBookingDates(checkInValue: string, checkOutValue: string) {
    const checkIn = new Date(checkInValue);
    const checkOut = new Date(checkOutValue);
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
    return [checkIn, checkOut] as const;
  }

  private async ensureNoOverlap(
    accommodationId: number,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: number,
  ) {
    const existingBookings = await this.bookingRepository.find({
      where: { accommodation: { id: accommodationId } },
      relations: { status: true },
    });
    const overlaps = existingBookings.some((booking) => {
      if (
        booking.id === excludeBookingId ||
        booking.status?.name.toLowerCase() === 'canceled'
      ) {
        return false;
      }
      const bookingCheckIn = new Date(booking.check_in);
      const bookingCheckOut = new Date(booking.cheek_out);
      return checkIn < bookingCheckOut && checkOut > bookingCheckIn;
    });
    if (overlaps) {
      throw new ConflictException(
        'This accommodation is already booked for the selected dates.',
      );
    }
  }
}
