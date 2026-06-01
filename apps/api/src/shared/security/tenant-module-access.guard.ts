import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import type { JwtUser } from '../../modules/auth/presentation/http/jwt-user';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { REQUIRED_SYSTEM_MODULE_KEY } from './require-system-module.decorator';

@Injectable()
export class TenantModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<
      SystemModuleKey | undefined
    >(REQUIRED_SYSTEM_MODULE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const currentUser = request.user;

    if (!currentUser?.companyId) {
      throw new ForbiddenException('Modulo indisponivel para esta conta.');
    }

    const subscription =
      await this.prismaService.companyModuleSubscription.findUnique({
        where: {
          companyId_moduleKey: {
            companyId: currentUser.companyId,
            moduleKey: requiredModule,
          },
        },
        include: {
          module: {
            select: {
              isActive: true,
              isTenantVisible: true,
            },
          },
        },
      });

    if (
      !subscription?.isActive ||
      !subscription.module.isActive ||
      !subscription.module.isTenantVisible
    ) {
      throw new ForbiddenException(
        'Este modulo nao esta contratado para a sua empresa.',
      );
    }

    return true;
  }
}
