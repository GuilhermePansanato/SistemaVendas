# MVP do Sistema de Vendas

## Objetivo

Entregar uma primeira versao utilizavel do sistema com foco em:

- cadastro de clientes
- registro de vendas parceladas
- acompanhamento de parcelas
- registro de pagamentos
- visao financeira simples
- lembretes automaticos de cobranca por WhatsApp

## Escopo do MVP

### Autenticacao

- login com `JWT`
- senha com `bcrypt`
- protecao de rotas no frontend e backend

### Clientes

- cadastrar cliente
- editar cliente
- listar clientes
- visualizar historico de vendas do cliente

Campos minimos:

- nome
- telefone
- WhatsApp
- documento opcional
- e-mail opcional
- observacoes opcionais

### Vendas

- criar venda vinculada a um cliente
- informar valor total
- informar quantidade de parcelas
- gerar parcelas automaticamente
- permitir descricao e observacoes da venda

### Parcelas

- visualizar parcelas por venda
- listar parcelas por status
- filtrar por cliente, vencimento e situacao
- acompanhar saldo pago e saldo pendente

Status do MVP:

- `PENDING`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`

### Pagamentos

- registrar pagamento por parcela
- salvar data do pagamento
- salvar valor pago
- salvar forma de pagamento
- permitir pagamento parcial

### Dashboard

- total em aberto
- total vencido
- total recebido
- proximas parcelas a vencer

### Cobranca por WhatsApp

- enviar lembrete automatico em `D-3`
- enviar lembrete automatico em `D0`
- registrar cada mensagem enviada
- permitir reprocessamento controlado sem duplicar lembrete

## Fora do MVP

- estoque
- catalogo de produtos
- multiplos usuarios com niveis avancados de permissao
- renegociacao de divida
- relatorios avancados
- integracao com gateway de pagamento

## Regras de Negocio

1. Toda venda pertence a um cliente.
2. Toda venda deve gerar pelo menos uma parcela.
3. O valor total da venda deve ser igual a soma das parcelas.
4. Uma parcela pode receber varios pagamentos.
5. O status da parcela depende do saldo pendente e da data de vencimento.
6. Uma parcela e `PAID` quando o saldo pendente for zero.
7. Uma parcela e `OVERDUE` quando a data de vencimento passar e ainda existir saldo pendente.
8. O sistema deve impedir envio duplicado do mesmo lembrete para a mesma parcela e mesma janela de disparo.
9. Toda mensagem de WhatsApp enviada deve ficar registrada com vinculo a parcela e ao cliente.

## Ordem Recomendada de Implementacao

1. Base do projeto e autenticacao.
2. Cadastro de clientes.
3. Vendas e geracao de parcelas.
4. Pagamentos e atualizacao de status.
5. Dashboard financeiro.
6. Filas com BullMQ e Redis.
7. Integracao com WhatsApp Cloud API.
