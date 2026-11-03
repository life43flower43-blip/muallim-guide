// حاسبة مستوى الرخصة المهنية للمعلمين: ممارس، متقدم، خبير
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/public-bank";
import Prose from "@/components/site/Prose";
import Calc from "./Calc";

export const metadata: Metadata = {
  title: "حاسبة مستوى الرخصة المهنية للمعلمين: ممارس أم متقدم أم خبير | تربوي",
  description: "اكتب درجتك في الاختبار التربوي العام والاختبار التخصصي، واعرف مستوى رخصتك المتوقع: معلم ممارس، أو متقدم، أو خبير، وكم درجة تنقصك للمستوى التالي.",
  alternates: { canonical: `${SITE_URL}/license-calculator` },
};

export default function LicenseCalculator() {
  return (
    <Prose title="حاسبة مستوى الرخصة المهنية" intro="اكتب درجتك في الاختبارين، واعرف مستوى رخصتك المتوقع، وكم درجة تنقصك للمستوى التالي.">
      <Calc />
      <h2>كيف تُحسب؟</h2>
      <p>تعتمد الحاسبة على حدود الدرجات المنشورة: ممارس من ٥٠ إلى ٦٩، ومتقدم من ٧٠ إلى ٧٩، وخبير ٨٠ فأكثر. وتحسب مستواك بالدرجة الأقل بين الاختبارين، لأن الحد يُشترط في كليهما.</p>
      <p>المستوى النهائي يرتبط أيضًا بشروط أخرى، مثل المؤهل وسنوات الخبرة، وقد تتغير الحدود. فالنتيجة هنا تقديرية، والمرجع الرسمي هو <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer">هيئة تقويم التعليم والتدريب</a>.</p>
      <h2>تريد درجة أعلى؟</h2>
      <p>ذاكر بالمعايير العشرة التي يُبنى عليها الاختبار التربوي العام: <Link href="/standards">المعايير العشرة وما يسأل عنه كل معيار</Link>، ثم جرّب <Link href="/practice-test">نموذج الاختبار التفاعلي</Link>.</p>
    </Prose>
  );
}
