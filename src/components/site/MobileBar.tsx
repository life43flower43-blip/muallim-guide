"use client";

// أزرار الهاتف في رأس الموقع: زر بحث يفتح شريط بحث بعرض الشاشة، وزر قائمة يفتح درجًا جانبيًا من اليمين
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, ChevronDown, ChevronLeft, ClipboardCheck, Compass, Home, Info, Layers, LayoutGrid, Library, Network, Newspaper, School, Search, Smartphone, X, Scale, ListChecks, Calculator, CalendarDays, GraduationCap, Mail, Globe } from "lucide-react";
import SearchBox from "./SearchBox";

type L = { href: string; label: string };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/articles": Newspaper,
  "/learn": Layers,
  "/glossary": Library,
  "/practice-test": ClipboardCheck,
  "/classroom-problems": School,
  "/misconceptions": AlertTriangle,
  "/mind-maps": Network,
  "/comparisons": Scale,
  "/standards": ListChecks,
  "/license-calculator": Calculator,
  "/weekly-test": CalendarDays,
  "/teacher-exams": Globe,
  "/specialized": GraduationCap,
  "/sections": LayoutGrid,
  "/license-guide": Compass,
  "/tatbeeq": Smartphone,
  "/about": Info,
  "/contact": Mail,
};

function Burger({ open }: { open: boolean }) {
  // ثلاثة خطوط بأطوال مختلفة تتحول إلى علامة إغلاق
  return (
    <span className="relative block h-5 w-6" aria-hidden="true">
      <span className={`absolute end-0 h-[2.5px] rounded-full bg-current transition-all ${open ? "top-[9px] w-6 rotate-45" : "top-0.5 w-6"}`} />
      <span className={`absolute end-0 top-[9px] h-[2.5px] rounded-full bg-current transition-all ${open ? "w-0 opacity-0" : "w-4"}`} />
      <span className={`absolute end-0 h-[2.5px] rounded-full bg-current transition-all ${open ? "top-[9px] w-6 -rotate-45" : "top-[17px] w-5"}`} />
    </span>
  );
}

export default function MobileBar({ nav, groups = [], courses }: { nav: L[]; groups?: { title: string; items: L[] }[]; courses: L[] }) {
  const [panel, setPanel] = useState<"none" | "search" | "menu">("none");
  const [showCourses, setShowCourses] = useState(false);
  const path = usePathname();
  useEffect(() => setPanel("none"), [path]);
  useEffect(() => {
    document.body.style.overflow = panel === "menu" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panel]);
  const close = () => setPanel("none");
  const btn = "flex h-11 w-11 items-center justify-center rounded-full text-[#136F5C] transition active:bg-[#EEF5F1]";

  return (
    <div className="ms-auto flex items-center gap-1 md:hidden">
      <button type="button" aria-label="بحث" onClick={() => setPanel(panel === "search" ? "none" : "search")} className={`${btn} ${panel === "search" ? "bg-[#EEF5F1]" : ""}`}>
        {panel === "search" ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" strokeWidth={2.2} />}
      </button>
      <button type="button" aria-label="القائمة" aria-expanded={panel === "menu"} onClick={() => setPanel(panel === "menu" ? "none" : "menu")} className={btn}>
        <Burger open={panel === "menu"} />
      </button>

      {panel === "search" && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-[#E2ECE6] bg-white px-4 py-3">
          <SearchBox autoFocus onDone={close} />
        </div>
      )}

      {/* الدرج الجانبي */}
      <div className={`fixed inset-0 z-50 ${panel === "menu" ? "" : "pointer-events-none"}`} aria-hidden={panel !== "menu"}>
        <button type="button" aria-label="إغلاق القائمة" onClick={close} className={`absolute inset-0 bg-[#0B2A23]/50 transition-opacity ${panel === "menu" ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 start-0 flex w-[84%] max-w-[340px] flex-col bg-white transition-transform duration-300 ${panel === "menu" ? "translate-x-0" : "translate-x-full"}`}>
          <div className="bg-[linear-gradient(135deg,#0E4F42,#136F5C)] px-5 pb-5 pt-4 text-white">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <img src="/icons/logo-128.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-0.5" />
                <span className="font-display text-[22px] font-extrabold">تربوي</span>
              </span>
              <button type="button" aria-label="إغلاق" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 text-[13px] text-white/80">دليل المعلم إلى اختبار الرخصة والتوظيف</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {nav.map((n) => {
              const Icon = ICONS[n.href] ?? BookOpen;
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              if (n.href === "/learn")
                return (
                  <div key={n.href}>
                    <button type="button" onClick={() => setShowCourses((v) => !v)} className={`flex w-full items-center gap-3 px-5 py-3.5 text-[16px] font-bold ${active ? "text-[#136F5C]" : "text-[#14302A]"}`}>
                      <Icon className="h-5 w-5 text-[#136F5C]" />
                      <span className="flex-1 text-right">{n.label}</span>
                      <ChevronDown className={`h-5 w-5 text-[#8AA095] transition ${showCourses ? "rotate-180" : ""}`} />
                    </button>
                    {showCourses && (
                      <div className="mx-5 mb-2 border-s-2 border-[#DDE9E2] ps-3">
                        <Link href="/learn" className="block py-2 text-[14px] font-bold text-[#136F5C]">كل المحاور</Link>
                        {courses.map((c) => (
                          <Link key={c.href} href={c.href} className="block py-2 text-[14px] text-[#2E4A42]">{c.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              return (
                <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-5 py-3.5 text-[16px] font-bold ${active ? "bg-[#EEF5F1] text-[#136F5C]" : "text-[#14302A]"}`}>
                  <Icon className="h-5 w-5 text-[#136F5C]" />
                  <span className="flex-1">{n.label}</span>
                  <ChevronLeft className="h-4 w-4 text-[#B5C6BE]" />
                </Link>
              );
            })}
            {groups.map((g) => (
              <div key={g.title} className="mt-2 border-t border-[#EEF3F0] pt-2">
                <p className="px-5 pb-1 pt-2 text-[12.5px] font-bold text-[#8AA095]">{g.title}</p>
                {g.items.map((n) => {
                  const Icon = ICONS[n.href] ?? BookOpen;
                  const active = path.startsWith(n.href);
                  return (
                    <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-5 py-3 text-[15px] font-bold ${active ? "bg-[#EEF5F1] text-[#136F5C]" : "text-[#14302A]"}`}>
                      <Icon className="h-[18px] w-[18px] text-[#136F5C]" />
                      <span className="flex-1">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-[#E2ECE6] p-4">
            <Link prefetch={false} href="/app" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7C5CFF] font-bold text-white">
              <Smartphone className="h-5 w-5" /> ابدأ التدريب مجانًا
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
