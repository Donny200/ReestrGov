import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircleIcon, ArrowLeftIcon, LogInIcon, ShieldCheckIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { homeRouteForRole, useAuth } from '../contexts/auth';
import { useI18n } from '../contexts/i18n';
import { errorMessage, fieldErrorsOf, statusOf } from '../utils/errors';

export function Login() {
  const { t } = useI18n();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.mustChangePassword ? '/settings/security' : homeRouteForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const clearFieldError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('validation.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('validation.email');
    if (!password) next.password = t('validation.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const authenticated = await signIn(email.trim(), password);
      toast.success(t('login.success'));
      const from = (location.state as { from?: string } | null)?.from;
      const safeFrom = from?.startsWith('/') && !from.startsWith('//') && !from.includes('\\') ? from : undefined;
      navigate(
        authenticated.mustChangePassword ? '/settings/security' : safeFrom ?? homeRouteForRole(authenticated.role),
        { replace: true }
      );
    } catch (error) {
      const status = statusOf(error);
      setErrors(fieldErrorsOf(error));
      setFormError(status === 401 || status === 400 ? t('login.invalid') : errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen min-h-dvh w-full bg-canvas">
      <a
        href="#login-main"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-pop transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent', "Asosiy tarkibga o'tish")}
      </a>

      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-brand lg:block">
        <div className="pointer-events-none absolute -right-28 top-20 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] font-display text-[14rem] font-extrabold leading-none tracking-[-0.1em] text-white/[0.04]" aria-hidden="true">R</div>
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo tone="light" />
          <div className="max-w-lg">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-teal-200">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              {t('home.ctaTitle')}
            </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/60">{t('home.ctaText')}</p>
            <p className="mt-8 max-w-md border-l-2 border-accent pl-4 text-xs leading-5 text-white/45">
              {t('app.demoNotice')}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[4.5rem] items-center justify-between gap-3 border-b border-line px-4 sm:px-8 lg:justify-end lg:border-b-0">
          <div className="min-w-0 lg:hidden"><Logo /></div>
          <div className="shrink-0"><LanguageSwitcher /></div>
        </header>

        <main id="login-main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-10 focus:outline-none sm:px-8 sm:py-14">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-semibold text-content-muted transition-colors hover:text-content-strong"
            >
              <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t('nav.backToSite')}
            </Link>

            <div className="rounded-card border border-line bg-white p-5 shadow-pop sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{t('nav.admin')}</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-content-strong sm:text-4xl">
                {t('login.title')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-navy-500">{t('login.subtitle')}</p>

              {formError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-[13px] font-medium leading-5 text-red-700"
                >
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {formError}
                </div>
              )}

              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <Field label={t('field.email')} error={errors.email} required>
                  {({ id, invalid, describedBy }) => (
                    <TextInput
                      id={id}
                      type="email"
                      autoComplete="email"
                      required
                      aria-required="true"
                      value={email}
                      invalid={invalid}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError('email');
                      }}
                      placeholder="ism.familiya@reestrtask.uz"
                    />
                  )}
                </Field>

                <Field label={t('field.password')} error={errors.password} required>
                  {({ id, invalid, describedBy }) => (
                    <TextInput
                      id={id}
                      type="password"
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      value={password}
                      invalid={invalid}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="••••••••"
                    />
                  )}
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  icon={<LogInIcon className="h-4 w-4" aria-hidden="true" />}
                >
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
