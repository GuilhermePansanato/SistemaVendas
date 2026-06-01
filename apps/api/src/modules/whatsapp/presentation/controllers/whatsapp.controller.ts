import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { SendWhatsAppTestMessageDto } from '../../application/dto/send-whatsapp-test-message.dto';
import { DisconnectWhatsAppConnectionUseCase } from '../../application/use-cases/disconnect-whatsapp-connection.use-case';
import { GetWhatsAppConnectionUseCase } from '../../application/use-cases/get-whatsapp-connection.use-case';
import { SendWhatsAppTestMessageUseCase } from '../../application/use-cases/send-whatsapp-test-message.use-case';
import { StartWhatsAppConnectionUseCase } from '../../application/use-cases/start-whatsapp-connection.use-case';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.REMINDERS)
export class WhatsappController {
  constructor(
    private readonly getWhatsAppConnectionUseCase: GetWhatsAppConnectionUseCase,
    private readonly startWhatsAppConnectionUseCase: StartWhatsAppConnectionUseCase,
    private readonly disconnectWhatsAppConnectionUseCase: DisconnectWhatsAppConnectionUseCase,
    private readonly sendWhatsAppTestMessageUseCase: SendWhatsAppTestMessageUseCase,
  ) {}

  @Get('connection')
  getConnection(@CurrentUser() currentUser: JwtUser) {
    return this.getWhatsAppConnectionUseCase.execute(currentUser.companyId);
  }

  @Post('connection/connect')
  connect(@CurrentUser() currentUser: JwtUser) {
    return this.startWhatsAppConnectionUseCase.execute(currentUser.companyId);
  }

  @Post('connection/disconnect')
  disconnect(@CurrentUser() currentUser: JwtUser) {
    return this.disconnectWhatsAppConnectionUseCase.execute(
      currentUser.companyId,
    );
  }

  @Post('test-message')
  sendTestMessage(
    @CurrentUser() currentUser: JwtUser,
    @Body() input: SendWhatsAppTestMessageDto,
  ) {
    return this.sendWhatsAppTestMessageUseCase.execute(
      currentUser.companyId,
      input,
    );
  }
}
