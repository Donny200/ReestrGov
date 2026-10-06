import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircleIcon, ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
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
    <div className="flex min-h-dvh w-full bg-surface text-foreground">
      <a
        href="#login-main"
        className="fixed start-5 top-3 z-50 -translate-y-24 rounded-pill bg-ink px-5 py-3 text-sm font-medium text-ink-fg transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent', 'Skip to main content')}
      </a>

      <aside className="ink relative hidden w-[44%] shrink-0 overflow-hidden bg-ink text-ink-fg lg:block">
        <span className="watermark" aria-hidden="true">{t('app.name')}</span>
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo onInk />
          <div className="max-w-md">
            <Eyebrow onInk>{t('nav.admin')}</Eyebrow>
            <p className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.02em] xl:text-4xl">{t('home.ctaText')}</p>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink-secondary">{t('app.demoNotice')}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between gap-3 px-5 sm:px-8">
          <div className="min-w-0 lg:hidden">
            <Logo />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher compact />
          </div>
        </header>

        <main id="login-main" tabIndex={-1} className="flex flex-1 items-center justify-center px-5 py-10 focus:outline-none sm:px-8 sm:py-14">
          <div className="w-full max-w-md">
            <div className="rounded-card border border-line bg-background p-6 sm:p-8">
              <Eyebrow>{t('nav.admin')}</Eyebrow>
              <h1 className="mt-4 text-4xl font-semibold text-foreground">{t('login.title')}</h1>
              <p className="mt-2 text-base leading-6 text-secondary">{t('login.subtitle')}</p>

              {formError && (
                <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-control bg-status-danger-bg px-4 py-3 text-sm font-medium leading-5 text-status-danger">
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {formError}
                </div>
              )}

              <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
                <Field label={t('field.email')} error={errors.email?.message} required>
                  {(control) => <Input {...control} type="email" autoComplete="email" inputMode="email" {...register('email')} />}
                </Field>
                <Field label={t('field.password')} error={errors.password?.message} required>
                  {(control) => <Input {...control} type="password" autoComplete="current-password" {...register('password')} />}
                </Field>
                <Button type="submit" variant="dark" size="lg" className="w-full" loading={isSubmitting}>
                  {t('action.login')}
                </Button>
              </form>
            </div>

            <Link to="/" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-pill text-sm font-medium text-secondary transition-colors duration-snap fine:hover:text-foreground">
              <ArrowLeftIcon className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              {t('nav.backToSite')}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
