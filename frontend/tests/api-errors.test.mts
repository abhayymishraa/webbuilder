import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError } from 'axios';
import { apiClient } from '../api/client.ts';

test('API errors remain readable', async (t) => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: { getItem: () => null },
  });
  t.after(() => {
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  const cases = [
    {
      name: 'malformed verification token',
      url: '/auth/verification/confirm', status: 422,
      detail: [{ type: 'string_too_short', loc: ['body', 'token'], msg: 'String should have at least 32 characters' }],
      expected: 'This verification link is invalid or expired. Request a new one.',
    },
    {
      name: 'expired verification token',
      url: '/auth/verification/confirm', status: 400,
      detail: 'This link has expired or was already used. Request a new one.',
      expected: 'This link has expired or was already used. Request a new one.',
    },
    {
      name: 'other validation errors', url: '/auth/verification/request', status: 422,
      detail: [{ msg: 'Enter a valid email address.' }, { msg: 'This field is required.' }],
      expected: 'Enter a valid email address. This field is required.',
    },
    {
      name: 'unexpected detail shape', url: '/auth/verification/confirm', status: 503,
      detail: { internal: 'Do not display this object' }, expected: 'Request failed',
    },
    {
      name: 'unexpected validation entries', url: '/auth/verification/request', status: 422,
      detail: [null, { msg: {} }, { msg: ' ' }], expected: 'Request failed',
    },
  ];

  for (const example of cases) {
    await t.test(example.name, async () => {
      await assert.rejects(apiClient.post(example.url, {}, {
        adapter: async (config) => {
          throw new AxiosError('Request failed', undefined, config, undefined, {
            data: { detail: example.detail }, status: example.status,
            statusText: 'Error', headers: {}, config,
          });
        },
      }), { message: example.expected });
    });
  }
});
