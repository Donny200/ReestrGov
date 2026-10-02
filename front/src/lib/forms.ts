import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { errorMessage, fieldErrorsOf, type Translate } from '../utils/errors';

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  onFormError: (message: string) => void,
  t?: Translate,
): void {
  const fields = fieldErrorsOf(error);
  const names = Object.keys(fields);
  if (names.length === 0) {
    onFormError(errorMessage(error, t));
    return;
  }
  names.forEach((name) => setError(name as Path<T>, { type: 'server', message: fields[name] }));
}
