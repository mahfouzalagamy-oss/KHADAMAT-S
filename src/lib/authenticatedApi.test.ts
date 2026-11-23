import { afterEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { auth } }));
import { authenticatedApi } from './authenticatedApi';
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
it.each(['https://example.com/api/test', '//example.com/api/test', '/api/../other', '/api/test?url=elsewhere'])('never sends tokens to %s', async (path) => {
  await expect(authenticatedApi(path)).rejects.toThrow('Invalid API path');
  expect(auth.getSession).not.toHaveBeenCalled();
});
it('does not send requests without a session', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  await expect(authenticatedApi('/api/auth/me')).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('sends the session token and disallows redirect forwarding', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ status: 200 }); vi.stubGlobal('fetch', fetchMock);
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null });
  await authenticatedApi('/api/auth/me', { headers: { Authorization: 'Bearer forged' } });
  const [path, options] = fetchMock.mock.calls[0];
  expect(path).toBe('/api/auth/me');
  expect(options.headers.get('Authorization')).toBe('Bearer test-token');
  expect(options.redirect).toBe('error');
});
