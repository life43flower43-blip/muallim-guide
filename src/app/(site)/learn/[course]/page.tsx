import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, chapterLabel, courseChapters, publicBank } from "@/lib/public-bank";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(publicBank().courses).map((course) => ({ course }));
}

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course } = await params;
  const name = publicBank().courses[course];
  if (!name) return {};
  const chapters = courseChapters(course).map((c) => chapterLabel(c.chapter));
  return {
    title: `${name} | تربوي`,
    description: `${name}: ${chapters.slice(0, 6).join("، ")}، وغيرها. شرح وأمثلة وأسئلة تدريب.`,
    alternates: { canonical: `${SITE_URL}/learn/${course}` },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  const name = publicBank().courses[course];
  if (!name) notFound();
  const chapters = courseChapters(course);
  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground">المقررات</Link> / {name}
      </nav>
      <h1 className="font-display text-3xl font-bold">{name}</h1>
      {chapters.map((ch, i) => (
        <section key={ch.chapter}>
          <h2 className="mb-3 font-display text-lg font-semibold">
            {i + 1}. {chapterLabel(ch.chapter)}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {ch.concepts.map((c) => (
              <li key={c.id}>
                <Link href={`/learn/${course}/${c.id}`} className="block px-4 py-3 text-base hover:bg-muted/60">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
