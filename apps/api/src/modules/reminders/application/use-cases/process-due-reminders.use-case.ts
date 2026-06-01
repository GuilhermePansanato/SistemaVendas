import { Injectable } from '@nestjs/common';
import type {
  ReminderInstallmentCandidate,
  ReminderRuleSnapshot,
} from '../../domain/entities/reminder';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';
import { GetWhatsAppConnectionUseCase } from '../../../whatsapp/application/use-cases/get-whatsapp-connection.use-case';
import { WhatsAppConnectionsRepository } from '../../../whatsapp/domain/repositories/whatsapp-connections.repository';
import { WhatsAppSessionGateway } from '../../../whatsapp/domain/services/whatsapp-session-gateway';

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function buildScheduledDateTime(date: Date, sendTime: string) {
  const [hours, minutes] = sendTime.split(':').map(Number);
  const scheduledDateTime = new Date(date);
  scheduledDateTime.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return scheduledDateTime;
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function buildReminderMessage(
  rule: ReminderRuleSnapshot,
  installment: ReminderInstallmentCandidate,
) {
  const dueDate = formatDate(installment.dueDate);
  const amount = formatCurrency(installment.amount);
  const saleDescription = installment.saleDescription || 'sua compra';

  if (rule.triggerType === 'BEFORE_DUE') {
    return `Ola, ${installment.customerName}. Lembrete: a parcela ${installment.installmentNumber} de ${saleDescription} vence em ${dueDate}, no valor de ${amount}.`;
  }

  return `Ola, ${installment.customerName}. A parcela ${installment.installmentNumber} de ${saleDescription} vence hoje (${dueDate}), no valor de ${amount}.`;
}

@Injectable()
export class ProcessDueRemindersUseCase {
  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly getWhatsAppConnectionUseCase: GetWhatsAppConnectionUseCase,
    private readonly whatsappConnectionsRepository: WhatsAppConnectionsRepository,
    private readonly whatsappSessionGateway: WhatsAppSessionGateway,
  ) {}

  async execute(companyId: string, referenceDate = new Date()) {
    const normalizedReferenceDate = getStartOfDay(referenceDate);
    const [settings, rules, connection] = await Promise.all([
      this.remindersRepository.getSettings(companyId),
      this.remindersRepository.ensureDefaultRules(companyId),
      this.getWhatsAppConnectionUseCase.execute(companyId),
    ]);

    let created = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const rule of rules) {
      const dueDate = addDays(normalizedReferenceDate, rule.daysBefore);
      const installments = await this.remindersRepository.findInstallmentsDueOn(
        companyId,
        dueDate,
      );

      for (const installment of installments) {
        const triggerDate =
          rule.triggerType === 'BEFORE_DUE'
            ? addDays(installment.dueDate, -rule.daysBefore)
            : installment.dueDate;
        const normalizedTriggerDate = getStartOfDay(triggerDate);
        const existingReminder =
          await this.remindersRepository.findReminderMessage(
            companyId,
            installment.installmentId,
            rule.triggerType,
            normalizedTriggerDate,
          );

        if (existingReminder?.status === 'SENT') {
          skipped += 1;
          continue;
        }

        if (!existingReminder) {
          created += 1;
        }

        const attemptedAt = new Date();
        const scheduledFor = buildScheduledDateTime(
          normalizedTriggerDate,
          settings.defaultSendTime,
        );
        const messageBody = buildReminderMessage(rule, installment);

        if (connection.status !== 'CONNECTED') {
          failed += 1;

          await this.remindersRepository.upsertReminderAttempt({
            companyId,
            customerId: installment.customerId,
            installmentId: installment.installmentId,
            ruleId: rule.id,
            whatsappConnectionId: connection.id,
            triggerType: rule.triggerType,
            triggerDate: normalizedTriggerDate,
            scheduledFor,
            messageBody,
            status: 'FAILED',
            retryCount: (existingReminder?.retryCount ?? 0) + 1,
            attemptedAt,
            sentAt: null,
            failureReason:
              connection.status === 'AUTH_FAILURE'
                ? 'AUTH_FAILURE'
                : 'WHATSAPP_DISCONNECTED',
            providerMessageId: null,
            errorMessage:
              connection.status === 'AUTH_FAILURE'
                ? 'Falha de autenticacao na sessao do WhatsApp.'
                : 'Envio bloqueado porque o WhatsApp esta desconectado.',
          });
          await this.whatsappConnectionsRepository.createEvent({
            companyId,
            connectionId: connection.id,
            type: 'SEND_BLOCKED',
            message:
              'Lembrete bloqueado porque a conexao do WhatsApp nao esta disponivel.',
            payload: {
              installmentId: installment.installmentId,
              triggerType: rule.triggerType,
            },
          });
          continue;
        }

        try {
          const sentMessage = await this.whatsappSessionGateway.sendTextMessage(
            connection,
            installment.customerWhatsappPhone,
            messageBody,
          );

          await this.remindersRepository.upsertReminderAttempt({
            companyId,
            customerId: installment.customerId,
            installmentId: installment.installmentId,
            ruleId: rule.id,
            whatsappConnectionId: connection.id,
            triggerType: rule.triggerType,
            triggerDate: normalizedTriggerDate,
            scheduledFor,
            messageBody,
            status: 'SENT',
            retryCount: existingReminder?.retryCount ?? 0,
            attemptedAt,
            sentAt: attemptedAt,
            failureReason: null,
            providerMessageId: sentMessage.providerMessageId,
            errorMessage: null,
          });
          sent += 1;
        } catch {
          failed += 1;

          await this.remindersRepository.upsertReminderAttempt({
            companyId,
            customerId: installment.customerId,
            installmentId: installment.installmentId,
            ruleId: rule.id,
            whatsappConnectionId: connection.id,
            triggerType: rule.triggerType,
            triggerDate: normalizedTriggerDate,
            scheduledFor,
            messageBody,
            status: 'FAILED',
            retryCount: (existingReminder?.retryCount ?? 0) + 1,
            attemptedAt,
            sentAt: null,
            failureReason: 'DELIVERY_ERROR',
            providerMessageId: null,
            errorMessage:
              'O WhatsApp nao conseguiu entregar a mensagem automaticamente.',
          });
        }
      }
    }

    return {
      referenceDate: normalizedReferenceDate,
      created,
      sent,
      failed,
      skipped,
    };
  }
}
