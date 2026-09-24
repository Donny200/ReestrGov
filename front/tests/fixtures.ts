import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { CreateFunctionRequest, AdminFunction } from '../src/types/adminFunctions';
import { FUNCTION_PERMISSIONS } from '../src/utils/functionPermissions';

export const allPermissions = [...FUNCTION_PERMISSIONS, 'FUNCTIONS_MANAGE_ANY_ORGANIZATION'];
export const organization = { id: 10, name: 'zafar', enabled: true, createdAt: '2026-09-01T00:00:00' };
export const languages = [
  { id: 1, code: 'en', name: 'English', nativeName: 'English', defaultLanguage: true },
  { id: 2, code: 'ru', name: 'Russian', nativeName: 'Русский', defaultLanguage: false },
  { id: 3, code: 'uz', name: 'Uzbek', nativeName: 'O‘zbek', defaultLanguage: false },
  { id: 4, code: 'fr', name: 'French', nativeName: 'Français', defaultLanguage: false },
];
function dictionary(language: string) {
  const values: Record<string, string> = {};
  const original = readFileSync('../reference-service/src/main/resources/db/migration/V1__normalize_interface_translations.sql', 'utf8');
  const added = readFileSync('../reference-service/src/main/resources/db/migration/V2__admin_function_labels.sql', 'utf8');
  for (const line of original.split('\n').filter(line => line.startsWith("('"))) {
    const parts = [...line.matchAll(/'((?:[^']|'')*)'/g)].map(part => part[1].replace(/''/g, "'"));
    if (parts.length === 2) values[parts[0]] = parts[1];
  }
  for (const line of added.split('\n').filter(line => line.startsWith("('"))) {
    const parts = [...line.matchAll(/'((?:[^']|'')*)'/g)].map(part => part[1].replace(/''/g, "'"));
    if (parts.length === 3 && parts[1] === language) values[parts[0]] = parts[2];
  }
  return values;
}
export function card(id = 1, status: AdminFunction['status'] = 'DRAFT'): AdminFunction {
  return { id, name: 'Service ' + id, description: 'Description ' + id, requirements: 'Passport',
    organizationId: 10, categoryId: 1, category: 'Legal', status, sourceLanguage: 'en',
    nameTranslations: { ru: { text: 'Услуга ' + id, source: 'human' }, uz: { text: 'Xizmat ' + id, source: 'machine' } },
    descriptionTranslations: { ru: { text: 'Описание ' + id, source: 'human' }, uz: { text: 'Tavsif ' + id, source: 'machine' } } };
}
export interface FixtureOptions {
  records?: AdminFunction[]; permissions?: string[]; role?: string;
  autoAvailable?: boolean; realBackend?: string; token?: string;
}
export async function setup(page: Page, options: FixtureOptions = {}) {
  const records = structuredClone(options.records ?? Array.from({ length: 11 }, (_, i) => card(i + 1, i < 3 ? 'PUBLISHED' : 'DRAFT')));
  const permissions = options.permissions ?? allPermissions;
  const role = options.role ?? 'ROLE_SUPER_ADMIN';
  const user = { id: 42, firstName: 'Editor', lastName: 'Test', email: 'editor@example.test', phone: null,
    role, enabled: true, mustChangePassword: false, organizationIds: [10], organizations: [organization], permissions };
  type Payload = Partial<CreateFunctionRequest> & { reason?: string; languages?: string[]; overwriteMachine?: boolean };
  const requests: { method: string; path: string; body: Payload }[] = [];
  const failures = new Map<string, number>();
  const audits: { id: number; functionId: number; performedBy: string; performedAt: string; action: string; details: string }[] = [];
  await page.addInitScript(() => window.localStorage.setItem('reestr-task-locale', 'en'));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const body = (request.postData() ? request.postDataJSON() : {}) as Payload;
    requests.push({ method, path, body });
    const reply = (json: unknown, status = 200) => route.fulfill({ status, json });
    const failureKey = method + ' ' + path;
    if (failures.has(failureKey)) {
      const status = failures.get(failureKey) ?? 500; failures.delete(failureKey);
      return reply({ message: 'Please retry this operation' }, status);
    }
    if (path.startsWith('/api/functions') && options.realBackend) {
      const response = await route.fetch({ url: options.realBackend + path,
        headers: { ...request.headers(), cookie: 'accessToken=' + options.token } });
      return route.fulfill({ response });
    }
    if (path === '/api/auth/me' || path === '/api/auth/login') return reply(user);
    if (path === '/api/auth/logout') return reply({});
    if (path === '/api/languages') return reply(languages);
    if (path.startsWith('/api/interface-translations/')) return reply(dictionary(path.split('/').at(-1) ?? 'en'));
    if (path === '/api/public/organizations' || path === '/api/organizations') return reply([organization]);
    if (path.startsWith('/api/admin/') || path === '/api/regions') return reply([]);
    if (path === '/api/functions/categories') return reply([{ id: 1, name: 'Legal', nameTranslations: { ru: { text: 'Правовые услуги', source: 'human' } } }]);
    if (path === '/api/functions/translation-capabilities') return reply({ available: options.autoAvailable ?? false });
    if (path === '/api/functions/admin') return permissions.includes('FUNCTIONS_VIEW') ? reply(records) : reply({}, 403);
    if (path === '/api/functions' && method === 'GET') return reply(records.filter(item => item.status === 'PUBLISHED'));
    if (path === '/api/functions' && method === 'POST') {
      const created: AdminFunction = { name: body.name ?? '', description: body.description ?? '', requirements: body.requirements ?? '',
        organizationId: body.organizationId ?? 10, sourceLanguage: body.sourceLanguage ?? 'en', id: Math.max(0, ...records.map(item => item.id)) + 1,
        status: 'DRAFT', categoryId: body.categoryId ?? null, category: body.categoryId ? 'Legal' : null,
        nameTranslations: {}, descriptionTranslations: {} };
      records.push(created); return reply(created, 201);
    }
    const match = path.match(/^\/api\/functions\/(\d+)(?:\/(.*))?$/);
    if (!match) return reply({ message: 'Unexpected API path ' + path }, 404);
    const record = records.find(item => item.id === Number(match[1]));
    if (!record) return reply({ message: 'Not found' }, 404);
    const action = match[2];
    if (action === 'admin') return reply(record);
    if (action === 'audit') return reply(audits.filter(entry => entry.functionId === record.id));
    if (method === 'GET') return record.status === 'PUBLISHED' ? reply(record) : reply({}, 404);
    if (method === 'PUT' && !action) Object.assign(record, body);
    else if (method === 'PUT' && action === 'requirements') record.requirements = body.requirements ?? '';
    else if (method === 'PUT' && action?.startsWith('translations/')) {
      const language = action.split('/')[1];
      record.nameTranslations ??= {};
      record.nameTranslations[language] = { text: body.name ?? '', source: 'human' };
      record.descriptionTranslations ??= {};
      record.descriptionTranslations[language] = { text: body.description ?? '', source: 'human' };
    } else if (action === 'translate') {
      for (const language of body.languages ?? []) {
        for (const field of ['nameTranslations', 'descriptionTranslations'] as const) {
          const existing = record[field]?.[language];
          if (!existing || (body.overwriteMachine && existing.source === 'machine')) {
            const values = record[field] ?? {};
            values[language] = { text: 'Translated ' + language, source: 'machine' };
            record[field] = values;
          }
        }
      }
    } else if (action === 'submit-for-review' || action === 'reactivate') record.status = 'PENDING_REVIEW';
    else if (action === 'publish') record.status = 'PUBLISHED';
    else if (action === 'reject') record.status = 'DRAFT';
    else if (method === 'DELETE') record.status = 'DEACTIVATED';
    else return reply({ message: 'Unexpected action' }, 400);
    audits.push({ id: audits.length + 1, functionId: record.id, performedBy: user.email,
      performedAt: new Date().toISOString(), action: action ?? 'UPDATE', details: body?.reason ?? 'Changed card' });
    return method === 'DELETE' ? route.fulfill({ status: 204 }) : reply(record);
  });
  return { records, requests, failures, audits };
}
