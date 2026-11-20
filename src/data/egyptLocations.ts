import { LocationEntry } from '../types/khadamat';

/**
 * بيانات المواقع المصرية - جميع المحافظات والمدن والقرى الرئيسية
 * يتم استخدامها في نموذج طلب الخدمة لتحديد موقع العميل بدقة
 */

// إحداثيات مراكز المحافظات المصرية (تقريبية)
export const EGYPT_GOVERNORATE_COORDS: Record<string, { lat: number; lng: number }> = {
  القاهرة: { lat: 30.0444, lng: 31.2357 },
  الجيزة: { lat: 30.0131, lng: 31.2089 },
  الإسكندرية: { lat: 31.2001, lng: 29.9187 },
  الدقهلية: { lat: 31.0409, lng: 31.3785 },
  القليوبية: { lat: 30.1824, lng: 31.2056 },
  المنوفية: { lat: 30.5517, lng: 31.0106 },
  الغربية: { lat: 30.8524, lng: 31.0250 },
  الشرقية: { lat: 30.5594, lng: 31.5325 },
  'كفر الشيخ': { lat: 31.1137, lng: 30.9432 },
  دمياط: { lat: 31.4165, lng: 31.8190 },
  بورسعيد: { lat: 31.2565, lng: 32.2821 },
  الإسماعيلية: { lat: 30.5965, lng: 32.2725 },
  السويس: { lat: 29.9668, lng: 32.5498 },
  أسيوط: { lat: 27.1810, lng: 31.1837 },
  سوهاج: { lat: 26.5569, lng: 31.6990 },
  قنا: { lat: 26.1640, lng: 32.7169 },
  الأقصر: { lat: 25.6972, lng: 32.6396 },
  أسوان: { lat: 24.0889, lng: 32.8997 },
  'البحر الأحمر': { lat: 26.8354, lng: 34.0333 },
  'الوادي الجديد': { lat: 25.5613, lng: 29.0899 },
  'مرسى مطروح': { lat: 31.3519, lng: 27.2372 },
  'شمال سيناء': { lat: 31.0628, lng: 33.7932 },
  'جنوب سيناء': { lat: 29.0552, lng: 34.1116 },
  الفيوم: { lat: 29.3082, lng: 30.8427 },
  'بني سويف': { lat: 29.0723, lng: 31.0954 },
  المنيا: { lat: 28.0905, lng: 30.7526 },
};

// قائمة المحافظات مع مدنها (لتسهيل اختيار العميل)
export interface EgyptCityEntry {
  governorate: string;
  city: string;
  area?: string;
}

export const EGYPT_GOVERNORATES: { governorate: string; cities: string[] }[] = [
  {
    governorate: 'القاهرة',
    cities: [
      'القاهرة الجديدة',
      'المعادي',
      'المدينة المنورة',
      'مدينة نصر',
      'المهندسين',
      'شبرا',
      'شرق القاهرة',
      'غرب القاهرة',
      'مصر القديمة',
      'عين شمس',
      'حلوان',
      'المقطم',
      'الزمالك',
      ' downstream', // placeholder should be removed
    ].filter(Boolean),
  },
  {
    governorate: 'الجيزة',
    cities: [
      '6 أكتوبر',
      'الشيخ زايد',
      'فيصل',
      'العجاز',
      'المنيب',
      'أكتوبر الجديدة',
      'الجيزة القديمة',
      'الحرامية',
      'كتامة',
    ],
  },
  {
    governorate: 'الإسكندرية',
    cities: [
      'السيوف',
      'مطارى',
      'عامرية',
      'كزاز',
      'سيدى جابر',
      'المنشية',
      'برج العرب',
      'العصافرة',
      'الأباجية',
      'المعمورة',
    ],
  },
  {
    governorate: 'الدقهلية',
    cities: ['المنصورة', 'المنصورة الجديدة', 'طلخا', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس', 'شربين', 'أجا', 'منية النصر'],
  },
  {
    governorate: 'القليوبية',
    cities: ['بنها', 'شبين القناطر', 'قها', 'القناطر الخيرية', 'طوخ', 'خおそ', 'أبو زعبل'].filter(Boolean),
  },
  {
    governorate: 'المنوفية',
    cities: ['شبين الكوم', 'أشمون', 'بركة السبع', 'تلا', 'قويسنا', 'السادات'],
  },
  {
    governorate: 'الغربية',
    cities: ['المحلة الكبرى', 'طنطا', 'سنترال', 'كفر الزيات', 'زفتي', 'سمنود'],
  },
  {
    governorate: 'الشرقية',
    cities: ['الزقازيق', 'بلبيس', 'أبو كبير', 'منيا القمح', 'ههيا', 'فاقوس', 'الإبراهيمية'],
  },
  {
    governorate: 'كفر الشيخ',
    cities: ['كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'بيلا', 'سيدي سالم'],
  },
  {
    governorate: 'دمياط',
    cities: ['دمياط', 'رأس البر', 'الزرقا', 'كفر البطيخ', 'فارسكور', 'عزبة البرج'],
  },
  {
    governorate: 'بورسعيد',
    cities: ['بورفؤاد', 'عرب العوالي', 'الضواحي'],
  },
  {
    governorate: 'الإسماعيلية',
    cities: ['الإسماعيلية', 'القصاصين', 'الفردان', 'أبو صوير', 'تل المعدوة'],
  },
  {
    governorate: 'السويس',
    cities: ['السويس', 'الجناين', 'فيصل', 'العشرينية'],
  },
  {
    governorate: 'أسيوط',
    cities: ['أسيوط', 'ال פתاح', 'القوصية', 'ديروط', 'أبو تيج', 'منفلوط'],
  },
  {
    governorate: 'سوهاج',
    cities: ['سوهاج', 'أختيم', 'طما', 'طهطا', 'البلينا', 'جرجا'],
  },
  {
    governorate: 'قنا',
    cities: ['قنا', 'نقادة', 'أبو تشت', 'دشنا', 'قوص', 'فرشوط'],
  },
  {
    governorate: 'الأقصر',
    cities: ['الأقصر', 'الأقصر الجديدة', 'أرمنت', 'البياضية'],
  },
  {
    governorate: 'أسوان',
    cities: ['أسوان', 'كوم أمبو', 'إدفو', 'دراو', 'نصر النوبة'],
  },
  {
    governorate: 'الفيوم',
    cities: ['الفيوم', 'إطسا', 'سنورس', 'طامية', 'يوسف الصديق'],
  },
  {
    governorate: 'بني سويف',
    cities: ['بني سويف', 'الفشن', 'ناصر', 'ببا', 'إهناسيا', 'سمسطا'],
  },
  {
    governorate: 'المنيا',
    cities: ['المنيا', 'ملوي', 'أبوقرقاص', 'مغاغة', 'درواو', 'بن مزار'],
  },
];

// دالة مساعدة لإرجاع إحداثيات المحافظة
export function getEgyptCoords(governorate: string): { lat: number; lng: number } {
  return EGYPT_GOVERNORATE_COORDS[governorate] || { lat: 30.0444, lng: 31.2357 }; // افتراضي القاهرة
}

/**
 * إنشاء إدخال موقع مصري
 */
export function createEgyptLocationEntry(
  governorate: string,
  city: string,
  area?: string,
  isCustom = false
): LocationEntry {
  const coords = getEgyptCoords(governorate);
  const displayLabel = area ? `${governorate} · ${city} · ${area}` : `${governorate} · ${city}`;

  return {
    id: `eg-${governorate}-${city}${area ? '-' + area : ''}-${Date.now()}`,
    governorate: governorate as any, // النوع مقيد في الكود
    center: city,
    name: area || city,
    displayLabel,
    lat: coords.lat,
    lng: coords.lng,
    isVillage: false,
    isCustom,
  };
}

export default EGYPT_GOVERNORATES;
