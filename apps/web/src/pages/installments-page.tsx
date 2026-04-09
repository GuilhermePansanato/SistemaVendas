const statuses = [
  { name: 'PENDING', description: 'Parcela criada e ainda dentro do prazo.' },
  {
    name: 'PARTIALLY_PAID',
    description: 'Parcela com pagamento parcial e saldo remanescente.',
  },
  { name: 'PAID', description: 'Saldo liquidado integralmente.' },
  { name: 'OVERDUE', description: 'Prazo vencido com valor ainda em aberto.' },
];

export function InstallmentsPage() {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(72,52,35,0.08)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        Modulo de parcelas
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {statuses.map((status) => (
          <article
            key={status.name}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <p className="text-sm font-semibold text-slate-900">{status.name}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {status.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
