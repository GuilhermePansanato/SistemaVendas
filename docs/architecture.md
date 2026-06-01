# Arquitetura Inicial

## Visao Geral

O projeto sera organizado como um monorepo simples com frontend e backend separados:

```text
SistemaVendas/
  apps/
    api/
    web/
  docs/
```

## Backend

Stack:

- NestJS
- Prisma
- PostgreSQL
- JWT
- bcrypt
- BullMQ
- Redis
- `whatsapp-web.js` no MVP

Estrategia:

- monolito modular
- Clean Architecture por modulo
- principios SOLID
- regras de negocio concentradas em `domain` e `application`

Estrutura proposta:

```text
apps/api/
  prisma/
    schema.prisma
  src/
    modules/
      auth/
      customers/
      sales/
      installments/
      payments/
      reminders/
      whatsapp/
      dashboard/
    shared/
      domain/
      application/
      infrastructure/
      presentation/
```

Estrutura interna recomendada para cada modulo:

```text
module-name/
  domain/
    entities/
    value-objects/
    repositories/
    services/
  application/
    dto/
    use-cases/
  infrastructure/
    prisma/
    repositories/
    gateways/
    queues/
  presentation/
    controllers/
    http/
```

Regras arquiteturais:

1. `domain` nao depende de NestJS, Prisma, Redis ou HTTP.
2. `application` orquestra casos de uso e usa portas.
3. `infrastructure` implementa repositorios e integracoes externas.
4. `presentation` expoe controllers, rotas e contratos HTTP.
5. Controllers devem ser finos.
6. Entidades e servicos de dominio devem conter regras que nao dependem de framework.

## Frontend

Stack:

- React
- TypeScript
- Vite
- TailwindCSS
- Axios
- TanStack Query
- React Hook Form
- Zod
- React Router

Estrutura proposta:

```text
apps/web/
  src/
    app/
    pages/
    features/
      auth/
      customers/
      sales/
      installments/
      payments/
      dashboard/
      reminders/
    shared/
      components/
      hooks/
      lib/
      services/
      types/
```

Diretrizes:

1. Separar componentes de pagina e componentes reutilizaveis.
2. Centralizar chamadas HTTP em `shared/services`.
3. Validar formularios com `React Hook Form` e `Zod`.
4. Usar `TanStack Query` para leitura, cache e invalidacao.
5. Organizar o estado por feature, evitando acoplamento global desnecessario.

## Fluxo de Cobranca

1. Uma venda e criada para um cliente.
2. O sistema gera as parcelas.
3. Jobs agendados verificam parcelas que entram nas janelas `D-3` e `D0`.
4. O modulo de lembretes cria um registro de envio.
5. O modulo de WhatsApp dispara a mensagem.
6. O resultado do envio e persistido para auditoria e acompanhamento.
7. Se a conexao estiver indisponivel, o envio e bloqueado e o sistema registra o alerta operacional.

## Convencoes Iniciais

- valores monetarios devem ser persistidos com `Decimal`
- datas de vencimento e pagamento devem ser armazenadas em `DateTime`
- regras de status devem ser centralizadas no dominio
- integracoes externas devem ser acessadas por portas e adapters
- logs de envio nao devem ser apagados
- o modulo `reminders` deve depender de uma porta de envio, nao da biblioteca `whatsapp-web.js` diretamente
