// @vitest-environment node
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { customerRequestsRouter } from '../../server/lib/customerRequests';

let server: Server;
let base: string;
const reader = { list: vi.fn(), find: vi.fn() };
beforeEach(async () => {
  vi.resetAllMocks();
  const app = express();
  app.use('/api/customer/requests', customerRequestsRouter(reader, async (token) => token === 'valid-a' ? { id: 'user-a' } : null));
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/customer/requests`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
const headers = { authorization: 'Bearer valid-a' };
it('does not reach storage without an authenticated session', async () => {
  expect((await fetch(base)).status).toBe(401);
  expect(reader.list).not.toHaveBeenCalled();
});
it('ignores attempts to choose a different owner or expand the page limit', async () => {
  reader.list.mockResolvedValue([{ id: 'request-a' }]);
  const result = await fetch(`${base}?userId=user-b&limit=99999`, { headers });
  expect(result.status).toBe(200);
  expect(reader.list).toHaveBeenCalledWith('user-a');
  expect(await result.json()).toEqual({ requests: [{ id: 'request-a' }], limit: 100 });
});
it('looks up a request within the verified user scope', async () => {
  reader.find.mockResolvedValue(null);
  expect((await fetch(`${base}/request-b`, { headers })).status).toBe(404);
  expect(reader.find).toHaveBeenCalledWith('user-a', 'request-b');
});
it('returns an owned request', async () => {
  reader.find.mockResolvedValue({ id: 'request-a' });
  expect(await (await fetch(`${base}/request-a`, { headers })).json()).toEqual({ request: { id: 'request-a' } });
});
it('rejects unsupported IDs before storage access', async () => {
  expect((await fetch(`${base}/invalid%20id`, { headers })).status).toBe(400);
  expect(reader.find).not.toHaveBeenCalled();
});
it('returns failure instead of an empty successful list when storage fails', async () => {
  reader.list.mockRejectedValue(new Error('private database detail'));
  const result = await fetch(base, { headers });
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain('private database');
});
