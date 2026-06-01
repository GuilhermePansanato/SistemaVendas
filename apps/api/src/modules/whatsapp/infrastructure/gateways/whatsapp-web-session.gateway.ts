import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import type { WhatsAppConnection } from '../../domain/entities/whatsapp-connection';
import { toWhatsAppChatId } from '../../domain/services/normalize-whatsapp-phone';
import { WhatsAppSessionGateway } from '../../domain/services/whatsapp-session-gateway';
import type { WhatsAppSentMessage } from '../../domain/services/whatsapp-session-gateway';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

type ClientInfoSnapshot = {
  pushname?: string | null;
  wid?: {
    user?: string | null;
  } | null;
};

type SentMessageSnapshot = {
  id?: {
    _serialized?: string;
  } | null;
};

@Injectable()
export class WhatsAppWebSessionGateway
  implements WhatsAppSessionGateway, OnApplicationShutdown
{
  private readonly clientStates = new Map<
    string,
    {
      client: Client;
      companyId: string;
      clientKey: string;
      runtimeToken: number;
      isStarting: boolean;
    }
  >();
  private runtimeSequence = 0;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async startConnection(connection: WhatsAppConnection): Promise<void> {
    const currentState = this.clientStates.get(connection.id);

    if (
      currentState &&
      (connection.status === 'CONNECTED' ||
        connection.status === 'CONNECTING' ||
        connection.status === 'PENDING_QR' ||
        currentState.isStarting)
    ) {
      return;
    }

    const runtimeToken = ++this.runtimeSequence;
    const sessionsRoot = this.getSessionsRoot();

    await fs.mkdir(sessionsRoot, { recursive: true });
    await this.destroyClient(connection.id);
    await this.updateConnection(connection.id, {
      status: 'CONNECTING',
      qrCode: null,
      sessionPath: sessionsRoot,
      lastError: null,
    });

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: connection.clientKey,
        dataPath: sessionsRoot,
      }),
      puppeteer: {
        headless: this.isHeadlessEnabled(),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.clientStates.set(connection.id, {
      client,
      companyId: connection.companyId,
      clientKey: connection.clientKey,
      runtimeToken,
      isStarting: true,
    });
    this.bindClientEvents(
      client,
      connection.id,
      connection.companyId,
      runtimeToken,
    );

    void client
      .initialize()
      .catch((error: unknown) =>
        this.handleInitializationFailure(
          connection.id,
          connection.companyId,
          runtimeToken,
          error,
        ),
      );
  }

  async disconnectConnection(connection: WhatsAppConnection): Promise<void> {
    const now = new Date();

    await this.destroyClient(connection.id);
    await this.updateConnection(connection.id, {
      status: 'DISCONNECTED',
      qrCode: null,
      lastDisconnectedAt: now,
      lastError: null,
    });
    await this.createEvent(
      connection.id,
      connection.companyId,
      'DISCONNECTED',
      'Conexao encerrada manualmente.',
    );
  }

  async sendTextMessage(
    connection: WhatsAppConnection,
    phoneNumber: string,
    message: string,
  ): Promise<WhatsAppSentMessage> {
    const clientState = this.clientStates.get(connection.id);

    if (!clientState || connection.status !== 'CONNECTED') {
      throw new Error('WHATSAPP_NOT_CONNECTED');
    }

    const chatId = this.toChatId(phoneNumber);
    const rawMessage: unknown = await clientState.client.sendMessage(
      chatId,
      message,
    );
    const sentMessage = rawMessage as SentMessageSnapshot | undefined;

    return {
      providerMessageId: sentMessage?.id?._serialized ?? null,
    };
  }

  async onApplicationShutdown() {
    await Promise.all(
      Array.from(this.clientStates.keys()).map((connectionId) =>
        this.destroyClient(connectionId),
      ),
    );
  }

  private bindClientEvents(
    client: Client,
    connectionId: string,
    companyId: string,
    runtimeToken: number,
  ) {
    client.on('qr', (qr: string) => {
      void this.handleQr(connectionId, companyId, runtimeToken, qr);
    });

    client.on('authenticated', () => {
      void this.handleAuthenticated(connectionId, companyId, runtimeToken);
    });

    client.on('ready', () => {
      void this.handleReady(connectionId, companyId, runtimeToken, client);
    });

    client.on('auth_failure', (message: string) => {
      void this.handleAuthFailure(
        connectionId,
        companyId,
        runtimeToken,
        message,
      );
    });

    client.on('disconnected', (reason: string) => {
      void this.handleDisconnected(
        connectionId,
        companyId,
        runtimeToken,
        reason,
      );
    });
  }

  private async handleQr(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
    qr: string,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    const qrCode: string = await QRCode.toDataURL(qr, {
      margin: 1,
      width: 320,
    });
    const generatedAt = new Date();

    await this.updateConnection(connectionId, {
      status: 'PENDING_QR',
      qrCode,
      lastQrGeneratedAt: generatedAt,
      lastError: null,
    });
    await this.createEvent(
      connectionId,
      companyId,
      'QR_GENERATED',
      'Novo QR code gerado para conectar o WhatsApp.',
    );
  }

  private async handleAuthenticated(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    this.setConnectionStartingState(connectionId, false);
    await this.updateConnection(connectionId, {
      status: 'CONNECTING',
      lastError: null,
    });
    await this.createEvent(
      connectionId,
      companyId,
      'AUTHENTICATED',
      'Sessao autenticada com sucesso.',
    );
  }

  private async handleReady(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
    client: Client,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    this.setConnectionStartingState(connectionId, false);
    const connectedAt = new Date();
    const rawClientInfo: unknown = client.info;
    const clientInfo = rawClientInfo as ClientInfoSnapshot | undefined;

    await this.updateConnection(connectionId, {
      status: 'CONNECTED',
      qrCode: null,
      displayName: clientInfo?.pushname ?? null,
      phoneNumber: clientInfo?.wid?.user ?? null,
      lastConnectedAt: connectedAt,
      lastError: null,
    });
    await this.createEvent(
      connectionId,
      companyId,
      'READY',
      'WhatsApp conectado e pronto para uso.',
    );
  }

  private async handleAuthFailure(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
    message: string,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    await this.destroyClient(connectionId);
    await this.updateConnection(connectionId, {
      status: 'AUTH_FAILURE',
      qrCode: null,
      lastDisconnectedAt: new Date(),
      lastError: message,
    });
    await this.createEvent(connectionId, companyId, 'AUTH_FAILURE', message);
  }

  private async handleDisconnected(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
    reason: string,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    await this.destroyClient(connectionId);
    await this.updateConnection(connectionId, {
      status: 'DISCONNECTED',
      qrCode: null,
      lastDisconnectedAt: new Date(),
      lastError: reason || null,
    });
    await this.createEvent(
      connectionId,
      companyId,
      'DISCONNECTED',
      reason || 'Conexao encerrada pelo WhatsApp Web.',
    );
  }

  private async handleInitializationFailure(
    connectionId: string,
    companyId: string,
    runtimeToken: number,
    error: unknown,
  ) {
    if (!this.isRuntimeActive(connectionId, runtimeToken)) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Falha ao iniciar a sessao do WhatsApp.';

    await this.destroyClient(connectionId);
    await this.updateConnection(connectionId, {
      status: 'AUTH_FAILURE',
      qrCode: null,
      lastDisconnectedAt: new Date(),
      lastError: message,
    });
    await this.createEvent(connectionId, companyId, 'AUTH_FAILURE', message);
  }

  private isRuntimeActive(connectionId: string, runtimeToken: number) {
    return this.clientStates.get(connectionId)?.runtimeToken === runtimeToken;
  }

  private setConnectionStartingState(
    connectionId: string,
    isStarting: boolean,
  ) {
    const clientState = this.clientStates.get(connectionId);

    if (!clientState) {
      return;
    }

    this.clientStates.set(connectionId, {
      ...clientState,
      isStarting,
    });
  }

  private async destroyClient(connectionId: string) {
    const clientState = this.clientStates.get(connectionId);

    if (!clientState) {
      return;
    }

    this.clientStates.delete(connectionId);

    await clientState.client.destroy().catch(() => null);
  }

  private async updateConnection(
    connectionId: string,
    data: {
      status?:
        | 'DISCONNECTED'
        | 'PENDING_QR'
        | 'CONNECTING'
        | 'CONNECTED'
        | 'AUTH_FAILURE';
      displayName?: string | null;
      phoneNumber?: string | null;
      qrCode?: string | null;
      sessionPath?: string | null;
      lastConnectedAt?: Date | null;
      lastDisconnectedAt?: Date | null;
      lastQrGeneratedAt?: Date | null;
      lastError?: string | null;
    },
  ) {
    await this.prismaService.whatsAppConnection.update({
      where: { id: connectionId },
      data,
    });
  }

  private async createEvent(
    connectionId: string,
    companyId: string,
    type:
      | 'QR_GENERATED'
      | 'AUTHENTICATED'
      | 'READY'
      | 'DISCONNECTED'
      | 'AUTH_FAILURE'
      | 'SEND_BLOCKED',
    message: string,
    payload?: Record<string, unknown>,
  ) {
    await this.prismaService.whatsAppConnectionEvent.create({
      data: {
        companyId,
        connectionId,
        type,
        message,
        ...(payload
          ? {
              payload: payload as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  private getSessionsRoot() {
    const configuredPath =
      this.configService.get<string>('WHATSAPP_SESSION_DIR')?.trim() || '';

    if (configuredPath) {
      return path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(process.cwd(), configuredPath);
    }

    return path.resolve(process.cwd(), '.sessions', 'whatsapp');
  }

  private isHeadlessEnabled() {
    const configuredValue =
      this.configService.get<string>('WHATSAPP_HEADLESS')?.trim() || 'true';

    return configuredValue.toLowerCase() !== 'false';
  }

  private toChatId(phoneNumber: string) {
    const defaultCountryCode =
      this.configService.get<string>('WHATSAPP_DEFAULT_COUNTRY_CODE')?.trim() ||
      '55';

    return toWhatsAppChatId(phoneNumber, defaultCountryCode);
  }
}
