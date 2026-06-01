import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculateRemainingAmount,
  resolveInstallmentStatus,
  resolveSaleStatus,
} from '../../../../shared/domain/finance/status-resolution';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  DashboardInstallmentPreview,
  DashboardPaymentPreview,
  DashboardSaleSnapshot,
  DashboardSummary,
} from '../../domain/entities/dashboard-summary';
import {
  DashboardRepository,
  type DashboardSummaryFilters,
} from '../../domain/repositories/dashboard.repository';

type SaleRecord = Prisma.SaleGetPayload<{
  include: {
    customer: true;
    installments: true;
  };
}>;

type RecentPaymentRecord = Prisma.PaymentGetPayload<{
  include: {
    installment: {
      include: {
        sale: {
          include: {
            customer: true;
          };
        };
      };
    };
  };
}>;

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEndOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function mapSaleSnapshot(record: SaleRecord): DashboardSaleSnapshot {
  const installments = record.installments
    .map((installment) => {
      const amount = installment.amount.toNumber();
      const paidAmount = installment.paidAmount.toNumber();

      return {
        installmentId: installment.id,
        number: installment.number,
        dueDate: installment.dueDate,
        amount,
        paidAmount,
        remainingAmount: calculateRemainingAmount(amount, paidAmount),
        status: resolveInstallmentStatus({
          amount,
          paidAmount,
          dueDate: installment.dueDate,
          storedStatus: installment.status,
        }),
      };
    })
    .toSorted((left, right) => left.number - right.number);

  return {
    saleId: record.id,
    customerId: record.customer.id,
    customerName: record.customer.name,
    whatsappPhone: record.customer.whatsappPhone,
    description: record.description,
    status: resolveSaleStatus(
      installments.map((installment) => installment.status),
    ),
    installments,
  };
}

function toInstallmentPreview(
  sale: DashboardSaleSnapshot,
  installment: DashboardSaleSnapshot['installments'][number],
): DashboardInstallmentPreview {
  return {
    installmentId: installment.installmentId,
    saleId: sale.saleId,
    customerId: sale.customerId,
    customerName: sale.customerName,
    whatsappPhone: sale.whatsappPhone,
    saleDescription: sale.description,
    installmentNumber: installment.number,
    dueDate: installment.dueDate,
    remainingAmount: installment.remainingAmount,
    status: installment.status,
  };
}

function mapRecentPayment(
  record: RecentPaymentRecord,
): DashboardPaymentPreview {
  return {
    paymentId: record.id,
    installmentId: record.installmentId,
    saleId: record.installment.saleId,
    customerId: record.installment.sale.customerId,
    customerName: record.installment.sale.customer.name,
    saleDescription: record.installment.sale.description,
    amount: record.amount.toNumber(),
    paidAt: record.paidAt,
    method: record.method,
  };
}

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  private readonly upcomingWindowDays = 7;
  private readonly previewLimit = 5;

  constructor(private readonly prismaService: PrismaService) {}

  async getSummary(
    companyId: string,
    filters?: DashboardSummaryFilters,
  ): Promise<DashboardSummary> {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const upcomingLimitDate = getEndOfDay(
      addDays(todayStart, this.upcomingWindowDays),
    );
    const salesWhere: Prisma.SaleWhereInput = {
      companyId,
      ...(filters?.from || filters?.to
        ? {
            saleDate: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const paymentsWhere: Prisma.PaymentWhereInput = {
      reversedAt: null,
      installment: {
        sale: {
          companyId,
        },
      },
      ...(filters?.from || filters?.to
        ? {
            paidAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [
      totalCustomers,
      activeCustomers,
      portfolioSales,
      filteredSales,
      recentPayments,
      receivedInRangeResult,
      receivedThisMonthResult,
      receivedTodayResult,
    ] = await Promise.all([
      this.prismaService.customer.count({
        where: {
          companyId,
        },
      }),
      this.prismaService.customer.count({
        where: {
          companyId,
          isActive: true,
        },
      }),
      this.prismaService.sale.findMany({
        where: {
          companyId,
        },
        include: {
          customer: true,
          installments: true,
        },
      }),
      this.prismaService.sale.findMany({
        where: salesWhere,
        include: {
          customer: true,
          installments: true,
        },
      }),
      this.prismaService.payment.findMany({
        where: paymentsWhere,
        include: {
          installment: {
            include: {
              sale: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        take: this.previewLimit,
      }),
      this.prismaService.payment.aggregate({
        where: paymentsWhere,
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.payment.aggregate({
        where: {
          reversedAt: null,
          installment: {
            sale: {
              companyId,
            },
          },
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.payment.aggregate({
        where: {
          reversedAt: null,
          installment: {
            sale: {
              companyId,
            },
          },
          paidAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const portfolioSaleSnapshots = portfolioSales.map(mapSaleSnapshot);
    const filteredSaleSnapshots = filteredSales.map(mapSaleSnapshot);
    const allInstallments = portfolioSaleSnapshots.flatMap((sale) =>
      sale.installments.map((installment) => ({
        sale,
        installment,
      })),
    );

    const openInstallments = allInstallments.filter(
      ({ installment }) =>
        installment.status !== 'PAID' && installment.status !== 'CANCELED',
    );
    const overdueInstallments = allInstallments
      .filter(({ installment }) => installment.status === 'OVERDUE')
      .toSorted(
        (left, right) =>
          left.installment.dueDate.getTime() -
          right.installment.dueDate.getTime(),
      );
    const upcomingInstallments = allInstallments
      .filter(
        ({ installment }) =>
          installment.status !== 'PAID' &&
          installment.status !== 'CANCELED' &&
          installment.status !== 'OVERDUE' &&
          installment.dueDate.getTime() >= todayStart.getTime() &&
          installment.dueDate.getTime() <= upcomingLimitDate.getTime(),
      )
      .toSorted(
        (left, right) =>
          left.installment.dueDate.getTime() -
          right.installment.dueDate.getTime(),
      );

    return {
      generatedAt: now,
      upcomingWindowDays: this.upcomingWindowDays,
      totals: {
        openAmount: roundCurrency(
          openInstallments.reduce(
            (total, { installment }) => total + installment.remainingAmount,
            0,
          ),
        ),
        overdueAmount: roundCurrency(
          overdueInstallments.reduce(
            (total, { installment }) => total + installment.remainingAmount,
            0,
          ),
        ),
        receivedInRange: receivedInRangeResult._sum.amount?.toNumber() ?? 0,
        receivedThisMonth: receivedThisMonthResult._sum.amount?.toNumber() ?? 0,
        receivedToday: receivedTodayResult._sum.amount?.toNumber() ?? 0,
        salesInRange: filteredSaleSnapshots.length,
        totalCustomers,
        activeCustomers,
        openInstallments: openInstallments.length,
        overdueInstallments: overdueInstallments.length,
        paidInstallments: allInstallments.filter(
          ({ installment }) => installment.status === 'PAID',
        ).length,
      },
      saleStatusBreakdown: {
        open: portfolioSaleSnapshots.filter((sale) => sale.status === 'OPEN')
          .length,
        partiallyPaid: portfolioSaleSnapshots.filter(
          (sale) => sale.status === 'PARTIALLY_PAID',
        ).length,
        paid: portfolioSaleSnapshots.filter((sale) => sale.status === 'PAID')
          .length,
        overdue: portfolioSaleSnapshots.filter(
          (sale) => sale.status === 'OVERDUE',
        ).length,
      },
      upcomingInstallments: upcomingInstallments
        .slice(0, this.previewLimit)
        .map(({ sale, installment }) =>
          toInstallmentPreview(sale, installment),
        ),
      overdueInstallments: overdueInstallments
        .slice(0, this.previewLimit)
        .map(({ sale, installment }) =>
          toInstallmentPreview(sale, installment),
        ),
      recentPayments: recentPayments.map(mapRecentPayment),
    };
  }
}
