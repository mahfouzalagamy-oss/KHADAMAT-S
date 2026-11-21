/**
 * أدوات التواصل عبر واتساب للعميل والفني
 */

/**
 * فتح واتساب برقم ورسالة مخصصة مسبقاً
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  // إزالة أي مسافات أو رموز من الرقم وإضافة رمز الدولة مصر إذا لم يكن موجوداً
  let cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[+()\-]/g, '');

  // إذا بدأ الرقم بـ 0 (محلي مصري)، حوله إلى +2
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '2' + cleanPhone.substring(1);
  }

  // إذا لم يبدأ بـ +، أضف Symbol +
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // فتح في نافذة جديدة
  window.open(url, '_blank');
}

/**
 * فتح تطبيق الهاتف للاتصال برقم
 */
export function openPhoneCall(phoneNumber: string): void {
  let cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[+()\-]/g, '');
  window.location.href = `tel:${cleanPhone}`;
}

/**
 * إنشاء رسالة واتساب لقبول عرض خدمة
 */
export function createAcceptQuoteMessage(
  technicianName: string,
  requestTitle: string,
  priceEGP: number
): string {
  return `أهلاً ${technicianName},\n\nأنا مهتم بعرضك لخدمة "${requestTitle}" بسعر ${priceEGP.toLocaleString('ar-EG')} جنيه.\nهل يمكنك تأكيد الموعد والموقع؟\nشكراً، تطبيق خدمات`;
}

/**
 * إنشاء رسالة واتساب لتأكيد إتمام الخدمة
 */
export function createJobCompletedMessage(
  technicianName: string,
  requestTitle: string
): string {
  return `أهلاً ${technicianName},\n\nتم تأكيد إتمام خدمة "${requestTitle}" بنجاح.\nشكراً لك على ثقتك في تطبيق خدمات.\nيمكنك تقييم الخدمة عبر التطبيق.`;
}
