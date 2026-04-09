const summaryCards = [
  { label: 'Em aberto', value: 'R$ 12.480,00', tone: 'text-amber-600' },
  { label: 'Vencidas', value: 'R$ 3.180,00', tone: 'text-rose-600' },
  { label: 'Recebido no mes', value: 'R$ 8.940,00', tone: 'text-emerald-600' },
];

const nextActions = [
  'Cadastrar clientes e validar telefones para WhatsApp.',
  'Criar venda com parcelamento automatico e datas de vencimento.',
  'Registrar pagamentos e recalcular status das parcelas.',
  'Agendar lembretes em D-3 e D0 com BullMQ.',
];

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <article className="rounded-[28px] bg-[linear-gradient(135deg,_#fff7ec_0%,_#ffe1cf_100%)] p-6 shadow-[0_18px_50px_rgba(204,97,61,0.14)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Panorama
          </p>
          <h3 className="mt-3 max-w-2xl font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-3xl font-semibold text-slate-900">
            A base ja nasceu orientada ao problema certo: operacao diaria,
            cobranca organizada e visibilidade de caixa.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
            O frontend esta pronto para evoluir por feature, enquanto o backend
            foi desenhado para manter regra de negocio no dominio e integracoes
            nas bordas.
          </p>
        </article>

        <article className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.24)]">
          <p className="text-xs uppercase tracking-[0.28em] text-teal-200">
            Fluxo principal
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
            <li>1. Cliente cadastrado com WhatsApp validado.</li>
            <li>2. Venda gera parcelas e agenda lembretes.</li>
            <li>3. Pagamentos atualizam saldo e status.</li>
            <li>4. Dashboard concentra aberto, vencido e quitado.</li>
          </ol>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_16px_40px_rgba(72,52,35,0.08)]"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {card.label}
            </p>
            <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Roadmap imediato
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {nextActions.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-100 px-4 py-4 text-sm text-slate-700"
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                {index + 1}
              </span>
              {item}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
