# دليل تحويل تطبيق «خدمات» إلى تطبيق أندرويد (APK) وتثبيته

يحتوي هذا المشروع على إعدادات **Capacitor 8** الجاهزة لتحويل تطبيق **خدمات** (خدمات الدقهلية والمنصورة الجديدة) إلى تطبيق أندرويد أصيل (`APK`) يعمل بسرعة وسلاسة على الهواتف، بما في ذلك شاشة البداية بلون التطبيق (`#0f766e`)، ودعم شريط الحالة، والعمل دون اتصال عبر البيانات المحلية والرسومات المضمنة.

---

## الطريقة الأولى: تحميل ملف APK جاهز مباشرة عبر GitHub Actions (بدون تثبيت Android Studio)

هذه هي أسهل طريقة لتجربة التطبيق وتثبيته على هاتفك فوراً:

1. ارفع المشروع إلى مستودع جديد على حسابك في **GitHub** (على فرع `main`):
   ```bash
   git init
   git add .
   git commit -m "إعداد Capacitor وبناء APK لمنصة خدمات"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/khadamat-dakahlia.git
   git push -u origin main
   ```
2. افتح المستودع على GitHub ثم انتقل إلى تبويب **Actions**.
3. اختر آخر تشغيل لعملية **`Deploy Live Website & Build Android APK`**.
4. بعد اكتمال البناء (يستغرق دقيقتين تقريباً)، انزل إلى قسم **Artifacts** في أسفل الصفحة واضغط على **`khadamat-dakahlia-apk`** لتحميل ملف `app-debug.apk`.

---

## الطريقة الثانية: بناء ملف APK محلياً عبر Android Studio

### المتطلبات الأساسية على جهازك
- **Node.js** (الإصدار 20 أو أحدث)
- **Java JDK 21**
- **Android Studio** مع تثبيت Android SDK (API 34/35)

### خطوات البناء والمزامنة

1. **تثبيت حزم المشروع وبناء نسخة الإنتاج**:
   ```bash
   npm install
   npm run build
   ```

2. **إنشاء مشروع Android الأصيل ومزامنة ملفات التطبيق لأول مرة**:
   ```bash
   npx cap add android
   npx cap sync android
   ```
   *(أو استخدم الاختصار المدمج: `npm run apk:sync` بعد إنشاء مجلد `android`).*

3. **توليد ملف APK مباشرة من سطر الأوامر (بدون واجهة Android Studio)**:
   - على **macOS / Linux**:
     ```bash
     cd android && ./gradlew assembleDebug
     ```
   - على **Windows (PowerShell)**:
     ```powershell
     cd android; .\gradlew.bat assembleDebug
     ```
   ستجد ملف التطبيق الجاهز للتثبيت في المسار:
   `android/app/build/outputs/apk/debug/app-debug.apk`

4. **أو عبر واجهة Android Studio (مناسب أيضاً لبناء نسخة Release موقّعة للمتجر)**:
   ```bash
   npm run apk:open
   ```
   - داخل Android Studio اختر من القائمة العلوية:
     **`Build` ← `Build Bundle(s) / APK(s)` ← `Build APK(s)`**
   - وعند الانتهاء اضغط **`locate`** لفتح مجلد ملف `.apk`.
   - لنشر نسخة رسمية على Google Play، اختر: **`Build` ← `Generate Signed App Bundle / APK`**.

---

## خطوات تثبيت ملف APK على هاتف الأندرويد

1. انقل ملف **`app-debug.apk`** إلى هاتفك (عبر USB أو واتساب أو Telegram أو Google Drive).
2. اضغط على الملف لبدء التثبيت.
3. إذا ظهرت رسالة أمان تطلب السماح بتثبيت التطبيقات:
   - اضغط **الإعدادات (Settings)**.
   - فعّل خيار **السماح من هذا المصدر (Allow from this source)**.
4. اضغط **تثبيت (Install)** ثم **فتح (Open)**.
5. سيعمل التطبيق بشاشة بداية «خدمات» الخضراء، وبكامل الميزات (طلب الخدمة، الرسومات الكرتونية، العروض، المحادثة، الطلبات المتكررة، وخريطة الدقهلية والمنصورة الجديدة) حتى عند انقطاع الإنترنت.

---

## ملاحظة عند تحديث الكود مستقبلاً

عند إجراء أي تعديل على شاشات أو خدمات التطبيق، نفّذ فقط:
```bash
npm run apk:sync
```
ثم أعد بناء APK من Android Studio أو `./gradlew assembleDebug` (أو ارفع التحديث إلى GitHub عبر `git push` ليتم بناء APK الجديد تلقائياً مع تحديث الموقع الحي).
