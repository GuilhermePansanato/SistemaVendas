import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateSaleDto } from '../../application/dto/create-sale.dto';
import { SaleQueryDto } from '../../application/dto/sale-query.dto';
import { CreateSaleUseCase } from '../../application/use-cases/create-sale.use-case';
import { GetSaleByIdUseCase } from '../../application/use-cases/get-sale-by-id.use-case';
import { ListSalesUseCase } from '../../application/use-cases/list-sales.use-case';

@Controller('sales')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.SALES)
export class SalesController {
  constructor(
    private readonly listSalesUseCase: ListSalesUseCase,
    private readonly getSaleByIdUseCase: GetSaleByIdUseCase,
    private readonly createSaleUseCase: CreateSaleUseCase,
  ) {}

  @Get()
  list(@CurrentUser() currentUser: JwtUser, @Query() query: SaleQueryDto) {
    return this.listSalesUseCase.execute(currentUser.companyId, {
      search: query.search?.trim() || undefined,
      customerId: query.customerId || undefined,
      status: query.status,
    });
  }

  @Get(':id')
  getById(@CurrentUser() currentUser: JwtUser, @Param('id') saleId: string) {
    return this.getSaleByIdUseCase.execute(currentUser.companyId, saleId);
  }

  @Post()
  create(@CurrentUser() currentUser: JwtUser, @Body() input: CreateSaleDto) {
    return this.createSaleUseCase.execute(currentUser.companyId, input);
  }
}
