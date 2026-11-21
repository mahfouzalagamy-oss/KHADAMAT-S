import {
  AppNotification,
  HomePlannerProfile,
  LocationEntry,
  LoyaltyRedemption,
  LoyaltyRewardTier,
  PaymentMethod,
  PlannerRecommendation,
  PromoCode,
  RecurrenceFrequency,
  RecurringSchedule,
  RequestMessage,
  SavedAddress,
  SeasonalBundle,
  ServiceCategory,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';
import {
  DEFAULT_DAKAHLIA_DISTRICT,
  EGYPT_LOCATIONS,
  findNearestMatchingTechnicians,
} from './dakahliaLocations';

export const HERO_IMAGE_PATH = '/src/assets/images/cartoon_hero_khadamat_1794956209485.webp';

const IMG_AC = '/src/assets/images/cartoon_ac_service_1794956210988.webp';
const IMG_PLUMBING = '/src/assets/images/cartoon_plumbing_service_1794956210605.webp';
const IMG_ELECTRICAL = '/src/assets/images/cartoon_electrical_service_1794956211565.webp';
const IMG_CLEANING = '/src/assets/images/cartoon_cleaning_service_1794956212778.webp';
const IMG_SMART_HOME = '/src/assets/images/cartoon_smart_home_1794956211324.webp';
const IMG_PAINT_WOOD = '/src/assets/images/cartoon_paint_wood_1794956232344.webp';
const IMG_GARDEN_CARE = '/src/assets/images/cartoon_garden_care_1794956232380.webp';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'ac',
    name: 'التكييف والتبريد',
    shortDesc: 'غسيل، شحن فريون، صيانة وتركيب',
    iconKey: 'ac',
    servicesCount: 3,
  },
  {
    id: 'plumbing',
    name: 'السباكة',
    shortDesc: 'خلاطات، تسريب مياه، سخانات وصرف',
    iconKey: 'plumbing',
    servicesCount: 3,
  },
  {
    id: 'electrical',
    name: 'الكهرباء',
    shortDesc: 'لوحات توزيع، إنارة، مفاتيح وأعطال',
    iconKey: 'electrical',
    servicesCount: 2,
  },
  {
    id: 'cleaning',
    name: 'تنظيف المنازل',
    shortDesc: 'تنظيف عميق، سجاد، أنتريهات ومطابخ',
    iconKey: 'cleaning',
    servicesCount: 3,
  },
  {
    id: 'carpentry',
    name: 'النجارة والأثاث',
    shortDesc: 'فك وتركيب غرف، أبواب ومفصلات',
    iconKey: 'carpentry',
    servicesCount: 2,
  },
  {
    id: 'painting',
    name: 'الدهانات والديكور',
    shortDesc: 'دهان غرف، معالجة رطوبة وورق حائط',
    iconKey: 'painting',
    servicesCount: 1,
  },
  {
    id: 'appliances',
    name: 'الأجهزة المنزلية',
    shortDesc: 'غسالات، ثلاجات، بوتاجازات وميكروويف',
    iconKey: 'appliances',
    servicesCount: 1,
  },
  {
    id: 'pest_control',
    name: 'مكافحة الحشرات',
    shortDesc: 'رش آمن بدون رائحة للمنازل والفلل',
    iconKey: 'pest_control',
    servicesCount: 2,
  },
  {
    id: 'security_tech',
    name: 'الكاميرات والشبكات والدش',
    shortDesc: 'كاميرات مراقبة، دش مركزي، إنتركم وواي فاي',
    iconKey: 'security_tech',
    servicesCount: 2,
  },
  {
    id: 'moving',
    name: 'نقل وتغليف الأثاث',
    shortDesc: 'نقل عفش، تغليف احترافي وونش رفع',
    iconKey: 'moving',
    servicesCount: 1,
  },
  {
    id: 'tanks_garden',
    name: 'الخزانات والحدائق',
    shortDesc: 'غسيل خزانات المياه وتنسيق حدائق الفلل',
    iconKey: 'tanks_garden',
    servicesCount: 2,
  },
  {
    id: 'aluminum_gypsum',
    name: 'الألوميتال والجبس والحدادة',
    shortDesc: 'شبابيك ألوميتال، سلك بليسيه وجبس بورد',
    iconKey: 'aluminum_gypsum',
    servicesCount: 1,
  },
  {
    id: 'carwash',
    name: 'غسيل السيارات بالمنزل',
    shortDesc: 'غسيل بالبخار وتلميع أمام منزلك',
    iconKey: 'carwash',
    servicesCount: 1,
  },
  {
    id: 'electronics',
    name: 'الإلكترونيات والكمبيوتر',
    shortDesc: 'صيانة لابتوب، شاشات سمارت، بلايستيشن وطابعات',
    iconKey: 'electronics',
    servicesCount: 2,
  },
  {
    id: 'networks',
    name: 'الشبكات والواي فاي',
    shortDesc: 'شبكات Mesh، تمديد CAT6، راوتر وفايبر منزلي',
    iconKey: 'networks',
    servicesCount: 2,
  },
];

export const SERVICES_CATALOG: ServiceItem[] = [
  {
    id: 'ac-clean-split',
    categoryId: 'ac',
    title: 'غسيل وصيانة تكييف سبليت شامل',
    summary: 'تنظيف الوحدتين بالضغط وفحص الفريون',
    description: 'صيانة وتنظيف للتكييف السبليت.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.9,
    reviewsCount: 412,
    warrantyDays: 30,
    imageUrl: IMG_AC,
    isPopular: true,
    included: [
      'تنظيف الفلاتر والمبخر بالمياه المضغوطة',
      'تسليك خرطوم الصرف',
      'فحص الوحدة الخارجية وضغط الفريون',
    ],
  },
  {
    id: 'ac-freon-full',
    categoryId: 'ac',
    title: 'كشف تسريب وشحن فريون',
    summary: 'فحص الدائرة ومعالجة التسريب وشحن الفريون',
    description: 'كشف تسريب وشحن فريون للتكييف.',
    estimatedDuration: '90 دقيقة',
    rating: 4.8,
    reviewsCount: 189,
    warrantyDays: 30,
    imageUrl: IMG_AC,
    included: [
      'فحص مواسير النحاس والصمامات',
      'تفريغ الهواء قبل الشحن',
      'شحن فريون R22 أو R410A',
    ],
  },
  {
    id: 'ac-install',
    categoryId: 'ac',
    title: 'فك وتركيب ونقل تكييف',
    summary: 'فك مع حبس الفريون وإعادة التركيب بالوزن',
    description: 'نقل وتركيب أجهزة التكييف السبليت.',
    estimatedDuration: '120 – 150 دقيقة',
    rating: 4.9,
    reviewsCount: 143,
    warrantyDays: 30,
    imageUrl: IMG_AC,
    included: [
      'حبس الفريون داخل الوحدة قبل الفك',
      'تثبيت القاعدة الداخلية والحامل الخارجي',
      'التشغيل التجريبي وقياس الأمبير',
    ],
  },
  {
    id: 'plumb-faucet',
    categoryId: 'plumbing',
    title: 'تركيب أو تغيير خلاطات ومستلزمات صحية',
    summary: 'فك الخلاط القديم وتركيب الجديد مع اختبار مانع التسريب',
    description: 'تركيب خلاطات المطبخ والحمام والأحواض.',
    estimatedDuration: '45 – 60 دقيقة',
    rating: 4.9,
    reviewsCount: 325,
    warrantyDays: 30,
    imageUrl: IMG_PLUMBING,
    isPopular: true,
    included: [
      'فك الخلاط القديم وتنظيف سنون التغذية',
      'تركيب الخلاط الجديد بالتفلون والكاوتشات',
      'اختبار ضغط المياه ومنع التنقيط',
    ],
  },
  {
    id: 'plumb-leak',
    categoryId: 'plumbing',
    title: 'كشف ومعالجة تسريب المياه والصرف',
    summary: 'تحديد مصدر التسريب وإصلاح الوصلات ومواتير المياه',
    description: 'فحص ومعالجة تسريبات التغذية والصرف.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.7,
    reviewsCount: 214,
    warrantyDays: 30,
    imageUrl: IMG_PLUMBING,
    included: [
      'فحص وصلات الحمام والمطبخ والغسالة',
      'إعادة عزل بالسيليكون الصحي أو التفلون',
      'اختبار التشغيل بعد الإصلاح',
    ],
  },
  {
    id: 'plumb-heater',
    categoryId: 'plumbing',
    title: 'تركيب وصيانة سخان مياه كهرباء أو غاز',
    summary: 'تركيب آمن للسخان مع صمام الأمان وتنظيف الشمعات',
    description: 'تركيب وصيانة السخانات وتغيير الثرموستات.',
    estimatedDuration: '75 دقيقة',
    rating: 4.8,
    reviewsCount: 162,
    warrantyDays: 30,
    imageUrl: IMG_PLUMBING,
    included: [
      'التثبيت الآمن على الحائط',
      'تركيب شيك بلف الأمان ووصلات المياه',
      'اختبار الفصل الأوتوماتيكي للحرارة',
    ],
  },
  {
    id: 'elec-panel',
    categoryId: 'electrical',
    title: 'فحص لوحة الكهرباء وتغيير القواطع',
    summary: 'تشخيص أعطال الفصل المتكرر واختبار الأحمال بالأجهزة الرقمية',
    description: 'فحص لوحة التوزيع وتأمين الأسلاك والقواطع.',
    estimatedDuration: '60 دقيقة',
    rating: 4.9,
    reviewsCount: 278,
    warrantyDays: 30,
    imageUrl: IMG_ELECTRICAL,
    isPopular: true,
    included: [
      'قياس الجهد والأحمال بالملتيميتر الرقمي',
      'ربط وتأمين ترامل اللوحة الرئيسية',
      'تحديد سبب الفصل المفاجئ للتيار',
    ],
  },
  {
    id: 'elec-lighting',
    categoryId: 'electrical',
    title: 'تركيب نجف، سبوتات ومفاتيح إنارة',
    summary: 'تثبيت وحدات الإضاءة الحديثة وتبديل البرايز والمراوح',
    description: 'تركيب النجف والسبوتات والمفاتيح والبرايز.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.8,
    reviewsCount: 301,
    warrantyDays: 30,
    imageUrl: IMG_ELECTRICAL,
    included: [
      'تركيب وتوصيل وحدات الإضاءة والنجف',
      'عزل التوصيلات بأغطية حماية قياسية',
      'اختبار التشغيل لكل خط إنارة',
    ],
  },
  {
    id: 'clean-home-deep',
    categoryId: 'cleaning',
    title: 'تنظيف شامل للشقق والفلل',
    summary: 'تنظيف الأرضيات والحمامات والمطبخ بالتعقيم',
    description: 'تنظيف شامل وتعقيم للشقق والفلل.',
    estimatedDuration: '3 – 5 ساعات',
    rating: 4.9,
    reviewsCount: 518,
    warrantyDays: 7,
    imageUrl: IMG_CLEANING,
    isPopular: true,
    included: [
      'تنظيف وتلميع الأرضيات والسيراميك والباركيه',
      'تعقيم الحمامات وإزالة التكلسات',
      'إزالة دهون المطبخ والشفاط والرخام',
    ],
  },
  {
    id: 'clean-sofa-carpet',
    categoryId: 'cleaning',
    title: 'غسيل أنتريه وسجاد بالبخار في المنزل',
    summary: 'إزالة البقع والروائح بالماكينات والتجفيف السريع',
    description: 'غسيل وتعقيم الأنتريهات والركن والسجاد بالمنزل.',
    estimatedDuration: '90 – 120 دقيقة',
    rating: 4.8,
    reviewsCount: 247,
    warrantyDays: 7,
    imageUrl: IMG_CLEANING,
    included: [
      'شفط الأتربة العميقة قبل الغسيل',
      'معالجة البقع الصعبة بمزيل آمن',
      'شطف وسحب المياه بالبخار الساخن',
    ],
  },
  {
    id: 'clean-post-renovation',
    categoryId: 'cleaning',
    title: 'تنظيف ما بعد التشطيب والدهان',
    summary: 'إزالة بقايا الأسمنت والدهانات من الأرضيات والألوميتال',
    description: 'تجهيز الشقق الجديدة للسكن بدون خدش السيراميك.',
    estimatedDuration: '4 – 6 ساعات',
    rating: 4.9,
    reviewsCount: 94,
    warrantyDays: 7,
    imageUrl: IMG_CLEANING,
    included: [
      'إزالة آثار الدهانات واللاصق من الشبابيك',
      'غسيل شامل للحوائط والأرضيات',
      'تلميع الحمامات والمطابخ والأبواب',
    ],
  },
  {
    id: 'carp-furniture-assembly',
    categoryId: 'carpentry',
    title: 'فك وتركيب أثاث وغرف نوم',
    summary: 'تركيب الأثاث المودرن وإصلاح المفصلات والمجاري',
    description: 'فك وتركيب الدواليب والأسرة والمطابخ بدقة.',
    estimatedDuration: '120 دقيقة',
    rating: 4.8,
    reviewsCount: 175,
    warrantyDays: 30,
    imageUrl: IMG_PAINT_WOOD,
    included: [
      'فك أو تركيب غرف النوم والمطابخ',
      'ضبط مفصلات الأبواب ومجاري الأدراج',
      'تثبيت القطع العالية بالحائط بالأفيشر',
    ],
  },
  {
    id: 'carp-doors-locks',
    categoryId: 'carpentry',
    title: 'إصلاح أبواب خشب وتغيير كوالين',
    summary: 'ضبط احتكاك الأبواب وتبديل الكوالين والمقابض',
    description: 'معالجة الأبواب الخشبية أو المصفحة وتغيير الكالون.',
    estimatedDuration: '60 دقيقة',
    rating: 4.7,
    reviewsCount: 138,
    warrantyDays: 30,
    imageUrl: IMG_PAINT_WOOD,
    included: [
      'ضبط حواف الباب والكالون',
      'تغيير قلب كالون أو مقبض باب',
      'تثبيت مصد أرضي للأبواب',
    ],
  },
  {
    id: 'paint-room',
    categoryId: 'painting',
    title: 'دهان شقق وغرف ومعالجة الرطوبة',
    summary: 'معجنة، صنفرة، ودهان بلاستيك قابل للغسيل وديكورات حديثة',
    description: 'تجديد ألوان الغرف والشقق ومعالجة الرطوبة.',
    estimatedDuration: 'يوم – يومين حسب المساحة',
    rating: 4.8,
    reviewsCount: 112,
    warrantyDays: 30,
    imageUrl: IMG_PAINT_WOOD,
    included: [
      'تغطية الأثاث والأرضيات بالنايلون الواقي',
      'معجنة الشقوق وصنفرة الحوائط',
      'تطبيق دهانات عالية الجودة',
    ],
  },
  {
    id: 'app-washing-fridge',
    categoryId: 'appliances',
    title: 'صيانة غسالات وثلاجات وبوتاجازات',
    summary: 'كشف الأعطال بالمنزل وإصلاح الطلمبة أو الثرموستات أو البوردة',
    description: 'فحص وإصلاح أجهزة المطبخ بالمنزل.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.8,
    reviewsCount: 263,
    warrantyDays: 30,
    imageUrl: IMG_ELECTRICAL,
    included: [
      'فحص تشخيصي كامل للجهاز بالمنزل',
      'تنظيف الفلاتر وصرف الغسالة أو الثلاجة',
      'اختبار دورة التشغيل والتسخين أو التبريد',
    ],
  },
  {
    id: 'pest-home-spray',
    categoryId: 'pest_control',
    title: 'رش ومكافحة الحشرات بدون رائحة',
    summary: 'مكافحة الصراصير والنمل والبق بمبيدات آمنة على الأطفال',
    description: 'رش وقائي وعلاجي آمن بدون مغادرة المنزل.',
    estimatedDuration: '45 – 75 دقيقة',
    rating: 4.9,
    reviewsCount: 219,
    warrantyDays: 90,
    imageUrl: IMG_GARDEN_CARE,
    isPopular: true,
    included: [
      'حقن الجل في المطبخ ومناطق الاختباء',
      'رش محيط الأبواب والنوافذ بمواد معتمدة',
      'ضمان متابعة لمدة 3 شهور',
    ],
  },
  {
    id: 'pest-garden-villa',
    categoryId: 'pest_control',
    title: 'تعقيم ومكافحة حشرات الفلل والمداخل',
    summary: 'تطهير الحدائق والأدوار الأرضية ضد الزواحف والقوارض والناموس',
    description: 'حماية شاملة للفلل وحدائق المنصورة الجديدة.',
    estimatedDuration: '90 دقيقة',
    rating: 4.8,
    reviewsCount: 84,
    warrantyDays: 90,
    imageUrl: IMG_GARDEN_CARE,
    included: [
      'رش محيط السور والحديقة والبيارات',
      'تأمين فتحات التهوية ومصائد مخصصة',
      'متابعة وقائية بعد 15 يوماً',
    ],
  },
  {
    id: 'sec-cctv-install',
    categoryId: 'security_tech',
    title: 'تركيب كاميرات مراقبة وإنتركم منزلي',
    summary: 'تركيب كاميرات HD وربط المشاهدة على الموبايل بالإنترنت',
    description: 'توريد وتركيب كاميرات المراقبة والإنتركم.',
    estimatedDuration: '2 – 3 ساعات',
    rating: 4.9,
    reviewsCount: 168,
    warrantyDays: 180,
    imageUrl: IMG_SMART_HOME,
    isPopular: true,
    included: [
      'تثبيت الكاميرات وتمديد السلك باحترافية',
      'برمجة جهاز التسجيل والربط بالموبايل',
      'تدريب العميل على المشاهدة والتشغيل',
    ],
  },
  {
    id: 'sec-wifi-dish',
    categoryId: 'security_tech',
    title: 'ضبط شبكة الواي فاي وتركيب الدش المركزي',
    summary: 'تمديد نقاط إنترنت وأكسس بوينت وتوجيه أطباق الدش',
    description: 'تقوية شبكة الواي فاي وإصلاح إشارة الدش.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.8,
    reviewsCount: 142,
    warrantyDays: 30,
    imageUrl: IMG_SMART_HOME,
    included: [
      'تمديد سلك CAT6 وتثبيت مقوي الإشارة',
      'ضبط إشارة الدش وقنوات الاستقبال',
      'اختبار السرعة في جميع الغرف',
    ],
  },
  {
    id: 'move-furniture-winch',
    categoryId: 'moving',
    title: 'نقل وتغليف الأثاث مع ونش رفع',
    summary: 'فك وتغليف ونقل العفش بسيارة مغلقة داخل الدقهلية',
    description: 'نقل عفش آمن بالكرتون والاسترتش وونش هيدروليك.',
    estimatedDuration: '3 – 6 ساعات',
    rating: 4.9,
    reviewsCount: 192,
    warrantyDays: 14,
    imageUrl: IMG_PAINT_WOOD,
    included: [
      'تغليف قطع الأثاث والأجهزة الحساسة',
      'فك وإعادة تركيب الغرف والنجف',
      'توفير ونش رفع للأدوار العليا عند الحاجة',
    ],
  },
  {
    id: 'tanks-clean',
    categoryId: 'tanks_garden',
    title: 'غسيل وتعقيم خزانات المياه',
    summary: 'تنظيف الرواسب والطحالب وتعقيم الخزان بمواد آمنة معتمدة',
    description: 'تنظيف وتطهير خزانات المياه العلوية والأرضية.',
    estimatedDuration: '90 دقيقة',
    rating: 4.9,
    reviewsCount: 118,
    warrantyDays: 30,
    imageUrl: IMG_PLUMBING,
    included: [
      'تفريغ الخزان وإزالة الرواسب المترسبة',
      'غسيل الجدران الداخلية بالفرش والمعقمات',
      'شطف كامل وفحص العوامة والوصلات',
    ],
  },
  {
    id: 'garden-landscaping',
    categoryId: 'tanks_garden',
    title: 'تنسيق وقص حدائق الفلل والمداخل',
    summary: 'تهذيب الأشجار وقص النجيل وصيانة شبكة الري',
    description: 'رعاية دورية وتنسيق حدائق المنازل والفلل.',
    estimatedDuration: '2 – 3 ساعات',
    rating: 4.8,
    reviewsCount: 79,
    warrantyDays: 14,
    imageUrl: IMG_GARDEN_CARE,
    included: [
      'قص النجيل وتهذيب الأسوار الشجرية',
      'تسميد النباتات وتنظيف الأوراق الجافة',
      'فحص رشاشات الري والمواسير',
    ],
  },
  {
    id: 'alum-screen-gypsum',
    categoryId: 'aluminum_gypsum',
    title: 'صيانة ألوميتال وتركيب سلك بليسيه وجبس',
    summary: 'تغيير عجل ومقابض الألوميتال وتركيب سلك الناموس وإصلاح الجبس',
    description: 'إصلاح الشبابيك والأبواب الألوميتال والجبس بورد.',
    estimatedDuration: '60 – 120 دقيقة',
    rating: 4.8,
    reviewsCount: 109,
    warrantyDays: 30,
    imageUrl: IMG_PAINT_WOOD,
    included: [
      'ضبط مفصلات ومفاتيح شبابيك الألوميتال',
      'تركيب أو تغيير سلك بليسيه مانع للحشرات',
      'إعادة السكينة وعزل السيليكون حول الإطار',
    ],
  },
  {
    id: 'car-steam-wash',
    categoryId: 'carwash',
    title: 'غسيل وتلميع السيارة بالبخار أمام منزلك',
    summary: 'تنظيف خارجي وداخلي للصالون وتلميع الإطارات أمام بيتك',
    description: 'وحدة متنقلة لغسيل وتعقيم سيارتك أمام المنزل.',
    estimatedDuration: '60 دقيقة',
    rating: 4.9,
    reviewsCount: 204,
    warrantyDays: 7,
    imageUrl: IMG_CLEANING,
    included: [
      'غسيل الهيكل الخارجي بشمع الحماية',
      'تنظيف وشفط الفرش الأرضي والشنطة',
      'تلميع التابلوه والأبواب والإطارات',
    ],
  },
  {
    id: 'elec-tv-laptop',
    categoryId: 'electronics',
    title: 'صيانة لابتوب وشاشات سمارت بالمنزل',
    summary: 'كشف أعطال الشاشات، تنظيف وتبريد اللابتوب، وتحديث الهارد SSD',
    description: 'فحص وإصلاح أجهزة اللابتوب والشاشات الذكية أمامك بالمنزل.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.9,
    reviewsCount: 156,
    warrantyDays: 30,
    imageUrl: IMG_SMART_HOME,
    isPopular: true,
    included: [
      'فحص بوردة الباور والإضاءة الخلفية للشاشة',
      'تنظيف مروحة اللابتوب وتغيير معجون التبريد',
      'إعداد النظام وحل مشاكل البطء والحرارة',
    ],
  },
  {
    id: 'elec-console-ups',
    categoryId: 'electronics',
    title: 'صيانة بلايستيشن، طابعات وأجهزة UPS',
    summary: 'تنظيف أجهزة الألعاب، إصلاح الذراع، وضبط الطابعات ومانع الانقطاع',
    description: 'صيانة الأجهزة الإلكترونية المنزلية ومزودات الطاقة.',
    estimatedDuration: '60 دقيقة',
    rating: 4.8,
    reviewsCount: 92,
    warrantyDays: 30,
    imageUrl: IMG_SMART_HOME,
    included: [
      'تنظيف داخلي ومعجون حراري لأجهزة الألعاب',
      'صيانة مداخل HDMI وتبديل بطاريات UPS',
      'تعريف وربط الطابعات اللاسلكية بالمنزل',
    ],
  },
  {
    id: 'net-mesh-wifi',
    categoryId: 'networks',
    title: 'تأسيس وتقوية شبكة الواي فاي وMesh',
    summary: 'تغطية كل غرف الشقة أو الفيلا بدون تقطيع مع ضبط الراوتر وأمن الشبكة',
    description: 'حل مشكلة ضعف إشارة الواي فاي في الغرف البعيدة.',
    estimatedDuration: '60 – 90 دقيقة',
    rating: 4.9,
    reviewsCount: 174,
    warrantyDays: 30,
    imageUrl: IMG_SMART_HOME,
    isPopular: true,
    included: [
      'قياس نقاط ضعف الإشارة داخل الشقة أو الفيلا',
      'تركيب وبرمجة أنظمة Mesh أو Access Point',
      'تأمين الشبكة وضبط القنوات لعدم التداخل',
    ],
  },
  {
    id: 'net-fiber-cabling',
    categoryId: 'networks',
    title: 'تمديد نقاط شبكة CAT6 وتنظيم الراك المنزلي',
    summary: 'سحب كابلات إنترنت أصلية، تأريج السويتش، وتثبيت مخارج الحائط',
    description: 'تمديد وتنظيم كابلات الشبكة والإنترنت المنزلي والمكتبي.',
    estimatedDuration: '90 – 150 دقيقة',
    rating: 4.8,
    reviewsCount: 108,
    warrantyDays: 90,
    imageUrl: IMG_SMART_HOME,
    included: [
      'تمديد وتأريج كابلات CAT6 نقية النحاس',
      'اختبار سرعة الخط واستقرار البنغ للألعاب والعمل',
      'ترتيب الأسلاك داخل الصندوق وتثبيت البورتات',
    ],
  },
];

export const VERIFIED_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'م. أحمد محمود عبد السلام',
    isCompany: false,
    specialty: 'فني تكييف وتبريد وأجهزة منزلية',
    categoryIds: ['ac', 'appliances'],
    area: 'الدقهلية · المنصورة، طلخا، أجا',
    primaryCenter: 'المنصورة',
    coveredCenters: ['المنصورة', 'طلخا', 'أجا'],
    coveredAreas: [
      'الدقهلية · المنصورة - المنصورة (حي شرق - توريل - قناة السويس - جديلة)',
      'الدقهلية · المنصورة - المنصورة (حي غرب - المشاية - الجامعة - الجلاء)',
      'الدقهلية · طلخا - مدينة طلخا',
      'الدقهلية · أجا - مدينة أجا',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'national_id_front',
        label: 'صورة البطاقة الشخصية (وجه)',
        fileName: 'national-id-ahmed-front.jpg',
        fileSizeLabel: 'موثق',
      },
      {
        type: 'national_id_back',
        label: 'صورة البطاقة الشخصية (خلف)',
        fileName: 'national-id-ahmed-back.jpg',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 194,
    completedJobs: 640,
    yearsExp: 9,
    phone: '01098451230',
    initials: 'أم',
  },
  {
    id: 'tech-2',
    name: 'شركة الدلتا لخدمات التبريد والصيانة',
    isCompany: true,
    specialty: 'شركة متخصصة في التكييف والكهرباء والأجهزة',
    categoryIds: ['ac', 'electrical', 'appliances'],
    area: 'الدقهلية · المنصورة، المنصورة الجديدة، دكرنس، السنبلاوين، بلقاس',
    primaryCenter: 'دكرنس',
    coveredCenters: ['المنصورة', 'المنصورة الجديدة', 'دكرنس', 'السنبلاوين', 'بلقاس'],
    coveredAreas: [
      'الدقهلية · دكرنس - مدينة دكرنس',
      'الدقهلية · السنبلاوين - مدينة السنبلاوين',
      'الدقهلية · بلقاس - مدينة بلقاس',
      'الدقهلية · المنصورة - المنصورة (حي شرق - توريل - قناة السويس - جديلة)',
      'الدقهلية · المنصورة الجديدة - جنة 1 (Janna 1)',
      'الدقهلية · المنصورة الجديدة - سكن مصر',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'commercial_register',
        label: 'صورة السجل التجاري',
        fileName: 'delta-commercial-register.pdf',
        fileSizeLabel: 'موثق',
      },
      {
        type: 'tax_card',
        label: 'صورة البطاقة الضريبية',
        fileName: 'delta-tax-card.pdf',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.8,
    reviewsCount: 310,
    completedJobs: 920,
    yearsExp: 11,
    phone: '01022446688',
    initials: 'شد',
  },
  {
    id: 'tech-3',
    name: 'أ. كريم عبد الرحمن',
    isCompany: false,
    specialty: 'فني سباكة صحية وكشف تسريبات',
    categoryIds: ['plumbing'],
    area: 'الدقهلية · المنصورة (شاوة)، ميت غمر، السنبلاوين',
    primaryCenter: 'ميت غمر',
    coveredCenters: ['المنصورة', 'ميت غمر', 'السنبلاوين'],
    coveredAreas: [
      'الدقهلية · المنصورة - شاوة',
      'الدقهلية · ميت غمر - مدينة ميت غمر',
      'الدقهلية · ميت غمر - دقادوس',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'national_id_front',
        label: 'صورة البطاقة الشخصية (وجه)',
        fileName: 'karim-id-front.jpg',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 162,
    completedJobs: 512,
    yearsExp: 8,
    phone: '01145678921',
    initials: 'كع',
  },
  {
    id: 'tech-4',
    name: 'شركة النيل الذهبي للتنظيف والتشطيب',
    isCompany: true,
    specialty: 'شركة تنظيف شامل ومفروشات بالبخار ودهانات',
    categoryIds: ['cleaning', 'painting', 'carwash'],
    area: 'الدقهلية · المنصورة، المنصورة الجديدة، طلخا، جمصة، نبروه',
    primaryCenter: 'المنصورة',
    coveredCenters: ['المنصورة', 'المنصورة الجديدة', 'طلخا', 'جمصة', 'نبروه'],
    coveredAreas: [
      'الدقهلية · المنصورة - المنصورة (حي غرب - المشاية - الجامعة - الجلاء)',
      'الدقهلية · المنصورة الجديدة - كمبوند زاهية',
      'الدقهلية · المنصورة الجديدة - جنة 1 (Janna 1)',
      'الدقهلية · جمصة - مدينة جمصة',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'commercial_register',
        label: 'صورة السجل التجاري',
        fileName: 'nile-gold-cr.pdf',
        fileSizeLabel: 'موثق',
      },
      {
        type: 'tax_card',
        label: 'صورة البطاقة الضريبية',
        fileName: 'nile-gold-tax.pdf',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 405,
    completedJobs: 1120,
    yearsExp: 7,
    phone: '01223344556',
    initials: 'شن',
  },
  {
    id: 'tech-5',
    name: 'م. مصطفى السعيد',
    isCompany: false,
    specialty: 'مهندس كهرباء وأنظمة إنارة ولوحات',
    categoryIds: ['electrical', 'appliances'],
    area: 'الدقهلية · شربين، نبروه، بلقاس، المنصورة',
    primaryCenter: 'شربين',
    coveredCenters: ['شربين', 'نبروه', 'بلقاس', 'المنصورة'],
    coveredAreas: [
      'الدقهلية · شربين - مدينة شربين',
      'الدقهلية · شربين - بساط كريم الدين',
      'الدقهلية · نبروه - بهوت',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'national_id_front',
        label: 'صورة البطاقة الشخصية (وجه)',
        fileName: 'mostafa-id-front.jpg',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.8,
    reviewsCount: 145,
    completedJobs: 430,
    yearsExp: 11,
    phone: '01556677889',
    initials: 'مس',
  },
  {
    id: 'tech-6',
    name: 'أ. محمود فتحي حسن',
    isCompany: false,
    specialty: 'نجار أثاث مودرن وإصلاح أبواب',
    categoryIds: ['carpentry', 'painting'],
    area: 'الدقهلية · منية النصر، المنزلة، دكرنس، طلخا',
    primaryCenter: 'منية النصر',
    coveredCenters: ['منية النصر', 'المنزلة', 'دكرنس', 'طلخا'],
    coveredAreas: [
      'الدقهلية · منية النصر - مدينة منية النصر',
      'الدقهلية · منية النصر - برمبال الجديدة والقديمة',
      'الدقهلية · المنزلة - مدينة المنزلة',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'national_id_front',
        label: 'صورة البطاقة الشخصية (وجه)',
        fileName: 'mahmoud-id-front.jpg',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.8,
    reviewsCount: 118,
    completedJobs: 318,
    yearsExp: 12,
    phone: '01066554433',
    initials: 'مف',
  },
  {
    id: 'tech-7',
    name: 'مؤسسة أمان الدقهلية لمكافحة الحشرات والحدائق',
    isCompany: true,
    specialty: 'مكافحة حشرات بدون رائحة وتعقيم خزانات وحدائق',
    categoryIds: ['pest_control', 'tanks_garden', 'cleaning'],
    area: 'الدقهلية · المنصورة الجديدة، المنصورة، جمصة، طلخا',
    primaryCenter: 'المنصورة الجديدة',
    coveredCenters: ['المنصورة الجديدة', 'المنصورة', 'جمصة', 'طلخا', 'بلقاس'],
    coveredAreas: [
      'الدقهلية · المنصورة الجديدة - جنة 1 (Janna 1)',
      'الدقهلية · المنصورة الجديدة - جنة 2 (Janna 2)',
      'الدقهلية · المنصورة الجديدة - كمبوند زاهية',
      'الدقهلية · المنصورة الجديدة - منطقة الفيلات الساحلية',
      'الدقهلية · المنصورة - المنصورة (حي شرق - توريل - قناة السويس - جديلة)',
      'الدقهلية · جمصة - مدينة جمصة',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'commercial_register',
        label: 'صورة السجل التجاري',
        fileName: 'aman-pest-cr.pdf',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 184,
    completedJobs: 540,
    yearsExp: 8,
    phone: '01099887766',
    initials: 'أد',
  },
  {
    id: 'tech-8',
    name: 'شركة المنصورة الذكية للشبكات والكاميرات ونقل الأثاث',
    isCompany: true,
    specialty: 'شبكات واي فاي، كاميرات مراقبة، إلكترونيات ونقل عفش',
    categoryIds: ['security_tech', 'networks', 'electronics', 'moving', 'aluminum_gypsum'],
    area: 'الدقهلية · المنصورة، طلخا، المنصورة الجديدة، دكرنس',
    primaryCenter: 'المنصورة',
    coveredCenters: ['المنصورة', 'طلخا', 'المنصورة الجديدة', 'دكرنس', 'ميت غمر'],
    coveredAreas: [
      'الدقهلية · المنصورة - المنصورة (حي غرب - المشاية - الجامعة - الجلاء)',
      'الدقهلية · المنصورة الجديدة - المنطقة المركزية والخدمات',
      'الدقهلية · طلخا - مدينة طلخا',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'commercial_register',
        label: 'صورة السجل التجاري',
        fileName: 'smart-mansoura-cr.pdf',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 215,
    completedJobs: 690,
    yearsExp: 10,
    phone: '01277665544',
    initials: 'مذ',
  },
  {
    id: 'tech-9',
    name: 'م. عمر الشربيني للإلكترونيات والشبكات',
    isCompany: false,
    specialty: 'صيانة لابتوب وشاشات وتأسيس شبكات واي فاي Mesh',
    categoryIds: ['electronics', 'networks', 'security_tech'],
    area: 'الدقهلية · المنصورة، المنصورة الجديدة، طلخا، أجا',
    primaryCenter: 'المنصورة',
    coveredCenters: ['المنصورة', 'المنصورة الجديدة', 'طلخا', 'أجا'],
    coveredAreas: [
      'الدقهلية · المنصورة - المنصورة (حي شرق - توريل - قناة السويس - جديلة)',
      'الدقهلية · المنصورة الجديدة - جنة 1 (Janna 1)',
      'الدقهلية · المنصورة الجديدة - كمبوند زاهية',
      'الدقهلية · طلخا - مدينة طلخا',
    ],
    isVerifiedDocs: true,
    isPhoneVerified: true,
    documents: [
      {
        type: 'national_id_front',
        label: 'صورة البطاقة الشخصية (وجه)',
        fileName: 'omar-id-front.jpg',
        fileSizeLabel: 'موثق',
      },
    ],
    rating: 4.9,
    reviewsCount: 138,
    completedJobs: 410,
    yearsExp: 7,
    phone: '01033221199',
    initials: 'عش',
  },
];

export const INITIAL_USER: UserProfile = {
  name: 'طارق حسن إبراهيم',
  phone: '01012345678',
  defaultDistrict: DEFAULT_DAKAHLIA_DISTRICT,
};

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'طارق حسن إبراهيم',
    phone: '01012345678',
    district: DEFAULT_DAKAHLIA_DISTRICT,
    isPhoneVerified: true,
    createdAt: 'حساب موثق',
  },
];

export const INITIAL_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    label: 'المنزل (المنصورة)',
    district: DEFAULT_DAKAHLIA_DISTRICT,
    streetDetails: 'شارع قناة السويس، برج الصفوة، أمام مسجد النور',
    buildingFloor: 'الدور الرابع · شقة 8',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'منزل العائلة (طلخا)',
    district: 'الدقهلية · طلخا - ميت الكرماء',
    streetDetails: 'الشارع الرئيسي بجوار الوحدة المحلية',
    buildingFloor: 'منزل عائلي · الدور الثاني',
    isDefault: false,
  },
];

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-101',
    referenceCode: 'KH-90412',
    categoryId: 'ac',
    categoryName: 'التكييف والتبريد',
    serviceTitle: 'غسيل وصيانة تكييف سبليت شامل',
    detailedDescription:
      'لدي تكييفين كاريير 1.5 حصان و2.25 حصان في شقة بتوريل. الوحدة الداخلية تنقط مياه والتبريد ضعيف نسبياً، أحتاج غسيل شامل وفحص الفريون.',
    district: DEFAULT_DAKAHLIA_DISTRICT,
    addressText: 'توريل الجديدة، شارع الإمام محمد عبده، عمارة 14 · الدور الثالث',
    preferredDate: 'اليوم',
    preferredTime: '03:00 م – 06:00 م',
    customerName: 'طارق حسن إبراهيم',
    customerPhone: '01012345678',
    status: 'open_for_quotes',
    paymentMethod: 'cash',
    createdAt: 'منذ 12 دقيقة',
    createdAtTimestamp: Date.now() - 12 * 60 * 1000,
  },
  {
    id: 'req-102',
    referenceCode: 'KH-90385',
    categoryId: 'plumbing',
    categoryName: 'السباكة',
    serviceTitle: 'كشف ومعالجة تسريب المياه والصرف',
    detailedDescription:
      'يوجد تسريب بسيط أسفل حوض المطبخ ومحتاج تغيير محبس زاوية وتركيب سيفون جديد في قرية شاوة.',
    district: 'الدقهلية · المنصورة - شاوة',
    addressText: 'مدخل قرية شاوة بجوار مسجد الرحمة، منزل الحاج محمود',
    preferredDate: 'غداً',
    preferredTime: '12:00 م – 03:00 م',
    customerName: 'طارق حسن إبراهيم',
    customerPhone: '01012345678',
    status: 'quote_accepted',
    paymentMethod: 'wallet',
    walletProvider: 'فودافون كاش',
    createdAt: 'أمس',
    acceptedQuoteId: 'q-201',
  },
  {
    id: 'req-103',
    referenceCode: 'KH-90190',
    categoryId: 'cleaning',
    categoryName: 'تنظيف المنازل',
    serviceTitle: 'تنظيف شامل للشقق والفلل',
    detailedDescription:
      'شقة 140 متر 3 غرف وريسبشن ومطبخ وحمامين في حي الجامعة بالمنصورة، تحتاج تنظيف عميق قبل سكن الأسرة.',
    district: 'الدقهلية · المنصورة - المنصورة (حي غرب - المشاية - الجامعة - الجلاء)',
    addressText: 'حي الجامعة، شارع أحمد ماهر، برج النيل الدور السادس',
    preferredDate: 'الأسبوع الماضي',
    preferredTime: '10:00 ص – 02:00 م',
    customerName: 'طارق حسن إبراهيم',
    customerPhone: '01012345678',
    status: 'completed',
    paymentMethod: 'cash',
    createdAt: 'منذ 4 أيام',
    completedAtTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    warrantyDays: 30,
    pointsAwarded: 120,
    acceptedQuoteId: 'q-301',
    rating: 5,
    review: 'فريق شركة النيل الذهبي التزم بالموعد والسعر المتفق عليه والشغل ممتاز جداً.',
  },
  {
    id: 'req-104',
    referenceCode: 'KH-90458',
    categoryId: 'networks',
    categoryName: 'الشبكات والواي فاي',
    serviceTitle: 'تأسيس وتقوية شبكة الواي فاي وMesh',
    detailedDescription:
      'الشقة 160 متر وإشارة الراوتر ضعيفة جداً في الغرف الداخلية، مطلوب تركيب وتوزيع نقطتي Mesh وتأمين الشبكة.',
    district: 'الدقهلية · طلخا - تقسيم عمرو بن العاص',
    addressText: 'تقسيم عمرو بن العاص، شارع 10، برج السلام · الدور الخامس',
    preferredDate: 'اليوم',
    preferredTime: 'الآن (أقرب وقت)',
    customerName: 'طارق حسن إبراهيم',
    customerPhone: '01012345678',
    status: 'en_route',
    paymentMethod: 'cash',
    createdAt: 'منذ 35 دقيقة',
    createdAtTimestamp: Date.now() - 35 * 60 * 1000,
    enRouteStartedAt: Date.now() - 3 * 60 * 1000,
    promoCode: 'NET12',
    discountPercent: 12,
    maxDiscountEGP: 100,
    acceptedQuoteId: 'q-401',
  },
];

export const INITIAL_QUOTES: ServiceQuote[] = [
  {
    id: 'q-101',
    requestId: 'req-101',
    technicianId: 'tech-1',
    technicianName: 'م. أحمد محمود عبد السلام',
    isCompany: false,
    technicianRating: 4.9,
    technicianCompletedJobs: 640,
    technicianPhone: '01098451230',
    priceEGP: 450,
    estimatedArrival: 'اليوم الساعة 3:30 عصراً',
    warrantyLabel: 'ضمان 30 يوماً',
    notes: 'السعر يشمل غسيل التكييفين بالكامل وتسليك الصرف وقياس ضغط الفريون بالأجهزة.',
    createdAt: 'منذ 15 دقيقة',
    status: 'pending',
  },
  {
    id: 'q-102',
    requestId: 'req-101',
    technicianId: 'tech-2',
    technicianName: 'شركة الدلتا لخدمات التبريد والصيانة',
    isCompany: true,
    technicianRating: 4.8,
    technicianCompletedJobs: 920,
    technicianPhone: '01022446688',
    priceEGP: 520,
    estimatedArrival: 'اليوم الساعة 4:00 عصراً',
    warrantyLabel: 'ضمان 30 يوماً + تعقيم',
    notes: 'فريق من فنيين اثنين مع غطاء عزل للمياه وتعقيم مضاد للبكتيريا وضمان 30 يوماً.',
    createdAt: 'منذ 8 دقائق',
    status: 'pending',
  },
  {
    id: 'q-201',
    requestId: 'req-102',
    technicianId: 'tech-3',
    technicianName: 'أ. كريم عبد الرحمن',
    isCompany: false,
    technicianRating: 4.9,
    technicianCompletedJobs: 512,
    technicianPhone: '01145678921',
    priceEGP: 280,
    estimatedArrival: 'غداً الساعة 12:30 ظهراً',
    warrantyLabel: 'ضمان 30 يوماً',
    notes: 'شامل فك وتركيب السيفون الجديد والمحبس واختبار التسريب.',
    createdAt: 'أمس',
    status: 'accepted',
  },
  {
    id: 'q-301',
    requestId: 'req-103',
    technicianId: 'tech-4',
    technicianName: 'شركة النيل الذهبي للتنظيف والتشطيب',
    isCompany: true,
    technicianRating: 4.9,
    technicianCompletedJobs: 1120,
    technicianPhone: '01223344556',
    priceEGP: 750,
    estimatedArrival: 'في الموعد المحدد',
    warrantyLabel: 'ضمان إعادة التنظيف 7 أيام',
    notes: 'تنظيف شامل بمواد تعقيم أصلية لفريق مكون من 3 أفراد.',
    createdAt: 'منذ 4 أيام',
    status: 'accepted',
  },
  {
    id: 'q-401',
    requestId: 'req-104',
    technicianId: 'tech-9',
    technicianName: 'م. عمر الشربيني للإلكترونيات والشبكات',
    isCompany: false,
    technicianRating: 4.9,
    technicianCompletedJobs: 410,
    technicianPhone: '01033221199',
    priceEGP: 420,
    estimatedArrival: 'خلال 15 دقيقة',
    warrantyLabel: 'ضمان 30 يوماً',
    notes: 'يشمل قياس تغطية الغرف وضبط وحدات Mesh وتأريج كابل الربط الرئيسي.',
    createdAt: 'منذ 22 دقيقة',
    status: 'accepted',
  },
];

export const INITIAL_MESSAGES: RequestMessage[] = [
  {
    id: 'msg-seed-1',
    requestId: 'req-101',
    technicianId: 'tech-1',
    technicianName: 'م. أحمد محمود عبد السلام',
    senderRole: 'technician',
    text: 'أهلاً بحضرتك، هل الوحدتان الخارجيتان في البلكونة أم على حامل خارجي في المنور؟',
    createdAt: 'منذ 10 دقائق',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    recipientRole: 'customer',
    type: 'new_quote',
    title: 'عرض سعر جديد على طلب التكييف (#KH-90412)',
    body: 'قدّم م. أحمد محمود عبد السلام عرضاً بقيمة 450 ج.م على طلبك في المنصورة.',
    requestId: 'req-101',
    createdAt: 'منذ 15 دقيقة',
    isRead: false,
  },
  {
    id: 'notif-2',
    recipientRole: 'customer',
    type: 'new_quote',
    title: 'عرض جديد من شركة الدلتا للتبريد (#KH-90412)',
    body: 'وصل عرض ثانٍ بقيمة 520 ج.م مع ضمان 30 يوماً. راجع العروض واضغط موافق للاختيار.',
    requestId: 'req-101',
    createdAt: 'منذ 8 دقائق',
    isRead: false,
  },
  {
    id: 'notif-3',
    recipientRole: 'technician',
    recipientTechId: 'tech-3',
    type: 'quote_accepted',
    title: 'وافق العميل على عرضك (#KH-90385)',
    body: 'تمت الموافقة على عرضك بقيمة 280 ج.م لطلب قرية شاوة. رقم العميل متاح الآن للتواصل.',
    requestId: 'req-102',
    createdAt: 'أمس',
    isRead: false,
  },
];

export const CUSTOMER_TESTIMONIALS = [
  {
    id: 'rev-1',
    author: 'نهى عبد العزيز',
    area: 'توريل، المنصورة',
    service: 'صيانة تكييف',
    quote: 'وصلتني 3 عروض خلال دقائق واخترت الأنسب فوراً.',
  },
  {
    id: 'rev-2',
    author: 'أحمد السعدني',
    area: 'طلخا، الدقهلية',
    service: 'سباكة',
    quote: 'مقارنة الأسعار سهلت الاختيار ورقمي لم يظهر إلا بعد الموافقة.',
  },
  {
    id: 'rev-3',
    author: 'سلمى القاضي',
    area: 'المنصورة الجديدة',
    service: 'تنظيف شقة',
    quote: 'التغطية تشمل جنة والكمبوندات والفريق التزم بالموعد.',
  },
];

export const INITIAL_TECHNICIAN_REVIEWS: TechnicianReview[] = [
  {
    id: 'trev-1',
    technicianId: 'tech-1',
    customerName: 'محمد الشهاوي',
    area: 'المنصورة · توريل',
    serviceTitle: 'غسيل وصيانة تكييف سبليت شامل',
    rating: 5,
    review: 'شغل ممتاز جداً، البشمهندس نظف التكييفين بغطاء عزل وبدون نقطة مياه على الحيطة.',
    dateLabel: 'منذ يومين',
    priceEGP: 420,
  },
  {
    id: 'trev-2',
    technicianId: 'tech-1',
    customerName: 'هند عبد اللطيف',
    area: 'طلخا · تقسيم عمرو بن العاص',
    serviceTitle: 'كشف تسريب وشحن فريون',
    rating: 5,
    review: 'التزم بالموعد والسعر المقدم في العرض، والتبريد رجع ممتاز من أول يوم.',
    dateLabel: 'منذ 5 أيام',
    priceEGP: 680,
  },
  {
    id: 'trev-3',
    technicianId: 'tech-1',
    customerName: 'إيهاب مصطفى',
    area: 'أجا · ميت العامل',
    serviceTitle: 'صيانة غسالات وثلاجات وبوتاجازات',
    rating: 4,
    review: 'أداء جيد واحترام في التعامل، وصل متأخر ربع ساعة فقط بسبب الزحمة واعتذر بذوق.',
    dateLabel: 'منذ أسبوع',
    priceEGP: 320,
  },
  {
    id: 'trev-4',
    technicianId: 'tech-1',
    customerName: 'د. علاء الدسوقي',
    area: 'المنصورة · حي الجامعة',
    serviceTitle: 'فك وتركيب ونقل تكييف',
    rating: 5,
    review: 'دقة عالية في حبس الفريون وتركيب الحامل بميزان المياه.',
    dateLabel: 'منذ أسبوعين',
    priceEGP: 800,
  },
  {
    id: 'trev-5',
    technicianId: 'tech-2',
    customerName: 'خالد الطنطاوي',
    area: 'دكرنس · مدينة دكرنس',
    serviceTitle: 'غسيل وصيانة تكييف سبليت شامل',
    rating: 5,
    review: 'فريق محترف وملتزم بالضمان وسعرهم مناسب مقارنة بجودة الخدمة.',
    dateLabel: 'منذ 3 أيام',
    priceEGP: 500,
  },
  {
    id: 'trev-6',
    technicianId: 'tech-2',
    customerName: 'مها سليم',
    area: 'السنبلاوين · المقاطعة',
    serviceTitle: 'فحص لوحة الكهرباء وتغيير القواطع',
    rating: 4,
    review: 'حلوا مشكلة فصل الكهرباء بسرعة مع شرح سبب العطل بوضوح.',
    dateLabel: 'منذ أسبوع',
    priceEGP: 350,
  },
  {
    id: 'trev-7',
    technicianId: 'tech-2',
    customerName: 'عمرو البنا',
    area: 'بلقاس · مدينة بلقاس',
    serviceTitle: 'صيانة تكييفات شركة',
    rating: 5,
    review: 'شركة منظمة وفنيون مدربون والتزام كامل بالموعد.',
    dateLabel: 'منذ 10 أيام',
    priceEGP: 950,
  },
  {
    id: 'trev-8',
    technicianId: 'tech-3',
    customerName: 'إبراهيم الدسوقي',
    area: 'المنصورة · شاوة',
    serviceTitle: 'كشف ومعالجة تسريب المياه والصرف',
    rating: 5,
    review: 'أسطى أمين وشغله نظيف جداً، عالج التسريب بدون تكسير.',
    dateLabel: 'منذ 3 أيام',
    priceEGP: 260,
  },
  {
    id: 'trev-9',
    technicianId: 'tech-3',
    customerName: 'سعاد حلمي',
    area: 'ميت غمر · دقادوس',
    serviceTitle: 'تركيب أو تغيير خلاطات ومستلزمات صحية',
    rating: 5,
    review: 'ركب خلاط المطبخ والسخان بسرعة ودقة ممتازة.',
    dateLabel: 'منذ 6 أيام',
    priceEGP: 300,
  },
  {
    id: 'trev-10',
    technicianId: 'tech-3',
    customerName: 'ياسر المنصور',
    area: 'المنصورة · سندوب',
    serviceTitle: 'تركيب وصيانة سخان مياه كهرباء أو غاز',
    rating: 4,
    review: 'شغل مضبوط وسعر عادل جداً.',
    dateLabel: 'منذ أسبوعين',
    priceEGP: 280,
  },
  {
    id: 'trev-11',
    technicianId: 'tech-4',
    customerName: 'طارق حسن إبراهيم',
    area: 'المنصورة · حي الجامعة',
    serviceTitle: 'تنظيف شامل للشقق والفلل',
    rating: 5,
    review: 'فريق شركة النيل الذهبي التزم بالموعد والسعر المتفق عليه والشغل ممتاز جداً.',
    dateLabel: 'منذ 4 أيام',
    priceEGP: 750,
  },
  {
    id: 'trev-12',
    technicianId: 'tech-4',
    customerName: 'رانيا الجندي',
    area: 'المنصورة · المشاية السفلية',
    serviceTitle: 'غسيل أنتريه وسجاد بالبخار في المنزل',
    rating: 5,
    review: 'البقع اختفت تماماً والأنتريه نشف في نفس اليوم برائحة جميلة.',
    dateLabel: 'منذ 9 أيام',
    priceEGP: 550,
  },
  {
    id: 'trev-13',
    technicianId: 'tech-5',
    customerName: 'سامح فؤاد',
    area: 'شربين · بساط كريم الدين',
    serviceTitle: 'فحص لوحة الكهرباء وتغيير القواطع',
    rating: 5,
    review: 'مهندس شاطر جداً وفاهم في الأحمال وأمّن اللوحة بالكامل.',
    dateLabel: 'منذ 4 أيام',
    priceEGP: 300,
  },
  {
    id: 'trev-14',
    technicianId: 'tech-5',
    customerName: 'نرمين عادل',
    area: 'نبروه · بهوت',
    serviceTitle: 'تركيب نجف، سبوتات ومفاتيح إنارة',
    rating: 5,
    review: 'ركب 3 نجفات و6 سبوتات في ساعة واحدة بنظافة تامة.',
    dateLabel: 'منذ أسبوعين',
    priceEGP: 280,
  },
  {
    id: 'trev-15',
    technicianId: 'tech-6',
    customerName: 'حسام الدين علي',
    area: 'منية النصر · برمبال الجديدة',
    serviceTitle: 'فك وتركيب أثاث وغرف نوم',
    rating: 5,
    review: 'فك وركب غرفة النوم كاملة وضبط جميع المفصلات والأدراج.',
    dateLabel: 'منذ 5 أيام',
    priceEGP: 450,
  },
  {
    id: 'trev-16',
    technicianId: 'tech-6',
    customerName: 'وليد عبد الرازق',
    area: 'طلخا · ميت عنتر',
    serviceTitle: 'إصلاح أبواب خشب وتغيير كوالين',
    rating: 4,
    review: 'شغل جيد جداً وضبط باب الشقة المصفح باحترافية.',
    dateLabel: 'منذ 12 يوماً',
    priceEGP: 250,
  },
  {
    id: 'trev-17',
    technicianId: 'tech-7',
    customerName: 'د. مروة السعيد',
    area: 'المنصورة الجديدة · جنة 1',
    serviceTitle: 'رش ومكافحة الحشرات بدون رائحة',
    rating: 5,
    review: 'مبيد آمن بدون رائحة فعلاً والتزموا بالمتابعة بعد الرش.',
    dateLabel: 'منذ 4 أيام',
    priceEGP: 420,
  },
  {
    id: 'trev-18',
    technicianId: 'tech-8',
    customerName: 'م. طارق الشناوي',
    area: 'المنصورة · حي غرب',
    serviceTitle: 'تركيب كاميرات مراقبة وإنتركم منزلي',
    rating: 5,
    review: 'تمديد احترافي للأسلاك وربط الكاميرات بالموبايل في نفس الزيارة.',
    dateLabel: 'منذ 6 أيام',
    priceEGP: 1050,
  },
  {
    id: 'trev-19',
    technicianId: 'tech-9',
    customerName: 'أحمد العزب',
    area: 'المنصورة · توريل',
    serviceTitle: 'تأسيس وتقوية شبكة الواي فاي وMesh',
    rating: 5,
    review: 'الإشارة أصبحت كاملة في كل الغرف وسرعة التحميل مستقرة جداً.',
    dateLabel: 'منذ 3 أيام',
    priceEGP: 380,
  },
  {
    id: 'trev-20',
    technicianId: 'tech-9',
    customerName: 'كريم شوقي',
    area: 'المنصورة الجديدة · جنة 1',
    serviceTitle: 'صيانة لابتوب وشاشات سمارت بالمنزل',
    rating: 5,
    review: 'فحص الشاشة في البيت وصلّح عطل الإضاءة في نفس الساعة بأمانة تامة.',
    dateLabel: 'منذ أسبوع',
    priceEGP: 460,
  },
];

export interface TechnicianComputedStats {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  positivePercent: number;
  totalQuotesSent: number;
  acceptedQuotesCount: number;
  acceptanceRatePercent: number;
  totalCompletedValueEGP: number;
  reviews: TechnicianReview[];
}

export function computeTechnicianStats(
  technicianId: string,
  allReviews: TechnicianReview[],
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[]
): TechnicianComputedStats {
  const techReviews = allReviews.filter((r) => r.technicianId === technicianId);
  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sumRatings = 0;
  for (const r of techReviews) {
    const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingCounts[clamped] += 1;
    sumRatings += r.rating;
  }

  const totalReviews = techReviews.length;
  const averageRating =
    totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(1)) : 5.0;
  const positiveCount = ratingCounts[5] + ratingCounts[4];
  const positivePercent =
    totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100;

  const techQuotes = allQuotes.filter((q) => q.technicianId === technicianId);
  const totalQuotesSent = techQuotes.length;
  const acceptedQuotes = techQuotes.filter((q) => q.status === 'accepted');
  const acceptedQuotesCount = acceptedQuotes.length;
  const acceptanceRatePercent =
    totalQuotesSent > 0
      ? Math.round((acceptedQuotesCount / totalQuotesSent) * 100)
      : 0;

  // Sum completed values from historical reviews + newly completed accepted requests
  const reviewIdsFromRequests = new Set(
    allRequests.filter((req) => req.rating).map((req) => req.id)
  );
  const historicalValue = techReviews
    .filter((r) => !reviewIdsFromRequests.has(r.id.replace('trev-req-', '')))
    .reduce((sum, r) => sum + (r.priceEGP || 0), 0);

  const liveCompletedValue = acceptedQuotes.reduce((sum, q) => {
    const req = allRequests.find((r) => r.id === q.requestId);
    if (req && req.status === 'completed' && req.id !== 'req-103') {
      return sum + q.priceEGP;
    }
    return sum;
  }, 0);

  return {
    averageRating,
    totalReviews,
    ratingCounts,
    positivePercent,
    totalQuotesSent,
    acceptedQuotesCount,
    acceptanceRatePercent,
    totalCompletedValueEGP: historicalValue + liveCompletedValue,
    reviews: techReviews,
  };
}

export function getRecurrenceLabel(freq?: RecurrenceFrequency): string {
  switch (freq) {
    case 'daily':
      return 'يومياً';
    case 'weekly':
      return 'أسبوعياً';
    case 'monthly':
      return 'شهرياً';
    default:
      return 'مرة واحدة';
  }
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addRecurrenceIntervalISO(
  baseISO: string,
  frequency: Exclude<RecurrenceFrequency, 'none'>
): string {
  const parts = baseISO.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  const dt = new Date(year, month, day);

  if (frequency === 'daily') {
    dt.setDate(dt.getDate() + 1);
  } else if (frequency === 'weekly') {
    dt.setDate(dt.getDate() + 7);
  } else if (frequency === 'monthly') {
    const targetMonth = dt.getMonth() + 1;
    const origDay = dt.getDate();
    dt.setDate(1);
    dt.setMonth(targetMonth);
    const maxDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    dt.setDate(Math.min(origDay, maxDay));
  }

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, days: number): string {
  const parts = baseISO.split('-').map(Number);
  const dt = new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatArabicDateLabel(isoDate: string): string {
  try {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dt);
  } catch {
    return isoDate;
  }
}

export const INITIAL_RECURRING_SCHEDULES: RecurringSchedule[] = [
  {
    id: 'rec-seed-1',
    frequency: 'weekly',
    categoryId: 'cleaning',
    categoryName: 'تنظيف المنازل',
    serviceTitle: 'تنظيف شامل للشقق والفلل',
    detailedDescription:
      'تنظيف أسبوعي دوري للشقة (3 غرف ومطبخ وحمامين) مع تعقيم الأرضيات.',
    district: DEFAULT_DAKAHLIA_DISTRICT,
    addressText: 'شارع قناة السويس، برج الصفوة، أمام مسجد النور · الدور الرابع · شقة 8',
    preferredTime: '10:00 ص – 12:00 م',
    customerName: 'طارق حسن إبراهيم',
    customerPhone: '01012345678',
    paymentMethod: 'cash',
    startDateISO: getTodayISO(),
    nextRunDateISO: addDaysISO(getTodayISO(), 7),
    lastRunDateISO: getTodayISO(),
    generatedCount: 1,
    status: 'active',
    createdAt: 'مُجدول أسبوعياً',
  },
];

export const WALLET_PROVIDERS = [
  'فودافون كاش',
  'إنستاباي (InstaPay)',
  'أورنج كاش',
  'اتصالات كاش',
] as const;

export function getPaymentMethodLabel(
  method?: PaymentMethod,
  walletProvider?: string
): string {
  if (method === 'wallet') {
    return walletProvider
      ? `محفظة إلكترونية (${walletProvider})`
      : 'محفظة إلكترونية';
  }
  return 'نقد عند الاستلام';
}

export function formatEGP(amount: number): string {
  return `${amount.toLocaleString('en-US')} ج.م`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `20${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

// Historical anonymized technician quotes per service in Dakahlia for market average analysis
export const PREVIOUS_SERVICE_QUOTES_HISTORY: Record<string, number[]> = {
  'غسيل وصيانة تكييف سبليت شامل': [520, 550, 500, 580, 540],
  'كشف تسريب وشحن فريون': [780, 850, 750, 820],
  'فك وتركيب ونقل تكييف': [920, 980, 900, 950],
  'تركيب أو تغيير خلاطات ومستلزمات صحية': [360, 380, 350, 400],
  'كشف ومعالجة تسريب المياه والصرف': [320, 350, 330, 340],
  'تركيب وصيانة سخان مياه كهرباء أو غاز': [340, 360, 320, 380],
  'فحص لوحة الكهرباء وتغيير القواطع': [380, 420, 390, 400],
  'تركيب نجف، سبوتات ومفاتيح إنارة': [330, 360, 350, 340],
  'تنظيف شامل للشقق والفلل': [880, 950, 900, 920],
  'غسيل أنتريه وسجاد بالبخار في المنزل': [640, 680, 620, 660],
  'تنظيف ما بعد التشطيب والدهان': [1450, 1600, 1500],
  'فك وتركيب أثاث وغرف نوم': [520, 560, 540, 500],
  'إصلاح أبواب خشب وتغيير كوالين': [300, 320, 290, 310],
  'دهان شقق وغرف ومعالجة الرطوبة': [1300, 1450, 1380],
  'صيانة غسالات وثلاجات وبوتاجازات': [390, 420, 380, 410],
  'رش ومكافحة الحشرات بدون رائحة': [500, 540, 520, 480],
  'تعقيم ومكافحة حشرات الفلل والمداخل': [850, 920, 880],
  'تركيب كاميرات مراقبة وإنتركم منزلي': [1200, 1280, 1180, 1250],
  'ضبط شبكة الواي فاي وتركيب الدش المركزي': [360, 400, 380],
  'نقل وتغليف الأثاث مع ونش رفع': [2400, 2650, 2500],
  'غسيل وتعقيم خزانات المياه': [620, 680, 650],
  'تنسيق وقص حدائق الفلل والمداخل': [750, 820, 780],
  'صيانة ألوميتال وتركيب سلك بليسيه وجبس': [420, 460, 440],
  'غسيل وتلميع السيارة بالبخار أمام منزلك': [320, 360, 340],
  'صيانة لابتوب وشاشات سمارت بالمنزل': [520, 560, 500, 540],
  'صيانة بلايستيشن، طابعات وأجهزة UPS': [420, 460, 440, 400],
  'تأسيس وتقوية شبكة الواي فاي وMesh': [440, 480, 450, 420],
  'تمديد نقاط شبكة CAT6 وتنظيم الراك المنزلي': [620, 680, 650, 600],
};

export interface ServiceMarketStats {
  marketAverageEGP: number | null;
  previousQuotesCount: number;
  lowestOfferEGP: number | null;
  activeOffersCount: number;
  savingsPercent: number;
  savingsAmountEGP: number;
}

export interface QuoteMarketComparison {
  marketAverageEGP: number | null;
  previousQuotesCount: number;
  savingsPercent: number;
  savingsAmountEGP: number;
}

function collectPreviousPricesForService(
  serviceTitle: string,
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[],
  allReviews: TechnicianReview[],
  excludeRequestId?: string
): number[] {
  const reqById = new Map(allRequests.map((r) => [r.id, r]));
  const seeded = PREVIOUS_SERVICE_QUOTES_HISTORY[serviceTitle] || [];
  const pool: number[] = [...seeded];

  for (const rev of allReviews) {
    if (rev.priceEGP && rev.priceEGP > 0 && rev.serviceTitle === serviceTitle) {
      pool.push(rev.priceEGP);
    }
  }

  for (const q of allQuotes) {
    if (q.status === 'rejected' || q.priceEGP <= 0) continue;
    if (excludeRequestId && q.requestId === excludeRequestId) continue;
    const req = reqById.get(q.requestId);
    if (!req || req.serviceTitle !== serviceTitle) continue;
    // Avoid double-counting completed seed request req-103 which is already in trev-11
    if (req.id === 'req-103' && allReviews.some((r) => r.id === 'trev-11')) {
      continue;
    }
    if (q.status === 'accepted') {
      pool.push(q.priceEGP);
    }
  }

  return pool;
}

export function computeServiceMarketStats(
  serviceTitle: string,
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[],
  allReviews: TechnicianReview[]
): ServiceMarketStats {
  const reqById = new Map(allRequests.map((r) => [r.id, r]));
  const activeQuotePrices: number[] = [];
  const reviewPrices: number[] = [];

  for (const q of allQuotes) {
    if (q.status === 'rejected' || q.priceEGP <= 0) continue;
    const req = reqById.get(q.requestId);
    if (req && req.serviceTitle === serviceTitle) {
      activeQuotePrices.push(q.priceEGP);
    }
  }

  for (const rev of allReviews) {
    if (rev.priceEGP && rev.priceEGP > 0 && rev.serviceTitle === serviceTitle) {
      reviewPrices.push(rev.priceEGP);
    }
  }

  // Prioritize active/recent quotes on requests; fall back to completed service reviews
  const offerPool = activeQuotePrices.length > 0 ? activeQuotePrices : reviewPrices;
  const lowestOfferEGP = offerPool.length > 0 ? Math.min(...offerPool) : null;

  const previousPool = collectPreviousPricesForService(
    serviceTitle,
    allQuotes,
    allRequests,
    allReviews
  );

  const marketAverageEGP =
    previousPool.length >= 2
      ? Math.round(previousPool.reduce((sum, p) => sum + p, 0) / previousPool.length)
      : null;

  let savingsPercent = 0;
  let savingsAmountEGP = 0;

  if (
    lowestOfferEGP !== null &&
    marketAverageEGP !== null &&
    marketAverageEGP > lowestOfferEGP
  ) {
    savingsAmountEGP = marketAverageEGP - lowestOfferEGP;
    savingsPercent = Math.round((savingsAmountEGP / marketAverageEGP) * 100);
  }

  return {
    marketAverageEGP,
    previousQuotesCount: previousPool.length,
    lowestOfferEGP,
    activeOffersCount: offerPool.length,
    savingsPercent,
    savingsAmountEGP,
  };
}

export function computeQuoteMarketComparison(
  quotePriceEGP: number,
  serviceTitle: string,
  requestId: string,
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[],
  allReviews: TechnicianReview[]
): QuoteMarketComparison {
  const previousPool = collectPreviousPricesForService(
    serviceTitle,
    allQuotes,
    allRequests,
    allReviews,
    requestId
  );

  const marketAverageEGP =
    previousPool.length >= 2
      ? Math.round(previousPool.reduce((sum, p) => sum + p, 0) / previousPool.length)
      : null;

  let savingsPercent = 0;
  let savingsAmountEGP = 0;

  if (
    quotePriceEGP > 0 &&
    marketAverageEGP !== null &&
    marketAverageEGP > quotePriceEGP
  ) {
    savingsAmountEGP = marketAverageEGP - quotePriceEGP;
    savingsPercent = Math.round((savingsAmountEGP / marketAverageEGP) * 100);
  }

  return {
    marketAverageEGP,
    previousQuotesCount: previousPool.length,
    savingsPercent,
    savingsAmountEGP,
  };
}

export interface FeaturedTechnicianEntry {
  technician: Technician;
  effectiveRating: number;
  effectiveCompletedJobs: number;
  totalReviews: number;
  positivePercent: number;
  trustScore: number;
}

export function computeFeaturedTechnicians(
  allTechnicians: Technician[],
  allReviews: TechnicianReview[],
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[]
): FeaturedTechnicianEntry[] {
  const entries = allTechnicians.map((tech) => {
    const stats = computeTechnicianStats(tech.id, allReviews, allQuotes, allRequests);

    // Count newly completed requests in the session (excluding seed req-103 already reflected in completedJobs)
    const liveCompletedExtra = allRequests.filter((req) => {
      if (req.status !== 'completed' || req.id === 'req-103') return false;
      const acceptedQuote = allQuotes.find(
        (q) =>
          q.id === req.acceptedQuoteId ||
          (q.requestId === req.id && q.status === 'accepted')
      );
      return acceptedQuote?.technicianId === tech.id;
    }).length;

    const effectiveCompletedJobs = tech.completedJobs + liveCompletedExtra;

    // Blend baseline historical rating with live review stats so high-volume reputation stays balanced
    const effectiveRating =
      stats.totalReviews >= 5
        ? stats.averageRating
        : stats.totalReviews > 0
        ? Number((tech.rating * 0.65 + stats.averageRating * 0.35).toFixed(1))
        : Number(tech.rating.toFixed(1));

    const totalReviews = Math.max(tech.reviewsCount, stats.totalReviews);
    const trustScore = (effectiveRating - 4.0) * 600 + effectiveCompletedJobs;

    return {
      technician: tech,
      effectiveRating,
      effectiveCompletedJobs,
      totalReviews,
      positivePercent: stats.positivePercent,
      trustScore,
    };
  });

  // Prioritize verified high-rated technicians with strong completion history
  const qualified = entries.filter(
    (entry) => entry.effectiveRating >= 4.7 && entry.effectiveCompletedJobs >= 300
  );
  const pool = qualified.length > 0 ? qualified : entries;

  return [...pool].sort((a, b) => {
    if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
    if (b.effectiveCompletedJobs !== a.effectiveCompletedJobs) {
      return b.effectiveCompletedJobs - a.effectiveCompletedJobs;
    }
    return b.effectiveRating - a.effectiveRating;
  });
}

export interface SmartServiceHint {
  id: string;
  service: ServiceItem;
  reason: string;
  source: 'current_and_history' | 'current_service' | 'customer_history';
  noteAddition: string;
}

interface ComplementaryRule {
  targetServiceId: string;
  reason: string;
  noteAddition: string;
}

const COMPLEMENTARY_SERVICE_RULES: Record<string, ComplementaryRule[]> = {
  'ac-clean-split': [
    {
      targetServiceId: 'ac-freon-full',
      reason: 'تكميلية لصيانة التكييف · فحص الفريون وتنظيف الفلاتر',
      noteAddition: 'إضافة تكميلية: تنظيف عميق للفلاتر مع كشف تسريب وشحن فريون عند اللزوم',
    },
    {
      targetServiceId: 'elec-panel',
      reason: 'وقائية لحماية أحمال التكييف ومنع فصل القاطع',
      noteAddition: 'إضافة تكميلية: فحص قاطع التكييف والأحمال في لوحة الكهرباء',
    },
  ],
  'ac-freon-full': [
    {
      targetServiceId: 'ac-clean-split',
      reason: 'ينصح بغسيل الفلاتر والمبخر لضمان كفاءة التبريد بعد الشحن',
      noteAddition: 'إضافة تكميلية: غسيل الفلاتر والوحدة الداخلية مع ضبط الصرف',
    },
    {
      targetServiceId: 'elec-panel',
      reason: 'وقائية للتأكد من سلامة مفتاح التكييف والأحمال',
      noteAddition: 'إضافة تكميلية: مراجعة مفتاح وقاطع التكييف',
    },
  ],
  'ac-install': [
    {
      targetServiceId: 'ac-clean-split',
      reason: 'غسيل وتنظيف الفلاتر والوحدة قبل التشغيل في المكان الجديد',
      noteAddition: 'إضافة تكميلية: غسيل شامل للوحدتين وتنظيف الفلاتر بعد التركيب',
    },
    {
      targetServiceId: 'ac-freon-full',
      reason: 'التأكد من ضغط الفريون وعدم وجود تسريب بعد الفك والنقل',
      noteAddition: 'إضافة تكميلية: اختبار تسريب وضبط ضغط الفريون',
    },
  ],
  'plumb-leak': [
    {
      targetServiceId: 'plumb-faucet',
      reason: 'تكميلية لأعمال السباكة · تغيير المحابس والوصلات التالفة',
      noteAddition: 'إضافة تكميلية: فحص وتبديل المحابس أو الخلاطات المسببة للتنقيط',
    },
    {
      targetServiceId: 'paint-room',
      reason: 'معالجة آثار الرطوبة وتقشير الدهان بعد إصلاح التسريب',
      noteAddition: 'إضافة تكميلية: معالجة رطوبة الحائط بعد وقف التسريب',
    },
  ],
  'plumb-faucet': [
    {
      targetServiceId: 'plumb-leak',
      reason: 'اختبار ضغط الوصلات والمواسير لمنع أي تسريب مخفي',
      noteAddition: 'إضافة تكميلية: فحص شامل لوصلات التغذية والصرف أسفل الحوض',
    },
    {
      targetServiceId: 'plumb-heater',
      reason: 'تكميلية لتأمين وصلات المياه الساخنة وصمام الأمان',
      noteAddition: 'إضافة تكميلية: فحص وصلات السخان وصمام الأمان',
    },
  ],
  'plumb-heater': [
    {
      targetServiceId: 'plumb-leak',
      reason: 'فحص وصلات السخان ومنع تنقيط المحابس',
      noteAddition: 'إضافة تكميلية: فحص محابس التغذية والوصلات المرنة',
    },
    {
      targetServiceId: 'elec-panel',
      reason: 'تأمين مفتاح وقاطع الكهرباء المغذي للسخان',
      noteAddition: 'إضافة تكميلية: فحص قاطع السخان وتأمين السلك',
    },
  ],
  'elec-panel': [
    {
      targetServiceId: 'elec-lighting',
      reason: 'تكميلية لأعمال الكهرباء · استغلال نفس الزيارة لفحص المفاتيح',
      noteAddition: 'إضافة تكميلية: مراجعة البرايز ومفاتيح الإنارة في الغرف',
    },
    {
      targetServiceId: 'app-washing-fridge',
      reason: 'حماية الأجهزة المنزلية من تذبذب الجهد والفصل المتكرر',
      noteAddition: 'إضافة تكميلية: فحص نقاط تغذية الغسالة والثلاجة',
    },
  ],
  'elec-lighting': [
    {
      targetServiceId: 'elec-panel',
      reason: 'التأكد من توازن أحمال الإنارة والقواطع داخل اللوحة',
      noteAddition: 'إضافة تكميلية: فحص قاطع الإنارة الرئيسي باللوحة',
    },
  ],
  'clean-home-deep': [
    {
      targetServiceId: 'clean-sofa-carpet',
      reason: 'تكميلية للتنظيف الشامل · غسيل وتعقيم الأنتريه والسجاد بالبخار',
      noteAddition: 'إضافة تكميلية: غسيل الأنتريه والسجاد بالبخار في نفس اليوم',
    },
    {
      targetServiceId: 'pest-home-spray',
      reason: 'رش وقائي بدون رائحة بعد إتمام التنظيف الشامل',
      noteAddition: 'إضافة تكميلية: رش وقائي آمن بدون رائحة في المطبخ والحمام',
    },
  ],
  'clean-sofa-carpet': [
    {
      targetServiceId: 'clean-home-deep',
      reason: 'استكمال نظافة الأرضيات والغرف مع تعقيم المفروشات',
      noteAddition: 'إضافة تكميلية: تنظيف وتلميع الأرضيات المحيطة بالمفروشات',
    },
    {
      targetServiceId: 'pest-home-spray',
      reason: 'حماية المفروشات والأركان برش وقائي بدون رائحة',
      noteAddition: 'إضافة تكميلية: معالجة وقائية للأركان ضد الحشرات',
    },
  ],
  'clean-post-renovation': [
    {
      targetServiceId: 'ac-clean-split',
      reason: 'إزالة غبار التشطيب والدهان من فلاتر التكييف قبل السكن',
      noteAddition: 'إضافة تكميلية: تنظيف فلاتر التكييف من أتربة التشطيب',
    },
    {
      targetServiceId: 'pest-home-spray',
      reason: 'تأمين الشقة الجديدة برش وقائي قبل فرش الأثاث',
      noteAddition: 'إضافة تكميلية: رش وقائي شامل قبل نقل الأثاث',
    },
  ],
  'carp-furniture-assembly': [
    {
      targetServiceId: 'carp-doors-locks',
      reason: 'ضبط كوالين ومفصلات الأبواب في نفس زيارة النجار',
      noteAddition: 'إضافة تكميلية: ضبط أبواب الغرف وتزييت المفصلات والكوالين',
    },
    {
      targetServiceId: 'move-furniture-winch',
      reason: 'تكميلية إذا كان التركيب مرتبطاً بنقل الأثاث',
      noteAddition: 'إضافة تكميلية: ترتيب وتأمين قطع الأثاث داخل الغرف',
    },
  ],
  'carp-doors-locks': [
    {
      targetServiceId: 'carp-furniture-assembly',
      reason: 'إصلاح مفصلات الدواليب والأدراج في نفس الزيارة',
      noteAddition: 'إضافة تكميلية: ضبط مفصلات الدواليب ومجاري الأدراج',
    },
  ],
  'paint-room': [
    {
      targetServiceId: 'clean-post-renovation',
      reason: 'إزالة آثار الدهانات وتنظيف الأرضيات والألوميتال بعد الانتهاء',
      noteAddition: 'إضافة تكميلية: تنظيف الأرضيات والشبابيك من آثار الطلاء',
    },
    {
      targetServiceId: 'alum-screen-gypsum',
      reason: 'معالجة فواصل الجبس بورد وضبط الشبابيك قبل الدهان',
      noteAddition: 'إضافة تكميلية: معالجة شروخ الجبس بورد حول الشبابيك',
    },
  ],
  'app-washing-fridge': [
    {
      targetServiceId: 'elec-panel',
      reason: 'فحص فيشة وتوصيلة الكهرباء المغذية للجهاز لمنع الأعطال',
      noteAddition: 'إضافة تكميلية: فحص جهد الفيشة ومفتاح الأمان الكهربائي',
    },
    {
      targetServiceId: 'plumb-leak',
      reason: 'مراجعة خرطوم التغذية والصرف للغسالة',
      noteAddition: 'إضافة تكميلية: فحص محبس وخراطيم مياه الغسالة',
    },
  ],
  'pest-home-spray': [
    {
      targetServiceId: 'alum-screen-gypsum',
      reason: 'تركيب أو إصلاح سلك البليسيه لمنع دخول الحشرات مستقبلاً',
      noteAddition: 'إضافة تكميلية: فحص سلك الشبابيك وسد الفتحات الجانبية',
    },
    {
      targetServiceId: 'clean-home-deep',
      reason: 'تنظيف وتعقيم الأسطح والخزائن بالتوازي مع المكافحة',
      noteAddition: 'إضافة تكميلية: تنظيف الزوايا وأسفل أجهزة المطبخ',
    },
  ],
  'pest-garden-villa': [
    {
      targetServiceId: 'garden-landscaping',
      reason: 'تقليم الأشجار وتنظيف الحديقة يعزز فعالية المكافحة',
      noteAddition: 'إضافة تكميلية: تنظيف الحشائش الجافة حول السور',
    },
    {
      targetServiceId: 'tanks-clean',
      reason: 'تعقيم خزان المياه الأرضي أو العلوي في الفيلا',
      noteAddition: 'إضافة تكميلية: فحص وتأمين غطاء خزان المياه',
    },
  ],
  'sec-cctv-install': [
    {
      targetServiceId: 'sec-wifi-dish',
      reason: 'ضبط تغطية الواي فاي لضمان بث الكاميرات على الموبايل بدون تقطيع',
      noteAddition: 'إضافة تكميلية: اختبار استقرار شبكة الواي فاي وربط المشاهدة عن بُعد',
    },
  ],
  'sec-wifi-dish': [
    {
      targetServiceId: 'sec-cctv-install',
      reason: 'توصيل أو مراجعة كاميرات المراقبة على نفس الشبكة',
      noteAddition: 'إضافة تكميلية: مراجعة نقاط التوصيل للإنتركم أو الكاميرات',
    },
  ],
  'move-furniture-winch': [
    {
      targetServiceId: 'carp-furniture-assembly',
      reason: 'فك وتركيب الغرف والمطابخ بأيدٍ متخصصة بعد النقل',
      noteAddition: 'إضافة تكميلية: فك وإعادة تركيب غرف النوم والمطبخ بعد النقل',
    },
    {
      targetServiceId: 'clean-home-deep',
      reason: 'تنظيف الشقة الجديدة قبل أو بعد ترتيب العفش',
      noteAddition: 'إضافة تكميلية: تنظيف سريع للأرضيات بعد إنزال الأثاث',
    },
  ],
  'tanks-clean': [
    {
      targetServiceId: 'plumb-leak',
      reason: 'فحص العوامة ومحبس ومواسير تغذية الخزان بعد الغسيل',
      noteAddition: 'إضافة تكميلية: فحص عوامة الخزان ومنع تسريب المواسير',
    },
  ],
  'garden-landscaping': [
    {
      targetServiceId: 'pest-garden-villa',
      reason: 'رش وقائي للحديقة ضد الناموس والزواحف بعد القص',
      noteAddition: 'إضافة تكميلية: رش وقائي آمن لمحيط الحديقة والمدخل',
    },
  ],
  'alum-screen-gypsum': [
    {
      targetServiceId: 'pest-home-spray',
      reason: 'تعزيز حماية المنزل برش وقائي مع تركيب السلك المانع للحشرات',
      noteAddition: 'إضافة تكميلية: رش وقائي حول إطارات الشبابيك والأبواب',
    },
  ],
  'car-steam-wash': [
    {
      targetServiceId: 'clean-sofa-carpet',
      reason: 'نفس ماكينة البخار متاحة لتعقيم الأنتريه أو السجاد بالمنزل',
      noteAddition: 'إضافة تكميلية: غسيل وتعقيم مقاعد السيارة بالبخار العميق',
    },
  ],
};

const HISTORY_CATEGORY_FOLLOWUPS: Record<string, ComplementaryRule[]> = {
  ac: [
    {
      targetServiceId: 'ac-freon-full',
      reason: 'بناءً على طلبك السابق في التكييف · فحص الفريون',
      noteAddition: 'إضافة بناءً على سجلك: مراجعة ضغط الفريون لوحدة التكييف السابقة',
    },
  ],
  plumbing: [
    {
      targetServiceId: 'plumb-heater',
      reason: 'بناءً على طلبك السابق في السباكة · صيانة السخان',
      noteAddition: 'إضافة بناءً على سجلك: فحص صمام الأمان ووصلات السخان',
    },
  ],
  cleaning: [
    {
      targetServiceId: 'clean-sofa-carpet',
      reason: 'بناءً على طلب التنظيف السابق لديك · غسيل بالبخار',
      noteAddition: 'إضافة بناءً على سجلك: غسيل الأنتريه أو السجاد بالبخار',
    },
    {
      targetServiceId: 'pest-home-spray',
      reason: 'مكملة لطلب التنظيف السابق لديك',
      noteAddition: 'إضافة بناءً على سجلك: رش وقائي بدون رائحة للمطبخ',
    },
  ],
  electrical: [
    {
      targetServiceId: 'elec-lighting',
      reason: 'استكمالاً لطلبك السابق في الكهرباء',
      noteAddition: 'إضافة بناءً على سجلك: فحص المفاتيح والإنارة الإضافية',
    },
  ],
  electronics: [
    {
      targetServiceId: 'net-mesh-wifi',
      reason: 'استقرار شبكة الإنترنت يعزز أداء الشاشات الذكية وأجهزة العمل',
      noteAddition: 'إضافة تكميلية: فحص اتصال الشاشة أو اللابتوب بشبكة الواي فاي',
    },
  ],
  networks: [
    {
      targetServiceId: 'sec-cctv-install',
      reason: 'استغلال قوة الشبكة في ربط كاميرات المراقبة بالموبايل',
      noteAddition: 'إضافة تكميلية: اختبار بث الكاميرات على شبكة الواي فاي الجديدة',
    },
  ],
};

export function computeSmartServiceHints(
  currentServiceTitle: string,
  currentCategoryId: string,
  customerRequests: ServiceRequest[]
): SmartServiceHint[] {
  const serviceById = new Map(SERVICES_CATALOG.map((s) => [s.id, s]));
  const currentService =
    SERVICES_CATALOG.find((s) => s.title === currentServiceTitle) ||
    SERVICES_CATALOG.find((s) => s.categoryId === currentCategoryId);

  const currentId = currentService?.id || '';
  const activeHistoryRequests = customerRequests.filter(
    (r) => r.status !== 'cancelled'
  );
  const pastServiceTitles = new Set(activeHistoryRequests.map((r) => r.serviceTitle));

  const hintsByTargetId = new Map<string, SmartServiceHint>();

  // 1. Complementary suggestions directly linked to the currently selected service
  const currentRules = COMPLEMENTARY_SERVICE_RULES[currentId] || [];
  for (const rule of currentRules) {
    const target = serviceById.get(rule.targetServiceId);
    if (!target || target.id === currentId || target.title === currentServiceTitle) {
      continue;
    }

    const alsoInHistory = activeHistoryRequests.some(
      (r) => r.categoryId === target.categoryId || r.serviceTitle === target.title
    );

    hintsByTargetId.set(target.id, {
      id: `hint-${target.id}`,
      service: target,
      reason: alsoInHistory
        ? `${rule.reason} (مرتبط بسجل طلباتك)`
        : rule.reason,
      source: alsoInHistory ? 'current_and_history' : 'current_service',
      noteAddition: rule.noteAddition,
    });
  }

  // 2. Personalized suggestions derived from the customer's previous/active requests
  for (const req of activeHistoryRequests) {
    const reqService = SERVICES_CATALOG.find((s) => s.title === req.serviceTitle);
    const rulesFromHistory = [
      ...(reqService ? COMPLEMENTARY_SERVICE_RULES[reqService.id] || [] : []),
      ...(HISTORY_CATEGORY_FOLLOWUPS[req.categoryId] || []),
    ];

    for (const rule of rulesFromHistory) {
      const target = serviceById.get(rule.targetServiceId);
      if (
        !target ||
        target.id === currentId ||
        target.title === currentServiceTitle ||
        hintsByTargetId.has(target.id)
      ) {
        continue;
      }

      // Prefer complementary services the customer hasn't already booked with exact title
      const alreadyRequestedExact = pastServiceTitles.has(target.title);
      const historyReason = alreadyRequestedExact
        ? `مرتبط بطلبك «${req.serviceTitle}» · مناسب للتجديد`
        : `بناءً على طلبك السابق «${req.serviceTitle}»`;

      hintsByTargetId.set(target.id, {
        id: `hint-${target.id}`,
        service: target,
        reason: historyReason,
        source: 'customer_history',
        noteAddition: rule.noteAddition,
      });
    }
  }

  // Prioritize: combined current+history -> current complementary -> history follow-ups
  const priorityOrder: Record<SmartServiceHint['source'], number> = {
    current_and_history: 0,
    current_service: 1,
    customer_history: 2,
  };

  return Array.from(hintsByTargetId.values())
    .sort((a, b) => priorityOrder[a.source] - priorityOrder[b.source])
    .slice(0, 3);
}

export interface RequestCostSavingsSummary {
  marketAverageEGP: number | null;
  previousQuotesCount: number;
  bestOfferEGP: number | null;
  expectedSavingsPercent: number;
  expectedSavingsAmountEGP: number;
  mode: 'live_best_offer' | 'accepted_offer' | 'historical_expectation';
}

export function computeRequestCostSavingsSummary(
  request: ServiceRequest,
  requestQuotes: ServiceQuote[],
  allQuotes: ServiceQuote[],
  allRequests: ServiceRequest[],
  allReviews: TechnicianReview[]
): RequestCostSavingsSummary {
  let previousPool = collectPreviousPricesForService(
    request.serviceTitle,
    allQuotes,
    allRequests,
    allReviews,
    request.id
  );

  // Fallback to category-level historical quotes when a custom service title is used
  if (previousPool.length < 2) {
    const categoryTitles = SERVICES_CATALOG.filter(
      (s) => s.categoryId === request.categoryId
    ).map((s) => s.title);
    const catPool: number[] = [];
    for (const title of categoryTitles) {
      catPool.push(
        ...collectPreviousPricesForService(
          title,
          allQuotes,
          allRequests,
          allReviews,
          request.id
        )
      );
    }
    if (catPool.length >= 2) {
      previousPool = catPool;
    }
  }

  const marketAverageEGP =
    previousPool.length >= 2
      ? Math.round(previousPool.reduce((sum, p) => sum + p, 0) / previousPool.length)
      : null;

  const activeQuotes = requestQuotes.filter(
    (q) => q.status !== 'rejected' && q.priceEGP > 0
  );
  const acceptedQuote = activeQuotes.find(
    (q) => q.id === request.acceptedQuoteId || q.status === 'accepted'
  );

  if (acceptedQuote) {
    const expectedSavingsAmountEGP =
      marketAverageEGP !== null
        ? Math.max(0, marketAverageEGP - acceptedQuote.priceEGP)
        : 0;
    const expectedSavingsPercent =
      marketAverageEGP !== null && marketAverageEGP > acceptedQuote.priceEGP
        ? Math.round((expectedSavingsAmountEGP / marketAverageEGP) * 100)
        : 0;

    return {
      marketAverageEGP,
      previousQuotesCount: previousPool.length,
      bestOfferEGP: acceptedQuote.priceEGP,
      expectedSavingsPercent,
      expectedSavingsAmountEGP,
      mode: 'accepted_offer',
    };
  }

  if (activeQuotes.length > 0) {
    const bestOfferEGP = Math.min(...activeQuotes.map((q) => q.priceEGP));
    const expectedSavingsAmountEGP =
      marketAverageEGP !== null ? Math.max(0, marketAverageEGP - bestOfferEGP) : 0;
    const expectedSavingsPercent =
      marketAverageEGP !== null && marketAverageEGP > bestOfferEGP
        ? Math.round((expectedSavingsAmountEGP / marketAverageEGP) * 100)
        : 0;

    return {
      marketAverageEGP,
      previousQuotesCount: previousPool.length,
      bestOfferEGP,
      expectedSavingsPercent,
      expectedSavingsAmountEGP,
      mode: 'live_best_offer',
    };
  }

  // Open request waiting for quotes: estimate expected savings based on historical spread
  const historicalMin = previousPool.length > 0 ? Math.min(...previousPool) : null;
  const expectedSavingsAmountEGP =
    marketAverageEGP !== null && historicalMin !== null
      ? Math.max(0, marketAverageEGP - historicalMin)
      : 0;
  const expectedSavingsPercent =
    marketAverageEGP !== null &&
    historicalMin !== null &&
    marketAverageEGP > historicalMin
      ? Math.round((expectedSavingsAmountEGP / marketAverageEGP) * 100)
      : 0;

  return {
    marketAverageEGP,
    previousQuotesCount: previousPool.length,
    bestOfferEGP: null,
    expectedSavingsPercent,
    expectedSavingsAmountEGP,
    mode: 'historical_expectation',
  };
}

// Seasonal Maintenance Bundles & Discount Promo Codes
export const SEASONAL_BUNDLES: SeasonalBundle[] = [
  {
    id: 'bundle-summer-ac',
    title: 'باقة تجهيز التكييف والكهرباء',
    subtitle: 'غسيل التكييف + فحص قاطع الأحمال باللوحة لحماية منزلك في الحر',
    seasonLabel: 'باقة الصيف الموفرة',
    categoryId: 'ac',
    serviceId: 'ac-clean-split',
    promoCode: 'SUMMER15',
    discountPercent: 15,
    maxDiscountEGP: 120,
    estimatedSavingsLabel: 'توفير حتى 120 ج.م',
    includedTasks: [
      'غسيل الوحدتين بالضغط وتسليك الصرف',
      'قياس ضغط الفريون الفعلي',
      'فحص قاطع التكييف بلوحة الكهرباء',
    ],
  },
  {
    id: 'bundle-home-fresh',
    title: 'باقة نظافة وتعقيم المنزل الشاملة',
    subtitle: 'تنظيف عميق للشقة مع رش وقائي آمن بدون رائحة في نفس الزيارة',
    seasonLabel: 'باقة العناية بالمنزل',
    categoryId: 'cleaning',
    serviceId: 'clean-home-deep',
    promoCode: 'KHADAMAT15',
    discountPercent: 15,
    maxDiscountEGP: 150,
    estimatedSavingsLabel: 'توفير حتى 150 ج.م',
    includedTasks: [
      'تنظيف وتعقيم الحمامات والمطبخ',
      'تلميع الأرضيات والأسطح',
      'رش جل وقائي آمن للمطبخ بدون رائحة',
    ],
  },
  {
    id: 'bundle-smart-wifi',
    title: 'باقة الشبكة الذكية والإلكترونيات',
    subtitle: 'توزيع واي فاي Mesh لكل الغرف + فحص واستقرار الأجهزة الذكية',
    seasonLabel: 'باقة المنزل الذكي',
    categoryId: 'networks',
    serviceId: 'net-mesh-wifi',
    promoCode: 'NET12',
    discountPercent: 12,
    maxDiscountEGP: 100,
    estimatedSavingsLabel: 'توفير حتى 100 ج.م',
    includedTasks: [
      'قياس إشارة الواي فاي في كل غرفة',
      'تثبيت وبرمجة مقوي Mesh',
      'توصيل الشاشات الذكية والطابعة بالشبكة',
    ],
  },
];

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'KHADAMAT15',
    title: 'خصم عملاء خدمات المميز',
    discountPercent: 15,
    maxDiscountEGP: 150,
  },
  {
    code: 'SUMMER15',
    title: 'خصم باقة التكييف والأجهزة',
    discountPercent: 15,
    maxDiscountEGP: 120,
    applicableCategoryIds: ['ac', 'electrical', 'appliances'],
  },
  {
    code: 'NET12',
    title: 'خصم الشبكات والإلكترونيات',
    discountPercent: 12,
    maxDiscountEGP: 100,
    applicableCategoryIds: ['networks', 'electronics', 'security_tech'],
  },
  {
    code: 'DAKAHLIA10',
    title: 'خصم أهل الدقهلية الترحيبي',
    discountPercent: 10,
    maxDiscountEGP: 90,
  },
];

export function validatePromoCode(
  rawCode: string,
  categoryId?: string
): { valid: true; promo: PromoCode } | { valid: false; error: string } {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: 'أدخل كود الخصم أولاً.' };
  }
  const found = PROMO_CODES.find((p) => p.code === normalized);
  if (!found) {
    return {
      valid: false,
      error: 'كود الخصم غير صحيح. جرّب KHADAMAT15 أو DAKAHLIA10.',
    };
  }
  if (
    found.applicableCategoryIds &&
    categoryId &&
    !found.applicableCategoryIds.includes(categoryId)
  ) {
    return {
      valid: false,
      error: `كود ${found.code} مخصص لأقسام محددة. استخدم KHADAMAT15 أو DAKAHLIA10 لهذا القسم.`,
    };
  }
  return { valid: true, promo: found };
}

export function computeDiscountedPrice(
  originalPriceEGP: number,
  discountPercent?: number,
  maxDiscountEGP?: number,
  flatDiscountEGP: number = 0
): { finalPriceEGP: number; promoDiscountEGP: number } {
  if (originalPriceEGP <= 0) {
    return { finalPriceEGP: 0, promoDiscountEGP: 0 };
  }
  let pctDiscount = 0;
  if (discountPercent && discountPercent > 0) {
    const rawDiscount = Math.round((originalPriceEGP * discountPercent) / 100);
    pctDiscount =
      maxDiscountEGP && maxDiscountEGP > 0
        ? Math.min(rawDiscount, maxDiscountEGP)
        : rawDiscount;
  }
  const extraFlat = flatDiscountEGP > 0 ? Math.round(flatDiscountEGP) : 0;
  const totalDiscount = Math.min(originalPriceEGP, pctDiscount + extraFlat);
  const finalPriceEGP = Math.max(0, originalPriceEGP - totalDiscount);
  return { finalPriceEGP, promoDiscountEGP: totalDiscount };
}

export const FAST_QUOTE_WINDOW_MINUTES = 30;

export function getFastQuoteWindowStatus(
  createdAtTimestamp?: number,
  quotesCount: number = 0,
  nowMs: number = Date.now()
): {
  remainingMinutes: number;
  elapsedMinutes: number;
  isWithinWindow: boolean;
  headline: string;
} {
  if (!createdAtTimestamp) {
    return {
      remainingMinutes: quotesCount > 0 ? 18 : 26,
      elapsedMinutes: quotesCount > 0 ? 12 : 4,
      isWithinWindow: true,
      headline:
        quotesCount > 0
          ? 'عروض سريعة خلال 30 دقيقة'
          : 'جاري تجميع عروض خلال 30 دقيقة',
    };
  }
  const elapsedMinutes = Math.max(
    0,
    Math.floor((nowMs - createdAtTimestamp) / 60000)
  );
  const remainingMinutes = Math.max(
    0,
    FAST_QUOTE_WINDOW_MINUTES - elapsedMinutes
  );
  const isWithinWindow = remainingMinutes > 0;

  return {
    remainingMinutes,
    elapsedMinutes,
    isWithinWindow,
    headline: isWithinWindow
      ? `متبقي ${remainingMinutes} د من نافذة الـ 30 دقيقة`
      : 'مفتوح لاستقبال عروض إضافية',
  };
}

export function parseWarrantyDaysFromLabel(
  label?: string,
  fallbackDays = 30
): number {
  if (!label) return fallbackDays;
  const match = label.match(/(\d+)/);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (label.includes('فحص')) return 14;
  return fallbackDays;
}

export interface WarrantyCertificateStatus {
  certificateCode: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  progressPercent: number;
  isActive: boolean;
  expiryDateLabel: string;
}

export function getWarrantyCertificateStatus(
  req: ServiceRequest,
  warrantyLabel?: string,
  nowMs: number = Date.now()
): WarrantyCertificateStatus {
  const catalogMatch = SERVICES_CATALOG.find((s) => s.title === req.serviceTitle);
  const totalDays =
    req.warrantyDays ||
    parseWarrantyDaysFromLabel(warrantyLabel, catalogMatch?.warrantyDays || 30);

  const baseTimestamp =
    req.completedAtTimestamp ||
    req.createdAtTimestamp ||
    nowMs - 4 * 24 * 60 * 60 * 1000;

  const dayMs = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.max(0, Math.floor((nowMs - baseTimestamp) / dayMs));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((remainingDays / Math.max(1, totalDays)) * 100))
  );

  const expiryDate = new Date(baseTimestamp + totalDays * dayMs);
  const expiryISO = `${expiryDate.getFullYear()}-${String(
    expiryDate.getMonth() + 1
  ).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;

  return {
    certificateCode: `WR-${req.referenceCode}`,
    totalDays,
    elapsedDays,
    remainingDays,
    progressPercent,
    isActive: remainingDays > 0,
    expiryDateLabel: formatArabicDateLabel(expiryISO),
  };
}

export const KHADAMAT_POINTS_PER_COMPLETED_ORDER = 100;
export const KHADAMAT_BONUS_POINTS_FOR_RATING = 20;

export const LOYALTY_REWARDS: LoyaltyRewardTier[] = [
  {
    id: 'reward-100',
    title: 'خصم فوري 10 ج.م',
    pointsCost: 100,
    discountEGP: 10,
    promoCode: 'PTS10',
    description: 'كل 100 نقطة تمنحك خصم 10 جنيه فوري على أي عرض فني توافق عليه',
  },
  {
    id: 'reward-200',
    title: 'خصم فوري 20 ج.م',
    pointsCost: 200,
    discountEGP: 20,
    promoCode: 'PTS20',
    description: 'استبدل 200 نقطة بخصم 20 جنيه مباشرة من قيمة خدمات التكييف أو السباكة أو الكهرباء',
  },
  {
    id: 'reward-400',
    title: 'خصم VIP بقيمة 40 ج.م',
    pointsCost: 400,
    discountEGP: 40,
    promoCode: 'PTS40',
    description: 'استبدل 400 نقطة بخصم 40 جنيه على الصيانة الشاملة والباقات المنزلية',
  },
];

export interface CustomerPointsSummary {
  completedOrdersCount: number;
  earnedPoints: number;
  spentPoints: number;
  availablePoints: number;
  tierName: string;
  nextMilestonePoints: number;
  nextMilestoneLabel: string;
  pointsToNextMilestone: number;
  progressPercent: number;
}

export function computeOrderEarnedPoints(req: ServiceRequest): number {
  if (req.status !== 'completed' || req.isWarrantyClaim) return 0;
  if (typeof req.pointsAwarded === 'number' && req.pointsAwarded > 0) {
    return req.pointsAwarded;
  }
  return (
    KHADAMAT_POINTS_PER_COMPLETED_ORDER +
    (req.rating ? KHADAMAT_BONUS_POINTS_FOR_RATING : 0)
  );
}

export function computeCustomerPointsSummary(
  requests: ServiceRequest[],
  redemptions: LoyaltyRedemption[]
): CustomerPointsSummary {
  const completedOrders = requests.filter(
    (r) => r.status === 'completed' && !r.isWarrantyClaim
  );
  const earnedPoints = completedOrders.reduce(
    (sum, req) => sum + computeOrderEarnedPoints(req),
    0
  );
  const spentPoints = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);
  const availablePoints = Math.max(0, earnedPoints - spentPoints);

  let tierName = 'العضو البرونزي';
  if (earnedPoints >= 400) {
    tierName = 'العضو الذهبي VIP';
  } else if (earnedPoints >= 200) {
    tierName = 'العضو الفضي';
  }

  let nextMilestonePoints = 100;
  let nextMilestoneLabel = 'خصم فوري 10 ج.م (100 نقطة)';
  if (availablePoints < 100) {
    nextMilestonePoints = 100;
    nextMilestoneLabel = 'خصم فوري 10 ج.م (100 نقطة)';
  } else if (availablePoints < 200) {
    nextMilestonePoints = 200;
    nextMilestoneLabel = 'خصم فوري 20 ج.م (200 نقطة)';
  } else if (availablePoints < 400) {
    nextMilestonePoints = 400;
    nextMilestoneLabel = 'خصم VIP بقيمة 40 ج.م (400 نقطة)';
  } else {
    nextMilestonePoints = 400;
    nextMilestoneLabel = 'وصلت إلى أعلى باقة خصم متاحة (40 ج.م)';
  }

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((availablePoints / nextMilestonePoints) * 100))
  );
  const pointsToNextMilestone = Math.max(0, nextMilestonePoints - availablePoints);

  return {
    completedOrdersCount: completedOrders.length,
    earnedPoints,
    spentPoints,
    availablePoints,
    tierName,
    nextMilestonePoints,
    nextMilestoneLabel,
    pointsToNextMilestone,
    progressPercent,
  };
}

export const DEFAULT_HOME_PLANNER_PROFILE: HomePlannerProfile = {
  homeType: 'apartment',
  acUnits: 2,
  seasonFocus: 'summer',
  priorityCategories: ['ac', 'plumbing', 'electrical'],
};

export interface SmartMaintenancePlanSummary {
  readinessScore: number;
  coveredByWarrantyCount: number;
  activeRecurringCount: number;
  estimatedAnnualSavingLabel: string;
  recommendations: PlannerRecommendation[];
}

export function generateSmartMaintenancePlan(
  profile: HomePlannerProfile,
  requests: ServiceRequest[],
  recurringSchedules: RecurringSchedule[],
  quotes: ServiceQuote[]
): SmartMaintenancePlanSummary {
  const activeSchedules = recurringSchedules.filter((s) => s.status === 'active');

  const activeWarrantyMap = new Map<string, string>();
  requests
    .filter((r) => r.status === 'completed' && !r.isWarrantyClaim)
    .forEach((req) => {
      const q = quotes.find(
        (item) =>
          item.id === req.acceptedQuoteId ||
          (item.requestId === req.id && item.status === 'accepted')
      );
      const status = getWarrantyCertificateStatus(req, q?.warrantyLabel);
      if (status.isActive) {
        activeWarrantyMap.set(req.serviceTitle, status.expiryDateLabel);
      }
    });

  const isServiceScheduled = (serviceTitle: string, categoryId: string) =>
    activeSchedules.some(
      (s) => s.serviceTitle === serviceTitle || s.categoryId === categoryId
    );

  const candidateIds: {
    serviceId: string;
    priority: PlannerRecommendation['priority'];
    reason: string;
    frequency: PlannerRecommendation['recommendedFrequency'];
    promoCode: string;
    savingLabel: string;
  }[] = [];

  // 1. AC Planning based on unit count & season
  if (
    profile.acUnits > 0 &&
    (profile.seasonFocus === 'summer' ||
      profile.seasonFocus === 'year_round' ||
      profile.priorityCategories.includes('ac'))
  ) {
    candidateIds.push({
      serviceId: 'ac-clean-split',
      priority: profile.seasonFocus === 'summer' ? 'high' : 'recommended',
      reason:
        profile.acUnits >= 2
          ? `لديك ${profile.acUnits} أجهزة تكييف — الغسيل الدوري يقلل استهلاك الكهرباء حتى 20% ويمنع التسريب.`
          : 'غسيل وفحص التكييف قبل ذروة الاستخدام يضمن تبريداً قوياً بدون أعطال مفاجئة.',
      frequency: profile.seasonFocus === 'summer' ? 'monthly' : 'none',
      promoCode: 'KHADAMAT15',
      savingLabel: 'وفر حتى 150 ج.م (كود KHADAMAT15)',
    });
  }

  // 2. Plumbing & Water Heater
  if (
    profile.seasonFocus === 'winter' ||
    profile.priorityCategories.includes('plumbing') ||
    profile.homeType === 'villa'
  ) {
    candidateIds.push({
      serviceId: profile.seasonFocus === 'winter' ? 'plumb-heater' : 'plumb-leak',
      priority: profile.seasonFocus === 'winter' ? 'high' : 'recommended',
      reason:
        profile.seasonFocus === 'winter'
          ? 'فحص السخان وصمام الأمان والثرموستات ضروري قبل برودة الشتاء لتجنب الأعطال المفاجئة.'
          : 'مراجعة الوصلات ومواتير المياه تمنع ارتفاع فاتورة المياه والتسريبات الخفية.',
      frequency: 'none',
      promoCode: 'DAKAHLIA10',
      savingLabel: 'خصم 10% (كود DAKAHLIA10)',
    });
  }

  // 3. Electrical Load & Safety Panel
  if (profile.priorityCategories.includes('electrical') || profile.acUnits >= 2) {
    candidateIds.push({
      serviceId: 'elec-panel',
      priority: profile.acUnits >= 3 ? 'high' : 'recommended',
      reason:
        profile.homeType === 'office'
          ? 'تأمين لوحة توزيع الأحمال للأجهزة المكتبية والتكييفات يحمي المعدات من تذبذب الجهد.'
          : 'قياس أحمال التكييفات والأجهزة الثقيلة على لوحة القواطع يمنع الفصل المتكرر.',
      frequency: 'none',
      promoCode: 'KHADAMAT15',
      savingLabel: 'خصم 15% على الفحص الشامل',
    });
  }

  // 4. Deep Cleaning / Villa Tanks & Garden
  if (profile.homeType === 'villa') {
    candidateIds.push({
      serviceId: 'tanks-clean',
      priority: 'recommended',
      reason: 'للمنازل المستقلة والفلل: غسيل وتعقيم خزان المياه كل 3–6 أشهر يحفظ جودة المياه.',
      frequency: 'monthly',
      promoCode: 'DAKAHLIA10',
      savingLabel: 'خصم 10% في الجدولة الدورية',
    });
  } else {
    candidateIds.push({
      serviceId: 'clean-home-deep',
      priority: 'preventive',
      reason:
        profile.homeType === 'office'
          ? 'جدولة تنظيف دوري للمكتب تحافظ على بيئة عمل صحية وتوفر عروض تعاقد شهرية.'
          : 'جدولة تنظيف عميق شهري توفر وقتك وتثبّت أفضل تسعيرة مع نفس الفريق.',
      frequency: 'monthly',
      promoCode: 'KHADAMAT15',
      savingLabel: 'وفر حتى 15% (كود KHADAMAT15)',
    });
  }

  // 5. Home Networks / Smart Work Setup
  if (
    profile.priorityCategories.includes('networks') ||
    profile.priorityCategories.includes('electronics') ||
    profile.homeType === 'office'
  ) {
    candidateIds.push({
      serviceId: 'net-mesh-wifi',
      priority: 'recommended',
      reason: 'توزيع شبكة Mesh Wi-Fi يضمن تغطية كاملة للشقة أو المكتب بدون مناطق عمياء.',
      frequency: 'none',
      promoCode: 'NEWMNS12',
      savingLabel: 'خصم 12% لشبكات المنازل والمكاتب',
    });
  }

  // 6. Preventive Appliances / Pest Control
  if (
    profile.priorityCategories.includes('appliances') ||
    profile.priorityCategories.includes('pest_control')
  ) {
    const targetId = profile.priorityCategories.includes('pest_control')
      ? 'pest-home-spray'
      : 'app-washing-fridge';
    candidateIds.push({
      serviceId: targetId,
      priority: 'preventive',
      reason:
        targetId === 'pest-home-spray'
          ? 'الرش الوقائي الآمن بدون رائحة في بداية الموسم يحمي المطبخ والمنزل طوال العام.'
          : 'فحص وقائي لكاوتش الثلاجة وفلاتر الغسالة يطيل عمر الأجهزة ويقلل استهلاك الكهرباء.',
      frequency: 'none',
      promoCode: 'DAKAHLIA10',
      savingLabel: 'خصم 10% (كود DAKAHLIA10)',
    });
  }

  const seenServices = new Set<string>();
  const recommendations: PlannerRecommendation[] = [];

  for (const item of candidateIds) {
    if (seenServices.has(item.serviceId)) continue;
    const svc = SERVICES_CATALOG.find((s) => s.id === item.serviceId);
    if (!svc) continue;
    seenServices.add(item.serviceId);

    const warrantyUntil = activeWarrantyMap.get(svc.title);
    const scheduled = isServiceScheduled(svc.title, svc.categoryId);

    recommendations.push({
      id: `plan-${svc.id}`,
      categoryId: svc.categoryId,
      serviceId: svc.id,
      serviceTitle: svc.title,
      priority: warrantyUntil || scheduled ? 'preventive' : item.priority,
      reason: warrantyUntil
        ? `مغطى حالياً بشهادة ضمان سارية حتى ${warrantyUntil} — لا حاجة لصيانة مدفوعة الآن.`
        : scheduled
        ? 'هذه الخدمة مجدولة تلقائياً بالفعل ضمن طلباتك الدورية النشطة.'
        : item.reason,
      recommendedFrequency: item.frequency,
      recommendedPromoCode: item.promoCode,
      estimatedSavingLabel: item.savingLabel,
      alreadyCoveredByWarranty: warrantyUntil,
      alreadyScheduled: scheduled,
    });
  }

  const coveredByWarrantyCount = recommendations.filter((r) =>
    Boolean(r.alreadyCoveredByWarranty)
  ).length;
  const activeRecurringCount = activeSchedules.length;

  const baseScore = 58;
  const warrantyBoost = Math.min(22, activeWarrantyMap.size * 11);
  const scheduleBoost = Math.min(20, activeRecurringCount * 10);
  const readinessScore = Math.min(100, baseScore + warrantyBoost + scheduleBoost);

  const estimatedAnnualSavingLabel =
    profile.homeType === 'villa' || profile.acUnits >= 3
      ? 'حتى 1,450 ج.م سنوياً'
      : 'حتى 850 ج.م سنوياً';

  return {
    readinessScore,
    coveredByWarrantyCount,
    activeRecurringCount,
    estimatedAnnualSavingLabel,
    recommendations: recommendations.slice(0, 4),
  };
}





