import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  createPlatformCompany,
  getPlatformCompanies,
  resetPlatformCompanyUserPassword,
  updatePlatformCompanyModules,
  updatePlatformCompanyStatus,
} from '../features/platform-companies/services/platform-companies-service';
import type { PlatformCompany } from '../features/platform-companies/types/platform-company';
import { getPlatformModules } from '../features/platform-modules/services/platform-modules-service';
import type { PlatformModule } from '../features/platform-modules/types/platform-module';
import {
  EmptyState,
  Modal,
  PageHeader,
  ScrollableContent,
  SectionCard,
} from '../shared/components/page-ui';
import { formatDate } from '../shared/lib/formatters';

const companySchema = z.object({
  name: z.string().min(2, 'Informe o nome da empresa.'),
  slug: z.string().optional(),
  adminName: z.string().min(2, 'Informe o nome do usuario administrador.'),
  adminEmail: z.email('Informe um e-mail valido.'),
  adminPassword: z
    .string()
    .min(8, 'A senha inicial precisa ter pelo menos 8 caracteres.'),
  moduleKeys: z.array(z.string()).min(1, 'Selecione pelo menos um modulo.'),
});

const moduleSelectionSchema = z.object({
  moduleKeys: z.array(z.string()).min(1, 'Selecione pelo menos um modulo.'),
});

const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'A nova senha precisa ter pelo menos 8 caracteres.'),
    confirmPassword: z
      .string()
      .min(8, 'A confirmacao precisa ter pelo menos 8 caracteres.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'A confirmacao da senha precisa ser igual a nova senha.',
    path: ['confirmPassword'],
  });

type CompanyFormData = z.infer<typeof companySchema>;
type ModuleSelectionFormData = z.infer<typeof moduleSelectionSchema>;
type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

function toggleSelection(currentValues: string[], value: string) {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  return [...currentValues, value];
}

function getModuleTone(moduleKey: string) {
  if (moduleKey === 'REMINDERS') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (moduleKey === 'SALES') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (moduleKey === 'CUSTOMERS') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function getCompanyErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message =
      typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message.join(' ')
          : null;

    if (message) {
      return message;
    }
  }

  return fallback;
}

function ModuleCheckboxField({
  modules,
  value,
  onChange,
}: {
  modules: PlatformModule[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {modules.map((module) => {
        const isChecked = value.includes(module.key);

        return (
          <label
            key={module.key}
            className={[
              'flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition',
              isChecked
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300',
            ].join(' ')}
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(toggleSelection(value, module.key))}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-900">
                {module.name}
              </span>
            </span>
            {module.description ? (
              <span className="mt-2 text-sm text-slate-500">
                {module.description}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

export function PlatformCompaniesPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<PlatformCompany | null>(
    null,
  );
  const [statusCompany, setStatusCompany] = useState<PlatformCompany | null>(null);
  const [passwordCompany, setPasswordCompany] = useState<PlatformCompany | null>(
    null,
  );

  const companiesQuery = useQuery({
    queryKey: ['platform-companies'],
    queryFn: getPlatformCompanies,
  });

  const modulesQuery = useQuery({
    queryKey: ['platform-modules'],
    queryFn: getPlatformModules,
  });

  const availableModules = modulesQuery.data ?? [];

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      slug: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      moduleKeys: [],
    },
  });

  const moduleSelectionForm = useForm<ModuleSelectionFormData>({
    resolver: zodResolver(moduleSelectionSchema),
    defaultValues: {
      moduleKeys: [],
    },
  });

  const passwordResetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!editingCompany) {
      return;
    }

    moduleSelectionForm.reset({
      moduleKeys: editingCompany.modules,
    });
  }, [editingCompany, moduleSelectionForm]);

  useEffect(() => {
    if (!passwordCompany) {
      return;
    }

    passwordResetForm.reset({
      newPassword: '',
      confirmPassword: '',
    });
  }, [passwordCompany, passwordResetForm]);

  const createCompanyMutation = useMutation({
    mutationFn: createPlatformCompany,
    onSuccess: () => {
      setIsCreateModalOpen(false);
      companyForm.reset({
        name: '',
        slug: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        moduleKeys: [],
      });
      void queryClient.invalidateQueries({
        queryKey: ['platform-companies'],
      });
    },
  });

  const updateModulesMutation = useMutation({
    mutationFn: (input: { companyId: string; moduleKeys: string[] }) =>
      updatePlatformCompanyModules(input.companyId, {
        moduleKeys: input.moduleKeys,
      }),
    onSuccess: () => {
      setEditingCompany(null);
      void queryClient.invalidateQueries({
        queryKey: ['platform-companies'],
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (input: { companyId: string; isActive: boolean }) =>
      updatePlatformCompanyStatus(input.companyId, {
        isActive: input.isActive,
      }),
    onSuccess: () => {
      setStatusCompany(null);
      void queryClient.invalidateQueries({
        queryKey: ['platform-companies'],
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (input: {
      companyId: string;
      userId: string;
      newPassword: string;
    }) =>
      resetPlatformCompanyUserPassword(input.companyId, input.userId, {
        newPassword: input.newPassword,
      }),
    onSuccess: () => {
      setPasswordCompany(null);
      passwordResetForm.reset({
        newPassword: '',
        confirmPassword: '',
      });
    },
  });

  const activeModulesCount = useMemo(
    () =>
      (companiesQuery.data ?? []).reduce(
        (total, company) => total + company.modules.length,
        0,
      ),
    [companiesQuery.data],
  );

  const companies = companiesQuery.data ?? [];

  const submitCreateCompany = (values: CompanyFormData) => {
    createCompanyMutation.mutate({
      name: values.name.trim(),
      slug: values.slug?.trim() ? values.slug.trim().toLowerCase() : undefined,
      adminName: values.adminName.trim(),
      adminEmail: values.adminEmail.trim().toLowerCase(),
      adminPassword: values.adminPassword,
      moduleKeys: values.moduleKeys,
    });
  };

  const submitModuleSelection = (values: ModuleSelectionFormData) => {
    if (!editingCompany) {
      return;
    }

    updateModulesMutation.mutate({
      companyId: editingCompany.id,
      moduleKeys: values.moduleKeys,
    });
  };

  const submitCompanyStatus = () => {
    if (!statusCompany) {
      return;
    }

    updateStatusMutation.mutate({
      companyId: statusCompany.id,
      isActive: !statusCompany.isActive,
    });
  };

  const submitPasswordReset = (values: PasswordResetFormData) => {
    const adminUser = passwordCompany?.adminUsers[0];

    if (!passwordCompany || !adminUser) {
      return;
    }

    resetPasswordMutation.mutate({
      companyId: passwordCompany.id,
      userId: adminUser.id,
      newPassword: values.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Crie contas de empresas, defina o usuario inicial e escolha os modulos contratados."
        action={
          <button
            type="button"
            disabled={modulesQuery.isLoading || modulesQuery.isError}
            onClick={() => {
              createCompanyMutation.reset();
              companyForm.reset({
                name: '',
                slug: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
                moduleKeys: [],
              });
              setIsCreateModalOpen(true);
            }}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Nova empresa
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard className="md:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Empresas
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {companies.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Modulos ativos
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {activeModulesCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Catalogo
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {availableModules.length}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Modulos disponiveis"
          description="Esses modulos podem ser contratados pelas empresas."
        >
          <ScrollableContent size="sm" className="space-y-3">
            {availableModules.map((module) => (
              <div
                key={module.key}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {module.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {module.description ?? 'Sem descricao cadastrada.'}
                </p>
              </div>
            ))}
          </ScrollableContent>
        </SectionCard>
      </div>

      <SectionCard
        title="Empresas cadastradas"
        description="Acompanhe os acessos criados e ajuste os modulos contratados."
      >
        {companiesQuery.isLoading ? (
          <EmptyState message="Carregando empresas..." />
        ) : companiesQuery.isError ? (
          <EmptyState
            tone="danger"
            message="Nao foi possivel carregar as empresas da plataforma."
          />
        ) : companies.length === 0 ? (
          <EmptyState message="Nenhuma empresa cadastrada ate o momento." />
        ) : (
          <ScrollableContent size="lg" className="space-y-4">
            {companies.map((company) => (
              <article
                key={company.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {company.name}
                        </h3>
                        <span
                          className={[
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            company.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
                          {company.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Slug: {company.slug}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p>
                        Admin principal:{' '}
                        <span className="font-medium text-slate-900">
                          {company.adminUsers[0]?.name ?? 'Nao definido'}
                        </span>
                      </p>
                      <p>
                        E-mail:{' '}
                        <span className="font-medium text-slate-900">
                          {company.adminUsers[0]?.email ?? 'Nao definido'}
                        </span>
                      </p>
                      <p>
                        Criada em:{' '}
                        <span className="font-medium text-slate-900">
                          {formatDate(company.createdAt)}
                        </span>
                      </p>
                      <p>
                        Atualizada em:{' '}
                        <span className="font-medium text-slate-900">
                          {formatDate(company.updatedAt)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {company.modules.map((moduleKey) => (
                        <span
                          key={moduleKey}
                          className={[
                            'rounded-full border px-3 py-1 text-xs font-semibold',
                            getModuleTone(moduleKey),
                          ].join(' ')}
                        >
                          {moduleKey}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        updateModulesMutation.reset();
                        setEditingCompany(company);
                      }}
                      disabled={modulesQuery.isLoading || modulesQuery.isError}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Editar modulos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetPasswordMutation.reset();
                        setPasswordCompany(company);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      Mudar senha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateStatusMutation.reset();
                        setStatusCompany(company);
                      }}
                      className={[
                        'rounded-xl px-4 py-3 text-sm font-semibold transition',
                        company.isActive
                          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                      ].join(' ')}
                    >
                      {company.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </ScrollableContent>
        )}
      </SectionCard>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova empresa"
        description="Defina os dados iniciais da empresa, o usuario administrador e os modulos contratados."
        size="lg"
      >
        <form
          className="space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={companyForm.handleSubmit(submitCreateCompany)}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nome da empresa
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                {...companyForm.register('name')}
              />
              {companyForm.formState.errors.name ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {companyForm.formState.errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Slug da empresa
              </span>
              <input
                type="text"
                placeholder="opcional"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                {...companyForm.register('slug')}
              />
              {companyForm.formState.errors.slug ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {companyForm.formState.errors.slug.message}
                </span>
              ) : (
                <span className="mt-2 block text-xs text-slate-500">
                  Se deixar vazio, o sistema gera automaticamente.
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nome do admin
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                {...companyForm.register('adminName')}
              />
              {companyForm.formState.errors.adminName ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {companyForm.formState.errors.adminName.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                E-mail do admin
              </span>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                {...companyForm.register('adminEmail')}
              />
              {companyForm.formState.errors.adminEmail ? (
                <span className="mt-2 block text-sm text-rose-600">
                  {companyForm.formState.errors.adminEmail.message}
                </span>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Senha inicial
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...companyForm.register('adminPassword')}
            />
            {companyForm.formState.errors.adminPassword ? (
              <span className="mt-2 block text-sm text-rose-600">
                {companyForm.formState.errors.adminPassword.message}
              </span>
            ) : null}
          </label>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Modulos contratados
              </p>
              <p className="text-sm text-slate-500">
                Escolha os modulos que vao aparecer para a empresa.
              </p>
            </div>

            <Controller
              control={companyForm.control}
              name="moduleKeys"
              render={({ field }) => (
                <ModuleCheckboxField
                  modules={availableModules}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {companyForm.formState.errors.moduleKeys ? (
              <span className="block text-sm text-rose-600">
                {companyForm.formState.errors.moduleKeys.message}
              </span>
            ) : null}
          </div>

          {createCompanyMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getCompanyErrorMessage(
                createCompanyMutation.error,
                'Nao foi possivel criar a empresa.',
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createCompanyMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createCompanyMutation.isPending ? 'Salvando...' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingCompany)}
        onClose={() => setEditingCompany(null)}
        title={editingCompany ? `Modulos de ${editingCompany.name}` : 'Editar modulos'}
        description="Ative ou desative os modulos contratados pela empresa."
        size="lg"
      >
        <form
          className="space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={moduleSelectionForm.handleSubmit(submitModuleSelection)}
        >
          <Controller
            control={moduleSelectionForm.control}
            name="moduleKeys"
            render={({ field }) => (
              <ModuleCheckboxField
                modules={availableModules}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {moduleSelectionForm.formState.errors.moduleKeys ? (
            <span className="block text-sm text-rose-600">
              {moduleSelectionForm.formState.errors.moduleKeys.message}
            </span>
          ) : null}

          {updateModulesMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getCompanyErrorMessage(
                updateModulesMutation.error,
                'Nao foi possivel atualizar os modulos da empresa.',
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setEditingCompany(null)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateModulesMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateModulesMutation.isPending
                ? 'Atualizando...'
                : 'Salvar modulos'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(statusCompany)}
        onClose={() => setStatusCompany(null)}
        title={
          statusCompany?.isActive
            ? `Desativar ${statusCompany.name}`
            : `Ativar ${statusCompany?.name ?? 'empresa'}`
        }
        description={
          statusCompany?.isActive
            ? 'A empresa vai deixar de acessar o sistema ate ser reativada novamente.'
            : 'A empresa voltara a ter acesso ao sistema com os modulos contratados.'
        }
        size="md"
      >
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            {statusCompany?.isActive
              ? 'Novos logins vao ser bloqueados e a empresa sera desconectada na proxima validacao de sessao.'
              : 'Depois da reativacao, os usuarios da empresa poderao entrar novamente com as credenciais atuais.'}
          </div>

          {updateStatusMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getCompanyErrorMessage(
                updateStatusMutation.error,
                'Nao foi possivel atualizar o status da empresa.',
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setStatusCompany(null)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitCompanyStatus}
              disabled={updateStatusMutation.isPending}
              className={[
                'rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                statusCompany?.isActive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700',
              ].join(' ')}
            >
              {updateStatusMutation.isPending
                ? 'Atualizando...'
                : statusCompany?.isActive
                  ? 'Desativar empresa'
                  : 'Ativar empresa'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(passwordCompany)}
        onClose={() => setPasswordCompany(null)}
        title={
          passwordCompany
            ? `Nova senha para ${passwordCompany.name}`
            : 'Redefinir senha'
        }
        description="Defina uma nova senha para o usuario administrador principal da empresa."
        size="md"
      >
        <form
          className="space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={passwordResetForm.handleSubmit(submitPasswordReset)}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <p>
              Admin principal:{' '}
              <span className="font-medium text-slate-900">
                {passwordCompany?.adminUsers[0]?.name ?? 'Nao definido'}
              </span>
            </p>
            <p className="mt-1">
              E-mail:{' '}
              <span className="font-medium text-slate-900">
                {passwordCompany?.adminUsers[0]?.email ?? 'Nao definido'}
              </span>
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Nova senha
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...passwordResetForm.register('newPassword')}
            />
            {passwordResetForm.formState.errors.newPassword ? (
              <span className="mt-2 block text-sm text-rose-600">
                {passwordResetForm.formState.errors.newPassword.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Confirmar nova senha
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...passwordResetForm.register('confirmPassword')}
            />
            {passwordResetForm.formState.errors.confirmPassword ? (
              <span className="mt-2 block text-sm text-rose-600">
                {passwordResetForm.formState.errors.confirmPassword.message}
              </span>
            ) : null}
          </label>

          {resetPasswordMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getCompanyErrorMessage(
                resetPasswordMutation.error,
                'Nao foi possivel atualizar a senha do usuario.',
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setPasswordCompany(null)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetPasswordMutation.isPending
                ? 'Atualizando...'
                : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
