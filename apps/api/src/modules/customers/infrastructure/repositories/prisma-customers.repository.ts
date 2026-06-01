import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  CreateCustomerData,
  CustomersRepository,
  ListCustomersFilters,
  UpdateCustomerData,
} from '../../domain/repositories/customers.repository';

@Injectable()
export class PrismaCustomersRepository implements CustomersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  list(filters: ListCustomersFilters) {
    const where: Prisma.CustomerWhereInput = {
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: filters.search,
                },
              },
              {
                whatsappPhone: {
                  contains: filters.search,
                },
              },
              {
                document: {
                  contains: filters.search,
                },
              },
            ],
          }
        : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    };

    return this.prismaService.customer.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string, companyId?: string) {
    return this.prismaService.customer.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });
  }

  create(data: CreateCustomerData) {
    return this.prismaService.customer.create({
      data,
    });
  }

  update(id: string, companyId: string, data: UpdateCustomerData) {
    return this.prismaService.$transaction(async (tx) => {
      await tx.customer.updateMany({
        where: {
          id,
          companyId,
        },
        data,
      });

      return tx.customer.findFirstOrThrow({
        where: {
          id,
          companyId,
        },
      });
    });
  }
}
