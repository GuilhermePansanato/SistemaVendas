import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AuthUser } from '../../domain/entities/auth-user';
import { AuthUsersRepository } from '../../domain/repositories/auth-users.repository';

const authUserInclude = Prisma.validator<Prisma.UserInclude>()({
  company: {
    include: {
      moduleSubscriptions: {
        where: {
          isActive: true,
          module: {
            is: {
              isActive: true,
              isTenantVisible: true,
            },
          },
        },
        include: {
          module: {
            select: {
              key: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  },
});

type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

function mapAuthUser(record: AuthUserRecord): AuthUser {
  return {
    id: record.id,
    companyId: record.companyId,
    companyName: record.company.name,
    companyIsActive: record.company.isActive,
    modules: [...record.company.moduleSubscriptions]
      .sort(
        (left, right) =>
          left.module.sortOrder - right.module.sortOrder ||
          left.module.key.localeCompare(right.module.key),
      )
      .map((subscription) => subscription.module.key),
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    isActive: record.isActive,
  };
}

@Injectable()
export class PrismaAuthUsersRepository implements AuthUsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: authUserInclude,
    });

    return user ? mapAuthUser(user) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: authUserInclude,
    });

    return user ? mapAuthUser(user) : null;
  }
}
