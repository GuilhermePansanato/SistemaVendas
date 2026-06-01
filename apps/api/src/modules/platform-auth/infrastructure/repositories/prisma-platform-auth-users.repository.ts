import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PlatformAuthUser } from '../../domain/entities/platform-auth-user';
import { PlatformAuthUsersRepository } from '../../domain/repositories/platform-auth-users.repository';

function mapPlatformAuthUser(record: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN';
  isActive: boolean;
}): PlatformAuthUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    isActive: record.isActive,
  };
}

@Injectable()
export class PrismaPlatformAuthUsersRepository implements PlatformAuthUsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<PlatformAuthUser | null> {
    const user = await this.prismaService.platformUser.findUnique({
      where: { email },
    });

    return user ? mapPlatformAuthUser(user) : null;
  }

  async findById(id: string): Promise<PlatformAuthUser | null> {
    const user = await this.prismaService.platformUser.findUnique({
      where: { id },
    });

    return user ? mapPlatformAuthUser(user) : null;
  }
}
