"use client";
// قائمة «حسابي»: لوح يطلع من أسفل الشاشة فوق الصفحة الحالية (مثل تطبيق أوريندو)،
// خلفه طبقة داكنة ضبابية فلا يظهر ما وراءه، ويُغلق بالسحب للأسفل أو بالضغط خارجه.
// كل صف يفتح قسمه الخاص.
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, Download, Send, Settings, Share2, Trophy, UserRound } from "lucide-react";
import { OPEN_SETTINGS_EVENT } from "@/lib/ui-store";

const TILES = {
  profile: { bg: "linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)", shadow: "0 6px 14px -4px rgba(2,132,199,0.45)" },
  tests: { bg: "linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)", shadow: "0 6px 14px -4px rgba(124,58,237,0.45)" },
  settings: { bg: "linear-gradient(180deg, #94A3B8 0%, #475569 100%)", shadow: "0 6px 14px -4px rgba(71,85,105,0.4)" },
  data: { bg: "linear-gradient(180deg, #2DD4BF 0%, #0F766E 100%)", shadow: "0 6px 14px -4px rgba(15,118,110,0.45)" },
} as const;

type Item = { id: keyof typeof TILES; label: string; sub: string; icon: React.ElementType; section?: "settings" | "data" | "tests" };
const ITEMS: Item[] = [
  { id: "profile", label: "الملف الشخصي", sub: "حسابك وجواهرك ومستواك", icon: UserRound },
  { id: "tests", label: "الإنجازات والنتائج", sub: "اختباراتك السابقة وتقدمك", icon: Trophy, section: "tests" },
  { id: "settings", label: "الإعدادات", sub: "الهدف والمظهر والتذكير", icon: Settings, section: "settings" },
  { id: "data", label: "البيانات والأمان", sub: "نسخة احتياطية وكلمة المرور", icon: Download, section: "data" },
];

async function shareApp() {
  const url = `${window.location.origin}/tatbeeq`;
  const text = "تطبيق تربوي: آلاف الأسئلة بشرح لكل إجابة للاستعداد لاختبار الرخصة المهنية للمعلمين، مجانًا";
  try {
    if (navigator.share) await navigator.share({ title: "تطبيق تربوي", text, url });
    else await navigator.clipboard.writeText(`${text}\n${url}`);
  } catch {}
}

export default function AccountDrawer({ open, onClose, onOpenProfile }: { open: boolean; onClose: () => void; onOpenProfile: () => void }) {
  const go = (it: Item) => {
    onClose();
    onOpenProfile();
    if (it.section) setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT, { detail: it.section })), 60);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[44] bg-slate-900/50 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-label="قائمة حسابي"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={onDragEnd}
            className="fixed inset-x-0 bottom-0 z-[46] flex flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] dark:bg-card"
            style={{ maxHeight: "85vh", paddingBottom: "calc(var(--nav-h, 88px) + 4px)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--t700)]" />
            <div className="flex shrink-0 justify-center pb-1 pt-3">
              <div className="h-1.5 w-10 rounded-full bg-slate-300" />
            </div>

            {/* شارك التطبيق: أول القائمة، بلمعة تمر عليه */}
            <div className="shrink-0 px-4 pb-1 pt-2">
              <motion.button
                type="button"
                onClick={shareApp}
                whileTap={{ scale: 0.97 }}
                className="share-banner relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3.5 text-start text-white ring-1 ring-white/40"
                style={{ boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--t700) 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.35)" }}
              >
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-150%" }}
                  animate={{ x: "350%" }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                />
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/25 shadow-inner ring-1 ring-white/50">
                  <Share2 className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold leading-tight">شارك التطبيق مع زملائك</span>
                  <span className="mt-1 block text-[11px] leading-tight text-white/90">شارك المعرفة — شارك تربوي</span>
                </span>
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 ring-1 ring-white/40">
                  <Send className="h-4 w-4 -scale-x-100" strokeWidth={2.5} />
                </span>
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-2 pt-2">
              {ITEMS.map((it) => (
                <motion.button
                  key={it.id}
                  type="button"
                  onClick={() => go(it)}
                  whileTap={{ scale: 0.96 }}
                  className="mb-2 flex w-full items-center gap-4 rounded-2xl p-3 text-start transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-white/5"
                >
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/40" style={{ background: TILES[it.id].bg, boxShadow: TILES[it.id].shadow }}>
                    <it.icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-tight text-foreground">{it.label}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{it.sub}</span>
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                    <ChevronLeft className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
