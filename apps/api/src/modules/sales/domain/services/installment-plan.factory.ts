import type { CreateSaleInstallmentData } from '../repositories/sales.repository';

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function fromCents(amountInCents: number) {
  return amountInCents / 100;
}

export function buildInstallmentPlan(
  totalAmount: number,
  dueDates: Date[],
): CreateSaleInstallmentData[] {
  const totalAmountInCents = toCents(totalAmount);
  const installmentCount = dueDates.length;
  const baseInstallmentInCents = Math.floor(
    totalAmountInCents / installmentCount,
  );
  const remainderInCents = totalAmountInCents % installmentCount;

  return dueDates.map((dueDate, index) => ({
    number: index + 1,
    amount: fromCents(
      baseInstallmentInCents + (index < remainderInCents ? 1 : 0),
    ),
    dueDate,
  }));
}
