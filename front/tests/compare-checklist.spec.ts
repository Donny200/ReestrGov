import { test, expect } from '@playwright/test';
import { card, organization, setup } from './fixtures';
import type { AdminFunction } from '../src/types/adminFunctions';

function structured(id: number, overrides: Partial<AdminFunction> = {}): AdminFunction {
  return {
    ...card(id, 'PUBLISHED'),
    instructions: { whoCanUse: null, steps: 'Fill in the application\nSubmit it at the service centre', requiredDocuments: 'Passport\nPhoto 3x4', whereHowToApply: null, processingTime: '10 days', fee: '0.5 BHM' },
    lastUpdatedAt: '2026-10-01T10:00:00Z',
    ...overrides,
  };
}

function writes(requests: { method: string; path: string }[]) {
  return requests.filter(request => request.method !== 'GET' && !request.path.startsWith('/api/auth/') && request.path !== '/api/analytics/events');
}

test('visitors compare up to three published services side by side, with missing values marked, and can share or clear', async ({ page }) => {
  const fixture = await setup(page, {
    anonymous: true,
    records: [structured(1), structured(2, { instructions: null, requirements: '', lastUpdatedAt: null }), structured(3), structured(4), card(5, 'DRAFT')],
    organizations: [{ ...organization, description: null, contact: { address: 'Tashkent, Sayilgoh 5', phone: '+998 71 200-00-00', workingHours: null, latitude: null, longitude: null, mapUrl: null, regionCode: null } }],
  });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Catalogue' });
  await page.getByRole('button', { name: 'Compare: Service 1' }).click();
  await page.getByRole('button', { name: 'Compare: Service 2' }).click();
  await page.getByRole('button', { name: 'Compare: Service 3' }).click();
  await page.getByRole('button', { name: 'Compare: Service 4' }).click();
  await expect(page.getByText('You can compare up to 3 services', { exact: false })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Compare (3)' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem('reestr-compare-services') ?? '[]'))).toEqual([1, 2, 3]);

  await nav.getByRole('link', { name: 'Compare (3)' }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const table = page.getByRole('table', { name: 'Compare services' });
  await expect(table.getByRole('columnheader')).toHaveCount(4);
  const fee = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Official fee' }) });
  await expect(fee.getByRole('cell').nth(0)).toHaveText('0.5 BHM');
  await expect(fee.getByRole('cell').nth(1)).toHaveText('Not specified');
  const documents = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Required documents' }) });
  await expect(documents.getByRole('cell').nth(0)).toContainText('Photo 3x4');
  await expect(documents.getByRole('cell').nth(1)).toHaveText('Not specified');
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Organization contacts' }) }).getByText('Tashkent, Sayilgoh 5')).toHaveCount(3);
  const updated = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Last updated' }) });
  await expect(updated.getByRole('cell').nth(1)).toHaveText('Not specified');
  await expect(page.getByText('“Not specified” means the organization has not published that detail yet', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Remove from comparison: Service 2' }).click();
  await expect(table.getByRole('columnheader')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Print comparison' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Clear selection' }).click();
  await expect(page.getByText('No services selected yet')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('reestr-compare-services'))).toBeNull();

  // A shared link selects published services only; the draft and the unknown id are ignored.
  await page.goto('/compare?ids=3,5,999,1');
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole('table', { name: 'Compare services' }).getByRole('columnheader')).toHaveCount(3);
  await expect(page.getByText('no longer published', { exact: false })).toBeVisible();
  expect(writes(fixture.requests)).toEqual([]);
});

test('the preparation checklist lives in this browser, survives reloads and flags items the organization changed', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [structured(1, { requirements: '' })] });
  await page.goto('/functions/1');
  const main = page.getByRole('main');
  await expect(main.getByText('This checklist is a preparation aid', { exact: false })).toBeVisible();
  await expect(main.getByText('never sent to the server', { exact: false })).toBeVisible();
  await expect(main.getByText('0 / 4')).toBeVisible();
  await main.getByRole('checkbox', { name: 'Photo 3x4' }).check();
  await main.getByRole('checkbox', { name: /Fill in the application/ }).check();
  await expect(main.getByText('2 / 4')).toBeVisible();
  await page.reload();
  await expect(main.getByRole('checkbox', { name: 'Photo 3x4' })).toBeChecked();
  await expect(main.getByRole('checkbox', { name: 'Passport' })).not.toBeChecked();
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('reestr-checklist-1') ?? '{}'));
  expect(Object.values(stored.items as Record<string, { text: string }>).map(item => item.text).sort()).toEqual(['Fill in the application', 'Photo 3x4']);
  expect(writes(fixture.requests)).toEqual([]);

  // The organization replaces "Photo 3x4" by "Two photos": the ticked step survives, the removed document is flagged.
  fixture.records[0].instructions = { ...structured(1).instructions, requiredDocuments: 'Passport\nTwo photos' } as AdminFunction['instructions'];
  await page.reload();
  await expect(main.getByRole('checkbox', { name: /Fill in the application/ })).toBeChecked();
  await expect(main.getByRole('checkbox', { name: 'Two photos' })).not.toBeChecked();
  await expect(main.getByText('1 / 4')).toBeVisible();
  const stale = main.getByRole('status').filter({ hasText: 'no longer part of the current list' });
  await expect(stale).toContainText('Photo 3x4');
  await stale.getByRole('button', { name: 'Remove outdated items' }).click();
  await expect(stale).toHaveCount(0);

  await main.getByRole('button', { name: 'Clear checklist' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Clear checklist' }).click();
  await expect(main.getByText('0 / 4')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('reestr-checklist-1'))).toBeNull();

  await page.emulateMedia({ media: 'print' });
  await expect(main.getByRole('checkbox', { name: 'Two photos' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Clear checklist' })).toBeHidden();
  expect(writes(fixture.requests)).toEqual([]);
});
