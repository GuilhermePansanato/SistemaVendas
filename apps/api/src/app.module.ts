import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InstallmentsModule } from './modules/installments/installments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { PlatformCompaniesModule } from './modules/platform-companies/platform-companies.module';
import { PlatformModulesModule } from './modules/platform-modules/platform-modules.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { SalesModule } from './modules/sales/sales.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { TenantModuleAccessModule } from './shared/security/tenant-module-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
    }),
    PrismaModule,
    TenantModuleAccessModule,
    PlatformAuthModule,
    PlatformModulesModule,
    PlatformCompaniesModule,
    AuthModule,
    CustomersModule,
    SalesModule,
    InstallmentsModule,
    PaymentsModule,
    RemindersModule,
    WhatsappModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
