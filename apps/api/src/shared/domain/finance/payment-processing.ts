import {
  calculateRemainingAmount,
  resolveInstallmentStatus,
  type InstallmentLifecycleStatus,
} from './status-resolution';

interface ProjectInstallmentAfterPaymentInput {
  installmentAmount: number;
  paidAmount: number;
  dueDate: Date;
  storedStatus?: InstallmentLifecycleStatus;
  paymentAmount: number;
  paymentDate: Date;
  referenceDate?: Date;
}

export interface InstallmentPaymentProjection {
  currentStatus: InstallmentLifecycleStatus;
  currentRemainingAmount: number;
  nextPaidAmount: number;
  nextRemainingAmount: number;
  nextStatus: InstallmentLifecycleStatus;
  nextPaidAt: Date | null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function projectInstallmentAfterPayment({
  installmentAmount,
  paidAmount,
  dueDate,
  storedStatus,
  paymentAmount,
  paymentDate,
  referenceDate = new Date(),
}: ProjectInstallmentAfterPaymentInput): InstallmentPaymentProjection {
  const currentStatus = resolveInstallmentStatus({
    amount: installmentAmount,
    paidAmount,
    dueDate,
    storedStatus,
    referenceDate,
  });
  const currentRemainingAmount = calculateRemainingAmount(
    installmentAmount,
    paidAmount,
  );

  if (currentStatus === 'PAID') {
    throw new Error('INSTALLMENT_ALREADY_PAID');
  }

  if (currentStatus === 'CANCELED') {
    throw new Error('INSTALLMENT_CANCELED');
  }

  if (paymentAmount <= 0) {
    throw new Error('INVALID_PAYMENT_AMOUNT');
  }

  if (paymentAmount > currentRemainingAmount) {
    throw new Error('PAYMENT_EXCEEDS_REMAINING_AMOUNT');
  }

  const nextPaidAmount = roundCurrency(paidAmount + paymentAmount);
  const nextRemainingAmount = calculateRemainingAmount(
    installmentAmount,
    nextPaidAmount,
  );
  const nextStatus = resolveInstallmentStatus({
    amount: installmentAmount,
    paidAmount: nextPaidAmount,
    dueDate,
    storedStatus,
    referenceDate,
  });

  return {
    currentStatus,
    currentRemainingAmount,
    nextPaidAmount,
    nextRemainingAmount,
    nextStatus,
    nextPaidAt: nextStatus === 'PAID' ? paymentDate : null,
  };
}
