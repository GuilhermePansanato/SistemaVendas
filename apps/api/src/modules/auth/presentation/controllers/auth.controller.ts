import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LoginDto } from '../../application/dto/login.dto';
import { GetAuthProfileUseCase } from '../../application/use-cases/get-auth-profile.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../http/current-user.decorator';
import type { JwtUser } from '../http/jwt-user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getAuthProfileUseCase: GetAuthProfileUseCase,
  ) {}

  @Post('login')
  login(@Body() input: LoginDto) {
    return this.loginUseCase.execute(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() currentUser: JwtUser) {
    return this.getAuthProfileUseCase.execute(currentUser.userId);
  }
}
