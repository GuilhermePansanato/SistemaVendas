import { useQuery } from '@tanstack/react-query';
import { startTransition, useState } from 'react';
import {
  getDashboardSummary,
  type DashboardSummaryFilters,
} from '../features/dashboard/services/dashboard-service';
import type {
  DashboardInstallmentPreview,
  DashboardPaymentPreview,
  DashboardSaleStatusBreakdown,
} from '../features/dashboard/types/dashboard';
import {
  EmptyState,
  MetricCard,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatCurrency, formatDate } from '../shared/lib/formatters';
import type { InstallmentStatus, PaymentMethod } from '../shared/types/finance';

type DashboardRangePreset =
  | 'last-30-days'
  | 'current-month'
  | 'current-year'
  | 'custom';

type DashboardDateRange = Required<DashboardSummaryFilters>;

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartao de credito',
  DEBIT_CARD: 'Cartao de debito',
  BANK_TRANSFER: 'Transferencia',
  OTHER: 'Outro',
};

const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendente',
  PARTIALLY_PAID: 'Parcial',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
  CANCELED: 'Cancelado',
};

const rangePresetOptions: Array<{
  value: Exclude<DashboardRangePreset, 'custom'>;
  label: string;
}> = [
  { value: 'last-30-days', label: 'Ultimos 30 dias' },
  { value: 'current-month', label: 'Mes atual' },
  { value: 'current-year', label: 'Ano atual' },
];

function toInputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function subtractDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() - days);
  return nextDate;
}

function getLast30DaysRange(): DashboardDateRange {
  const today = new Date();

  return {
    from: toInputDate(subtractDays(today, 29)),
    to: toInputDate(today),
  };
}

function getCurrentMonthRange(): DashboardDateRange {
  const today = new Date();

  return {
    from: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
}

function getCurrentYearRange(): DashboardDateRange {
  const today = new Date();

  return {
    from: toInputDate(new Date(today.getFullYear(), 0, 1)),
    to: toInputDate(new Date(today.getFullYear(), 11, 31)),
  };
}

function getPresetRange(
  preset: Exclude<DashboardRangePreset, 'custom'>,
): DashboardDateRange {
  if (preset === 'current-month') {
    return getCurrentMonthRange();
  }

  if (preset === 'current-year') {
    return getCurrentYearRange();
  }

  return getLast30DaysRange();
}

function formatInputDateLabel(value: string) {
  if (!value) {
    return '--/--/----';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
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

function InstallmentRow({ item }: { item: DashboardInstallmentPreview }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.customerName}</p>
          <p className="mt-1 text-sm text-slate-500">
            Parcela {item.installmentNumber} - {item.saleDescription || 'Venda sem descricao'}
          </p>
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            getInstallmentStatusTone(item.status),
          ].join(' ')}
        >
          {installmentStatusLabels[item.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Vencimento
          </p>
          <p className="mt-1 text-sm text-slate-900">{formatDate(item.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Saldo
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatCurrency(item.remainingAmount)}
          </p>
        </div>
      </div>
    </article>
  );
}

function RecentPaymentRow({ payment }: { payment: DashboardPaymentPreview }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(payment.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {payment.customerName} - {paymentMethodLabels[payment.method]}
          </p>
        </div>
        <p className="text-sm text-slate-500">{formatDate(payment.paidAt)}</p>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {payment.saleDescription || 'Venda sem descricao'}
      </p>
    </article>
  );
}

function SaleStatusGrid({
  breakdown,
}: {
  breakdown: DashboardSaleStatusBreakdown;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard label="Abertas" value={String(breakdown.open)} tone="info" />
      <MetricCard
        label="Parciais"
        value={String(breakdown.partiallyPaid)}
        tone="warning"
      />
      <MetricCard label="Quitadas" value={String(breakdown.paid)} tone="success" />
      <MetricCard label="Em atraso" value={String(breakdown.overdue)} tone="danger" />
    </div>
  );
}

export function DashboardPage() {
  const defaultRange = getLast30DaysRange();
  const [rangePreset, setRangePreset] = useState<DashboardRangePreset>(
    'last-30-days',
  );
  const [range, setRange] = useState<DashboardDateRange>(defaultRange);
  const isRangeIncomplete = !range.from || !range.to;
  const isRangeInvalid = !isRangeIncomplete && range.from > range.to;
  const selectedRangeLabel = `${formatInputDateLabel(range.from)} a ${formatInputDateLabel(range.to)}`;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'summary', range.from, range.to],
    queryFn: () =>
      getDashboardSummary({
        from: range.from,
        to: range.to,
      }),
    enabled: !isRangeIncomplete && !isRangeInvalid,
  });

  const applyRangePreset = (
    preset: Exclude<DashboardRangePreset, 'custom'>,
  ) => {
    const nextRange = getPresetRange(preset);

    startTransition(() => {
      setRangePreset(preset);
      setRange(nextRange);
    });
  };

  const updateRangeField = (
    field: keyof DashboardDateRange,
    value: string,
  ) => {
    startTransition(() => {
      setRangePreset('custom');
      setRange((currentRange) => ({
        ...currentRange,
        [field]: value,
      }));
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          dashboardQuery.data
            ? `Periodo de ${selectedRangeLabel}. A carteira atual continua refletindo os valores reais do sistema. Atualizado em ${formatDate(dashboardQuery.data.generatedAt)}.`
            : `Periodo de ${selectedRangeLabel}.`
        }
      />

      <SectionCard
        title="Periodo"
        description="Use os atalhos ou ajuste as datas manualmente para atualizar o resumo."
      >
        <div className="flex flex-wrap gap-3">
          {rangePresetOptions.map((option) => {
            const isActive = rangePreset === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => applyRangePreset(option.value)}
                className={[
                  'rounded-xl border px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Data inicial
            </span>
            <input
              type="date"
              value={range.from}
              onChange={(event) => updateRangeField('from', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Data final
            </span>
            <input
              type="date"
              value={range.to}
              onChange={(event) => updateRangeField('to', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </label>
        </div>

        {isRangeIncomplete ? (
          <div className="mt-4">
            <EmptyState
              tone="warning"
              message="Preencha a data inicial e a data final para carregar o dashboard."
            />
          </div>
        ) : null}

        {isRangeInvalid ? (
          <div className="mt-4">
            <EmptyState
              tone="danger"
              message="A data inicial precisa ser anterior ou igual a data final."
            />
          </div>
        ) : null}
      </SectionCard>

      {isRangeIncomplete || isRangeInvalid ? null : dashboardQuery.isLoading ? (
        <EmptyState message="Carregando resumo do dashboard..." />
      ) : dashboardQuery.isError || !dashboardQuery.data ? (
        <EmptyState
          tone="danger"
          message="Nao foi possivel carregar o dashboard financeiro neste momento."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Em aberto"
              value={formatCurrency(dashboardQuery.data.totals.openAmount)}
              tone="warning"
              helper="Carteira atual"
            />
            <MetricCard
              label="Vencidas"
              value={formatCurrency(dashboardQuery.data.totals.overdueAmount)}
              tone="danger"
              helper="Carteira atual"
            />
            <MetricCard
              label="Recebido no periodo"
              value={formatCurrency(dashboardQuery.data.totals.receivedInRange)}
              tone="success"
            />
            <MetricCard
              label="Clientes ativos"
              value={`${dashboardQuery.data.totals.activeCustomers}/${dashboardQuery.data.totals.totalCustomers}`}
              helper="Ativos / total"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Vendas no periodo"
              value={String(dashboardQuery.data.totals.salesInRange)}
              tone="info"
            />
            <MetricCard
              label="Parcelas em aberto"
              value={String(dashboardQuery.data.totals.openInstallments)}
              tone="info"
            />
            <MetricCard
              label="Parcelas quitadas"
              value={String(dashboardQuery.data.totals.paidInstallments)}
              tone="success"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
            <SectionCard
              title={`Proximos ${dashboardQuery.data.upcomingWindowDays} dias`}
              description="Parcelas da carteira atual com vencimento mais proximo."
            >
              <ScrollableContent size="md">
                <div className="space-y-3">
                  {dashboardQuery.data.upcomingInstallments.length === 0 ? (
                    <EmptyState message="Nenhuma parcela prevista para o curto prazo." />
                  ) : (
                    dashboardQuery.data.upcomingInstallments.map((item) => (
                      <InstallmentRow key={item.installmentId} item={item} />
                    ))
                  )}
                </div>
              </ScrollableContent>
            </SectionCard>

            <SectionCard
              title="Status das vendas"
              description="Distribuicao atual da carteira de vendas."
            >
              <SaleStatusGrid breakdown={dashboardQuery.data.saleStatusBreakdown} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Parcelas em atraso"
              description="Itens em atraso da carteira atual."
            >
              <ScrollableContent size="md">
                <div className="space-y-3">
                  {dashboardQuery.data.overdueInstallments.length === 0 ? (
                    <EmptyState
                      message="Nenhuma parcela vencida no momento."
                      tone="success"
                    />
                  ) : (
                    dashboardQuery.data.overdueInstallments.map((item) => (
                      <InstallmentRow key={item.installmentId} item={item} />
                    ))
                  )}
                </div>
              </ScrollableContent>
            </SectionCard>

            <SectionCard
              title="Pagamentos recentes"
              description="Ultimos recebimentos registrados dentro do periodo."
            >
              <ScrollableContent size="md">
                <div className="space-y-3">
                  {dashboardQuery.data.recentPayments.length === 0 ? (
                    <EmptyState message="Nenhum pagamento encontrado no periodo selecionado." />
                  ) : (
                    dashboardQuery.data.recentPayments.map((payment) => (
                      <RecentPaymentRow key={payment.paymentId} payment={payment} />
                    ))
                  )}
                </div>
              </ScrollableContent>
            </SectionCard>
          </div>
        </>
      )}
    </section>
  );
}
