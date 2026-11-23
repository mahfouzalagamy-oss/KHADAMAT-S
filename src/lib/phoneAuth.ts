import { supabase } from './supabase';

export function normalizeEgyptianMobile(value: string): string {
  const digits = value.trim().replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
  const local = digits.replace(/^(?:\+20|0020|20)/, '0');
  if (!/^01[0125]\d{8}$/.test(local)) {
    throw new Error('أدخل رقم موبايل مصري صحيح مكونًا من 11 رقمًا.');
  }
  return `+20${local.slice(1)}`;
}

export async function sendPhoneOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizeEgyptianMobile(phone),
    options: { channel: 'sms' },
  });
  if (error) throw new Error('تعذّر إرسال رمز التحقق. حاول لاحقًا أو تواصل مع الدعم.');
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<string> {
  if (!/^\d{6}$/.test(token)) throw new Error('أدخل رمز التحقق المكون من 6 أرقام.');
  const normalized = normalizeEgyptianMobile(phone);
  const { data, error } = await supabase.auth.verifyOtp({ phone: normalized, token, type: 'sms' });
  if (error || !data.session || !data.user || data.user.phone !== normalized.slice(1)) {
    throw new Error('رمز التحقق غير صحيح أو انتهت صلاحيته.');
  }
  return data.user.id;
}
