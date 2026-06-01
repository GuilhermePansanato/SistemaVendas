import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DisconnectWhatsAppConnectionUseCase } from './application/use-cases/disconnect-whatsapp-connection.use-case';
import { GetWhatsAppConnectionUseCase } from './application/use-cases/get-whatsapp-connection.use-case';
import { SendWhatsAppTestMessageUseCase } from './application/use-cases/send-whatsapp-test-message.use-case';
import { StartWhatsAppConnectionUseCase } from './application/use-cases/start-whatsapp-connection.use-case';
import { WhatsAppConnectionsRepository } from './domain/repositories/whatsapp-connections.repository';
import { WhatsAppSessionGateway } from './domain/services/whatsapp-session-gateway';
import { WhatsAppWebSessionGateway } from './infrastructure/gateways/whatsapp-web-session.gateway';
import { PrismaWhatsAppConnectionsRepository } from './infrastructure/repositories/prisma-whatsapp-connections.repository';
import { WhatsappController } from './presentation/controllers/whatsapp.controller';

@Module({
  imports: [ConfigModule],
  controllers: [WhatsappController],
  providers: [
    GetWhatsAppConnectionUseCase,
    StartWhatsAppConnectionUseCase,
    DisconnectWhatsAppConnectionUseCase,
    SendWhatsAppTestMessageUseCase,
    {
      provide: WhatsAppConnectionsRepository,
      useClass: PrismaWhatsAppConnectionsRepository,
    },
    {
      provide: WhatsAppSessionGateway,
      useClass: WhatsAppWebSessionGateway,
    },
  ],
  exports: [
    GetWhatsAppConnectionUseCase,
    WhatsAppConnectionsRepository,
    WhatsAppSessionGateway,
  ],
})
export class WhatsappModule {}
