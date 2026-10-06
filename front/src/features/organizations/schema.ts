import { z } from 'zod';
import { optionalString, requiredString } from '../../lib/validation';
import type { Translate } from '../../utils/errors';

export const organizationSchema = (t: Translate) =>
  z.object({
    name: requiredString(t, 150),
    description: optionalString(500),
  });

export type OrganizationFormValues = z.infer<ReturnType<typeof organizationSchema>>;
