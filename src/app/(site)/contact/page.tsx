// صفحة التواصل: قائمة بذاتها، فيها طرق التواصل وما يمكن مراسلتنا بشأنه
import type { Metadata } from "next";
import { Mail, Lightbulb, BookX, Lock, Flag } from "lucide-react";
import Prose from "@/components/site/Prose";
import { SITE_URL } from "@/lib/public-bank";

export const metadata: Metadata = { title: "اتصل بنا | تربوي", description: "تواصل مع فريق تربوي لاقتراح، أو ملاحظة على محتوى، أو سؤال عن الخصوصية.", alternates: { canonical: `${SITE_URL}/contact` } };

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const TOPICS = [
  { icon: Lightbulb, t: "اقتراح", d: "موضوع تريد مقالًا عنه، أو ميزة في التطبيق." },
  { icon: BookX, t: "خطأ في المحتوى", d: "معلومة غير دقيقة، أو خطأ لغوي في مفهوم أو مقال." },
  { icon: Lock, t: "الخصوصية والحساب", d: "سؤال عن بياناتك، أو طلب حذف حسابك." },
];

export default function Contact() {
  return (
    <Prose title="اتصل بنا" intro="يسعدنا أن نسمع منك. نقرأ كل رسالة، ونرد عليها في أقرب وقت.">
      <div className="not-prose grid gap-3 sm:grid-cols-3">
        {TOPICS.map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-[#E2ECE6] bg-white p-4">
            <Icon className="h-6 w-6 text-[#136F5C]" strokeWidth={1.8} />
            <p className="mt-2 text-[15.5px] font-extrabold text-[#14302A]">{t}</p>
            <p className="mt-1 text-[14px] leading-7 text-[#4A6158]">{d}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#EEF5F1] p-5">
        <Mail className="h-6 w-6 shrink-0 text-[#136F5C]" />
        {EMAIL ? (
          <p className="m-0">راسلنا على: <a href={`mailto:${EMAIL}`} dir="ltr">{EMAIL}</a></p>
        ) : (
          <p className="m-0">البريد الإلكتروني للتواصل يُضاف قريبًا.</p>
        )}
      </div>
      <p className="flex gap-2"><Flag className="mt-2 h-4 w-4 shrink-0 text-[#B4532A]" /><span>للإبلاغ عن خطأ في سؤال بعينه، استخدم زر «أبلغ عن خطأ في السؤال» داخل التطبيق بعد الإجابة، فيصلنا السؤال نفسه مع ملاحظتك.</span></p>
    </Prose>
  );
}
