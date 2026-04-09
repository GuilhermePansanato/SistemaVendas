export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(180deg,_#f6efe5_0%,_#eedeca_100%)] px-4">
      <article className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(72,52,35,0.14)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
          Acesso
        </p>
        <h1 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-3xl font-semibold text-slate-900">
          Login do sistema
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          Esta tela sera ligada ao modulo de autenticacao do Nest com JWT nas
          proximas iteracoes.
        </p>
      </article>
    </div>
  );
}
