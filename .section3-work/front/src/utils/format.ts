export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ROLE_SUPER_ADMIN':
      return 'Super admin';
    case 'ROLE_ORG_ADMIN':
      return 'Tashkilot admini';
    case 'ROLE_MODERATOR':
      return 'Moderator';
    case 'ROLE_USER':
      return 'Foydalanuvchi';
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
