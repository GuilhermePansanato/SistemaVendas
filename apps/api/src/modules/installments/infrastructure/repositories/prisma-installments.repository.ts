import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculateRemainingAmount,
  resolveInstallmentStatus,
  resolveSaleStatus,
} from '../../../../shared/domain/finance/status-resolution';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  InstallmentDetail,
  InstallmentListItem,
} from '../../domain/entities/installment';
import {
  InstallmentsRepository,
  ListInstallmentsFilters,
} from '../../domain/repositories/installments.repository';

type InstallmentRecord = Prisma.InstallmentGetPayload<{
  include: {
    sale: {
      include: {
        customer: true;
        installments: true;
      };
    };
  };
}>;

function mapInstallmentRecord(record: InstallmentRecord): InstallmentDetail {
  const amount = record.amount.toNumber();
  const paidAmount = record.paidAmount.toNumber();
  const saleInstallmentStatuses = record.sale.installments.map((installment) =>
    resolveInstallmentStatus({
      amount: installment.amount.toNumber(),
      paidAmount: installment.paidAmount.toNumber(),
      dueDate: installment.dueDate,
      storedStatus: installment.status,
    }),
  );

  return {
    id: record.id,
    saleId: record.saleId,
    customerId: record.sale.customerId,
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
    customer: {
      id: record.sale.customer.id,
      name: record.sale.customer.name,
      whatsappPhone: record.sale.customer.whatsappPhone,
    },
    sale: {
      id: record.sale.id,
      description: record.sale.description,
      saleDate: record.sale.saleDate,
      totalAmount: record.sale.totalAmount.toNumber(),
      installmentCount: record.sale.installmentCount,
      status: resolveSaleStatus(saleInstallmentStatuses),
    },
    saleNotes: record.sale.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class PrismaInstallmentsRepository implements InstallmentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(filters: ListInstallmentsFilters): Promise<InstallmentListItem[]> {
    const where: Prisma.InstallmentWhereInput = {
      ...(filters.companyId
        ? {
            sale: {
              companyId: filters.companyId,
              ...(filters.customerId ? { customerId: filters.customerId } : {}),
            },
          }
        : {}),
      ...(filters.saleId ? { saleId: filters.saleId } : {}),
      ...(!filters.companyId && filters.customerId
        ? {
            sale: {
              customerId: filters.customerId,
            },
          }
        : {}),
      ...(filters.dueFrom || filters.dueTo
        ? {
            dueDate: {
              ...(filters.dueFrom ? { gte: filters.dueFrom } : {}),
              ...(filters.dueTo ? { lte: filters.dueTo } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                sale: {
                  customer: {
                    name: {
                      contains: filters.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                sale: {
                  description: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                sale: {
                  customer: {
                    whatsappPhone: {
                      contains: filters.search,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const installments = await this.prismaService.installment.findMany({
      where,
      include: {
        sale: {
          include: {
            customer: true,
            installments: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { number: 'asc' }],
    });

    return installments
      .map(mapInstallmentRecord)
      .filter((installment) =>
        filters.status ? installment.status === filters.status : true,
      );
  }

  async findById(
    id: string,
    companyId?: string,
  ): Promise<InstallmentDetail | null> {
    const installment = await this.prismaService.installment.findFirst({
      where: {
        id,
        ...(companyId
          ? {
              sale: {
                companyId,
              },
            }
          : {}),
      },
      include: {
        sale: {
          include: {
            customer: true,
            installments: true,
          },
        },
      },
    });

    return installment ? mapInstallmentRecord(installment) : null;
  }
}
