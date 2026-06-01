# WhatsApp Web + Cobrancas

## Objetivo

Integrar `whatsapp-web.js` ao sistema para:

- conectar uma conta de WhatsApp via QR code
- acompanhar o status da conexao dentro da aplicacao
- disparar lembretes `D-3` e `D0`
- registrar todas as tentativas e envios
- avisar no sistema quando houver cobranca para enviar e o WhatsApp estiver desconectado

## Estrategia

### Fase 1 - Fundacao

- modelar `WhatsAppConnection` e `WhatsAppConnectionEvent`
- enriquecer `ReminderMessage` com metadados de tentativa e motivo de falha
- expor `GET /api/whatsapp/connection` para a tela de cobrancas

### Fase 2 - Conexao

- instalar e configurar `whatsapp-web.js`
- persistir sessao com `LocalAuth`
- tratar eventos `qr`, `authenticated`, `ready`, `disconnected` e `auth_failure`
- salvar o estado da conexao no banco

### Fase 3 - Processamento

- criar worker com `BullMQ`
- montar job de varredura das parcelas elegiveis em `D-3` e `D0`
- montar job de envio da mensagem
- bloquear envio quando a conexao estiver `DISCONNECTED` ou `AUTH_FAILURE`

### Fase 4 - Experiencia no sistema

- evoluir a tela `Cobrancas`
- mostrar status da conexao
- mostrar QR code
- mostrar ultimo erro
- mostrar falhas por desconexao
- mostrar historico de mensagens

## Modelagem inicial

### `WhatsAppConnection`

- uma conexao principal por loja/sistema
- status operacional da sessao do WhatsApp
- dados para diagnostico e reconexao

Campos principais:

- `clientKey`
- `provider`
- `status`
- `displayName`
- `phoneNumber`
- `qrCode`
- `sessionPath`
- `lastConnectedAt`
- `lastDisconnectedAt`
- `lastQrGeneratedAt`
- `lastError`

### `WhatsAppConnectionEvent`

- trilha de auditoria da sessao
- guarda eventos importantes do ciclo de vida da conexao

Eventos iniciais:

- `QR_GENERATED`
- `AUTHENTICATED`
- `READY`
- `DISCONNECTED`
- `AUTH_FAILURE`
- `SEND_BLOCKED`

### `ReminderMessage`

Campos novos para acompanhar execucao:

- `whatsappConnectionId`
- `attemptedAt`
- `retryCount`
- `failureReason`

Motivos de falha previstos:

- `WHATSAPP_DISCONNECTED`
- `AUTH_FAILURE`
- `DELIVERY_ERROR`
- `UNKNOWN`

## Responsabilidades por modulo

### `whatsapp`

- gerenciar sessao do `whatsapp-web.js`
- fornecer status da conexao
- gerar QR code
- enviar mensagem sob comando de outro modulo
- registrar eventos operacionais

### `reminders`

- decidir quais parcelas entram em `D-3` e `D0`
- montar o texto da cobranca
- controlar idempotencia
- criar jobs
- persistir tentativas, envios e falhas

## Contratos HTTP planejados

### WhatsApp

- `GET /api/whatsapp/connection`
- `POST /api/whatsapp/connection/connect`
- `POST /api/whatsapp/connection/disconnect`
- `GET /api/whatsapp/connection/qr`
- `POST /api/whatsapp/test-message`

### Cobrancas

- `GET /api/reminders`
- `GET /api/reminders/summary`
- `POST /api/reminders/process`
- `POST /api/reminders/:id/retry`

## Regras importantes

1. O sistema nao tenta enviar cobranca automaticamente se a conexao estiver indisponivel.
2. Toda falha de envio precisa ser auditavel.
3. O frontend deve mostrar claramente quando existem lembretes bloqueados por desconexao.
4. O modulo `reminders` nao conhece `whatsapp-web.js` diretamente; ele conversa por porta/adapter.
5. A integracao deve poder ser trocada por `WhatsApp Cloud API` no futuro sem reescrever as regras de negocio.
