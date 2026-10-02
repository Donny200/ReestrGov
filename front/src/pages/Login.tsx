import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon, LogInIcon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { FloatingInput } from '../components/ui/Input';
import { homeRouteForRole, useAuth } from '../contexts/auth';
import { useI18n } from '../contexts/i18n';
import { emailPattern } from '../lib/validation';
import { errorMessage, fieldErrorsOf, statusOf, type Translate } from '../utils/errors';

const loginSchema = (t: Translate) =>
  z.object({
    email: z.string().trim().min(1, t('validation.required')).regex(emailPattern, t('validation.email')),
    password: z.string().min(1, t('validation.required')),
  });

type LoginValues = z.infer<ReturnType<typeof loginSchema>>;

const highlights = [
  { key: 'login.highlightSecure', fallback: 'HttpOnly cookie sessions, no tokens in the browser' },
  { key: 'login.highlightWorkflow', fallback: 'Draft, review and publish services with a full audit trail' },
  { key: 'login.highlightLanguages', fallback: 'Catalogue content in every enabled language' },
];

export function Login() {
  const { t } = useI18n();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => loginSchema(t), [t]);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (user) {
      navigate(user.mustChangePassword ? '/settings/security' : homeRouteForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const subscription = watch(() => setFormError(null));
    return () => subscription.unsubscribe();
  }, [watch]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const authenticated = await signIn(values.email, values.password);
      toast.success(t('login.success'));
      const from = (location.state as { from?: string } | null)?.from;
      const safeFrom = from?.startsWith('/') && !from.startsWith('//') && !from.includes('\\') ? from : undefined;
      navigate(authenticated.mustChangePassword ? '/settings/security' : safeFrom ?? homeRouteForRole(authenticated.role), { replace: true });
    } catch (error) {
      const status = statusOf(error);
      Object.entries(fieldErrorsOf(error)).forEach(([field, message]) => {
        if (field === 'email' || field === 'password') setError(field, { type: 'server', message });
      });
      setFormError(status === 401 || status === 400 ? t('login.invalid') : errorMessage(error, t));
    }
  });

  return (
    <div className="flex min-h-dvh w-full animate-fade-up">
      <a
        href="#login-main"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent', 'Skip to main content')}
      </a>

      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-brand-gradient text-white lg:block">
        <div
          className="grid-pattern pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black_30%,transparent_100%)]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-28 top-20 h-[32rem] w-[32rem] rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[26rem] w-[26rem] rounded-full bg-black/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label={t('app.name')}>
            <span className="flex h-9 w-9 items-center justify-center rounded-control border border-white/20 bg-white/10 backdrop-blur">
              <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
                <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22C16.1 21.6 21.8 15.8 24 2Z" />
              </svg>
            </span>
            <span className="font-display text-base font-bold tracking-tight">{t('app.name')}</span>
          </Link>

          <div className="max-w-lg">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight xl:text-4xl">{t('home.ctaTitle')}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">{t('home.ctaText')}</p>
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item.key} className="flex items-start gap-3 text-sm text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {t(item.key, item.fallback)}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-md border-l-2 border-white/40 pl-4 text-xs leading-5 text-white/70">{t('app.demoNotice')}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
          <div className="min-w-0 lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher compact />
          </div>
        </header>

        <main id="login-main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-10 focus:outline-none sm:px-8 sm:py-14">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-content-muted transition-colors duration-fast hover:text-content-strong"
            >
              <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t('nav.backToSite')}
            </Link>

            <div className="glass rounded-overlay p-6 shadow-elevated sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-link">{t('nav.admin')}</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-content-strong">{t('login.title')}</h1>
              <p className="mt-2 text-sm leading-6 text-content-muted">{t('login.subtitle')}</p>

              {formError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium leading-5 text-danger"
                >
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {formError}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
                <FloatingInput
                  label={t('field.email')}
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <FloatingInput
                  label={t('field.password')}
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Button type="submit" size="lg" variant="gradient" className="w-full" loading={isSubmitting} icon={<LogInIcon />}>
                  {t('action.login')}
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
