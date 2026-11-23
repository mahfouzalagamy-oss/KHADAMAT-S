// @vitest-environment node
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireIdentity } from '../../server/lib/auth';

describe('server identity boundary', () => {
  let server: Server;
  let url: string;
  const verify = vi.fn();
  beforeEach(async () => {
    verify.mockReset();
    const app = express();
    app.use(express.json());
    app.post('/protected', requireIdentity(verify), (_req, res) => res.json(res.locals.identity));
    await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/protected`;
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  it.each(['', 'Basic abc', 'Bearer', 'Bearer a,b', 'Bearer a b'])('rejects malformed credentials %s', async (authorization) => {
    const response = await fetch(url, { method: 'POST', headers: { authorization } });
    expect(response.status).toBe(401);
    expect(verify).not.toHaveBeenCalled();
  });
  it('rejects invalid or expired tokens', async () => {
    verify.mockResolvedValue(null);
    expect((await fetch(url, { method: 'POST', headers: { authorization: 'Bearer invalid' } })).status).toBe(401);
  });
  it('uses the verified identity instead of caller-supplied identity and role', async () => {
    verify.mockResolvedValue({ id: 'customer-a' });
    const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer valid', 'content-type': 'application/json' }, body: JSON.stringify({ userId: 'customer-b', role: 'admin' }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'customer-a' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('fails closed if Auth is unavailable without exposing its error', async () => {
    verify.mockRejectedValue(new Error('private configuration detail'));
    const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer valid' } });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private configuration');
  });
});
