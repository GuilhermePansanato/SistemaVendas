import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { projectInstallmentAfterPayment } from '../../../../shared/domain/finance/payment-processing';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentsRepository } from '../../domain/repositories/payments.repository';

function mapPaymentProjectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return new BadRequestException('Nao foi possivel processar o pagamento.');
  }

  if (error.message === 'INSTALLMENT_ALREADY_PAID') {
    return new BadRequestException('Esta parcela ja esta quitada.');
  }

  if (error.message === 'INSTALLMENT_CANCELED') {
    return new BadRequestException(
      'Nao e possivel registrar pagamento em parcela cancelada.',
    );
  }

  if (error.message === 'INVALID_PAYMENT_AMOUNT') {
    return new BadRequestException(
      'O valor do pagamento precisa ser maior que zero.',
    );
  }

  if (error.message === 'PAYMENT_EXCEEDS_REMAINING_AMOUNT') {
    return new BadRequestException(
      'O valor informado excede o saldo pendente da parcela.',
    );
  }

  return new BadRequestException('Nao foi possivel processar o pagamento.');
}

@Injectable()
export class RegisterPaymentUseCase {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async execute(
    companyId: string,
    installmentId: string,
    input: CreatePaymentDto,
  ) {
    const installment = await this.paymentsRepository.findInstallmentForPayment(
      companyId,
      installmentId,
    );

    if (!installment) {
      throw new NotFoundException('Parcela nao encontrada.');
    }

    if (input.paidAt.getTime() > Date.now()) {
      throw new BadRequestException(
        'A data do pagamento nao pode estar no futuro.',
      );
    }

    try {
      projectInstallmentAfterPayment({
        installmentAmount: installment.amount,
        paidAmount: installment.paidAmount,
        dueDate: installment.dueDate,
        storedStatus: installment.status,
        paymentAmount: input.amount,
        paymentDate: input.paidAt,
      });
    } catch (error) {
      throw mapPaymentProjectionError(error);
    }

    return this.paymentsRepository.register({
      companyId,
      installmentId,
      amount: input.amount,
      paidAt: input.paidAt,
      method: input.method,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    });
  }
}
