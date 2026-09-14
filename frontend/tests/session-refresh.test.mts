import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../api/client.ts';
import { clearSession, getSessionId, saveSession, storeTokens } from '../api/session.ts';

const tokens = (access = 'old-access', refresh = 'old-refresh') => ({
  access_token: access, refresh_token: refresh, token_type: 'bearer',
});
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  config, data, status, statusText: String(status), headers: {},
});
function denied(config: InternalAxiosRequestConfig, status = 401, detail = 'Unauthorized'): never {
  throw new AxiosError('Request failed', undefined, config, undefined,
    response(config, { detail }, status));
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

test('session renewal', async t => {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const adapter = axios.defaults.adapter;
  const values = new Map<string, string>();
  const redirects: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { pathname: '/chat', replace: (url: string) => redirects.push(url) },
  } });
  t.after(() => {
    axios.defaults.adapter = adapter;
    for (const [key, descriptor] of [['localStorage', oldStorage], ['window', oldWindow]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  t.beforeEach(() => { values.clear(); redirects.length = 0; saveSession(tokens()); });

  await t.test('retries the original POST once with renewed tokens', async () => {
    let refreshes = 0;
    let requests = 0;
    const id = getSessionId();
    axios.defaults.adapter = async config => {
      refreshes++;
      assert.ok(config.url?.endsWith('/auth/refresh'));
      assert.deepEqual(JSON.parse(config.data), { refresh_token: 'old-refresh' });
      return response(config, tokens('new-access', 'new-refresh'));
    };
    const result = await apiClient.post('/chats/example/runs', { prompt: 'test' }, {
      adapter: async config => {
        requests++;
        assert.equal(config.method, 'post');
        assert.deepEqual(JSON.parse(config.data), { prompt: 'test' });
        if (config.headers.Authorization === 'Bearer old-access') denied(config);
        assert.equal(config.headers.Authorization, 'Bearer new-access');
        return response(config, { run_id: 'one-run' });
      },
    });
    assert.equal(result.data.run_id, 'one-run');
    assert.equal(refreshes, 1);
    assert.equal(requests, 2);
    assert.equal(getSessionId(), id);
    assert.equal(values.get('refresh_token'), 'new-refresh');
    assert.deepEqual(redirects, []);
  });

  await t.test('simultaneous 401s share a single refresh', async () => {
    let refreshes = 0;
    axios.defaults.adapter = async config => {
      refreshes++;
      await new Promise(resolve => setImmediate(resolve));
      return response(config, tokens('new-access', 'new-refresh'));
    };
    await Promise.all(Array.from({ length: 6 }, () => apiClient.get('/auth/me', {
      adapter: async config => {
        if (config.headers.Authorization === 'Bearer old-access') denied(config);
        return response(config, { id: 1 });
      },
    })));
    assert.equal(refreshes, 1);
    assert.deepEqual(redirects, []);
  });

  await t.test('late old-token 401 reuses the already renewed token', async () => {
    const started = deferred();
    const release = deferred();
    let refreshes = 0;
    axios.defaults.adapter = async config => {
      refreshes++;
      return response(config, tokens('new-access', 'new-refresh'));
    };
    const late = apiClient.get('/projects', { adapter: async config => {
      if (config.headers.Authorization === 'Bearer old-access') {
        started.resolve(); await release.promise; denied(config);
      }
      return response(config, []);
    } });
    await started.promise;
    await apiClient.get('/auth/me', { adapter: async config => {
      if (config.headers.Authorization === 'Bearer old-access') denied(config);
      return response(config, {});
    } });
    release.resolve(); await late;
    assert.equal(refreshes, 1);
  });

  for (const status of [401, 403]) {
    await t.test(`rejected refresh ${status} clears the complete session`, async () => {
      axios.defaults.adapter = async config => denied(config, status);
      await assert.rejects(apiClient.get('/auth/me', { adapter: async config => denied(config) }), /expired/);
      assert.equal(values.size, 0);
      assert.deepEqual(redirects, ['/signin']);
    });
  }

  for (const status of [0, 503]) {
    await t.test(`temporary refresh failure ${status} retains the session`, async () => {
      axios.defaults.adapter = async config => {
        if (status) denied(config, status);
        throw new AxiosError('Network Error', 'ERR_NETWORK', config);
      };
      const id = getSessionId();
      await assert.rejects(apiClient.get('/auth/me', { adapter: async config => denied(config) }), /try again/);
      assert.equal(getSessionId(), id);
      assert.equal(values.get('refresh_token'), 'old-refresh');
      assert.deepEqual(redirects, []);
    });
  }

  await t.test('a second 401 ends the session without an infinite refresh loop', async () => {
    let refreshes = 0;
    let requests = 0;
    axios.defaults.adapter = async config => { refreshes++; return response(config, tokens('new')); };
    await assert.rejects(apiClient.get('/auth/me', { adapter: async config => { requests++; denied(config); } }));
    assert.equal(refreshes, 1);
    assert.equal(requests, 2);
    assert.equal(values.size, 0);
  });

  for (const change of ['logout', 'new-account']) {
    await t.test(`pending refresh cannot undo ${change}`, async () => {
      const started = deferred();
      const release = deferred();
      axios.defaults.adapter = async config => {
        started.resolve(); await release.promise;
        return response(config, tokens('stale-access', 'stale-refresh'));
      };
      const request = apiClient.get('/auth/me', { adapter: async config => denied(config) });
      const rejected = assert.rejects(request);
      await started.promise;
      clearSession();
      if (change === 'new-account') saveSession(tokens('other-access', 'other-refresh'));
      release.resolve(); await rejected;
      assert.equal(values.get('auth_token'), change === 'logout' ? undefined : 'other-access');
      assert.deepEqual(redirects, []);
    });
  }

  await t.test('invalid login does not use an existing refresh token', async () => {
    let refreshes = 0;
    axios.defaults.adapter = async config => { refreshes++; return response(config, tokens()); };
    await assert.rejects(apiClient.post('/auth/login', {}, { adapter: async config => {
      assert.equal(config.headers.Authorization, undefined);
      denied(config);
    } }));
    assert.equal(refreshes, 0);
    assert.deepEqual(redirects, []);
  });

  for (const rejected of [false, true]) {
    await t.test(`another tab's renewed session survives a late ${rejected ? 'rejection' : 'response'}`, async () => {
      const started = deferred();
      const release = deferred();
      axios.defaults.adapter = async config => {
        started.resolve(); await release.promise;
        if (rejected) denied(config);
        return response(config, tokens('stale-access', 'stale-refresh'));
      };
      const request = apiClient.get('/auth/me', { adapter: async config => {
        if (config.headers.Authorization === 'Bearer old-access') denied(config);
        assert.equal(config.headers.Authorization, 'Bearer other-tab-access');
        return response(config, {});
      } });
      await started.promise;
      storeTokens(tokens('other-tab-access', 'other-tab-refresh'));
      release.resolve(); await request;
      assert.equal(values.get('refresh_token'), 'other-tab-refresh');
      assert.deepEqual(redirects, []);
    });
  }

  await t.test('unverified users cannot refresh their way past verification', async () => {
    let refreshes = 0;
    axios.defaults.adapter = async config => { refreshes++; return response(config, tokens()); };
    await assert.rejects(apiClient.get('/auth/me', {
      adapter: async config => denied(config, 403, 'Verify your email before continuing.'),
    }), /Verify your email/);
    assert.equal(refreshes, 0);
    assert.equal(values.size, 0);
    assert.deepEqual(redirects, ['/verify-email']);
  });

  await t.test('legacy access-only sessions require one fresh sign-in', async () => {
    values.delete('refresh_token'); values.delete('auth_session_id');
    await assert.rejects(apiClient.get('/auth/me', { adapter: async config => denied(config) }), /sign in again/);
    assert.equal(values.size, 0);
    assert.deepEqual(redirects, ['/signin']);
  });
});
