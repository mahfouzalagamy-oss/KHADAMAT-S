import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

type Environment = Record<string, string | undefined>;
export function localDemoEnabled(env: Environment): boolean {
  return env.NODE_ENV === 'development'
    && env.ENABLE_LOCAL_DEMO_SYNC === 'true'
    && !env.SUPABASE_SECRET_KEY;
}

function isLoopback(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

/** Legacy full-array sync is demo-only, never an authenticated production API. */
export function allowLegacyUpgrade(req: IncomingMessage, env: Environment): boolean {
  if (!localDemoEnabled(env) || !isLoopback(req.socket.remoteAddress)) return false;
  if (!req.headers.origin || !req.headers.host) return false;
  try {
    const origin = new URL(req.headers.origin);
    return origin.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
      && origin.host === req.headers.host;
  } catch {
    return false;
  }
}

export function rejectLegacyUpgrade(socket: Duplex): void {
  socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
}
