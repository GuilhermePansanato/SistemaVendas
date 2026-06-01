import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../features/auth/context/use-auth';
import { getDefaultAppPath } from '../features/auth/lib/module-access';
import { loginRequest } from '../features/auth/services/auth-service';

const loginSchema = z.object({
  email: z.email('Informe um e-mail valido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      login(session);
      startTransition(() => {
        void navigate(getDefaultAppPath(session.user.modules), { replace: true });
      });
    },
  });

  const onSubmit = (values: LoginFormData) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <article className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
          <p className="text-sm text-slate-500">
            Acesse a plataforma para gerenciar clientes, vendas, parcelas e pagamentos.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              E-mail
            </span>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...register('email')}
            />
            {errors.email ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Senha
            </span>
            <input
              type="password"
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              {...register('password')}
            />
            {errors.password ? (
              <span className="mt-2 block text-sm text-rose-600">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          {loginMutation.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Nao foi possivel autenticar. Verifique as credenciais e tente novamente.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </article>
    </div>
  );
}
