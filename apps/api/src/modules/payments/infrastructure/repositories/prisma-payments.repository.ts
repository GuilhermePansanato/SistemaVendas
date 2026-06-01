import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { projectInstallmentAfterPayment } from '../../../../shared/domain/finance/payment-processing';
import {
  calculateRemainingAmount,
  resolveInstallmentStatus,
  resolveSaleStatus,
} from '../../../../shared/domain/finance/status-resolution';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  PaymentListItem,
  PaymentTargetInstallment,
} from '../../domain/entities/payment';
import type {
  ListPaymentsFilters,
  PaymentsRepository,
  ReopenInstallmentData,
  RegisterPaymentData,
} from '../../domain/repositories/payments.repository';

type InstallmentForPaymentRecord = Prisma.InstallmentGetPayload<{
  include: {
    sale: {
      include: {
        customer: true;
        installments: true;
      };
    };
  };
}>;

type PaymentRecord = Prisma.PaymentGetPayload<{
  include: {
    installment: {
      include: {
        sale: {
          include: {
            customer: true;
            installments: true;
          };
        };
      };
    };
  };
}>;

function mapTargetInstallment(
  installment: InstallmentForPaymentRecord,
): PaymentTargetInstallment {
  return {
    id: installment.id,
    saleId: installment.saleId,
    amount: installment.amount.toNumber(),
    paidAmount: installment.paidAmount.toNumber(),
    dueDate: installment.dueDate,
    paidAt: installment.paidAt,
    status: resolveInstallmentStatus({
      amount: installment.amount.toNumber(),
      paidAmount: installment.paidAmount.toNumber(),
      dueDate: installment.dueDate,
      storedStatus: installment.status,
    }),
  };
}

function mapPaymentRecord(record: PaymentRecord): PaymentListItem {
  const installmentAmount = record.installment.amount.toNumber();
  const installmentPaidAmount = record.installment.paidAmount.toNumber();
  const installmentStatus = resolveInstallmentStatus({
    amount: installmentAmount,
    paidAmount: installmentPaidAmount,
    dueDate: record.installment.dueDate,
    storedStatus: record.installment.status,
  });
  const saleStatuses = record.installment.sale.installments.map((installment) =>
    resolveInstallmentStatus({
      amount: installment.amount.toNumber(),
      paidAmount: installment.paidAmount.toNumber(),
      dueDate: installment.dueDate,
      storedStatus: installment.status,
    }),
  );

  return {
    id: record.id,
    installmentId: record.installmentId,
    saleId: record.installment.saleId,
    customerId: record.installment.sale.customerId,
    amount: record.amount.toNumber(),
    paidAt: record.paidAt,
    method: record.method,
    reference: record.reference,
    notes: record.notes,
    createdAt: record.createdAt,
    customer: {
      id: record.installment.sale.customer.id,
      name: record.installment.sale.customer.name,
      whatsappPhone: record.installment.sale.customer.whatsappPhone,
    },
    sale: {
      id: record.installment.sale.id,
      description: record.installment.sale.description,
      saleDate: record.installment.sale.saleDate,
      status: resolveSaleStatus(saleStatuses),
    },
    installment: {
      id: record.installment.id,
      number: record.installment.number,
      amount: installmentAmount,
      paidAmount: installmentPaidAmount,
      remainingAmount: calculateRemainingAmount(
        installmentAmount,
        installmentPaidAmount,
      ),
      dueDate: record.installment.dueDate,
      paidAt: record.installment.paidAt,
      status: installmentStatus,
    },
  };
}

@Injectable()
export class PrismaPaymentsRepository implements PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findInstallmentForPayment(
    companyId: string,
    installmentId: string,
  ): Promise<PaymentTargetInstallment | null> {
    const installment = await this.prismaService.installment.findFirst({
      where: {
        id: installmentId,
        sale: {
          companyId,
        },
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

    return installment ? mapTargetInstallment(installment) : null;
  }

  async register(data: RegisterPaymentData): Promise<PaymentListItem> {
    const createdPaymentId = await this.prismaService.$transaction(
      async (tx) => {
        const installment = await tx.installment.findFirst({
          where: {
            id: data.installmentId,
            sale: {
              companyId: data.companyId,
            },
          },
          include: {
            sale: {
              include: {
                installments: true,
              },
            },
          },
        });

        if (!installment) {
          throw new Error('INSTALLMENT_NOT_FOUND');
        }

        const projection = projectInstallmentAfterPayment({
          installmentAmount: installment.amount.toNumber(),
          paidAmount: installment.paidAmount.toNumber(),
          dueDate: installment.dueDate,
          storedStatus: installment.status,
          paymentAmount: data.amount,
          paymentDate: data.paidAt,
        });

        const payment = await tx.payment.create({
          data: {
            installmentId: data.installmentId,
            amount: new Prisma.Decimal(data.amount),
            paidAt: data.paidAt,
            method: data.method,
            reference: data.reference,
            notes: data.notes,
          },
        });

        await tx.installment.update({
          where: { id: data.installmentId },
          data: {
            paidAmount: new Prisma.Decimal(projection.nextPaidAmount),
            paidAt: projection.nextPaidAt,
            status: projection.nextStatus,
          },
        });

        const updatedSaleStatuses = installment.sale.installments.map(
          (saleInstallment) =>
            saleInstallment.id === data.installmentId
              ? projection.nextStatus
              : resolveInstallmentStatus({
                  amount: saleInstallment.amount.toNumber(),
                  paidAmount: saleInstallment.paidAmount.toNumber(),
                  dueDate: saleInstallment.dueDate,
                  storedStatus: saleInstallment.status,
                }),
        );

        await tx.sale.update({
          where: { id: installment.saleId },
          data: {
            status: resolveSaleStatus(updatedSaleStatuses),
          },
        });

        return payment.id;
      },
    );

    const payment = await this.prismaService.payment.findUniqueOrThrow({
      where: { id: createdPaymentId },
      include: {
        installment: {
          include: {
            sale: {
              include: {
                customer: true,
                installments: true,
              },
            },
          },
        },
      },
    });

    return mapPaymentRecord(payment);
  }

  async list(filters: ListPaymentsFilters): Promise<PaymentListItem[]> {
    const where: Prisma.PaymentWhereInput = {
      reversedAt: null,
      ...(filters.companyId
        ? {
            installment: {
              sale: {
                companyId: filters.companyId,
                ...(filters.customerId
                  ? { customerId: filters.customerId }
                  : {}),
              },
            },
          }
        : {}),
      ...(filters.installmentId
        ? { installmentId: filters.installmentId }
        : {}),
      ...(!filters.companyId && filters.customerId
        ? {
            installment: {
              sale: {
                customerId: filters.customerId,
              },
            },
          }
        : {}),
      ...(filters.method ? { method: filters.method } : {}),
      ...(filters.paidFrom || filters.paidTo
        ? {
            paidAt: {
              ...(filters.paidFrom ? { gte: filters.paidFrom } : {}),
              ...(filters.paidTo ? { lte: filters.paidTo } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                reference: {
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
                installment: {
                  sale: {
                    description: {
                      contains: filters.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                installment: {
                  sale: {
                    customer: {
                      name: {
                        contains: filters.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const payments = await this.prismaService.payment.findMany({
      where,
      include: {
        installment: {
          include: {
            sale: {
              include: {
                customer: true,
                installments: true,
              },
            },
          },
        },
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });

    return payments.map(mapPaymentRecord);
  }

  async reopenInstallment(data: ReopenInstallmentData): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const installment = await tx.installment.findFirst({
        where: {
          id: data.installmentId,
          sale: {
            companyId: data.companyId,
          },
        },
        include: {
          sale: {
            include: {
              installments: true,
            },
          },
        },
      });

      if (!installment) {
        throw new Error('INSTALLMENT_NOT_FOUND');
      }

      const reversedAt = new Date();
      const nextStatus = resolveInstallmentStatus({
        amount: installment.amount.toNumber(),
        paidAmount: 0,
        dueDate: installment.dueDate,
        storedStatus: installment.status,
        referenceDate: reversedAt,
      });

      await tx.payment.updateMany({
        where: {
          installmentId: data.installmentId,
          reversedAt: null,
        },
        data: {
          reversedAt,
          reversedByUserId: data.reversedByUserId,
          reversalReason: data.reversalReason,
        },
      });

      await tx.installment.update({
        where: { id: data.installmentId },
        data: {
          paidAmount: new Prisma.Decimal(0),
          paidAt: null,
          status: nextStatus,
        },
      });

      const updatedSaleStatuses = installment.sale.installments.map(
        (saleInstallment) =>
          saleInstallment.id === data.installmentId
            ? nextStatus
            : resolveInstallmentStatus({
                amount: saleInstallment.amount.toNumber(),
                paidAmount: saleInstallment.paidAmount.toNumber(),
                dueDate: saleInstallment.dueDate,
                storedStatus: saleInstallment.status,
              }),
      );

      await tx.sale.update({
        where: { id: installment.saleId },
        data: {
          status: resolveSaleStatus(updatedSaleStatuses),
        },
      });
    });
  }
}
