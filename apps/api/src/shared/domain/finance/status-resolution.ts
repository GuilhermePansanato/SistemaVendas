export const saleStatusValues = [
  'OPEN',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
] as const;

export const installmentStatusValues = [
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
] as const;

export type SaleLifecycleStatus = (typeof saleStatusValues)[number];
export type InstallmentLifecycleStatus =
  (typeof installmentStatusValues)[number];

interface ResolveInstallmentStatusInput {
  amount: number;
  paidAmount: number;
  dueDate: Date;
  storedStatus?: InstallmentLifecycleStatus;
  referenceDate?: Date;
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateRemainingAmount(amount: number, paidAmount: number) {
  return roundCurrency(Math.max(0, amount - paidAmount));
}

export function resolveInstallmentStatus({
  amount,
  paidAmount,
  dueDate,
  storedStatus,
  referenceDate = new Date(),
}: ResolveInstallmentStatusInput): InstallmentLifecycleStatus {
  if (storedStatus === 'CANCELED') {
    return 'CANCELED';
  }

  if (roundCurrency(paidAmount) >= roundCurrency(amount)) {
    return 'PAID';
  }

  if (
    getStartOfDay(dueDate).getTime() < getStartOfDay(referenceDate).getTime()
  ) {
    return 'OVERDUE';
  }

  if (roundCurrency(paidAmount) > 0) {
    return 'PARTIALLY_PAID';
  }

  return 'PENDING';
}

export function resolveSaleStatus(
  installmentStatuses: InstallmentLifecycleStatus[],
): SaleLifecycleStatus {
  if (installmentStatuses.length === 0) {
    return 'OPEN';
  }

  if (installmentStatuses.every((status) => status === 'CANCELED')) {
    return 'CANCELED';
  }

  if (
    installmentStatuses.every(
      (status) => status === 'PAID' || status === 'CANCELED',
    )
  ) {
    return 'PAID';
  }

  if (installmentStatuses.some((status) => status === 'OVERDUE')) {
    return 'OVERDUE';
  }

  if (
    installmentStatuses.some(
      (status) => status === 'PARTIALLY_PAID' || status === 'PAID',
    )
  ) {
    return 'PARTIALLY_PAID';
  }

  return 'OPEN';
}
