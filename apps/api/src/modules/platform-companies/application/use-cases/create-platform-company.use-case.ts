import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcrypt';
import { PlatformModulesRepository } from '../../../platform-modules/domain/repositories/platform-modules.repository';
import { CreatePlatformCompanyDto } from '../dto/create-platform-company.dto';
import { PlatformCompaniesRepository } from '../../domain/repositories/platform-companies.repository';

function slugifyCompanyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

@Injectable()
export class CreatePlatformCompanyUseCase {
  constructor(
    private readonly platformCompaniesRepository: PlatformCompaniesRepository,
    private readonly platformModulesRepository: PlatformModulesRepository,
  ) {}

  async execute(input: CreatePlatformCompanyDto) {
    await this.platformModulesRepository.ensureCatalogSeeded();
    const availableModules = await this.platformModulesRepository.listByKeys(
      input.moduleKeys,
    );

    if (availableModules.length !== input.moduleKeys.length) {
      throw new BadRequestException(
        'Um ou mais modulos informados nao estao disponiveis para contratacao.',
      );
    }

    const passwordHash = await hash(input.adminPassword, 10);
    const slug = input.slug || slugifyCompanyName(input.name);

    if (!slug) {
      throw new BadRequestException(
        'Nao foi possivel gerar o slug da empresa.',
      );
    }

    try {
      return await this.platformCompaniesRepository.create({
        name: input.name.trim(),
        slug,
        adminUser: {
          name: input.adminName.trim(),
          email: input.adminEmail,
          passwordHash,
        },
        moduleKeys: input.moduleKeys,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ja existe uma empresa ou usuario com os dados informados.',
        );
      }

      throw error;
    }
  }
}
