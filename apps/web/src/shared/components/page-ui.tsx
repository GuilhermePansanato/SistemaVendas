import { useEffect, type ReactNode } from 'react';

type Tone = 'default' | 'info' | 'success' | 'warning' | 'danger';
type ScrollAreaSize = 'sm' | 'md' | 'lg';

const emptyStateToneClasses: Record<Tone, string> = {
  default: 'border-slate-200 bg-slate-50 text-slate-600',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

const metricToneClasses: Record<Tone, string> = {
  default: 'text-slate-900',
  info: 'text-sky-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
};

const scrollAreaSizeClasses: Record<ScrollAreaSize, string> = {
  sm: 'max-h-[18rem]',
  md: 'max-h-[24rem]',
  lg: 'max-h-[32rem]',
};

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>

      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </header>
  );
}

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={[
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      {title || description || action ? (
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          {action ? <div className="flex items-center gap-3">{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
};

export function MetricCard({
  label,
  value,
  helper,
  tone = 'default',
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-semibold ${metricToneClasses[tone]}`}>
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </article>
  );
}

type EmptyStateProps = {
  message: string;
  tone?: Tone;
};

export function EmptyState({
  message,
  tone = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-xl border px-4 py-5 text-sm',
        emptyStateToneClasses[tone],
      ].join(' ')}
    >
      {message}
    </div>
  );
}

type ScrollableContentProps = {
  children: ReactNode;
  size?: ScrollAreaSize;
  className?: string;
};

export function ScrollableContent({
  children,
  size = 'md',
  className,
}: ScrollableContentProps) {
  return (
    <div
      className={[
        'overflow-y-auto pr-1',
        scrollAreaSizeClasses[size],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

type ModalSize = 'md' | 'lg' | 'xl';

const modalSizeClasses: Record<ModalSize, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
};

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  size = 'lg',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          modalSizeClasses[size],
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="space-y-1">
            <h2 id="modal-title" className="text-xl font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
