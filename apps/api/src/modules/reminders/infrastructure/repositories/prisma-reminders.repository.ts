import { Injectable } from '@nestjs/common';
import { type ReminderFailureReason } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  ReminderAutomationTarget,
  ReminderInstallmentCandidate,
  ReminderListItem,
  ReminderMessageSnapshot,
  ReminderRuleSnapshot,
  ReminderSettingsSnapshot,
  ReminderSummary,
  ReminderTriggerType,
} from '../../domain/entities/reminder';
import type {
  RemindersRepository,
  UpsertReminderAttemptData,
} from '../../domain/repositories/reminders.repository';

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEndOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function mapReminderRecord(record: {
  id: string;
  customer: {
    name: string;
    whatsappPhone: string;
  };
  installment: {
    number: number;
    dueDate: Date;
    sale: {
      description: string | null;
    };
  };
  triggerType: 'BEFORE_DUE' | 'ON_DUE';
  messageBody: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';
  failureReason: ReminderFailureReason | null;
  errorMessage: string | null;
  sentAt: Date | null;
  attemptedAt: Date | null;
  createdAt: Date;
}): ReminderListItem {
  return {
    id: record.id,
    customerName: record.customer.name,
    customerWhatsappPhone: record.customer.whatsappPhone,
    saleDescription: record.installment.sale.description,
    installmentNumber: record.installment.number,
    dueDate: record.installment.dueDate,
    triggerType: record.triggerType,
    messageBody: record.messageBody,
    status: record.status,
    failureReason: record.failureReason,
    errorMessage: record.errorMessage,
    sentAt: record.sentAt,
    attemptedAt: record.attemptedAt,
    createdAt: record.createdAt,
  };
}

const DEFAULT_REMINDER_SEND_TIME = '09:00';

@Injectable()
export class PrismaRemindersRepository implements RemindersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getSettings(companyId: string): Promise<ReminderSettingsSnapshot> {
    const settings = await this.prismaService.reminderSettings.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        defaultSendTime: DEFAULT_REMINDER_SEND_TIME,
      },
    });

    return {
      defaultSendTime: settings.defaultSendTime,
      lastAutomatedRunAt: settings.lastAutomatedRunAt,
    };
  }

  async updateSettings(
    companyId: string,
    input: ReminderSettingsSnapshot,
  ): Promise<ReminderSettingsSnapshot> {
    const settings = await this.prismaService.reminderSettings.upsert({
      where: { companyId },
      update: {
        defaultSendTime: input.defaultSendTime,
      },
      create: {
        companyId,
        defaultSendTime: input.defaultSendTime,
      },
    });

    return {
      defaultSendTime: settings.defaultSendTime,
      lastAutomatedRunAt: settings.lastAutomatedRunAt,
    };
  }

  async listAutomationTargets(): Promise<ReminderAutomationTarget[]> {
    const companies = await this.prismaService.company.findMany({
      where: {
        isActive: true,
      },
      include: {
        reminderSettings: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return companies.map((company) => ({
      companyId: company.id,
      defaultSendTime:
        company.reminderSettings?.defaultSendTime ?? DEFAULT_REMINDER_SEND_TIME,
      lastAutomatedRunAt: company.reminderSettings?.lastAutomatedRunAt ?? null,
    }));
  }

  async markAutomatedRun(companyId: string, executedAt: Date): Promise<void> {
    await this.prismaService.reminderSettings.upsert({
      where: { companyId },
      update: {
        lastAutomatedRunAt: executedAt,
      },
      create: {
        companyId,
        defaultSendTime: DEFAULT_REMINDER_SEND_TIME,
        lastAutomatedRunAt: executedAt,
      },
    });
  }

  async ensureDefaultRules(companyId: string): Promise<ReminderRuleSnapshot[]> {
    const rules = [
      {
        name: 'Lembrete D-3',
        triggerType: 'BEFORE_DUE' as const,
        daysBefore: 3,
        template: 'Lembrete preventivo enviado tres dias antes do vencimento.',
      },
      {
        name: 'Lembrete D0',
        triggerType: 'ON_DUE' as const,
        daysBefore: 0,
        template: 'Lembrete enviado no proprio dia do vencimento.',
      },
    ];

    for (const rule of rules) {
      await this.prismaService.reminderRule.upsert({
        where: {
          companyId_triggerType_daysBefore: {
            companyId,
            triggerType: rule.triggerType,
            daysBefore: rule.daysBefore,
          },
        },
        update: {
          name: rule.name,
          template: rule.template,
          isActive: true,
        },
        create: {
          companyId,
          name: rule.name,
          triggerType: rule.triggerType,
          daysBefore: rule.daysBefore,
          template: rule.template,
          isActive: true,
        },
      });
    }

    const storedRules = await this.prismaService.reminderRule.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ daysBefore: 'desc' }, { createdAt: 'asc' }],
    });

    return storedRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      triggerType: rule.triggerType,
      daysBefore: rule.daysBefore,
      template: rule.template,
    }));
  }

  async findInstallmentsDueOn(
    companyId: string,
    date: Date,
  ): Promise<ReminderInstallmentCandidate[]> {
    const installments = await this.prismaService.installment.findMany({
      where: {
        sale: {
          companyId,
        },
        dueDate: {
          gte: getStartOfDay(date),
          lte: getEndOfDay(date),
        },
        status: {
          notIn: ['PAID', 'CANCELED'],
        },
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { number: 'asc' }],
    });

    return installments.map((installment) => ({
      customerId: installment.sale.customerId,
      customerName: installment.sale.customer.name,
      customerWhatsappPhone: installment.sale.customer.whatsappPhone,
      saleDescription: installment.sale.description,
      installmentId: installment.id,
      installmentNumber: installment.number,
      dueDate: installment.dueDate,
      amount: installment.amount.toNumber(),
    }));
  }

  async findReminderMessage(
    companyId: string,
    installmentId: string,
    triggerType: ReminderTriggerType,
    triggerDate: Date,
  ): Promise<ReminderMessageSnapshot | null> {
    const reminder = await this.prismaService.reminderMessage.findFirst({
      where: {
        companyId,
        installmentId,
        triggerType,
        triggerDate,
      },
    });

    if (!reminder) {
      return null;
    }

    return {
      id: reminder.id,
      status: reminder.status,
      retryCount: reminder.retryCount,
    };
  }

  async upsertReminderAttempt(data: UpsertReminderAttemptData): Promise<void> {
    await this.prismaService.reminderMessage.upsert({
      where: {
        installmentId_triggerType_triggerDate: {
          installmentId: data.installmentId,
          triggerType: data.triggerType,
          triggerDate: data.triggerDate,
        },
      },
      update: {
        companyId: data.companyId,
        ruleId: data.ruleId,
        whatsappConnectionId: data.whatsappConnectionId,
        scheduledFor: data.scheduledFor,
        attemptedAt: data.attemptedAt,
        sentAt: data.sentAt,
        status: data.status,
        retryCount: data.retryCount,
        failureReason: data.failureReason as ReminderFailureReason | null,
        messageBody: data.messageBody,
        providerMessageId: data.providerMessageId,
        errorMessage: data.errorMessage,
      },
      create: {
        companyId: data.companyId,
        customerId: data.customerId,
        installmentId: data.installmentId,
        ruleId: data.ruleId,
        whatsappConnectionId: data.whatsappConnectionId,
        triggerType: data.triggerType,
        triggerDate: data.triggerDate,
        scheduledFor: data.scheduledFor,
        attemptedAt: data.attemptedAt,
        sentAt: data.sentAt,
        status: data.status,
        retryCount: data.retryCount,
        failureReason: data.failureReason as ReminderFailureReason | null,
        messageBody: data.messageBody,
        providerMessageId: data.providerMessageId,
        errorMessage: data.errorMessage,
      },
    });
  }

  async listRecent(
    companyId: string,
    limit: number,
  ): Promise<ReminderListItem[]> {
    const reminders = await this.prismaService.reminderMessage.findMany({
      where: {
        companyId,
      },
      include: {
        customer: true,
        installment: {
          include: {
            sale: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });

    return reminders.map(mapReminderRecord);
  }

  async getSummary(companyId: string): Promise<ReminderSummary> {
    const grouped = await this.prismaService.reminderMessage.groupBy({
      where: {
        companyId,
      },
      by: ['status', 'failureReason'],
      _count: {
        _all: true,
      },
    });

    return grouped.reduce<ReminderSummary>(
      (summary, item) => {
        if (item.status === 'PENDING') {
          summary.pending += item._count._all;
        }

        if (item.status === 'SENT') {
          summary.sent += item._count._all;
        }

        if (item.status === 'FAILED') {
          summary.failed += item._count._all;

          if (item.failureReason === 'WHATSAPP_DISCONNECTED') {
            summary.blockedByConnection += item._count._all;
          }
        }

        return summary;
      },
      {
        pending: 0,
        sent: 0,
        failed: 0,
        blockedByConnection: 0,
      },
    );
  }
}
