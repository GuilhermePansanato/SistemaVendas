# SistemaVendas

Sistema web para loja com foco em controle de clientes, vendas parceladas, pagamentos, acompanhamento financeiro e lembretes de cobranca por WhatsApp.

Este projeto tem dois objetivos principais:

- demonstrar meus conhecimentos de frontend com uma aplicacao organizada, profissional e bem apresentada
- aprender backend de forma mais estruturada, trabalhando regras de negocio, arquitetura limpa, integracoes e persistencia

O desenvolvimento tambem conta com apoio do Codex como assistente de engenharia para planejamento, organizacao da arquitetura, scaffold inicial, validacoes e iteracoes tecnicas durante a construcao do sistema.

## Proposta do projeto

O sistema foi pensado para uso real e tambem como projeto de portfolio.

A ideia e permitir:

- cadastro de clientes
- registro de vendas para cada cliente
- geracao e acompanhamento de parcelas
- registro de pagamentos parciais ou totais
- visao financeira simples do que esta em aberto, vencido e pago
- envio automatico de lembretes por WhatsApp antes e no dia do vencimento
- historico de mensagens enviadas por parcela

## Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Axios
- TanStack Query
- React Hook Form
- Zod
- React Router

### Backend

- NestJS
- Prisma
- PostgreSQL
- JWT
- bcrypt

### Integracoes e automacoes

- WhatsApp Cloud API
- BullMQ
- Redis

## Arquitetura

O projeto esta organizado como monorepo com frontend e backend separados:

```text
SistemaVendas/
  apps/
    api/
    web/
  docs/
```

### Backend

O backend segue a ideia de monolito modular com Clean Architecture e principios SOLID.

Modulos planejados:

- auth
- customers
- sales
- installments
- payments
- reminders
- whatsapp
- dashboard

Direcao arquitetural:

- `domain` para regras de negocio
- `application` para casos de uso
- `infrastructure` para Prisma, Redis e integracoes externas
- `presentation` para controllers e contratos HTTP

### Frontend

O frontend esta organizado por feature para facilitar crescimento, manutencao e demonstracao tecnica:

- `auth`
- `customers`
- `sales`
- `installments`
- `payments`
- `dashboard`
- `reminders`

## O que ja existe no projeto

Hoje a base inicial ja foi criada e validada.

### Estrutura criada

- monorepo com `npm workspaces`
- frontend scaffoldado com Vite + React + TypeScript
- backend scaffoldado com NestJS
- configuracao de `docker-compose` para PostgreSQL e Redis
- arquivos `.env.example` para frontend e backend
- documentacao inicial do MVP e da arquitetura

### Frontend pronto

- React Router configurado
- TanStack Query configurado
- TailwindCSS integrado ao Vite
- layout inicial com visual de dashboard
- paginas base para:
  - dashboard
  - clientes
  - vendas
  - parcelas
  - pagamentos
  - cobrancas
  - login

### Backend pronto

- NestJS configurado
- `ConfigModule` global
- `ValidationPipe` global
- `PrismaService` configurado
- `schema.prisma` inicial com entidades principais
- modulos base criados para os dominios do sistema
- endpoint inicial de status da API

### Modelagem inicial

O schema inicial do Prisma ja contempla:

- `User`
- `Customer`
- `Sale`
- `Installment`
- `Payment`
- `ReminderRule`
- `ReminderMessage`

Tambem ja foram definidos enums e status para:

- vendas
- parcelas
- formas de pagamento
- status de lembretes
- tipos de disparo de cobranca

## MVP definido

O MVP inicial contempla:

- autenticacao com JWT
- cadastro de clientes
- cadastro de vendas
- geracao automatica de parcelas
- registro de pagamentos
- dashboard financeiro simples
- lembretes automaticos de cobranca em `D-3` e `D0`
- historico de mensagens enviadas

Fora do MVP por enquanto:

- estoque
- catalogo de produtos
- relatorios avancados
- renegociacao de divida
- gateway de pagamento

## Regras de negocio iniciais

- toda venda pertence a um cliente
- toda venda gera ao menos uma parcela
- o valor total da venda deve bater com a soma das parcelas
- uma parcela pode receber varios pagamentos
- pagamento parcial e permitido
- uma parcela vira `PAID` quando o saldo pendente chega a zero
- uma parcela vira `OVERDUE` quando passa do vencimento e ainda existe saldo
- o sistema deve evitar envio duplicado do mesmo lembrete para a mesma parcela
- toda mensagem de WhatsApp enviada deve ser registrada

## Documentacao atual

- [MVP](./docs/mvp.md)
- [Arquitetura](./docs/architecture.md)

## Como rodar o projeto

### Requisitos

- Node.js 20+
- npm 10+
- Docker e Docker Compose

Observacao:

- o frontend buildou com sucesso nesta base, mas o Vite atual recomenda Node `20.19+`

### Instalar dependencias

```bash
npm install
```

### Subir banco e Redis

```bash
docker compose up -d
```

### Backend

1. Criar o arquivo de ambiente a partir de `apps/api/.env.example`
2. Gerar o client do Prisma:

```bash
npm run prisma:generate
```

3. Iniciar a API:

```bash
npm run dev:api
```

### Frontend

1. Criar o arquivo de ambiente a partir de `apps/web/.env.example`
2. Iniciar a aplicacao:

```bash
npm run dev:web
```

## Scripts uteis

```bash
npm run dev:web
npm run dev:api
npm run build:web
npm run build:api
npm run lint:web
npm run lint:api
npm run prisma:generate
npm run prisma:migrate
```

## Status atual

Neste momento o projeto esta na fase de base estrutural:

- arquitetura definida
- stack definida
- scaffold inicial pronto
- modelagem inicial pronta
- frontend e backend preparados para comecar a implementacao dos modulos reais

## Proximos passos

Ordem recomendada de implementacao:

1. autenticacao
2. clientes
3. vendas e geracao de parcelas
4. pagamentos e atualizacao de status
5. dashboard financeiro
6. filas com BullMQ e Redis
7. integracao com WhatsApp Cloud API

## Uso do Codex no projeto

O Codex esta sendo usado como apoio tecnico no desenvolvimento para:

- organizar o planejamento do projeto
- estruturar o monorepo
- desenhar a arquitetura inicial
- modelar entidades e regras de negocio
- configurar frontend e backend
- validar builds, lint e base tecnica
- acelerar iteracoes sem perder clareza arquitetural

Mesmo com apoio do Codex, o objetivo do projeto continua sendo demonstrar minhas decisoes, meu raciocinio de produto e meu crescimento tecnico principalmente em frontend e no aprendizado de backend.
