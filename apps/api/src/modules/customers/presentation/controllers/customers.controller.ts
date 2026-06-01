import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { CustomerQueryDto } from '../../application/dto/customer-query.dto';
import { UpdateCustomerDto } from '../../application/dto/update-customer.dto';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { GetCustomerByIdUseCase } from '../../application/use-cases/get-customer-by-id.use-case';
import { ListCustomersUseCase } from '../../application/use-cases/list-customers.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.CUSTOMERS)
export class CustomersController {
  constructor(
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
  ) {}

  @Get()
  list(@CurrentUser() currentUser: JwtUser, @Query() query: CustomerQueryDto) {
    return this.listCustomersUseCase.execute(currentUser.companyId, {
      search: query.search?.trim() || undefined,
      isActive: query.isActive,
    });
  }

  @Get(':id')
  getById(
    @CurrentUser() currentUser: JwtUser,
    @Param('id') customerId: string,
  ) {
    return this.getCustomerByIdUseCase.execute(
      currentUser.companyId,
      customerId,
    );
  }

  @Post()
  create(
    @CurrentUser() currentUser: JwtUser,
    @Body() input: CreateCustomerDto,
  ) {
    return this.createCustomerUseCase.execute(currentUser.companyId, input);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: JwtUser,
    @Param('id') customerId: string,
    @Body() input: UpdateCustomerDto,
  ) {
    return this.updateCustomerUseCase.execute(
      currentUser.companyId,
      customerId,
      input,
    );
  }
}
