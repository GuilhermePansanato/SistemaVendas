const saleSteps = [
  'Selecionar o cliente.',
  'Informar valor total e quantidade de parcelas.',
  'Definir datas de vencimento.',
  'Persistir a venda e gerar parcelas automaticamente.',
];

export function SalesPage() {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        Modulo de vendas
      </p>
      <h3 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-2xl font-semibold text-slate-900">
        Cada venda vira a origem de todo o fluxo financeiro.
      </h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {saleSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl bg-[linear-gradient(135deg,_#eef9f6_0%,_#d9f3eb_100%)] px-4 py-5 text-sm text-slate-800"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-teal-700">
              Etapa {index + 1}
            </p>
            <p className="mt-2 leading-6">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
