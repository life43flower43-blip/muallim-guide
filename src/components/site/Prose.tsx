// نص صفحة ثابتة (عن الموقع، الخصوصية، الشروط)
export default function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-5 leading-8 text-secondary-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ms-5 [&_li]:list-disc">
      <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      {children}
    </article>
  );
}
