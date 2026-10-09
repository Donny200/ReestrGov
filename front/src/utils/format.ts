export function formatDate(value: string | null | undefined, locale = 'uz-UZ'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
}

export function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function roleLabel(role: string, t?: (key: string, fallback?: string) => string): string {
  switch (role) {
    case 'ROLE_SUPER_ADMIN':
      return t?.('role.superAdmin', 'Super admin') ?? 'Super admin';
    case 'ROLE_ORG_ADMIN':
      return t?.('role.orgAdmin', 'Tashkilot admini') ?? 'Tashkilot admini';
    case 'ROLE_MODERATOR':
      return t?.('role.moderator', 'Moderator') ?? 'Moderator';
    case 'ROLE_USER':
      return t?.('role.user', 'Foydalanuvchi') ?? 'Foydalanuvchi';
    default:
      return role;
  }
}

export function fullName(user: {firstName: string;lastName: string;}): string {
  return `${user.lastName} ${user.firstName}`.trim();
}

export function initials(user: {firstName: string;lastName: string;}): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function organizationInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || name.charAt(0).toUpperCase();
}

export function truncate(value: string | null | undefined, length = 120): string {
  if (!value) return '—';
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function requirementLines(requirements: string | null | undefined): string[] {
  if (!requirements) return [];
  return requirements.
  split('\n').
  map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim()).
  filter(Boolean);
}
