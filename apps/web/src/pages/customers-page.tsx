import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  createCustomer,
  getCustomers,
  updateCustomer,
} from '../features/customers/services/customers-service';
import type { Customer, CustomerFormInput } from '../features/customers/types/customer';
import {
  EmptyState,
  Modal,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';

const customerSchema = z.object({
  name: z.string().trim().min(3, 'Informe ao menos 3 caracteres.'),
  phone: z.string().trim().min(8, 'Informe um telefone valido.'),
  whatsappPhone: z.string().trim().min(8, 'Informe um WhatsApp valido.'),
  document: z.string().trim().optional().nullable(),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail valido.')
    .optional()
    .or(z.literal(''))
    .nullable(),
  notes: z.string().trim().max(500, 'Limite de 500 caracteres.').optional().nullable(),
  isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const emptyValues: CustomerFormData = {
  name: '',
  phone: '',
  whatsappPhone: '',
  document: '',
  email: '',
  notes: '',
  isActive: true,
};

function toCustomerPayload(values: CustomerFormData): CustomerFormInput {
  return {
    name: values.name,
    phone: values.phone,
    whatsappPhone: values.whatsappPhone,
    document: values.document?.trim() ? values.document.trim() : null,
    email: values.email?.trim() ? values.email.trim() : null,
    notes: values.notes?.trim() ? values.notes.trim() : null,
    isActive: values.isActive,
  };
}

function toFormValues(customer: Customer): CustomerFormData {
  return {
    name: customer.name,
    phone: customer.phone,
    whatsappPhone: customer.whatsappPhone,
    document: customer.document ?? '',
    email: customer.email ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive,
  };
}

function CustomerRow({
  customer,
  onSelect,
}: {
  customer: Customer;
  onSelect: (customer: Customer) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {customer.email ?? 'Sem e-mail'} - {customer.whatsappPhone}
          </p>
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
            customer.isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600',
          ].join(' ')}
        >
          {customer.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(customer)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'active',
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyValues,
  });

  const customerQuery = useQuery({
    queryKey: ['customers', deferredSearch, statusFilter],
    queryFn: () =>
      getCustomers({
        search: deferredSearch.trim() || undefined,
        isActive:
          statusFilter === 'all' ? undefined : statusFilter === 'active',
      }),
  });

  useEffect(() => {
    if (!selectedCustomer) {
      reset(emptyValues);
      return;
    }

    reset(toFormValues(selectedCustomer));
  }, [reset, selectedCustomer]);

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      reset(emptyValues);
      setSelectedCustomer(null);
      setIsCustomerModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CustomerFormInput) =>
      updateCustomer(selectedCustomer!.id, values),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(customer);
      reset(toFormValues(customer));
      setIsCustomerModalOpen(false);
    },
  });

  const onSubmit = (values: CustomerFormData) => {
    const payload = toCustomerPayload(values);

    if (selectedCustomer) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const mutationError = createMutation.isError || updateMutation.isError;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const customers = customerQuery.data ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastre, pesquise e mantenha os dados atualizados."
      />

      <SectionCard
        title="Lista de clientes"
        description={`${customers.length} cliente(s) encontrado(s)`}
        action={
          <button
            type="button"
            onClick={() => {
              setSelectedCustomer(null);
              reset(emptyValues);
              setIsCustomerModalOpen(true);
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Novo cliente
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou documento"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          >
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="all">Todos</option>
          </select>
        </div>

        <ScrollableContent size="lg" className="mt-5">
          <div className="space-y-3">
            {customerQuery.isLoading ? (
              <EmptyState message="Carregando clientes..." />
            ) : null}

            {customerQuery.isError ? (
              <EmptyState tone="danger" message="Nao foi possivel carregar os clientes." />
            ) : null}

            {!customerQuery.isLoading && customers.length === 0 ? (
              <EmptyState message="Nenhum cliente encontrado com os filtros atuais." />
            ) : null}

            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onSelect={(value) => {
                  setSelectedCustomer(value);
                  setIsCustomerModalOpen(true);
                }}
              />
            ))}
          </div>
        </ScrollableContent>
      </SectionCard>

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
          reset(emptyValues);
        }}
        title={selectedCustomer ? 'Editar cliente' : 'Novo cliente'}
        description="Dados basicos para venda e cobranca."
        size="md"
      >
        <div className="max-w-2xl">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nome completo
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                placeholder="Ex.: Maria Ferreira"
                {...register('name')}
              />
              {errors.name ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="(11) 99999-0000"
                  {...register('phone')}
                />
                {errors.phone ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.phone.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  WhatsApp
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="(11) 99999-0000"
                  {...register('whatsappPhone')}
                />
                {errors.whatsappPhone ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.whatsappPhone.message}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Documento
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="CPF ou CNPJ"
                  {...register('document')}
                />
                {errors.document ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.document.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  placeholder="cliente@email.com"
                  {...register('email')}
                />
                {errors.email ? (
                  <span className="mt-2 block text-sm text-rose-600">
                    {errors.email.message}
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
                placeholder="Observacoes sobre o cliente"
                {...register('notes')}
              />
              {errors.notes ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {errors.notes.message}
                </span>
              ) : null}
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
              Cliente ativo para vendas e cobrancas
            </label>

            {mutationError ? (
              <EmptyState
                tone="danger"
                message="Nao foi possivel salvar o cliente. Verifique os dados e tente novamente."
              />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? 'Salvando...'
                  : selectedCustomer
                    ? 'Salvar alteracoes'
                    : 'Cadastrar cliente'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setSelectedCustomer(null);
                  reset(emptyValues);
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </section>
  );
}
