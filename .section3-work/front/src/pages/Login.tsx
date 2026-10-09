import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircleIcon, LogInIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '../components/layout/Logo';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { homeRouteForRole, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { errorMessage, fieldErrorsOf, statusOf } from '../utils/errors';

const HERO_IMAGE = "/3e42b6c2-ea58-46c4-a3f2-45342d80cb5b.jpg";

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

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('validation.required');else
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('validation.email');
    if (!password) next.password = t('validation.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const authenticated = await signIn(email.trim(), password);
      toast.success(t('login.success'));
      const from = (location.state as {from?: string;} | null)?.from;
      navigate(
        authenticated.mustChangePassword ? '/settings/security' : from ?? homeRouteForRole(authenticated.role),
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
    <div className="flex min-h-screen w-full bg-[#f4f6f9]">
      <div className="relative hidden w-1/2 shrink-0 lg:block">
        <img src={HERO_IMAGE} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy-950/70" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Logo tone="light" />
          <div>
            <h2 className="max-w-sm font-display text-3xl font-extrabold leading-tight text-white">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy-200">{t('home.ctaText')}</p>
            <p className="mt-8 max-w-sm text-[12px] text-navy-300">{t('app.demoNotice')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900">{t('login.title')}</h1>
            <p className="mt-1.5 text-sm text-navy-500">{t('login.subtitle')}</p>

            {formError &&
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-700">
              
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {formError}
              </div>
            }

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <Field label={t('field.email')} error={errors.email} required>
                {({ id, invalid, describedBy }) =>
                <TextInput
                  id={id}
                  type="email"
                  autoComplete="email"
                  value={email}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ism.familiya@reestrtask.uz" />

                }
              </Field>

              <Field label={t('field.password')} error={errors.password} required>
                {({ id, invalid, describedBy }) =>
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••" />

                }
              </Field>

              <Button type="submit" className="w-full" loading={submitting} icon={<LogInIcon className="h-4 w-4" />}>
                {t('action.login')}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-navy-400">
              <Link to="/" className="font-medium text-navy-600 hover:text-navy-900">
                {t('nav.backToSite')}
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>);

}
