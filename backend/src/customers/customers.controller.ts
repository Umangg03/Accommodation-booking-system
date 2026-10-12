import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UsePipes,
  ValidationPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { type AuthenticatedRequest } from '../auth/access-token.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('customers')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @RequirePermission('customers', 'create')
  @Post()
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.customersService.create(
      createCustomerDto,
      request.user.companyId,
      request.user.role?.toUpperCase() === 'ADMIN',
    );
  }

  @RequirePermission('customers', 'view')
  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('companyId') requestedCompanyId?: string,
  ) {
    const role = request.user.role?.toUpperCase();
    let companyId = role === 'ADMIN' ? undefined : request.user.companyId;
    if (role === 'ADMIN' && requestedCompanyId !== undefined) {
      companyId = Number(requestedCompanyId);
      if (!Number.isInteger(companyId) || companyId <= 0) {
        throw new BadRequestException('companyId must be a positive integer.');
      }
    }
    return this.customersService.findAll(companyId);
  }

  @RequirePermission('customers', 'view')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const companyId =
      request.user.role?.toUpperCase() === 'ADMIN'
        ? undefined
        : request.user.companyId;
    return this.customersService.findOne(+id, companyId);
  }

  @RequirePermission('customers', 'update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.customersService.update(
      +id,
      updateCustomerDto,
      request.user.role?.toUpperCase() === 'ADMIN'
        ? undefined
        : request.user.companyId,
      request.user.role?.toUpperCase() === 'ADMIN',
    );
  }

  @RequirePermission('customers', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.customersService.remove(
      +id,
      request.user.role?.toUpperCase() === 'ADMIN'
        ? undefined
        : request.user.companyId,
    );
  }
}
