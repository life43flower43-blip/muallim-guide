import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, courseChapters, courseList } from "@/lib/public-bank";

export const metadata: Metadata = {
  title: "محاور إعداد المعلم | تربوي",
  description: "محاور مجانية لطلاب كليات التربية والمتقدمين لاختبارات التوظيف والرخصة المهنية للمعلمين: النمو، وعلم النفس التربوي، والتعلم، والتقويم، وطرق التدريس، والتربية الخاصة.",
  alternates: { canonical: `${SITE_URL}/learn` },
};

export default function LearnIndex() {
  const courses = courseList();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">محاور إعداد المعلم</h1>
        <p className="mt-2 max-w-2xl leading-8 text-secondary-foreground">
          شرح مبسط لكل مفهوم تربوي مع أمثلة من الصف وأسئلة تدريب بمستوى اختبارات التوظيف والرخصة المهنية في الدول العربية.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <Link key={c.id} href={`/learn/${c.id}`} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
            <h2 className="font-display text-lg font-semibold">{c.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {courseChapters(c.id).length} فصلًا، {c.concepts.length} مفهومًا
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
