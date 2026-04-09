const customerFields = [
  'Nome completo',
  'Telefone e WhatsApp',
  'Documento',
  'Observacoes de relacionamento',
];

export function CustomersPage() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <article className="rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Modulo de clientes
        </p>
        <h3 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-2xl font-semibold text-slate-900">
          O cadastro precisa ser simples para a loja e confiavel para a cobranca.
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          O foco aqui e registrar quem compra, como entrar em contato e qual o
          historico financeiro dessa pessoa no sistema.
        </p>
      </article>

      <article className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)]">
        <p className="text-xs uppercase tracking-[0.24em] text-orange-200">
          Campos iniciais
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-200">
          {customerFields.map((field) => (
            <li key={field} className="rounded-2xl bg-white/10 px-4 py-3">
              {field}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
