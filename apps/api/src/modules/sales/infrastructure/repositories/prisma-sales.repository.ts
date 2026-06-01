import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculateRemainingAmount,
  resolveInstallmentStatus,
  resolveSaleStatus,
} from '../../../../shared/domain/finance/status-resolution';
import { projectInstallmentAfterPayment } from '../../../../shared/domain/finance/payment-processing';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  SaleDetail,
  SaleInstallmentCounts,
  SaleInstallmentSummary,
  SaleListItem,
} from '../../domain/entities/sale';
import {
  CreateSaleData,
  ListSalesFilters,
  SalesRepository,
} from '../../domain/repositories/sales.repository';

type SaleRecord = Prisma.SaleGetPayload<{
  include: {
    customer: true;
    installments: true;
  };
}>;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function mapInstallment(
  record: SaleRecord['installments'][number],
): SaleInstallmentSummary {
  const amount = record.amount.toNumber();
  const paidAmount = record.paidAmount.toNumber();

  return {
    id: record.id,
    number: record.number,
    amount,
    paidAmount,
    remainingAmount: calculateRemainingAmount(amount, paidAmount),
    dueDate: record.dueDate,
    paidAt: record.paidAt,
    status: resolveInstallmentStatus({
      amount,
      paidAmount,
      dueDate: record.dueDate,
      storedStatus: record.status,
    }),
  };
}

function buildCounts(
  installments: SaleInstallmentSummary[],
): SaleInstallmentCounts {
  return installments.reduce<SaleInstallmentCounts>(
    (counts, installment) => {
      if (installment.status === 'CANCELED') {
        return counts;
      }

      counts[
        installment.status === 'PENDING'
          ? 'pending'
          : installment.status === 'PARTIALLY_PAID'
            ? 'partiallyPaid'
            : installment.status === 'PAID'
              ? 'paid'
              : 'overdue'
      ] += 1;

      return counts;
    },
    {
      pending: 0,
      partiallyPaid: 0,
      paid: 0,
      overdue: 0,
    },
  );
}

function getNextDueDate(installments: SaleInstallmentSummary[]) {
  return (
    installments
      .filter(
        (installment) =>
          installment.status !== 'PAID' && installment.status !== 'CANCELED',
      )
      .toSorted(
        (left, right) => left.dueDate.getTime() - right.dueDate.getTime(),
      )[0]?.dueDate ?? null
  );
}

function mapSaleRecord(record: SaleRecord): SaleDetail {
  const installments = record.installments
    .map(mapInstallment)
    .toSorted((left, right) => left.number - right.number);
  const counts = buildCounts(installments);
  const paidAmount = roundCurrency(
    installments.reduce(
      (total, installment) => total + installment.paidAmount,
      0,
    ),
  );
  const remainingAmount = roundCurrency(
    installments.reduce(
      (total, installment) => total + installment.remainingAmount,
      0,
    ),
  );

  return {
    id: record.id,
    customerId: record.customerId,
    description: record.description,
    totalAmount: record.totalAmount.toNumber(),
    installmentCount: record.installmentCount,
    saleDate: record.saleDate,
    status: resolveSaleStatus(
      installments.map((installment) => installment.status),
    ),
    customer: {
      id: record.customer.id,
      name: record.customer.name,
      whatsappPhone: record.customer.whatsappPhone,
    },
    financial: {
      paidAmount,
      remainingAmount,
    },
    counts,
    nextDueDate: getNextDueDate(installments),
    notes: record.notes,
    installments,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toSaleListItem(sale: SaleDetail): SaleListItem {
  return {
    id: sale.id,
    customerId: sale.customerId,
    description: sale.description,
    totalAmount: sale.totalAmount,
    installmentCount: sale.installmentCount,
    saleDate: sale.saleDate,
    status: sale.status,
    customer: sale.customer,
    financial: sale.financial,
    counts: sale.counts,
    nextDueDate: sale.nextDueDate,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}

function matchesSaleStatusFilter(
  saleStatus: SaleDetail['status'],
  filterStatus?: ListSalesFilters['status'],
) {
  if (!filterStatus) {
    return true;
  }

  if (filterStatus === 'OPEN') {
    return saleStatus === 'OPEN' || saleStatus === 'PARTIALLY_PAID';
  }

  return saleStatus === filterStatus;
}

@Injectable()
export class PrismaSalesRepository implements SalesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(filters: ListSalesFilters): Promise<SaleListItem[]> {
    const where: Prisma.SaleWhereInput = {
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                description: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                notes: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                customer: {
                  name: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                customer: {
                  document: {
                    contains: filters.search,
                  },
                },
              },
              {
                customer: {
                  whatsappPhone: {
                    contains: filters.search,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const sales = await this.prismaService.sale.findMany({
      where,
      include: {
        customer: true,
        installments: true,
      },
      orderBy: [{ saleDate: 'desc' }, { createdAt: 'desc' }],
    });

    return sales
      .map(mapSaleRecord)
      .filter((sale) => matchesSaleStatusFilter(sale.status, filters.status))
      .map(toSaleListItem);
  }

  async findById(id: string, companyId?: string): Promise<SaleDetail | null> {
    const sale = await this.prismaService.sale.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        customer: true,
        installments: true,
      },
    });

    return sale ? mapSaleRecord(sale) : null;
  }

  async create(data: CreateSaleData): Promise<SaleDetail> {
    const saleId = await this.prismaService.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          companyId: data.companyId,
          customerId: data.customerId,
          description: data.description,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          installmentCount: data.installmentCount,
          saleDate: data.saleDate,
          notes: data.notes,
          installments: {
            create: data.installments.map((installment) => ({
              number: installment.number,
              amount: new Prisma.Decimal(installment.amount),
              dueDate: installment.dueDate,
            })),
          },
        },
        include: {
          installments: true,
        },
      });

      if (data.immediatePayment) {
        const [installment] = sale.installments;

        if (!installment) {
          throw new Error('IMMEDIATE_PAYMENT_INSTALLMENT_NOT_FOUND');
        }

        const projection = projectInstallmentAfterPayment({
          installmentAmount: installment.amount.toNumber(),
          paidAmount: installment.paidAmount.toNumber(),
          dueDate: installment.dueDate,
          storedStatus: installment.status,
          paymentAmount: data.totalAmount,
          paymentDate: data.saleDate,
        });

        await tx.payment.create({
          data: {
            installmentId: installment.id,
            amount: new Prisma.Decimal(data.totalAmount),
            paidAt: data.saleDate,
            method: data.immediatePayment.method,
            reference: data.immediatePayment.reference,
            notes: data.immediatePayment.notes,
          },
        });

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: new Prisma.Decimal(projection.nextPaidAmount),
            paidAt: projection.nextPaidAt,
            status: projection.nextStatus,
          },
        });

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: resolveSaleStatus([projection.nextStatus]),
          },
        });
      }

      return sale.id;
    });

    const sale = await this.prismaService.sale.findUniqueOrThrow({
      where: { id: saleId },
      include: {
        customer: true,
        installments: true,
      },
    });

    return mapSaleRecord(sale);
  }
}
