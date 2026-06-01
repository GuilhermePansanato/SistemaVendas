import { Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentsRepository } from '../../domain/repositories/installments.repository';

@Injectable()
export class GetInstallmentByIdUseCase {
  constructor(
    private readonly installmentsRepository: InstallmentsRepository,
  ) {}

  async execute(companyId: string, installmentId: string) {
    const installment = await this.installmentsRepository.findById(
      installmentId,
      companyId,
    );

    if (!installment) {
      throw new NotFoundException('Parcela nao encontrada.');
    }

    return installment;
  }
}
