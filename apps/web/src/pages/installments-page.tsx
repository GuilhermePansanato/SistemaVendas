import { useQuery } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { getCustomers } from '../features/customers/services/customers-service';
import {
  getInstallmentById,
  getInstallments,
} from '../features/installments/services/installments-service';
import type {
  InstallmentDetail,
  InstallmentListItem,
} from '../features/installments/types/installment';
import {
  EmptyState,
  MetricCard,
  Modal,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatCurrency, formatDate } from '../shared/lib/formatters';
import type { InstallmentStatus } from '../shared/types/finance';

const installmentStatusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'OVERDUE', label: 'Vencidas' },
  { value: 'PAID', label: 'Quitadas' },
] as const;

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

function InstallmentRow({
  installment,
  onSelect,
}: {
  installment: InstallmentListItem;
  onSelect: (installmentId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {installment.customer.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Parcela {installment.number} -{' '}
            {installment.sale.description || 'Venda sem descricao'}
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
            Vencimento
          </p>
          <p className="mt-1 text-sm text-slate-900">{formatDate(installment.dueDate)}</p>
        </div>
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
          onClick={() => onSelect(installment.id)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Ver detalhes
        </button>
      </div>
    </article>
  );
}

function InstallmentDetailPanel({
  installment,
}: {
  installment: InstallmentDetail;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">
          {installment.customer.name}
        </h3>
        <p className="text-sm text-slate-500">
          {installment.sale.description || 'Venda sem descricao'}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            getInstallmentStatusTone(installment.status),
          ].join(' ')}
        >
          {installment.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Parcela"
          value={`${installment.number}/${installment.sale.installmentCount}`}
          tone="info"
        />
        <MetricCard
          label="Vencimento"
          value={formatDate(installment.dueDate)}
          tone="default"
        />
        <MetricCard
          label="Saldo"
          value={formatCurrency(installment.remainingAmount)}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Valor da parcela
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(installment.amount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Valor pago
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(installment.paidAmount)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Observacoes
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {installment.saleNotes || 'Nenhuma observacao registrada nesta venda.'}
        </p>
      </div>
    </div>
  );
}

export function InstallmentsPage() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | InstallmentStatus>('all');
  const [customerId, setCustomerId] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(
    null,
  );

  const customersQuery = useQuery({
    queryKey: ['customers', 'installments-filter'],
    queryFn: () => getCustomers({}),
  });

  const installmentsQuery = useQuery({
    queryKey: [
      'installments',
      deferredSearch,
      statusFilter,
      customerId,
      dueFrom,
      dueTo,
    ],
    queryFn: () =>
      getInstallments({
        search: deferredSearch.trim() || undefined,
        customerId: customerId || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        dueFrom: dueFrom || undefined,
        dueTo: dueTo || undefined,
      }),
  });

  const installmentDetailQuery = useQuery({
    queryKey: ['installments', 'detail', selectedInstallmentId],
    queryFn: () => getInstallmentById(selectedInstallmentId!),
    enabled: Boolean(selectedInstallmentId),
  });

  const installments = installmentsQuery.data ?? [];
  const openAmount = installments.reduce((total, installment) => {
    if (installment.status === 'PAID' || installment.status === 'CANCELED') {
      return total;
    }

    return total + installment.remainingAmount;
  }, 0);
  const overdueAmount = installments.reduce((total, installment) => {
    if (installment.status !== 'OVERDUE') {
      return total;
    }

    return total + installment.remainingAmount;
  }, 0);
  const paidCount = installments.filter(
    (installment) => installment.status === 'PAID',
  ).length;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Parcelas"
        description="Consulte vencimentos, saldos e situacao de cobranca."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Em aberto" value={formatCurrency(openAmount)} tone="warning" />
        <MetricCard label="Vencidas" value={formatCurrency(overdueAmount)} tone="danger" />
        <MetricCard label="Quitadas" value={String(paidCount)} tone="success" />
      </div>

      <SectionCard
        title="Lista de parcelas"
        description={`${installments.length} parcela(s) encontrada(s)`}
        action={
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setCustomerId('');
              setDueFrom('');
              setDueTo('');
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Limpar filtros
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
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

          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="">Todos os clientes</option>
            {(customersQuery.data ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={dueFrom}
              onChange={(event) => setDueFrom(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
            <input
              type="date"
              value={dueTo}
              onChange={(event) => setDueTo(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </div>
        </div>

        <ScrollableContent size="lg" className="mt-5">
          <div className="space-y-3">
            {installmentsQuery.isLoading ? (
              <EmptyState message="Carregando parcelas..." />
            ) : null}

            {installmentsQuery.isError ? (
              <EmptyState tone="danger" message="Nao foi possivel carregar as parcelas." />
            ) : null}

            {!installmentsQuery.isLoading && installments.length === 0 ? (
              <EmptyState message="Nenhuma parcela encontrada com os filtros atuais." />
            ) : null}

            {installments.map((installment) => (
              <InstallmentRow
                key={installment.id}
                installment={installment}
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

      <Modal
        isOpen={Boolean(selectedInstallmentId)}
        onClose={() => setSelectedInstallmentId(null)}
        title="Detalhe da parcela"
        description="Informacoes financeiras e contexto da venda."
        size="md"
      >
        {selectedInstallmentId ? (
          installmentDetailQuery.isLoading ? (
            <EmptyState message="Carregando detalhe da parcela..." />
          ) : installmentDetailQuery.isError || !installmentDetailQuery.data ? (
            <EmptyState tone="danger" message="Nao foi possivel carregar o detalhe da parcela." />
          ) : (
            <InstallmentDetailPanel installment={installmentDetailQuery.data} />
          )
        ) : null}
      </Modal>
    </section>
  );
}
