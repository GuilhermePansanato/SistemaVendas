import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getInstallmentById, getInstallments } from '../features/installments/services/installments-service';
import type { InstallmentDetail, InstallmentListItem } from '../features/installments/types/installment';
import { getPayments, registerPayment } from '../features/payments/services/payments-service';
import type { CreatePaymentInput, PaymentListItem } from '../features/payments/types/payment';
import {
  EmptyState,
  MetricCard,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatCurrency, formatDate } from '../shared/lib/formatters';
import type {
  InstallmentStatus,
  PaymentMethod,
} from '../shared/types/finance';

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'OTHER', label: 'Outro' },
];

const installmentStatusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'PARTIALLY_PAID', label: 'Parciais' },
  { value: 'OVERDUE', label: 'Vencidas' },
  { value: 'PAID', label: 'Quitadas' },
] as const;

const paymentSchema = z.object({
  amount: z.number().positive('Informe um valor maior que zero.'),
  paidAt: z.string().min(1, 'Informe a data do pagamento.'),
  method: z.enum([
    'CASH',
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'OTHER',
  ]),
  reference: z.string().trim().max(120, 'Limite de 120 caracteres.'),
  notes: z.string().trim().max(500, 'Limite de 500 caracteres.'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

function getTodayInputValue() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function createEmptyPaymentValues(amount = 0): PaymentFormData {
  return {
    amount,
    paidAt: getTodayInputValue(),
    method: 'PIX',
    reference: '',
    notes: '',
  };
}

function mapPaymentPayload(values: PaymentFormData): CreatePaymentInput {
  return {
    amount: values.amount,
    paidAt: values.paidAt,
    method: values.method,
    reference: values.reference.trim() || null,
    notes: values.notes.trim() || null,
  };
}

function getInstallmentStatusTone(status: InstallmentStatus) {
  if (status === 'PAID') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'OVERDUE') {
    return 'bg-rose-100 text-rose-700';
  }

  if (status === 'PARTIALLY_PAID') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-sky-100 text-sky-700';
}

function InstallmentPickerRow({
  installment,
  isSelected,
  onSelect,
}: {
  installment: InstallmentListItem;
  isSelected: boolean;
  onSelect: (installmentId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(installment.id)}
      className={[
        'w-full rounded-xl border px-4 py-4 text-left transition',
        isSelected
          ? 'border-slate-900 bg-slate-100'
          : 'border-slate-200 bg-white hover:bg-slate-50',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {installment.customer.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Parcela {installment.number} - {installment.sale.description || 'Venda sem descricao'}
          </p>
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            getInstallmentStatusTone(installment.status),
          ].join(' ')}
        >
          {installment.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Vence
          </p>
          <p className="mt-1 text-sm text-slate-900">{formatDate(installment.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Saldo
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(installment.remainingAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Pago
          </p>
          <p className="mt-1 text-sm text-slate-900">
            {formatCurrency(installment.paidAmount)}
          </p>
        </div>
      </div>
    </button>
  );
}

function PaymentHistoryRow({ payment }: { payment: PaymentListItem }) {
  const methodLabel =
    paymentMethodOptions.find((option) => option.value === payment.method)?.label ??
    payment.method;

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(payment.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {payment.customer.name} - {methodLabel}
          </p>
        </div>
        <p className="text-sm text-slate-500">{formatDate(payment.paidAt)}</p>
      </div>

      {payment.reference ? (
        <p className="mt-3 text-sm text-slate-500">Referencia: {payment.reference}</p>
      ) : null}

      {payment.notes ? (
        <p className="mt-2 text-sm text-slate-500">{payment.notes}</p>
      ) : null}
    </article>
  );
}

function SelectedInstallmentPanel({
  installment,
  payments,
  isSubmitting,
  form: {
    register,
    handleSubmit,
    formState: { errors },
  },
  onSubmit,
  onResetForm,
  mutationError,
}: {
  installment: InstallmentDetail;
  payments: PaymentListItem[];
  isSubmitting: boolean;
  form: ReturnType<typeof useForm<PaymentFormData>>;
  onSubmit: (values: PaymentFormData) => void;
  onResetForm: () => void;
  mutationError: boolean;
}) {
  return (
    <SectionCard
      title={installment.customer.name}
      description={`Parcela ${installment.number}/${installment.sale.installmentCount} - vence em ${formatDate(installment.dueDate)}`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Valor" value={formatCurrency(installment.amount)} />
        <MetricCard
          label="Ja pago"
          value={formatCurrency(installment.paidAmount)}
          tone="success"
        />
        <MetricCard
          label="Saldo"
          value={formatCurrency(installment.remainingAmount)}
          tone="warning"
        />
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Valor pago
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.amount.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Data do pagamento
            </span>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...register('paidAt')}
            />
            {errors.paidAt ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.paidAt.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Forma de pagamento
            </span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...register('method')}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.method ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.method.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Referencia
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              placeholder="Ex.: PIX-AB12 ou recibo"
              {...register('reference')}
            />
            {errors.reference ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.reference.message}
              </span>
            ) : null}
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Observacoes
          </span>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            placeholder="Observacoes do recebimento"
            {...register('notes')}
          />
          {errors.notes ? (
            <span className="mt-2 block text-sm text-rose-600">
              {errors.notes.message}
            </span>
          ) : null}
        </label>

        {mutationError ? (
          <EmptyState
            tone="danger"
            message="Nao foi possivel registrar o pagamento. Revise o valor, a data e o saldo da parcela."
          />
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar pagamento'}
          </button>

          <button
            type="button"
            onClick={onResetForm}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Usar saldo restante
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-slate-900">Historico da parcela</p>
        <ScrollableContent size="sm">
          <div className="space-y-3">
            {payments.length === 0 ? (
              <EmptyState message="Ainda nao existe pagamento registrado para esta parcela." />
            ) : (
              payments.map((payment) => (
                <PaymentHistoryRow key={payment.id} payment={payment} />
              ))
            )}
          </div>
        </ScrollableContent>
      </div>
    </SectionCard>
  );
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | InstallmentStatus>('all');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(
    null,
  );

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: createEmptyPaymentValues(),
  });

  const installmentsQuery = useQuery({
    queryKey: ['installments', 'payments-page', deferredSearch, statusFilter],
    queryFn: () =>
      getInstallments({
        search: deferredSearch.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const installmentDetailQuery = useQuery({
    queryKey: ['installments', 'detail', selectedInstallmentId],
    queryFn: () => getInstallmentById(selectedInstallmentId!),
    enabled: Boolean(selectedInstallmentId),
  });

  const paymentsQuery = useQuery({
    queryKey: ['payments', selectedInstallmentId],
    queryFn: () =>
      getPayments({
        installmentId: selectedInstallmentId || undefined,
      }),
  });

  useEffect(() => {
    if (!installmentDetailQuery.data) {
      return;
    }

    form.reset(createEmptyPaymentValues(installmentDetailQuery.data.remainingAmount));
  }, [form, installmentDetailQuery.data]);

  const registerPaymentMutation = useMutation({
    mutationFn: (values: PaymentFormData) =>
      registerPayment(selectedInstallmentId!, mapPaymentPayload(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['installments'] });
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({
        queryKey: ['installments', 'detail', selectedInstallmentId],
      });
    },
  });

  const installments = installmentsQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const totalReceived = payments.reduce((total, payment) => total + payment.amount, 0);
  const openBalance = installments.reduce((total, installment) => {
    if (installment.status === 'PAID' || installment.status === 'CANCELED') {
      return total;
    }

    return total + installment.remainingAmount;
  }, 0);
  const overdueCount = installments.filter(
    (installment) => installment.status === 'OVERDUE',
  ).length;

  const onSubmit = (values: PaymentFormData) => {
    registerPaymentMutation.mutate(values);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Pagamentos"
        description="Registre recebimentos e acompanhe o historico."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Recebido na visao atual"
          value={formatCurrency(totalReceived)}
          tone="success"
        />
        <MetricCard
          label="Saldo aberto"
          value={formatCurrency(openBalance)}
          tone="warning"
        />
        <MetricCard
          label="Parcelas vencidas"
          value={String(overdueCount)}
          tone="danger"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <SectionCard
          title="Parcelas para receber"
          description={`${installments.length} parcela(s) encontrada(s)`}
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Limpar filtros
            </button>
          }
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, venda ou WhatsApp"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | InstallmentStatus)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            >
              {installmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <ScrollableContent size="lg" className="mt-5">
            <div className="space-y-3">
              {installmentsQuery.isLoading ? (
                <EmptyState message="Carregando parcelas..." />
              ) : null}

              {installmentsQuery.isError ? (
                <EmptyState
                  tone="danger"
                  message="Nao foi possivel carregar as parcelas para pagamento."
                />
              ) : null}

              {!installmentsQuery.isLoading && installments.length === 0 ? (
                <EmptyState message="Nenhuma parcela encontrada com os filtros atuais." />
              ) : null}

              {installments.map((installment) => (
                <InstallmentPickerRow
                  key={installment.id}
                  installment={installment}
                  isSelected={selectedInstallmentId === installment.id}
                  onSelect={(installmentId) => {
                    startTransition(() => {
                      setSelectedInstallmentId(installmentId);
                    });
                  }}
                />
              ))}
            </div>
          </ScrollableContent>
        </SectionCard>

        {selectedInstallmentId ? (
          installmentDetailQuery.isLoading ? (
            <EmptyState message="Carregando detalhe da parcela..." />
          ) : installmentDetailQuery.isError || !installmentDetailQuery.data ? (
            <EmptyState tone="danger" message="Nao foi possivel carregar a parcela selecionada." />
          ) : (
            <SelectedInstallmentPanel
              installment={installmentDetailQuery.data}
              payments={payments}
              isSubmitting={registerPaymentMutation.isPending}
              form={form}
              onSubmit={onSubmit}
              onResetForm={() =>
                form.reset(
                  createEmptyPaymentValues(
                    installmentDetailQuery.data.remainingAmount,
                  ),
                )
              }
              mutationError={registerPaymentMutation.isError}
            />
          )
        ) : (
          <SectionCard
            title="Historico de recebimentos"
            description="Selecione uma parcela para registrar um pagamento."
          >
            <ScrollableContent size="md">
              <div className="space-y-3">
                {paymentsQuery.isLoading ? (
                  <EmptyState message="Carregando pagamentos..." />
                ) : payments.length === 0 ? (
                  <EmptyState message="Ainda nao existe pagamento registrado no sistema." />
                ) : (
                  payments.map((payment) => (
                    <PaymentHistoryRow key={payment.id} payment={payment} />
                  ))
                )}
              </div>
            </ScrollableContent>
          </SectionCard>
        )}
      </div>
    </section>
  );
}
