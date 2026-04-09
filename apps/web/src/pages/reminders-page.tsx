const reminderMoments = [
  { code: 'D-3', note: 'Lembrete preventivo alguns dias antes do vencimento.' },
  { code: 'D0', note: 'Mensagem no proprio dia do vencimento.' },
];

export function RemindersPage() {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        Cobrancas por WhatsApp
      </p>
      <h3 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-2xl font-semibold text-slate-900">
        Automacao com historico de disparo, rastreabilidade e protecao contra
        duplicidade.
      </h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reminderMoments.map((reminder) => (
          <article
            key={reminder.code}
            className="rounded-2xl bg-[linear-gradient(135deg,_#fff2ed_0%,_#ffe1d6_100%)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Janela
            </p>
            <p className="mt-2 text-3xl font-semibold text-orange-600">
              {reminder.code}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {reminder.note}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
