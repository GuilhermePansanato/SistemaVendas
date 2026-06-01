import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { getCustomers } from '../features/customers/services/customers-service';
import {
  getPayments,
  registerPayment,
  reopenInstallment,
} from '../features/payments/services/payments-service';
import type {
  CreatePaymentInput,
  PaymentListItem,
  ReopenInstallmentInput,
} from '../features/payments/types/payment';
import { createSale, getSaleById, getSales } from '../features/sales/services/sales-service';
import type { CreateSaleInput, SaleDetail, SaleListItem } from '../features/sales/types/sale';
import {
  EmptyState,
  MetricCard,
  Modal,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatCurrency, formatDate } from '../shared/lib/formatters';
import type {
  InstallmentStatus,
  PaymentMethod,
  SaleStatus,
} from '../shared/types/finance';

const saleStatusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'OPEN', label: 'Em aberto' },
  { value: 'OVERDUE', label: 'Vencidas' },
  { value: 'PAID', label: 'Quitadas' },
] as const;

const saleTypeOptions = [
  { value: 'INSTALLMENT', label: 'Parcelada' },
  { value: 'CASH', label: 'A vista' },
] as const;

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'OTHER', label: 'Outro' },
];

const saleStatusLabels: Record<SaleStatus, string> = {
  OPEN: 'Pendente',
  PARTIALLY_PAID: 'Parcial',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
  CANCELED: 'Cancelado',
};

const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendente',
  PARTIALLY_PAID: 'Parcial',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
  CANCELED: 'Cancelado',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartao de credito',
  DEBIT_CARD: 'Cartao de debito',
  BANK_TRANSFER: 'Transferencia',
  OTHER: 'Outro',
};

const saleSchema = z
  .object({
    saleType: z.enum(['INSTALLMENT', 'CASH']),
    customerId: z.string().trim().min(1, 'Selecione um cliente.'),
    description: z.string().trim().max(180, 'Limite de 180 caracteres.'),
    totalAmount: z
      .number()
      .positive('Informe um valor total maior que zero.')
      .max(999999.99, 'Use um valor menor que R$ 1.000.000,00.'),
    saleDate: z.string().min(1, 'Informe a data da venda.'),
    notes: z.string().trim().max(500, 'Limite de 500 caracteres.'),
    paymentMethod: z.enum([
      'CASH',
      'PIX',
      'CREDIT_CARD',
      'DEBIT_CARD',
      'BANK_TRANSFER',
      'OTHER',
    ]),
    paymentReference: z.string().trim().max(120, 'Limite de 120 caracteres.'),
    installmentCount: z
      .number()
      .int('Use numeros inteiros.')
      .min(1, 'Use ao menos uma parcela.')
      .max(36, 'Limite de 36 parcelas.'),
    firstDueDate: z.string().min(1, 'Informe o primeiro vencimento.'),
    installments: z
      .array(
        z.object({
          dueDate: z.string().min(1, 'Informe a data de vencimento.'),
        }),
      )
      .min(1, 'Adicione ao menos uma parcela.')
      .max(36, 'Limite de 36 parcelas.'),
  })
  .superRefine((values, context) => {
    if (values.installments.length !== values.installmentCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A quantidade de parcelas precisa bater com a grade de vencimentos.',
        path: ['installments'],
      });
    }

    values.installments.forEach((installment, index) => {
      if (installment.dueDate < values.saleDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O vencimento nao pode ser anterior a data da venda.',
          path: ['installments', index, 'dueDate'],
        });
      }

      const previousInstallment = values.installments[index - 1];

      if (previousInstallment && installment.dueDate <= previousInstallment.dueDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'As datas precisam estar em ordem crescente.',
          path: ['installments', index, 'dueDate'],
        });
      }
    });

    if (values.saleType === 'CASH') {
      if (values.installmentCount !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Venda a vista deve possuir exatamente uma parcela.',
          path: ['installmentCount'],
        });
      }

      if (values.firstDueDate !== values.saleDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Venda a vista deve vencer no mesmo dia da venda.',
          path: ['firstDueDate'],
        });
      }
    }
  });

type SaleFormData = z.infer<typeof saleSchema>;

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

const reopenInstallmentSchema = z.object({
  password: z.string().min(1, 'Digite sua senha para confirmar.'),
});

type ReopenInstallmentFormData = z.infer<typeof reopenInstallmentSchema>;

function getTodayInputValue() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function addMonths(dateValue: string, months: number) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function buildInstallmentSchedule(firstDueDate: string, installmentCount: number) {
  return Array.from({ length: installmentCount }, (_, index) => ({
    dueDate: addMonths(firstDueDate, index),
  }));
}

function createEmptyValues(): SaleFormData {
  const saleDate = getTodayInputValue();
  const firstDueDate = addMonths(saleDate, 1);

  return {
    saleType: 'INSTALLMENT',
    customerId: '',
    description: '',
    totalAmount: 0,
    saleDate,
    notes: '',
    paymentMethod: 'PIX',
    paymentReference: '',
    installmentCount: 3,
    firstDueDate,
    installments: buildInstallmentSchedule(firstDueDate, 3),
  };
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

function createEmptyReopenValues(): ReopenInstallmentFormData {
  return {
    password: '',
  };
}

function mapSalePayload(values: SaleFormData): CreateSaleInput {
  return {
    customerId: values.customerId,
    description: values.description.trim() || null,
    totalAmount: values.totalAmount,
    saleDate: values.saleDate,
    notes: values.notes.trim() || null,
    installments: values.installments.map((installment) => ({
      dueDate: installment.dueDate,
    })),
    ...(values.saleType === 'CASH'
      ? {
          payment: {
            method: values.paymentMethod,
            reference: values.paymentReference.trim() || null,
            notes: null,
          },
        }
      : {}),
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

function mapReopenInstallmentPayload(
  values: ReopenInstallmentFormData,
): ReopenInstallmentInput {
  return {
    password: values.password,
  };
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

function getSaleStatusTone(status: SaleStatus) {
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

function getSaleSurfaceTone(status: SaleStatus) {
  if (status === 'PAID') {
    return 'border-emerald-200 bg-emerald-50';
  }

  if (status === 'OVERDUE') {
    return 'border-rose-300 bg-rose-100';
  }

  return 'border-slate-200 bg-white';
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

  return 'bg-slate-200 text-slate-700';
}

function SaleListRow({
  sale,
  onSelect,
}: {
  sale: SaleListItem;
  onSelect: (saleId: string) => void;
}) {
  return (
    <article
      className={[
        'rounded-xl border px-4 py-4',
        getSaleSurfaceTone(sale.status),
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {sale.description || 'Venda sem descricao'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {sale.customer.name} - {formatDate(sale.saleDate)}
          </p>
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            getSaleStatusTone(sale.status),
          ].join(' ')}
        >
          {saleStatusLabels[sale.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Total
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(sale.totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Em aberto
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(sale.financial.remainingAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Parcelas pagas
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {sale.counts.paid}/{sale.installmentCount}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(sale.id)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Ver detalhes
        </button>
      </div>
    </article>
  );
}

function SaleDetailPanel({
  sale,
  onSelectInstallment,
}: {
  sale: SaleDetail;
  onSelectInstallment: (installmentId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          {sale.description || 'Venda sem descricao'}
        </h3>
        <p className="text-sm text-slate-500">
          {sale.customer.name} - {sale.customer.whatsappPhone}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total"
          value={formatCurrency(sale.totalAmount)}
          tone="default"
        />
        <MetricCard
          label="Recebido"
          value={formatCurrency(sale.financial.paidAmount)}
          tone="success"
        />
        <MetricCard
          label="Em aberto"
          value={formatCurrency(sale.financial.remainingAmount)}
          tone="warning"
        />
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-semibold text-slate-900">Parcelas da venda</h4>
        <p className="text-sm text-slate-500">
          Acompanhamento completo dos vencimentos, valores e saldos desta venda.
        </p>
      </div>

      <ScrollableContent size="md">
        <div className="space-y-3">
          {sale.installments.map((installment) => (
            <div
              key={installment.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Parcela {installment.number}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Vence em {formatDate(installment.dueDate)}
                  </p>
                </div>

                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                    getInstallmentStatusTone(installment.status),
                  ].join(' ')}
                >
                  {installmentStatusLabels[installment.status]}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Valor
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatCurrency(installment.amount)}
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
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Saldo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(installment.remainingAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectInstallment(installment.id)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  {installment.status === 'PAID' || installment.status === 'CANCELED'
                    ? 'Ver historico'
                    : 'Registrar pagamento'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollableContent>
    </div>
  );
}

function SalePaymentPanel({
  sale,
  selectedInstallmentId,
  paymentForm,
  reopenInstallmentForm,
  payments,
  isPaymentsLoading,
  isSubmittingPayment,
  paymentErrorMessage,
  isSubmittingReopen,
  isReopenConfirmationOpen,
  onSubmitPayment,
  onOpenReopenConfirmation,
  onCancelReopenConfirmation,
  onSubmitReopenInstallment,
  onResetPaymentForm,
  onBack,
}: {
  sale: SaleDetail;
  selectedInstallmentId: string;
  paymentForm: ReturnType<typeof useForm<PaymentFormData>>;
  reopenInstallmentForm: ReturnType<typeof useForm<ReopenInstallmentFormData>>;
  payments: PaymentListItem[];
  isPaymentsLoading: boolean;
  isSubmittingPayment: boolean;
  paymentErrorMessage: string | null;
  isSubmittingReopen: boolean;
  isReopenConfirmationOpen: boolean;
  onSubmitPayment: (values: PaymentFormData) => void;
  onOpenReopenConfirmation: () => void;
  onCancelReopenConfirmation: () => void;
  onSubmitReopenInstallment: (values: ReopenInstallmentFormData) => void;
  onResetPaymentForm: () => void;
  onBack: () => void;
}) {
  const selectedInstallment = sale.installments.find(
    (installment) => installment.id === selectedInstallmentId,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = paymentForm;
  const {
    register: registerReopenField,
    handleSubmit: handleReopenSubmit,
    formState: { errors: reopenErrors },
  } = reopenInstallmentForm;

  if (!selectedInstallment) {
    return <EmptyState tone="danger" message="Parcela selecionada nao encontrada." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            Pagamentos da parcela {selectedInstallment.number}
          </h3>
          <p className="text-sm text-slate-500">
            {sale.customer.name} - {sale.description || 'Venda sem descricao'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Voltar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Valor"
          value={formatCurrency(selectedInstallment.amount)}
          tone="default"
        />
        <MetricCard
          label="Ja pago"
          value={formatCurrency(selectedInstallment.paidAmount)}
          tone="success"
        />
        <MetricCard
          label="Saldo"
          value={formatCurrency(selectedInstallment.remainingAmount)}
          tone="warning"
        />
      </div>

      {selectedInstallment.status === 'PAID' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Reabrir parcela quitada
            </p>
            <p className="text-sm text-slate-600">
              Use essa acao quando precisar marcar esta parcela novamente como
              nao paga. O sistema vai pedir sua senha e recalcular o status da
              venda automaticamente.
            </p>
          </div>

          {!isReopenConfirmationOpen ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onOpenReopenConfirmation}
                className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Marcar como nao paga
              </button>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4 rounded-xl border border-amber-200 bg-white p-4"
              onSubmit={handleReopenSubmit(onSubmitReopenInstallment)}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Senha do usuario logado
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="Digite sua senha para confirmar"
                  {...registerReopenField('password')}
                />
                {reopenErrors.password ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {reopenErrors.password.message}
                  </span>
                ) : null}
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReopen}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingReopen ? 'Confirmando...' : 'Confirmar reabertura'}
                </button>

                <button
                  type="button"
                  onClick={onCancelReopenConfirmation}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {selectedInstallment.status !== 'PAID' &&
      selectedInstallment.status !== 'CANCELED' ? (
        <form
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
          onSubmit={handleSubmit(onSubmitPayment)}
        >
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
              rows={3}
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

          {paymentErrorMessage ? (
            <EmptyState tone="danger" message={paymentErrorMessage} />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingPayment ? 'Registrando...' : 'Registrar pagamento'}
            </button>

            <button
              type="button"
              onClick={onResetPaymentForm}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Usar saldo restante
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-900">Historico da parcela</p>
        {isPaymentsLoading ? (
          <EmptyState message="Carregando pagamentos..." />
        ) : payments.length === 0 ? (
          <EmptyState message="Ainda nao existe pagamento registrado para esta parcela." />
        ) : (
          <ScrollableContent size="sm">
            <div className="space-y-3">
              {payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {paymentMethodLabels[payment.method]}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(payment.paidAt)}</p>
                  </div>

                  {payment.reference ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Referencia: {payment.reference}
                    </p>
                  ) : null}

                  {payment.notes ? (
                    <p className="mt-2 text-sm text-slate-500">{payment.notes}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </ScrollableContent>
        )}
      </div>
    </div>
  );
}

export function SalesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all');
  const [customerFilterId, setCustomerFilterId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(
    null,
  );
  const [saleDetailView, setSaleDetailView] = useState<'overview' | 'payment'>(
    'overview',
  );
  const [isReopenConfirmationOpen, setIsReopenConfirmationOpen] =
    useState(false);
  const [saleModalMode, setSaleModalMode] = useState<'create' | 'detail' | null>(
    null,
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: createEmptyValues(),
  });
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: createEmptyPaymentValues(),
  });
  const reopenInstallmentForm = useForm<ReopenInstallmentFormData>({
    resolver: zodResolver(reopenInstallmentSchema),
    defaultValues: createEmptyReopenValues(),
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'installments',
  });

  const installmentCount = useWatch({
    control,
    name: 'installmentCount',
  });
  const saleType = useWatch({
    control,
    name: 'saleType',
  });
  const firstDueDate = useWatch({
    control,
    name: 'firstDueDate',
  });
  const saleDate = useWatch({
    control,
    name: 'saleDate',
  });

  useEffect(() => {
    if (saleType === 'CASH') {
      const normalizedSaleDate = saleDate || getTodayInputValue();

      if (installmentCount !== 1) {
        setValue('installmentCount', 1);
      }

      if (firstDueDate !== normalizedSaleDate) {
        setValue('firstDueDate', normalizedSaleDate);
      }

      replace([{ dueDate: normalizedSaleDate }]);
      return;
    }

    const safeInstallmentCount =
      Number.isFinite(installmentCount) && installmentCount > 0
        ? Math.min(36, Math.max(1, installmentCount))
        : 1;
    const baseDueDate = firstDueDate || addMonths(getTodayInputValue(), 1);

    replace(buildInstallmentSchedule(baseDueDate, safeInstallmentCount));
  }, [firstDueDate, installmentCount, replace, saleDate, saleType, setValue]);

  const customersQuery = useQuery({
    queryKey: ['customers', 'active-sales'],
    queryFn: () => getCustomers({ isActive: true }),
  });
  const customersFilterQuery = useQuery({
    queryKey: ['customers', 'sales-filter'],
    queryFn: () => getCustomers({}),
  });

  const salesQuery = useQuery({
    queryKey: ['sales', deferredSearch, statusFilter, customerFilterId],
    queryFn: () =>
      getSales({
        search: deferredSearch.trim() || undefined,
        customerId: customerFilterId || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const saleDetailQuery = useQuery({
    queryKey: ['sales', 'detail', selectedSaleId],
    queryFn: () => getSaleById(selectedSaleId!),
    enabled: saleModalMode === 'detail' && Boolean(selectedSaleId),
  });
  const paymentsQuery = useQuery({
    queryKey: ['payments', 'sale-detail', selectedInstallmentId],
    queryFn: () =>
      getPayments({
        installmentId: selectedInstallmentId || undefined,
      }),
    enabled:
      saleModalMode === 'detail' &&
      saleDetailView === 'payment' &&
      Boolean(selectedInstallmentId),
  });

  useEffect(() => {
    if (!saleDetailQuery.data) {
      paymentForm.reset(createEmptyPaymentValues());
      return;
    }

    const nextSelectedInstallment =
      saleDetailQuery.data.installments.find(
        (installment) => installment.id === selectedInstallmentId,
      ) ?? null;

    if (!nextSelectedInstallment) {
      paymentForm.reset(createEmptyPaymentValues());
      return;
    }

    paymentForm.reset(
      createEmptyPaymentValues(nextSelectedInstallment.remainingAmount),
    );
  }, [paymentForm, saleDetailQuery.data, selectedInstallmentId]);

  useEffect(() => {
    if (!saleDetailQuery.data || !selectedInstallmentId) {
      return;
    }

    const nextSelectedInstallment =
      saleDetailQuery.data.installments.find(
        (installment) => installment.id === selectedInstallmentId,
      ) ?? null;

    if (!nextSelectedInstallment || nextSelectedInstallment.status !== 'PAID') {
      reopenInstallmentForm.reset(createEmptyReopenValues());
    }
  }, [reopenInstallmentForm, saleDetailQuery.data, selectedInstallmentId]);

  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({ queryKey: ['installments'] });
      reset(createEmptyValues());
      setSelectedSaleId(null);
      setSaleModalMode(null);
    },
  });
  const registerPaymentMutation = useMutation({
    mutationFn: (values: PaymentFormData) =>
      registerPayment(selectedInstallmentId!, mapPaymentPayload(values)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['installments'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({
          queryKey: ['sales', 'detail', selectedSaleId],
        }),
      ]);
    },
  });
  const reopenInstallmentMutation = useMutation({
    mutationFn: (values: ReopenInstallmentFormData) =>
      reopenInstallment(
        selectedInstallmentId!,
        mapReopenInstallmentPayload(values),
      ),
    onMutate: () => {
      reopenInstallmentForm.clearErrors();
    },
    onSuccess: async () => {
      setIsReopenConfirmationOpen(false);
      reopenInstallmentForm.reset(createEmptyReopenValues());

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['installments'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({
          queryKey: ['sales', 'detail', selectedSaleId],
        }),
      ]);
    },
    onError: (error) => {
      reopenInstallmentForm.setError('password', {
        type: 'server',
        message: getApiErrorMessage(
          error,
          'Nao foi possivel confirmar a senha para reabrir a parcela.',
        ),
      });
    },
  });

  const sales = salesQuery.data ?? [];
  const openBalance = sales.reduce(
    (total, sale) => total + sale.financial.remainingAmount,
    0,
  );
  const activeInstallments = sales.reduce(
    (total, sale) =>
      total + sale.counts.pending + sale.counts.partiallyPaid + sale.counts.overdue,
    0,
  );
  const overdueInstallments = sales.reduce(
    (total, sale) => total + sale.counts.overdue,
    0,
  );

  const onSubmit = (values: SaleFormData) => {
    createMutation.mutate(mapSalePayload(values));
  };
  const onSubmitPayment = (values: PaymentFormData) => {
    registerPaymentMutation.mutate(values);
  };
  const onSubmitReopenInstallment = (values: ReopenInstallmentFormData) => {
    reopenInstallmentMutation.mutate(values);
  };
  const openSaleDetail = (saleId: string) => {
    startTransition(() => {
      setSelectedSaleId(saleId);
      setSelectedInstallmentId(null);
      setSaleDetailView('overview');
      setIsReopenConfirmationOpen(false);
      registerPaymentMutation.reset();
      reopenInstallmentMutation.reset();
      reopenInstallmentForm.reset(createEmptyReopenValues());
      setSaleModalMode('detail');
    });
  };
  const openInstallmentPayment = (installmentId: string) => {
    startTransition(() => {
      setSelectedInstallmentId(installmentId);
      setSaleDetailView('payment');
      setIsReopenConfirmationOpen(false);
      registerPaymentMutation.reset();
      reopenInstallmentMutation.reset();
      reopenInstallmentForm.reset(createEmptyReopenValues());
    });
  };
  const returnToSaleOverview = () => {
    startTransition(() => {
      setSaleDetailView('overview');
      setSelectedInstallmentId(null);
      setIsReopenConfirmationOpen(false);
      registerPaymentMutation.reset();
      reopenInstallmentMutation.reset();
      reopenInstallmentForm.reset(createEmptyReopenValues());
    });
  };
  const closeSaleDetailModal = () => {
    setSaleModalMode(null);
    setSelectedSaleId(null);
    setSelectedInstallmentId(null);
    setSaleDetailView('overview');
    setIsReopenConfirmationOpen(false);
    registerPaymentMutation.reset();
    reopenInstallmentMutation.reset();
    reopenInstallmentForm.reset(createEmptyReopenValues());
  };
  const isPaymentDetailView =
    saleDetailView === 'payment' && Boolean(selectedInstallmentId);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Registre vendas, filtre por cliente e acompanhe parcelas e pagamentos no detalhe de cada venda."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Em aberto"
          value={formatCurrency(openBalance)}
          tone="warning"
        />
        <MetricCard
          label="Parcelas ativas"
          value={String(activeInstallments)}
          tone="info"
        />
        <MetricCard
          label="Parcelas vencidas"
          value={String(overdueInstallments)}
          tone="danger"
        />
      </div>

      <SectionCard
        title="Lista de vendas"
        description={`${sales.length} venda(s) encontrada(s)`}
        action={
          <button
            type="button"
            onClick={() => {
              reset(createEmptyValues());
              setSelectedSaleId(null);
              setSelectedInstallmentId(null);
              setSaleModalMode('create');
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Nova venda
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, descricao ou WhatsApp"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | SaleStatus)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            {saleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
              ))}
            </select>

          <select
            value={customerFilterId}
            onChange={(event) => setCustomerFilterId(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="">Todos os clientes</option>
            {(customersFilterQuery.data ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <ScrollableContent size="lg" className="mt-5">
          <div className="space-y-3">
            {salesQuery.isLoading ? <EmptyState message="Carregando vendas..." /> : null}

            {salesQuery.isError ? (
              <EmptyState tone="danger" message="Nao foi possivel carregar as vendas." />
            ) : null}

            {!salesQuery.isLoading && sales.length === 0 ? (
              <EmptyState message="Nenhuma venda encontrada com os filtros atuais." />
            ) : null}

            {sales.map((sale) => (
              <SaleListRow
                key={sale.id}
                sale={sale}
                onSelect={openSaleDetail}
              />
            ))}
          </div>
        </ScrollableContent>
      </SectionCard>

      <Modal
        isOpen={saleModalMode === 'create'}
        onClose={() => {
          setSaleModalMode(null);
          setSelectedSaleId(null);
          setSelectedInstallmentId(null);
          reset(createEmptyValues());
        }}
        title="Nova venda"
        description="Preencha os dados e confirme as parcelas."
        size="lg"
      >
        <div className="max-w-3xl">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de venda
                </span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  {...register('saleType')}
                >
                  {saleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Cliente
                </span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  {...register('customerId')}
                >
                  <option value="">Selecione um cliente ativo</option>
                  {(customersQuery.data ?? []).map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.customerId.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Descricao da venda
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="Ex.: Notebook parcelado"
                  {...register('description')}
                />
                {errors.description ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.description.message}
                  </span>
                ) : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Valor total
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    placeholder="0,00"
                    {...register('totalAmount', { valueAsNumber: true })}
                  />
                  {errors.totalAmount ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.totalAmount.message}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Data da venda
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    {...register('saleDate')}
                  />
                  {errors.saleDate ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.saleDate.message}
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    {saleType === 'CASH' ? 'Data do pagamento' : 'Primeiro vencimento'}
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    {...register('firstDueDate')}
                  />
                  {errors.firstDueDate ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.firstDueDate.message}
                    </span>
                  ) : null}
                </label>

                {saleType === 'INSTALLMENT' ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Quantidade de parcelas
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                      {...register('installmentCount', { valueAsNumber: true })}
                    />
                    {errors.installmentCount ? (
                      <span className="mt-2 block text-sm text-rose-600">
                        {errors.installmentCount.message}
                      </span>
                    ) : null}
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Forma de pagamento
                    </span>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                      {...register('paymentMethod')}
                    >
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {saleType === 'CASH' ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Referencia do pagamento
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                      placeholder="Ex.: PIX-123 ou recibo"
                      {...register('paymentReference')}
                    />
                    {errors.paymentReference ? (
                      <span className="mt-2 block text-sm text-rose-600">
                        {errors.paymentReference.message}
                      </span>
                    ) : null}
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    A venda a vista cria 1 parcela com vencimento no mesmo dia da venda
                    e registra o pagamento automaticamente.
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">Parcelas</p>
                    <span className="text-sm text-slate-500">
                      {fields.length} item(ns)
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {fields.map((field, index) => (
                      <label
                        key={field.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-4"
                      >
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Parcela {index + 1}
                        </span>
                        <input
                          type="date"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                          {...register(`installments.${index}.dueDate` as const)}
                        />
                        {errors.installments?.[index]?.dueDate ? (
                          <span className="mt-2 block text-sm text-rose-600">
                            {errors.installments[index]?.dueDate?.message}
                          </span>
                        ) : null}
                      </label>
                    ))}
                  </div>

                  {errors.installments && !Array.isArray(errors.installments) ? (
                    <span className="mt-3 block text-sm text-rose-600">
                      {errors.installments.message}
                    </span>
                  ) : null}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Observacoes
                </span>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="Observacoes da venda"
                  {...register('notes')}
                />
                {errors.notes ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.notes.message}
                  </span>
                ) : null}
              </label>

              {createMutation.isError ? (
                <EmptyState
                  tone="danger"
                  message="Nao foi possivel salvar a venda. Revise cliente, valor e vencimentos."
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Salvando...' : 'Criar venda'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSaleModalMode(null);
                    setSelectedSaleId(null);
                    setSelectedInstallmentId(null);
                    reset(createEmptyValues());
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={saleModalMode === 'detail'}
        onClose={closeSaleDetailModal}
        title={isPaymentDetailView ? 'Pagamento da parcela' : 'Detalhe da venda'}
        description={
          isPaymentDetailView
            ? 'Registre o pagamento desta parcela ou reabra-a com confirmacao de senha.'
            : 'Resumo financeiro e parcelas da venda.'
        }
        size="lg"
      >
        {saleDetailQuery.isLoading ? (
          <EmptyState message="Carregando detalhe da venda..." />
        ) : saleDetailQuery.isError || !saleDetailQuery.data ? (
          <EmptyState tone="danger" message="Nao foi possivel carregar o detalhe da venda." />
        ) : isPaymentDetailView && selectedInstallmentId ? (
          <SalePaymentPanel
            sale={saleDetailQuery.data}
            selectedInstallmentId={selectedInstallmentId}
            paymentForm={paymentForm}
            reopenInstallmentForm={reopenInstallmentForm}
            payments={paymentsQuery.data ?? []}
            isPaymentsLoading={paymentsQuery.isLoading}
            isSubmittingPayment={registerPaymentMutation.isPending}
            paymentErrorMessage={
              registerPaymentMutation.isError
                ? getApiErrorMessage(
                    registerPaymentMutation.error,
                    'Nao foi possivel registrar o pagamento. Revise o valor, a data e o saldo da parcela.',
                  )
                : null
            }
            isSubmittingReopen={reopenInstallmentMutation.isPending}
            isReopenConfirmationOpen={isReopenConfirmationOpen}
            onSubmitPayment={onSubmitPayment}
            onOpenReopenConfirmation={() => {
              setIsReopenConfirmationOpen(true);
              reopenInstallmentForm.reset(createEmptyReopenValues());
              reopenInstallmentMutation.reset();
            }}
            onCancelReopenConfirmation={() => {
              setIsReopenConfirmationOpen(false);
              reopenInstallmentForm.reset(createEmptyReopenValues());
              reopenInstallmentMutation.reset();
            }}
            onSubmitReopenInstallment={onSubmitReopenInstallment}
            onResetPaymentForm={() => {
              const selectedInstallment =
                saleDetailQuery.data.installments.find(
                  (installment) => installment.id === selectedInstallmentId,
                ) ?? null;

              paymentForm.reset(
                createEmptyPaymentValues(
                  selectedInstallment?.remainingAmount ?? 0,
                ),
              );
            }}
            onBack={returnToSaleOverview}
          />
        ) : (
          <SaleDetailPanel
            sale={saleDetailQuery.data}
            onSelectInstallment={openInstallmentPayment}
          />
        )}
      </Modal>
    </section>
  );
}
