const paymentMethods = [
  'PIX',
  'Dinheiro',
  'Cartao de debito',
  'Cartao de credito',
  'Transferencia',
];

export function PaymentsPage() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <article className="rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Pagamentos
        </p>
        <h3 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-2xl font-semibold text-slate-900">
          O MVP ja considera pagamento parcial, o que evita remendos no dominio.
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          Cada pagamento fica no historico, recalcula o saldo da parcela e
          permite uma visao financeira mais realista do caixa.
        </p>
      </article>

      <article className="rounded-[28px] bg-[linear-gradient(135deg,_#1f2937_0%,_#0f172a_100%)] p-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
          Formas iniciais
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {paymentMethods.map((method) => (
            <span
              key={method}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100"
            >
              {method}
            </span>
          ))}
        </div>
      </article>
    </section>
  );
}
