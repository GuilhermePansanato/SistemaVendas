import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  getReminders,
  getReminderSettings,
  getReminderSummary,
  processDueReminders,
  updateReminderSettings,
} from '../features/reminders/services/reminders-service';
import type {
  ReminderFailureReason,
  ReminderListItem,
  ReminderStatus,
  ReminderTriggerType,
} from '../features/reminders/types/reminder';
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppConnection,
} from '../features/whatsapp/services/whatsapp-service';
import type {
  WhatsAppConnection,
  WhatsAppConnectionStatus,
} from '../features/whatsapp/types/whatsapp-connection';
import {
  EmptyState,
  MetricCard,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatDate } from '../shared/lib/formatters';

const reminderStatusLabels: Record<ReminderStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
};

const triggerLabels: Record<ReminderTriggerType, string> = {
  BEFORE_DUE: 'D-3',
  ON_DUE: 'D0',
};

const failureReasonLabels: Record<ReminderFailureReason, string> = {
  WHATSAPP_DISCONNECTED: 'WhatsApp desconectado',
  AUTH_FAILURE: 'Falha de autenticacao',
  DELIVERY_ERROR: 'Erro no envio',
  UNKNOWN: 'Falha desconhecida',
};

const statusLabels: Record<WhatsAppConnectionStatus, string> = {
  DISCONNECTED: 'Desconectado',
  PENDING_QR: 'Aguardando QR',
  CONNECTING: 'Conectando',
  CONNECTED: 'Conectado',
  AUTH_FAILURE: 'Falha de autenticacao',
};

const reminderSettingsSchema = z.object({
  defaultSendTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Informe um horario valido no formato HH:mm.',
  }),
});

type ReminderSettingsFormData = z.infer<typeof reminderSettingsSchema>;

function formatDateTime(value: string | null) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return fallback;
}

function getConnectionDescription(connection: WhatsAppConnection) {
  if (connection.status === 'CONNECTED') {
    return 'A sessao esta pronta para disparar cobrancas automaticas.';
  }

  if (connection.status === 'PENDING_QR') {
    return 'Escaneie o QR code abaixo em Dispositivos conectados no WhatsApp.';
  }

  if (connection.status === 'CONNECTING') {
    return 'O sistema esta iniciando a sessao e aguardando os eventos do WhatsApp Web.';
  }

  if (connection.status === 'AUTH_FAILURE') {
    return 'Houve uma falha na autenticacao. Gere um novo QR code para reconectar.';
  }

  return 'Conecte um numero de WhatsApp para liberar os lembretes automaticos.';
}

function getConnectionTone(status: WhatsAppConnectionStatus) {
  if (status === 'CONNECTED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'PENDING_QR' || status === 'CONNECTING') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === 'AUTH_FAILURE') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function getReminderTone(status: ReminderStatus) {
  if (status === 'SENT') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'FAILED') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (status === 'PENDING') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function buildReminderSubtitle(reminder: ReminderListItem) {
  const parts = [
    `Parcela ${reminder.installmentNumber}`,
    reminder.saleDescription || 'Venda sem descricao',
    `Vencimento ${formatDate(reminder.dueDate)}`,
  ];

  return parts.join(' - ');
}

export function RemindersPage() {
  const queryClient = useQueryClient();
  const settingsForm = useForm<ReminderSettingsFormData>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: {
      defaultSendTime: '09:00',
    },
  });

  const connectionQuery = useQuery({
    queryKey: ['whatsapp', 'connection'],
    queryFn: getWhatsAppConnection,
    refetchInterval: 5000,
  });
  const reminderSettingsQuery = useQuery({
    queryKey: ['reminders', 'settings'],
    queryFn: getReminderSettings,
  });
  const reminderSummaryQuery = useQuery({
    queryKey: ['reminders', 'summary'],
    queryFn: getReminderSummary,
  });
  const remindersQuery = useQuery({
    queryKey: ['reminders', 'recent'],
    queryFn: getReminders,
  });

  useEffect(() => {
    if (!reminderSettingsQuery.data) {
      return;
    }

    settingsForm.reset({
      defaultSendTime: reminderSettingsQuery.data.defaultSendTime,
    });
  }, [reminderSettingsQuery.data, settingsForm]);

  const connectMutation = useMutation({
    mutationFn: connectWhatsApp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['whatsapp', 'connection'],
      });
    },
  });
  const disconnectMutation = useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['whatsapp', 'connection'],
      });
    },
  });
  const updateSettingsMutation = useMutation({
    mutationFn: updateReminderSettings,
    onSuccess: async (data) => {
      settingsForm.reset({
        defaultSendTime: data.defaultSendTime,
      });
      await queryClient.invalidateQueries({
        queryKey: ['reminders', 'settings'],
      });
    },
  });
  const processMutation = useMutation({
    mutationFn: processDueReminders,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['reminders', 'summary'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['reminders', 'recent'],
        }),
      ]);
    },
  });

  const connection = connectionQuery.data;
  const reminderSummary = reminderSummaryQuery.data;
  const reminders = remindersQuery.data ?? [];
  const isConnectionBusy =
    connectMutation.isPending || disconnectMutation.isPending;
  const connectionActionError = connectMutation.isError
    ? getApiErrorMessage(
        connectMutation.error,
        'Nao foi possivel iniciar a conexao do WhatsApp.',
      )
    : disconnectMutation.isError
      ? getApiErrorMessage(
          disconnectMutation.error,
          'Nao foi possivel desconectar a sessao do WhatsApp.',
        )
      : null;
  const settingsErrorMessage = updateSettingsMutation.isError
    ? getApiErrorMessage(
        updateSettingsMutation.error,
        'Nao foi possivel salvar o horario padrao.',
      )
    : null;
  const processErrorMessage = processMutation.isError
    ? getApiErrorMessage(
        processMutation.error,
        'Nao foi possivel processar os lembretes agora.',
      )
    : null;

  const handleSubmitSettings = settingsForm.handleSubmit((values) => {
    updateSettingsMutation.mutate(values);
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cobrancas"
        description="Conecte o WhatsApp da loja, defina o horario padrao de envio e acompanhe o historico das cobrancas."
      />

      {connection?.status !== 'CONNECTED' &&
      (reminderSummary?.blockedByConnection ?? 0) > 0 ? (
        <EmptyState
          tone="warning"
          message={`Existem ${reminderSummary?.blockedByConnection ?? 0} lembretes bloqueados porque o WhatsApp esta desconectado.`}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Status"
          value={connection ? statusLabels[connection.status] : '--'}
          tone={
            connection?.status === 'CONNECTED'
              ? 'success'
              : connection?.status === 'AUTH_FAILURE'
                ? 'danger'
                : connection?.status === 'PENDING_QR' ||
                    connection?.status === 'CONNECTING'
                  ? 'warning'
                  : 'default'
          }
        />
        <MetricCard
          label="Ultima conexao"
          value={
            connection?.lastConnectedAt
              ? formatDate(connection.lastConnectedAt)
              : '--'
          }
          helper={
            connection?.lastDisconnectedAt
              ? `Ultima queda: ${formatDate(connection.lastDisconnectedAt)}`
              : 'Sem desconexoes registradas.'
          }
        />
        <MetricCard
          label="Enviados"
          value={String(reminderSummary?.sent ?? 0)}
          helper="Lembretes registrados como enviados."
          tone="success"
        />
        <MetricCard
          label="Bloqueados"
          value={String(reminderSummary?.blockedByConnection ?? 0)}
          helper="Falhas causadas por conexao indisponivel."
          tone="warning"
        />
      </div>

      <SectionCard
        title="Conexao do WhatsApp"
        description={
          connection
            ? getConnectionDescription(connection)
            : 'Carregando o status atual da conexao.'
        }
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => connectMutation.mutate()}
              disabled={isConnectionBusy}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connectMutation.isPending
                ? 'Conectando...'
                : connection?.status === 'CONNECTED'
                  ? 'Reconectar'
                  : 'Conectar WhatsApp'}
            </button>

            <button
              type="button"
              onClick={() => disconnectMutation.mutate()}
              disabled={
                isConnectionBusy ||
                !connection ||
                connection.status === 'DISCONNECTED'
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        }
      >
        {connectionQuery.isLoading ? (
          <EmptyState message="Carregando o status da conexao..." />
        ) : connectionQuery.isError || !connection ? (
          <EmptyState
            tone="danger"
            message="Nao foi possivel carregar a conexao do WhatsApp."
          />
        ) : (
          <div className="space-y-5">
            <div
              className={[
                'rounded-xl border px-4 py-4 text-sm',
                getConnectionTone(connection.status),
              ].join(' ')}
            >
              <p className="font-semibold">
                Status atual: {statusLabels[connection.status]}
              </p>
              {connection.lastError ? (
                <p className="mt-2">{connection.lastError}</p>
              ) : null}
            </div>

            {connectionActionError ? (
              <EmptyState tone="danger" message={connectionActionError} />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Numero conectado
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {connection.phoneNumber || '--'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {connection.displayName || 'Nenhuma conta autenticada ainda.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Ultimo QR
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatDateTime(connection.lastQrGeneratedAt)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Gere um novo QR quando a sessao cair.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Ultima desconexao
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatDateTime(connection.lastDisconnectedAt)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Qualquer bloqueio de envio ficara registrado no historico.
                </p>
              </div>
            </div>

            {connection.qrCode ? (
              <div className="grid gap-4 lg:grid-cols-[320px,1fr] lg:items-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <img
                    src={connection.qrCode}
                    alt="QR code do WhatsApp"
                    className="mx-auto h-72 w-72 rounded-xl"
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Como conectar
                  </p>
                  <p className="text-sm text-slate-600">
                    Abra o WhatsApp no celular, entre em Dispositivos conectados e
                    escaneie este QR code.
                  </p>
                  <p className="text-sm text-slate-600">
                    Assim que a leitura for concluida, a tela muda automaticamente
                    para o status conectado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {connection.status === 'CONNECTED'
                  ? 'A conexao esta ativa e pronta para os envios manuais e automaticos.'
                  : 'Clique em Conectar WhatsApp para iniciar a sessao e gerar o QR code.'}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Envio de cobrancas"
        description="Defina o horario padrao das cobrancas automaticas e use o envio manual quando precisar."
        action={
          <button
            type="button"
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processMutation.isPending ? 'Enviando...' : 'Enviar manual'}
          </button>
        }
      >
        <div className="space-y-4">
          <form
            className="grid gap-4 md:grid-cols-[220px,1fr] md:items-end"
            onSubmit={handleSubmitSettings}
          >
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Horario padrao</span>
              <input
                type="time"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                {...settingsForm.register('defaultSendTime')}
              />
              {settingsForm.formState.errors.defaultSendTime ? (
                <p className="text-xs text-rose-600">
                  {settingsForm.formState.errors.defaultSendTime.message}
                </p>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateSettingsMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar horario'}
              </button>
              <p className="text-sm text-slate-500">
                Esse horario fica salvo como base para o envio das cobrancas.
              </p>
            </div>
          </form>

          {settingsErrorMessage ? (
            <EmptyState tone="danger" message={settingsErrorMessage} />
          ) : null}

          {updateSettingsMutation.isSuccess ? (
            <EmptyState
              tone="success"
              message="Horario padrao salvo com sucesso."
            />
          ) : null}

          {processErrorMessage ? (
            <EmptyState tone="danger" message={processErrorMessage} />
          ) : null}

          {processMutation.isSuccess ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              <p className="font-semibold">Envio manual concluido.</p>
              <p className="mt-2">
                Criados: {processMutation.data.created}, enviados:{' '}
                {processMutation.data.sent}, falharam:{' '}
                {processMutation.data.failed}, ignorados:{' '}
                {processMutation.data.skipped}
              </p>
              <p className="mt-1">
                Referencia: {formatDate(processMutation.data.referenceDate)}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Pendentes"
              value={String(reminderSummary?.pending ?? 0)}
            />
            <MetricCard
              label="Falhas"
              value={String(reminderSummary?.failed ?? 0)}
              tone="danger"
            />
            <MetricCard
              label="Bloqueadas"
              value={String(reminderSummary?.blockedByConnection ?? 0)}
              tone="warning"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Historico recente"
        description="Cada envio fica vinculado a uma parcela para auditoria e cobranca."
      >
        {remindersQuery.isLoading ? (
          <EmptyState message="Carregando historico de cobrancas..." />
        ) : remindersQuery.isError ? (
          <EmptyState
            tone="danger"
            message="Nao foi possivel carregar o historico de cobrancas."
          />
        ) : reminders.length === 0 ? (
          <EmptyState message="Ainda nao existe lembrete registrado no sistema." />
        ) : (
          <ScrollableContent size="lg">
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <article
                  key={reminder.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {reminder.customerName}
                        </p>
                        <span
                          className={[
                            'rounded-full border px-2.5 py-1 text-xs font-semibold',
                            getReminderTone(reminder.status),
                          ].join(' ')}
                        >
                          {reminderStatusLabels[reminder.status]}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {triggerLabels[reminder.triggerType]}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500">
                        {buildReminderSubtitle(reminder)}
                      </p>

                      <p className="text-sm text-slate-700">{reminder.messageBody}</p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-500 lg:min-w-[280px]">
                      <div>
                        <p className="font-medium text-slate-700">Contato</p>
                        <p>{reminder.customerWhatsappPhone}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Tentativa</p>
                        <p>{formatDateTime(reminder.attemptedAt || reminder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Envio</p>
                        <p>{formatDateTime(reminder.sentAt)}</p>
                      </div>
                    </div>
                  </div>

                  {reminder.failureReason || reminder.errorMessage ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      <p className="font-semibold">
                        {reminder.failureReason
                          ? failureReasonLabels[reminder.failureReason]
                          : 'Falha registrada'}
                      </p>
                      {reminder.errorMessage ? (
                        <p className="mt-1">{reminder.errorMessage}</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </ScrollableContent>
        )}
      </SectionCard>
    </section>
  );
}
