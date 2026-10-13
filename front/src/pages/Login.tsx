import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui/Button';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { homeRouteForRole, useAuth } from '../contexts/auth';
import { useI18n } from '../contexts/i18n';
import { emailPattern } from '../lib/validation';
import { getPasswordResetOptions } from '../services/authService';
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
  const resetOptions = useQuery({ queryKey: ['auth', 'password-reset-options'], queryFn: getPasswordResetOptions, staleTime: 60_000, retry: false });
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
    <AuthShell>
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
      {resetOptions.data?.selfServiceAvailable && (
        <p className="mt-5 text-sm">
          <Link to="/forgot-password" className="rounded-sm font-medium text-accent-text underline-offset-4 fine:hover:underline">
            {t('login.forgotPassword', 'Forgot password?')}
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
