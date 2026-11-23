// @vitest-environment node
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocket } from 'ws';
import { expect, it } from 'vitest';
import { allowLegacyUpgrade, localDemoEnabled, rejectLegacyUpgrade } from '../../server/lib/legacyRealtimeGuard';

const demo = { NODE_ENV: 'development', ENABLE_LOCAL_DEMO_SYNC: 'true' };
function request(address = '127.0.0.1', origin = 'http://localhost:3000', host = 'localhost:3000') {
  return { socket: { remoteAddress: address }, headers: { origin, host } } as IncomingMessage;
}
it.each([
  {},
  { ...demo, NODE_ENV: 'production' },
  { ...demo, NODE_ENV: 'test' },
  { ...demo, SUPABASE_SECRET_KEY: 'test-secret' },
  { ...demo, ENABLE_LOCAL_DEMO_SYNC: 'false' },
])('fails closed for environment %j', (env) => {
  expect(localDemoEnabled(env)).toBe(false);
  expect(allowLegacyUpgrade(request(), env)).toBe(false);
});
it('allows only an explicit local demo without administrative credentials', () => {
  expect(allowLegacyUpgrade(request(), demo)).toBe(true);
});
it.each([
  ['192.168.1.2', 'http://localhost:3000', 'localhost:3000'],
  ['127.0.0.1', 'https://evil.example', 'localhost:3000'],
  ['127.0.0.1', 'http://localhost:4000', 'localhost:3000'],
  ['127.0.0.1', '', 'localhost:3000'],
  ['127.0.0.1', 'invalid', 'localhost:3000'],
])('rejects remote or cross-origin upgrade %s %s', (address, origin, host) => {
  expect(allowLegacyUpgrade(request(address, origin, host), demo)).toBe(false);
});
it('rejects a real websocket handshake without sending a data frame', async () => {
  const server = createServer();
  server.on('upgrade', (_req, socket) => rejectLegacyUpgrade(socket));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const status = await new Promise<number>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${(server.address() as AddressInfo).port}/ws`);
      ws.on('open', () => { ws.close(); reject(new Error('Unexpected accepted connection')); });
      ws.on('unexpected-response', (_req, response) => { response.resume(); resolve(response.statusCode ?? 0); });
      ws.on('error', reject);
    });
    expect(status).toBe(403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
