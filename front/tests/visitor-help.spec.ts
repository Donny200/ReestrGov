import { test, expect } from '@playwright/test';
import { allPermissions, card, helpToken, organization, setup, type HelpFixture } from './fixtures';
import type { AdminFunction } from '../src/types/adminFunctions';

function published(id: number, overrides: Partial<AdminFunction> = {}): AdminFunction {
  return {
    ...card(id, 'PUBLISHED'),
    instructions: { whoCanUse: null, steps: 'Fill in the application\nSubmit it at the service centre', requiredDocuments: 'Passport\nPhoto 3x4',
      whereHowToApply: null, processingTime: '10 days', fee: 'Free of charge' },
    ...overrides,
  };
}

const contact = { address: 'Tashkent, Sayilgoh 5', phone: '+998 71 200-00-00', workingHours: null, latitude: null, longitude: null, mapUrl: null, regionCode: null };

function conversation(overrides: Partial<HelpFixture> = {}): HelpFixture {
  return { id: 1, token: helpToken('abc'), status: 'NEW', serviceId: 1, serviceName: 'Service 1', organizationId: 10, notificationRequested: false,
    assignedUserId: null, assignedUserName: null, createdAt: '2026-10-16T08:00:00Z',
    messages: [{ author: 'VISITOR', body: 'Can I apply for my child?', createdAt: '2026-10-16T08:00:00Z' }], ...overrides };
}

test('anonymous visitors read published requirements and documents, download the guide and see the help entry points', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [published(1), card(2, 'DRAFT')], organizations: [{ ...organization, description: null, contact }] });
  await page.goto('/functions/1');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Service 1' })).toBeVisible();
  await expect(main.getByRole('checkbox', { name: 'Photo 3x4' })).toBeVisible();
  await expect(main.getByText('Free of charge')).toBeVisible();
  // No sign-in is involved: the visitor stays on the public page and nothing is sent to the login endpoint.
  await expect(page).toHaveURL(/\/functions\/1$/);
  expect(fixture.requests.filter(request => request.path === '/api/auth/login')).toEqual([]);

  const guide = main.getByRole('link', { name: 'Download guide (PDF)' });
  // A plain public link in the interface language; the PDF itself is covered by the backend tests.
  await expect(guide).toHaveAttribute('href', '/api/functions/1/guide.pdf?lang=en');
  await expect(guide).toHaveAttribute('download', '');
  // Printing stays available next to the guide.
  await expect(main.getByRole('button', { name: 'Print checklist' })).toBeVisible();

  // The question flow is separate from reporting incorrect information.
  await expect(main.getByRole('button', { name: 'Report a problem' })).toBeVisible();
  await main.getByRole('link', { name: 'Ask a question' }).click();
  await expect(page).toHaveURL(/\/help\?service=1$/);
  await expect(page.getByRole('heading', { name: 'Ask a question about a service' })).toBeVisible();
});

test('a visitor asks about a service without an account, gets a private link and reads the reply later', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [published(1)], organizations: [{ ...organization, description: null, contact }] });
  await page.goto('/help?service=1');
  const preview = page.getByRole('region', { name: 'Before you ask: what the service page says' });
  await expect(preview.getByText('Photo 3x4')).toBeVisible();
  await expect(preview.getByText('Submit it at the service centre')).toBeVisible();
  await expect(preview.getByText('10 days')).toBeVisible();
  await expect(preview.getByText('Tashkent, Sayilgoh 5')).toBeVisible();
  await expect(page.getByText('Do not write passwords, personal identification (PINFL)', { exact: false })).toBeVisible();
  await expect(page.getByText('This site does not send notifications', { exact: false })).toBeVisible();
  await expect(page.getByText('This is not a live chat, and no response time is guaranteed', { exact: false })).toBeVisible();
  await expect(page.getByLabel('E-mail for a reply notification')).toHaveCount(0);

  const question = page.getByRole('textbox', { name: 'Your question' });
  await question.fill('My PINFL is 31210890123456, can I apply?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByText('Remove identification, card or document numbers', { exact: false })).toBeVisible();
  expect(fixture.requests.filter(request => request.path === '/api/help/conversations')).toEqual([]);

  await question.fill('Can I apply for my child with my passport?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByRole('heading', { name: 'Your question was sent' })).toBeVisible();
  const sent = fixture.requests.find(request => request.path === '/api/help/conversations');
  expect(sent?.body).toMatchObject({ serviceId: 1, message: 'Can I apply for my child with my passport?', language: 'en', website: '' });
  const token = fixture.helpConversations[0].token;
  await expect(page.getByLabel('Your private link')).toHaveValue(new RegExp(`/help/conversation#${token}$`));
  await expect(page.getByText('You will not receive a notification', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Open the conversation' }).click();
  await expect(page).toHaveURL(new RegExp(`/help/conversation#${token}$`));
  await expect(page.getByText('Can I apply for my child with my passport?')).toBeVisible();
  await expect(page.getByText('Waiting for a reply', { exact: false })).toBeVisible();
  // The token travels in a header, never in the API URL.
  const read = fixture.requests.find(request => request.path === '/api/help/conversation');
  expect(read?.query.toString()).toBe('');

  fixture.helpConversations[0].messages.push({ author: 'STAFF', body: 'Yes, bring the birth certificate.', createdAt: '2026-10-16T10:00:00Z', staffLabel: 'staff@example.test' });
  fixture.helpConversations[0].status = 'ANSWERED';
  await page.getByRole('button', { name: 'Check for a reply' }).click();
  const messages = page.getByRole('list', { name: 'Messages' });
  await expect(messages.getByText('Yes, bring the birth certificate.')).toBeVisible();
  await expect(messages.getByText('zafar')).toBeVisible();
  await expect(page.getByText('staff@example.test')).toHaveCount(0);

  await page.getByRole('textbox', { name: 'Write again' }).fill('Thank you, is a copy enough?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(messages.getByText('Thank you, is a copy enough?')).toBeVisible();
  expect(fixture.helpConversations[0].status).toBe('IN_PROGRESS');
});

test('general questions need no service and the conversation page explains how to return', async ({ page }) => {
  const fixture = await setup(page, { anonymous: true, records: [published(1)], helpNotifications: true });
  await page.goto('/');
  await page.getByRole('banner').getByRole('navigation', { name: 'Catalogue' }).getByRole('link', { name: 'Ask a question' }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByText('If you leave an e-mail address, we tell you when a reply arrives.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Your question' }).fill('How do I find the right service for a new business?');
  await page.getByLabel('E-mail for a reply notification').fill('visitor@example.test');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByText('We will send an e-mail to the address you gave', { exact: false })).toBeVisible();
  const sent = fixture.requests.find(request => request.path === '/api/help/conversations');
  expect(sent?.body.serviceId).toBeUndefined();
  expect(sent?.body.email).toBe('visitor@example.test');
  expect(fixture.helpConversations[0].organizationId).toBeNull();

  await page.goto('/help/conversation');
  await expect(page.getByText('Open the private link you received', { exact: false })).toBeVisible();
  await page.getByLabel('Paste your private link').fill('https://elsewhere.example/help/conversation#' + fixture.helpConversations[0].token);
  await page.getByRole('button', { name: 'Open the conversation' }).click();
  await expect(page.getByText('How do I find the right service for a new business?')).toBeVisible();
  await expect(page.getByText('Site support').first()).toBeVisible();

  await page.goto('/help/conversation#' + helpToken('unknown'));
  await expect(page.getByText('No conversation belongs to this link', { exact: false })).toBeVisible();
});

test('organization staff answer questions in their inbox; staff without the permission do not see it', async ({ page }) => {
  const permissions = [...allPermissions.filter(permission => permission !== 'FUNCTIONS_MANAGE_ANY_ORGANIZATION'), 'VISITOR_QUESTIONS_VIEW', 'VISITOR_QUESTIONS_REPLY'];
  const fixture = await setup(page, {
    role: 'ROLE_ORG_ADMIN', permissions, records: [published(1)],
    helpConversations: [conversation(), conversation({ id: 2, token: helpToken('other'), organizationId: 20, serviceId: 9, serviceName: 'Foreign service',
      messages: [{ author: 'VISITOR', body: 'Not for this organization', createdAt: '2026-10-16T08:00:00Z' }] }),
    conversation({ id: 3, token: helpToken('general'), organizationId: null, serviceId: null, serviceName: null,
      messages: [{ author: 'VISITOR', body: 'General site question', createdAt: '2026-10-16T08:00:00Z' }] })],
  });
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Visitor questions' }).first().click();
  await expect(page).toHaveURL(/\/admin\/questions$/);
  const table = page.getByRole('table', { name: 'Visitor questions' });
  await expect(table.getByText('Service 1')).toBeVisible();
  await expect(table.getByText('Foreign service')).toHaveCount(0);
  await expect(table.getByText('General question')).toHaveCount(0);

  await table.getByRole('button', { name: 'Open' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Can I apply for my child?')).toBeVisible();
  await expect(dialog.getByText('The visitor sees replies signed by the organization', { exact: false })).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Reply to the visitor' }).fill('Yes, bring the birth certificate.');
  await dialog.getByRole('button', { name: 'Send reply' }).click();
  await expect(dialog.getByText('Yes, bring the birth certificate.')).toBeVisible();
  await expect(dialog.getByText('Answered')).toBeVisible();
  const reply = fixture.requests.find(request => request.path === '/api/help/inbox/1/replies');
  expect(reply?.body).toEqual({ message: 'Yes, bring the birth certificate.' });
  await dialog.getByRole('button', { name: 'Close conversation' }).click();
  await expect(dialog.getByText('This conversation is closed. Reopen it to reply.')).toBeVisible();
  expect(fixture.helpConversations[0].status).toBe('CLOSED');
});

test('staff without the visitor-question permission get no inbox', async ({ page }) => {
  await setup(page, { role: 'ROLE_MODERATOR', permissions: ['ORGANIZATIONS_VIEW', 'REPORTS_VIEW'], helpConversations: [conversation()] });
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Visitor questions' })).toHaveCount(0);
  await page.goto('/admin/questions');
  await expect(page.getByText('You do not have permission', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Can I apply for my child?')).toHaveCount(0);
});
