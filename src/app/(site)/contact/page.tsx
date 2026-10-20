import type { Metadata } from "next";
import Prose from "@/components/site/Prose";
import { SITE_URL } from "@/lib/public-bank";

export const metadata: Metadata = { title: "اتصل بنا | تربوي", description: "تواصل مع فريق تربوي.", alternates: { canonical: `${SITE_URL}/contact` } };

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Contact() {
  return (
    <Prose title="اتصل بنا">
      <p>يسعدنا تواصلك لاقتراح، أو ملاحظة على محتوى، أو سؤال عن الخصوصية.</p>
      {EMAIL ? (
        <p>
          البريد الإلكتروني: <a href={`mailto:${EMAIL}`} className="font-medium text-primary" dir="ltr">{EMAIL}</a>
        </p>
      ) : (
        <p>البريد الإلكتروني للتواصل يُضاف قريبًا.</p>
      )}
      <p>للإبلاغ عن خطأ في سؤال بعينه، استخدم زر «أبلغ عن خطأ في السؤال» داخل التطبيق بعد الإجابة.</p>
    </Prose>
  );
}
