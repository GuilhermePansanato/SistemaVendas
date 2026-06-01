import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { WhatsAppConnection as PrismaWhatsAppConnection } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { WhatsAppConnection } from '../../domain/entities/whatsapp-connection';
import {
  CreateWhatsAppConnectionEventData,
  CreateWhatsAppConnectionData,
  UpdateWhatsAppConnectionData,
  WhatsAppConnectionsRepository,
} from '../../domain/repositories/whatsapp-connections.repository';

function mapConnectionRecord(
  record: PrismaWhatsAppConnection,
): WhatsAppConnection {
  return {
    id: record.id,
    companyId: record.companyId,
    clientKey: record.clientKey,
    provider: record.provider as 'WHATSAPP_WEB_JS',
    status: record.status,
    displayName: record.displayName,
    phoneNumber: record.phoneNumber,
    qrCode: record.qrCode,
    sessionPath: record.sessionPath,
    lastConnectedAt: record.lastConnectedAt,
    lastDisconnectedAt: record.lastDisconnectedAt,
    lastQrGeneratedAt: record.lastQrGeneratedAt,
    lastError: record.lastError,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class PrismaWhatsAppConnectionsRepository implements WhatsAppConnectionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByCompanyId(companyId: string): Promise<WhatsAppConnection | null> {
    const connection = await this.prismaService.whatsAppConnection.findUnique({
      where: { companyId },
    });

    return connection ? mapConnectionRecord(connection) : null;
  }

  async create(
    data: CreateWhatsAppConnectionData,
  ): Promise<WhatsAppConnection> {
    const connection = await this.prismaService.whatsAppConnection.create({
      data,
    });

    return mapConnectionRecord(connection);
  }

  async update(
    id: string,
    data: UpdateWhatsAppConnectionData,
  ): Promise<WhatsAppConnection> {
    const connection = await this.prismaService.whatsAppConnection.update({
      where: { id },
      data,
    });

    return mapConnectionRecord(connection);
  }

  async createEvent(data: CreateWhatsAppConnectionEventData): Promise<void> {
    await this.prismaService.whatsAppConnectionEvent.create({
      data: {
        companyId: data.companyId,
        connectionId: data.connectionId,
        type: data.type,
        message: data.message ?? null,
        ...(data.payload
          ? {
              payload: data.payload as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }
}
