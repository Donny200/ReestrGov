import { test, expect, type Page } from '@playwright/test';
import { setup, card, organization } from './fixtures';
import type { AdminFunction } from '../src/types/adminFunctions';
import type { Organization } from '../src/types/api';

function structuredCard(): AdminFunction {
  return {
    ...card(1, 'PUBLISHED'),
    requirements: 'Original documents',
    instructions: {
      whoCanUse: null,
      steps: 'Fill in the application\nSubmit it at the service centre',
      requiredDocuments: 'Passport\nPhoto 3x4',
      whereHowToApply: null,
      processingTime: null,
      fee: '0.5 BHM',
    },
    instructionTranslations: { steps: { ru: { text: 'Заполнить заявление\nПодать в центр услуг', source: 'machine' } } },
    officialSourceUrl: 'https://gov.example/services/1',
    lastVerifiedAt: '2026-09-01T10:00:00Z',
    verificationStatus: 'VERIFIED',
  };
}

const visitedOrganization: Organization = {
  ...organization,
  description: 'Justice office',
  contact: {
    address: 'Tashkent, Sayilgoh street 5',
    phone: '+998 71 200-00-00',
    workingHours: null,
    latitude: 41.311,
    longitude: 69.279,
    mapUrl: null,
    regionCode: '1726',
  },
  officialSourceUrl: null,
  verificationStatus: 'UNVERIFIED',
};

function writes(requests: { method: string; path: string }[]) {
  return requests.filter(request => request.method !== 'GET' && !request.path.startsWith('/api/auth/') && request.path !== '/api/analytics/events');
}

async function openPublic(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
}

test('structured instructions show provided facts, mark unknown ones and keep legacy requirements', async ({ page }) => {
  await setup(page, { anonymous: true, records: [structuredCard(), card(2, 'PUBLISHED')], organizations: [visitedOrganization] });
  await openPublic(page, '/functions/1');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Service 1');
  await expect(main.getByRole('heading', { name: 'Step-by-step procedure' })).toBeVisible();
  await expect(main.getByRole('listitem').filter({ hasText: 'Submit it at the service centre' })).toBeVisible();
  await expect(main.getByRole('checkbox', { name: 'Photo 3x4' })).toBeVisible();
  await expect(main.getByText('0.5 BHM')).toBeVisible();
  await expect(main.getByText('Not specified')).toHaveCount(2);
  await expect(main.getByText('Not provided yet. Confirm with the organization before you apply.')).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Additional requirements' })).toBeVisible();
  await expect(main.getByText('Checked against the official source on', { exact: false })).toBeVisible();
  await expect(main.getByRole('link', { name: /Official source/ })).toHaveAttribute('href', 'https://gov.example/services/1');
  await expect(main.getByText('Tashkent, Sayilgoh street 5')).toBeVisible();

  await openPublic(page, '/functions/2');
  await expect(main.getByRole('heading', { name: 'Requirements' })).toBeVisible();
  await expect(main.getByRole('checkbox', { name: 'Passport' })).toBeVisible();
  await expect(main.getByText('This information has not yet been checked against an official source.')).toBeVisible();
});

test('machine translated instructions are labelled for visitors', async ({ page }) => {
  await setup(page, { anonymous: true, records: [structuredCard()] });
  await page.addInitScript(() => window.localStorage.setItem('reestr-task-locale', 'ru'));
  await openPublic(page, '/functions/1');
  await expect(page.getByRole('main').getByText('Подать в центр услуг')).toBeVisible();
  await expect(page.getByRole('main').getByText('Часть текста на этой странице переведена автоматически', { exact: false })).toBeVisible();
});

test('saved services live only in this browser and can be removed or cleared', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [structuredCard(), card(2, 'PUBLISHED'), card(3, 'DRAFT')] });
  await openPublic(page, '/functions/1');
  await page.getByRole('main').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('main').getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await openPublic(page, '/');
  await page.getByRole('button', { name: 'Save: Service 2' }).click();
  await expect(page.getByRole('navigation', { name: 'Catalogue' }).getByRole('link', { name: 'Saved (2)' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('reestr-saved-services') ?? '[]') as { id: number }[]);
  expect(stored.map(item => item.id).sort()).toEqual([1, 2]);

  await openPublic(page, '/saved');
  const list = page.getByRole('list', { name: 'Saved services' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await list.getByRole('button', { name: 'Remove from saved: Service 2' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByText('You have not saved any services yet')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('reestr-saved-services'))).toBeNull();
  expect(writes(fixture.requests)).toEqual([]);
});

test('share uses the Web Share API when available and falls back to copying the link', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await setup(page, { anonymous: true, records: [structuredCard()] });
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }));
  await openPublic(page, '/functions/1');
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByText('Link copied to the clipboard')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('http://127.0.0.1:5183/functions/1');

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        (window as unknown as { shared: ShareData }).shared = data;
        return Promise.resolve();
      },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Share' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { shared?: ShareData }).shared?.url)).toBe('http://127.0.0.1:5183/functions/1');
});

test('print media hides navigation and actions but keeps the checklist', async ({ page }) => {
  await setup(page, { anonymous: true, records: [structuredCard()] });
  await openPublic(page, '/functions/1');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('banner')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Print checklist' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Report a problem' })).toBeHidden();
  await expect(page.getByText('Printed on', { exact: false })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Passport' })).toBeVisible();
});

test('guided finder shows only published services and recovers from an empty result', async ({ page }) => {
  const fixture = await setup(page, {
    anonymous: true,
    records: [card(1, 'PUBLISHED'), card(2, 'PUBLISHED'), { ...card(3, 'PUBLISHED'), categoryId: null, category: null }, card(4, 'DRAFT')],
  });
  await openPublic(page, '/finder');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'What is your situation?' })).toBeVisible();
  await main.getByRole('radio', { name: 'Legal' }).check();
  await main.getByRole('button', { name: 'Next' }).click();
  await expect(main.getByRole('heading', { name: 'What do you want to do?' })).toBeFocused();
  await main.getByLabel('Describe your goal in a few words (optional)').fill('passport renewal abroad');
  await main.getByRole('button', { name: 'Next' }).click();
  await main.getByRole('button', { name: 'Show services' }).click();
  await expect(main.getByText('No published services match these answers')).toBeVisible();
  await main.getByRole('button', { name: 'Clear keywords' }).click();
  await expect(main.getByRole('link', { name: /Service 1/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /Service 2/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /Service 3/ })).toHaveCount(0);
  await expect(main.getByRole('link', { name: /Service 4/ })).toHaveCount(0);
  await main.getByRole('button', { name: 'Start over' }).click();
  await main.getByRole('button', { name: 'Next' }).click();
  await main.getByLabel('Describe your goal in a few words (optional)').fill('Description 3');
  await main.getByRole('button', { name: 'Next' }).click();
  await main.getByRole('button', { name: 'Show services' }).click();
  await expect(main.getByRole('link', { name: /Service 3/ })).toBeVisible();
  expect(writes(fixture.requests)).toEqual([]);
});

test('anonymous visitor reports a problem with validation, privacy notice and rate-limit feedback', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [structuredCard()] });
  await openPublic(page, '/functions/1');
  await page.getByRole('button', { name: 'Report a problem' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Reports are private and never change the page automatically', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Send report' }).click();
  await expect(dialog.getByRole('alert').filter({ hasText: 'This field is required' })).toBeVisible();
  await expect(dialog.getByRole('alert').filter({ hasText: 'Describe the problem in at least 10 characters' })).toBeVisible();
  await dialog.getByLabel('What is wrong?').click();
  await page.getByRole('option', { name: 'Fee or processing time is wrong' }).click();
  await dialog.getByLabel('Describe the problem').fill('The fee changed in September.');
  await dialog.getByLabel('Email or phone for questions').fill('not a contact');
  await dialog.getByRole('button', { name: 'Send report' }).click();
  await expect(dialog.getByText('Enter an email address or a phone number', { exact: false })).toBeVisible();
  await dialog.getByLabel('Email or phone for questions').fill('');
  fixture.failures.set('POST /api/reports', 429);
  await dialog.getByRole('button', { name: 'Send report' }).click();
  await expect(dialog.getByText('Too many reports were sent from your connection', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Send report' }).click();
  await expect(dialog.getByText('Thank you, your report was sent')).toBeVisible();
  const sent = fixture.requests.filter(request => request.method === 'POST' && request.path === '/api/reports').at(-1);
  expect(sent?.body).toEqual({
    entityType: 'FUNCTION', entityId: 1, category: 'FEES_OR_TIMING',
    description: 'The fee changed in September.', contact: '', language: 'en', website: '',
  });
});

test('organization page shows the full address with a free map link and lets visitors report contact errors', async ({ page }) => {
  const fixture = await setup(page, {
    anonymous: true,
    records: [card(1, 'PUBLISHED')],
    organizations: [visitedOrganization],
    regions: [{ id: 1, name: 'Tashkent', code: '1726' }],
  });
  await openPublic(page, '/organizations/10');
  const main = page.getByRole('main');
  await expect(main.getByText('Tashkent, Sayilgoh street 5')).toBeVisible();
  await expect(main.getByText('Tashkent', { exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: '+998 71 200-00-00' })).toHaveAttribute('href', 'tel:+998712000000');
  await expect(main.getByRole('link', { name: /Open in OpenStreetMap/ })).toHaveAttribute('href', /openstreetmap\.org\/\?mlat=41\.311&mlon=69\.279/);
  await expect(main.getByText('Not provided yet', { exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Report a problem' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('What is wrong?').click();
  await expect(page.getByRole('option', { name: 'Address, phone or hours are wrong' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Fee or processing time is wrong' })).toHaveCount(0);
  await page.getByRole('option', { name: 'Address, phone or hours are wrong' }).click();
  await dialog.getByLabel('Describe the problem').fill('The phone number does not answer.');
  await dialog.getByRole('button', { name: 'Send report' }).click();
  await expect(dialog.getByText('Thank you, your report was sent')).toBeVisible();
  expect(fixture.requests.find(request => request.path === '/api/reports')?.body).toMatchObject({ entityType: 'ORGANIZATION', entityId: 10 });
});
