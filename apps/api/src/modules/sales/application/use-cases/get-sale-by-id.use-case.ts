import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesRepository } from '../../domain/repositories/sales.repository';

@Injectable()
export class GetSaleByIdUseCase {
  constructor(private readonly salesRepository: SalesRepository) {}

  async execute(companyId: string, saleId: string) {
    const sale = await this.salesRepository.findById(saleId, companyId);

    if (!sale) {
      throw new NotFoundException('Venda nao encontrada.');
    }

    return sale;
  }
}
