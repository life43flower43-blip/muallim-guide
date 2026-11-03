# تجهيز بوت فيسبوك ولينكدإن

الأسرار تُكتب في Vercel فقط (Settings ← Environment Variables)، ولا تُرسل في المحادثة.

## فيسبوك
1. أنشئ صفحة على فيسبوك باسم «تربوي» (صفحة لا حساب شخصي).
2. افتح developers.facebook.com ← My Apps ← Create App ← اختر نوع Business، والاسم Turbawy Bot.
3. أضف حالة الاستخدام «Manage everything on your Page» (أو منتج Facebook Login for Business).
4. في إعدادات Facebook Login ← Valid OAuth Redirect URIs أضف:
   https://muallim-guide.vercel.app/api/social/facebook/callback
5. App settings ← Basic:
   - Privacy Policy URL: https://muallim-guide.vercel.app/privacy
   - Category: Education، وأيقونة التطبيق.
   - انسخ App ID وApp Secret إلى Vercel: `FACEBOOK_APP_ID` و`FACEBOOK_APP_SECRET`.
6. حوّل التطبيق إلى Live (منشورات التطبيق في وضع التطوير لا يراها الجمهور).

## لينكدإن
1. أنشئ صفحة شركة على لينكدإن باسم «تربوي» (لينكدإن يشترطها لإنشاء التطبيق).
2. افتح linkedin.com/developers ← Create app: الاسم Turbawy Bot، واختر صفحة «تربوي»، وPrivacy policy URL: https://muallim-guide.vercel.app/privacy، والشعار.
3. وثّق التطبيق مع الصفحة (Verify) ووافق عليه من حساب مشرف الصفحة.
4. تبويب Products: أضف «Sign In with LinkedIn using OpenID Connect» و«Share on LinkedIn».
5. تبويب Auth ← Authorized redirect URLs أضف:
   https://muallim-guide.vercel.app/api/social/linkedin/callback
6. انسخ Client ID وPrimary Client Secret إلى Vercel: `LINKEDIN_CLIENT_ID` و`LINKEDIN_CLIENT_SECRET`.

## بعد ذلك
Redeploy في Vercel، ثم أخبر Claude ليبرمج صفحة الربط وزر «اربط فيسبوك» و«اربط لينكدإن» وينشر الجدول فيهما.
