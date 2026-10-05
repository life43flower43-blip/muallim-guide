"use client";

import { motion } from "framer-motion";
import { Gem, Info, ShoppingBag, Sparkles, FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHOP_ITEMS } from "@/lib/shop";
import { useApp } from "@/lib/store";

// ---------- صورة الجنية مع شارات القطع الملبسة (تُستخدم في المسار والمتجر) ----------
export function FairyAvatar({
  equipped,
  size = 48,
}: {
  equipped: Record<string, boolean>;
  size?: number;
}) {
  const badges = SHOP_ITEMS.filter((i) => equipped?.[i.id]);
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-b from-amber-100 to-pink-100 shadow-[0_0_16px_rgba(251,191,36,0.55)]"
        style={{ fontSize: size * 0.52, lineHeight: 1 }}
      >
        🧚‍♀️
      </span>
      {badges.length > 0 && (
        <span className="absolute -left-1.5 -top-1 flex flex-col gap-0.5">
          {badges.map((b) => (
            <span
              key={b.id}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-white text-[10px] shadow-sm"
            >
              {b.emoji}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

// ---------- متجر الجواهر ----------
export default function ShopDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const gems = useApp((s) => s.gems);
  const ownedItems = useApp((s) => s.ownedItems);
  const equipped = useApp((s) => s.equipped);
  const addGems = useApp((s) => s.addGems);
  const buyItem = useApp((s) => s.buyItem);
  const toggleEquip = useApp((s) => s.toggleEquip);

  // أزرار التجربة تظهر في نسخة التطوير فقط وتختفي نهائياً في بناء الإنتاج
  const IS_DEV = process.env.NODE_ENV === "development";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl p-5">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base font-black">
              <Gem className="h-5 w-5 text-cyan-600" /> متجر الجواهر
            </span>
            <span
              dir="ltr"
              className="flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-700"
            >
              <Gem className="h-4 w-4" /> {gems}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* معاينة الجنية بالقطع الملبسة */}
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-pink-50 p-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          >
            <FairyAvatar equipped={equipped} size={72} />
          </motion.div>
          <p className="text-xs font-black text-amber-900">هذه جينيتك</p>
          <p className="text-[11px] leading-5 text-amber-950/70">
            ترافقك على مسار الرحلة في الرئيسية، وتلبس ما تشتريه لها من هنا.
          </p>
        </div>

        {/* كيفية كسب الجواهر */}
        <div className="flex items-start gap-2 rounded-2xl bg-muted/60 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] font-semibold leading-6 text-foreground/80">
            اكسب الجواهر: أكمل أي جلسة تدريب أو اختبار أو محاكاة (+5 جواهر)، وإن أنهيتها
            كاملة بلا خطأ فستربح (+10). تصرفها على قطع تظهر بجانب الجنية في المسار.
          </p>
        </div>

        {/* القطع */}
        <div className="space-y-2">
          {SHOP_ITEMS.map((item) => {
            const owned = Boolean(ownedItems[item.id]);
            const on = Boolean(equipped[item.id]);
            const affordable = gems >= item.price;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  on ? "border-amber-300 bg-amber-50/70" : "border-border bg-white"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-black">
                    {item.name}
                    {owned && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                        مقتناة
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                {owned ? (
                  <button
                    onClick={() => toggleEquip(item.id)}
                    className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-black transition-colors ${
                      on
                        ? "bg-amber-400 text-amber-950"
                        : "bg-secondary text-primary"
                    }`}
                  >
                    {on ? "ملبسة — انزعها" : "البسها"}
                  </button>
                ) : (
                  <button
                    onClick={() => buyItem(item.id)}
                    disabled={!affordable}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[11px] font-black transition-colors ${
                      affordable
                        ? "bg-cyan-600 text-white"
                        : "cursor-not-allowed bg-muted text-muted-foreground"
                    }`}
                  >
                    <Gem className="h-3 w-3" />
                    {affordable ? item.price : `تحتاج ${item.price - gems}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* أدوات تجربة الجواهر — نسخة التطوير فقط */}
        {IS_DEV && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black text-amber-800">
              <FlaskConical className="h-4 w-4" /> أدوات تجربة — تظهر في نسخة التطوير فقط
            </p>
            <p className="mt-0.5 text-[10px] leading-5 text-amber-900/70">
              امنح جويتك جواهر مجانية لتجربة الشراء من المتجر قبل النشر.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                onClick={() => addGems(10)}
                className="rounded-xl bg-white py-2 text-xs font-black text-amber-900 shadow-sm transition-transform active:scale-95"
              >
                +10 جواهر
              </button>
              <button
                onClick={() => addGems(50)}
                className="rounded-xl bg-white py-2 text-xs font-black text-amber-900 shadow-sm transition-transform active:scale-95"
              >
                +50 جوهرة
              </button>
              <button
                onClick={() => addGems(-gems)}
                className="rounded-xl bg-white py-2 text-xs font-black text-red-600 shadow-sm transition-transform active:scale-95"
              >
                تصفير الجواهر
              </button>
            </div>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-[10px] font-bold text-muted-foreground">
          <Sparkles className="h-3 w-3" /> كل عملية شراء تُحفظ على هاتفك مع بقية تقدمك
          <ShoppingBag className="h-3 w-3" />
        </p>
      </DialogContent>
    </Dialog>
  );
}
