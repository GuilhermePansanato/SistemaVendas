import { EmptyState, PageHeader, SectionCard } from '../shared/components/page-ui';

export function NoModulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modulos indisponiveis"
        description="Esta conta nao possui modulos ativos no momento."
      />

      <SectionCard
        title="Acesso aguardando liberacao"
        description="Quando a empresa contratar um modulo, ele vai aparecer automaticamente no menu lateral."
      >
        <EmptyState
          tone="warning"
          message="Nenhum modulo esta ativo para esta empresa. Entre em contato com a administracao da plataforma para liberar o acesso."
        />
      </SectionCard>
    </div>
  );
}
