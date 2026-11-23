import { beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ signInWithOtp: vi.fn(), verifyOtp: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { auth } }));
import { normalizeEgyptianMobile, sendPhoneOtp, verifyPhoneOtp } from './phoneAuth';

beforeEach(() => vi.resetAllMocks());

describe('Egyptian phone identity', () => {
  it.each(['01012345678', '+201012345678', '00201012345678', '201012345678', '٠١٠١٢٣٤٥٦٧٨', '010 1234 5678'])('normalizes %s', (phone) => {
    expect(normalizeEgyptianMobile(phone)).toBe('+201012345678');
  });
  it.each(['', '01312345678', '+97412345678', '0101234567', '010123456789', 'abc01012345678'])('rejects %s', (phone) => {
    expect(() => normalizeEgyptianMobile(phone)).toThrow();
  });
  it('requests an SMS through the auth provider', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    await sendPhoneOtp('01012345678');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+201012345678', options: { channel: 'sms' } });
  });
  it('does not pretend an SMS was sent on provider failure', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { message: 'private provider details' } });
    await expect(sendPhoneOtp('01012345678')).rejects.toThrow('تعذّر إرسال');
  });
  it('rejects a four-digit legacy OTP without calling the provider', async () => {
    await expect(verifyPhoneOtp('01012345678', '1234')).rejects.toThrow();
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
  it.each([
    { session: null, user: { id: 'u1', phone: '201012345678' } },
    { session: { access_token: 'test-only' }, user: { id: 'u1', phone: '201112345678' } },
  ])('requires a session for the verified phone', async (data) => {
    auth.verifyOtp.mockResolvedValue({ data, error: null });
    await expect(verifyPhoneOtp('01012345678', '123456')).rejects.toThrow();
  });
  it('returns the provider identity after verification', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'test-only' }, user: { id: 'u1', phone: '201012345678' } }, error: null });
    await expect(verifyPhoneOtp('01012345678', '123456')).resolves.toBe('u1');
  });
});
