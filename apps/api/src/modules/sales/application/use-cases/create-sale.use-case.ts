import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomersRepository } from '../../../customers/domain/repositories/customers.repository';
import { CreateSaleDto } from '../dto/create-sale.dto';
import { buildInstallmentPlan } from '../../domain/services/installment-plan.factory';
import { SalesRepository } from '../../domain/repositories/sales.repository';

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date) {
  return left.getTime() === right.getTime();
}

@Injectable()
export class CreateSaleUseCase {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly customersRepository: CustomersRepository,
  ) {}

  async execute(companyId: string, input: CreateSaleDto) {
    const customer = await this.customersRepository.findById(
      input.customerId,
      companyId,
    );

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    if (!customer.isActive) {
      throw new BadRequestException(
        'Cliente inativo nao pode receber novas vendas.',
      );
    }

    const saleDate = getStartOfDay(input.saleDate);
    const dueDates = input.installments.map((installment) =>
      getStartOfDay(installment.dueDate),
    );

    dueDates.forEach((dueDate, index) => {
      if (dueDate.getTime() < saleDate.getTime()) {
        throw new BadRequestException(
          'A data de vencimento nao pode ser anterior a data da venda.',
        );
      }

      const previousDueDate = dueDates[index - 1];

      if (previousDueDate && dueDate.getTime() <= previousDueDate.getTime()) {
        throw new BadRequestException(
          'As datas das parcelas devem estar em ordem crescente.',
        );
      }
    });

    if (input.payment) {
      if (dueDates.length !== 1) {
        throw new BadRequestException(
          'Venda a vista deve possuir exatamente uma parcela.',
        );
      }

      if (!isSameDay(dueDates[0], saleDate)) {
        throw new BadRequestException(
          'Venda a vista deve vencer na mesma data da venda.',
        );
      }

      if (saleDate.getTime() > getStartOfDay(new Date()).getTime()) {
        throw new BadRequestException(
          'Venda a vista nao pode ser registrada com data futura.',
        );
      }
    }

    const installments = buildInstallmentPlan(input.totalAmount, dueDates);
    return this.salesRepository.create({
      companyId,
      customerId: input.customerId,
      description: input.description ?? null,
      totalAmount: input.totalAmount,
      installmentCount: installments.length,
      saleDate,
      notes: input.notes ?? null,
      installments,
      immediatePayment: input.payment
        ? {
            method: input.payment.method,
            reference: input.payment.reference ?? null,
            notes: input.payment.notes ?? null,
          }
        : null,
    });
  }
}
