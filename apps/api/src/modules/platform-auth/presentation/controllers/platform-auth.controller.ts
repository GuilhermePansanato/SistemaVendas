import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetPlatformAuthProfileUseCase } from '../../application/use-cases/get-platform-auth-profile.use-case';
import { PlatformLoginUseCase } from '../../application/use-cases/platform-login.use-case';
import { PlatformLoginDto } from '../../application/dto/platform-login.dto';
import { PlatformJwtAuthGuard } from '../../infrastructure/security/platform-jwt-auth.guard';
import { PlatformCurrentUser } from '../http/platform-current-user.decorator';
import type { PlatformJwtUser } from '../http/platform-jwt-user';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(
    private readonly platformLoginUseCase: PlatformLoginUseCase,
    private readonly getPlatformAuthProfileUseCase: GetPlatformAuthProfileUseCase,
  ) {}

  @Post('login')
  login(@Body() input: PlatformLoginDto) {
    return this.platformLoginUseCase.execute(input);
  }

  @Get('me')
  @UseGuards(PlatformJwtAuthGuard)
  me(@PlatformCurrentUser() currentUser: PlatformJwtUser) {
    return this.getPlatformAuthProfileUseCase.execute(currentUser.userId);
  }
}
