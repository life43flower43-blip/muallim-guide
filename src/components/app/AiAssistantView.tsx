"use client";

// المساعد الذكي — محادثة تربوية عبر وكيل الخادم المتصل بموقع المزوّد
// أول استخدام: افتح الإعدادات ⚙ وألصق مفتاحك من صفحة المفاتيح في الموقع.
// المفتاح يبقى في جهازك فقط، والمحادثة تمر عبر خادم التطبيق كوكيل آمن.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Settings,
  SendHorizonal,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Bot,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import {
  askAi,
  getAiSettings,
  saveAiSettings,
  listAiModels,
  AI_DEFAULT_MODEL,
  type AiChatMessage,
  type AiSettings,
} from "@/lib/ai";

// ---------- أمر النظام: هوية المساعد وقواعد لغته ----------
const SYSTEM_PROMPT = [
  "أنت «مساعد تربوي» خبير يرافق المعلمين وطلاب كليات التربية.",
  "أجب دائماً بالعربية الفصحى الواضحة، بتنصيص «» عند الاقتباس، وبأرقام عربية مشرقية (٠١٢٣).",
  "اجعل الإجابة عملية ومباشرة: ابدأ بالجوهر، ثم خطوات تطبيقية، ثم مثال صفّي قصير عند المناسبة.",
  "لا تستخدم الإنجليزية إطلاقاً، وإن اضطررت لمصطلح أجنبي فاشرحه بالعربية.",
  "إذا سُئلت عن شيء خارج التربية والتعليم فأجب بإيجاز ثم ارجع لدورك التربوي بلطف.",
].join("\n");

interface ChatMsg extends AiChatMessage {
  id: number;
  pending?: boolean;
  error?: boolean;
  meta?: string;
}

// اقتراحات جاهزة تشعل المحادثة
const QUICK_PROMPTS = [
  { icon: GraduationCap, text: "اشرح لي مفهوم التعلم النشط بأسلوب مبسط مع مثال صفّي" },
  { icon: Sparkles, text: "اقترح لي ثلاثة أنشطة تشويقية لافتتاح حصة الطلاب بفاعلية" },
  { icon: Bot, text: "كيف أتعامل بذكاء مع طالب يقاطع الشرح باستمرار؟" },
  { icon: Settings, text: "ساعدني في صياغة أهداف تعليمية سلوكية لدرس قادم" },
];

let uidSeq = 1;
const newId = () => uidSeq++;

export default function AiAssistantView() {
  const [settings, setSettings] = useState<AiSettings>({ key: "", model: AI_DEFAULT_MODEL });
  const [settingsReady, setSettingsReady] = useState(false); // هل قرأنا localStorage؟
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const clearAi = useUi((s) => s.clearAi);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // قراءة الإعدادات مرة واحدة عند الفتح
  useEffect(() => {
    setSettings(getAiSettings());
    setSettingsReady(true);
    // لا محادثة محفوظة — كل فتح جلسة جديدة نظيفة
  }, []);

  // تمرير تلقائي لآخر رسالة
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const hasKey = settings.key.trim().length > 0;

  // ---------- الإرسال ----------
  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      if (!hasKey) {
        setShowSettings(true);
        return;
      }

      const userMsg: ChatMsg = { id: newId(), role: "user", content };
      const botMsg: ChatMsg = { id: newId(), role: "assistant", content: "", pending: true };
      setMsgs((m) => [...m, userMsg, botMsg]);
      setInput("");
      setBusy(true);

      // سياق المحادثة: أمر النظام + آخر تبادل (بلا رسائل الانتظار أو الأخطاء)
      const history: AiChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...msgs
          .filter((m) => !m.pending && !m.error && m.content)
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      try {
        const reply = await askAi(history);
        setMsgs((m) =>
          m.map((x) =>
            x.id === botMsg.id
              ? {
                  ...x,
                  content: reply.content,
                  pending: false,
                  meta: `${ad(reply.usage.total)} رمزاً`,
                }
              : x
          )
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "حدث عطل غير متوقع";
        setMsgs((m) =>
          m.map((x) => (x.id === botMsg.id ? { ...x, content: msg, pending: false, error: true } : x))
        );
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, hasKey, msgs]
  );

  const clearChat = () => {
    if (busy) return;
    setMsgs([]);
  };

  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* ======= الرأس ======= */}
      <div className="safe-top shrink-0 bg-gradient-to-bl from-[#2A1058] via-[#4C1D95] to-[#6D28D9] px-4 pb-4">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </span>
            <div>
              <h1 className="text-base font-black leading-5 text-white">المساعد الذكي</h1>
              <p className="text-[10px] font-bold text-white/85">رفيقك التربوي الذي يجيب فوراً</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {msgs.length > 0 && (
              <button
                onClick={clearChat}
                disabled={busy}
                aria-label="تفريغ المحادثة وبدء جلسة جديدة"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-2 ring-white/25 backdrop-blur transition hover:bg-white/25 disabled:opacity-40"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="إعدادات المساعد الذكي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-2 ring-white/25 backdrop-blur transition hover:bg-white/25"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={clearAi}
              aria-label="إغلاق المساعد الذكي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-2 ring-white/25 backdrop-blur transition hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======= لافتة عدم ضبط المفتاح ======= */}
      {settingsReady && !hasKey && (
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-right"
        >
          <KeyRound className="h-4 w-4 shrink-0 text-amber-700" />
          <span className="flex-1 text-xs font-bold leading-5 text-amber-800">
            لم تربط مفتاحك بعد — انقر هنا وألصق مفتاحك من صفحة المفاتيح في موقع المزوّد لتشغيل المساعد
          </span>
        </button>
      )}

      {/* ======= المحادثة ======= */}
      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 ? (
          <EmptyState onPick={(t) => send(t)} hasKey={hasKey} />
        ) : (
          <div className="mx-auto max-w-md space-y-3">
            {msgs.map((m) => (
              <ChatBubble key={m.id} msg={m} />
            ))}
          </div>
        )}
      </div>

      {/* ======= صف الإدخال ======= */}
      <div className="safe-bottom shrink-0 border-t border-border bg-white px-3 pb-2 pt-2.5">
        <div className="mx-auto flex max-w-md items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={hasKey ? "اسأل عن أي شيء تربوي…" : "اربط مفتاحك أولاً من الإعدادات ⚙"}
            disabled={busy}
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold leading-6 placeholder:font-bold placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
          <Button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label="إرسال السؤال"
            className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-primary p-0 hover:bg-primary/90"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizonal className="h-5 w-5 -scale-x-100" />
            )}
          </Button>
        </div>
      </div>

      {/* ======= طبقة الإعدادات ======= */}
      {showSettings && (
        <AiSettingsPanel
          settings={settings}
          onClose={() => {
            // مزامنة الحالة مع ما حفظه زر «تحقق وجلب الطرز» في الجهاز —
            // حتى لا تظن الشاشة أن المفتاح مفقود إن أغلق المستخدم بالزر ✕
            setSettings(getAiSettings());
            setShowSettings(false);
          }}
          onSaved={(s) => {
            setSettings(s);
            setShowSettings(false);
          }}
        />
      )}
    </motion.div>
  );
}

// ---------- حالة الفراغ: ترحيب واقتراحات ----------
function EmptyState({ onPick, hasKey }: { onPick: (t: string) => void; hasKey: boolean }) {
  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="rounded-3xl border border-border bg-white p-5 text-center shadow-sm">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-bl from-[#4C1D95] to-[#6D28D9]">
          <Sparkles className="h-7 w-7 text-amber-300" />
        </span>
        <h2 className="text-lg font-black text-foreground">كيف أساعدك اليوم؟</h2>
        <p className="mx-auto mt-1.5 max-w-[19rem] text-xs font-semibold leading-6 text-muted-foreground">
          اسألني عن المفاهيم التربوية، إدارة الصف، خطط الدروس، أساليب التقويم، أو أي موقف يواجهك
          في الميدان — وسأجيبك خطوة بخطوة.
        </p>
        {!hasKey && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-5 text-amber-800">
            ملاحظة: لتفعيل المحادثة اربط مفتاحك من الإعدادات ⚙ أعلى الشاشة — عملية لم تُكمل إلا مرة واحدة.
          </p>
        )}
      </div>

      <p className="mb-2 mt-4 px-1 text-xs font-black text-muted-foreground">جرّب أحد هذه الأسئلة:</p>
      <div className="grid grid-cols-1 gap-2">
        {QUICK_PROMPTS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.text}
              onClick={() => onPick(p.text)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3.5 text-right transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </span>
              <span className="text-xs font-bold leading-5 text-foreground">{p.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- فقاعة رسالة ----------
function ChatBubble({ msg }: { msg: ChatMsg }) {
  const paragraphs = useMemo(() => msg.content.split(/\n{2,}/).filter(Boolean), [msg.content]);
  if (msg.role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-3">
          <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-primary-foreground">
            {msg.content}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[92%] rounded-3xl rounded-bl-lg border px-4 py-3 ${
          msg.error ? "border-red-200 bg-red-50" : "border-border bg-white"
        }`}
      >
        {msg.pending ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground">يفكر الآن…</span>
          </div>
        ) : (
          <>
            {msg.error && (
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" /> تعذر إتمام الطلب
              </span>
            )}
            <div className="space-y-2.5">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-wrap text-sm leading-8 text-foreground">
                  {p}
                </p>
              ))}
            </div>
            {msg.meta && !msg.error && (
              <p className="mt-2 border-t border-border/60 pt-1.5 text-[10px] font-bold text-muted-foreground">
                {msg.meta}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- لوحة الإعدادات: المفتاح والطرز ----------
function AiSettingsPanel({
  settings,
  onSaved,
  onClose,
}: {
  settings: AiSettings;
  onSaved: (s: AiSettings) => void;
  onClose: () => void;
}) {
  const [keyDraft, setKeyDraft] = useState(settings.key);
  const [modelDraft, setModelDraft] = useState(settings.model || AI_DEFAULT_MODEL);
  const [models, setModels] = useState<string[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkState, setCheckState] = useState<"idle" | "ok" | "fail">("idle");
  const [checkMsg, setCheckMsg] = useState("");

  // إحضار الطرز — يتحقق من المفتاح في الوقت نفسه
  const fetchModels = useCallback(async () => {
    const k = keyDraft.trim();
    if (!k) {
      setCheckState("fail");
      setCheckMsg("ألصق مفتاحك أولاً في الحقل أعلاه");
      return;
    }
    // احفظ مؤقتاً ليقرأ الوكيل المفتاح من الجهاز
    saveAiSettings({ key: k, model: modelDraft });
    setChecking(true);
    setCheckState("idle");
    setCheckMsg("");
    try {
      const list = await listAiModels();
      setModels(list);
      setCheckState("ok");
      setCheckMsg(`تم التحقق — المفتاح صالح وبه ${ad(list.length)} طرازاً متاحاً`);
      if (!list.includes(modelDraft) && list.length) {
        // إن غاب الطراز المحفوظ فاختر الأول المتاح
        const fallback =
          list.find((m) => m === AI_DEFAULT_MODEL) ??
          list.find((m) => m.includes("flash") || m.includes("mini")) ??
          list[0];
        if (fallback) setModelDraft(fallback);
      }
    } catch (e) {
      setCheckState("fail");
      setCheckMsg(e instanceof Error ? e.message : "تعذّر الاتصال — أعد المحاولة");
    } finally {
      setChecking(false);
    }
  }, [keyDraft, modelDraft]);

  const canSave = keyDraft.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/50" onClick={onClose}>
      <div
        className="mx-auto mt-auto w-full max-w-md rounded-t-[2rem] bg-background p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <KeyRound className="h-5 w-5 text-primary" /> ربط المفتاح
          </h2>
          <button
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="rounded-full bg-muted p-2.5 text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* خطوات الربط */}
        <ol className="mb-4 space-y-1.5 rounded-2xl border border-border bg-muted/40 p-3.5 text-[11px] font-bold leading-5 text-muted-foreground">
          <li>
            <span className="text-primary">١.</span> افتح موقع المزوّد وانتقل إلى صفحة «مفاتيح الواجهة»
            في لوحة حسابك.
          </li>
          <li>
            <span className="text-primary">٢.</span> انسخ المفتاح كاملاً ثم ألصقه في الحقل أدناه —
            يُحفظ في جهازك فقط.
          </li>
          <li>
            <span className="text-primary">٣.</span> انقر «تحقق وجلب الطرز» لاختبار المفتاح واختيار
            الطراز، ثم «حفظ الربط».
          </li>
        </ol>

        {/* حقل المفتاح */}
        <label className="mb-1.5 block text-xs font-black text-foreground">مفتاح الواجهة</label>
        <div className="relative mb-1">
          <input
            dir="ltr"
            type={showKey ? "text" : "password"}
            value={keyDraft}
            onChange={(e) => {
              setKeyDraft(e.target.value);
              setCheckState("idle");
              setCheckMsg("");
            }}
            placeholder="ألصق المفتاح هنا…"
            autoComplete="off"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 pl-12 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mb-4 text-[10px] font-bold leading-4 text-muted-foreground">
          يبقى المفتاح محفوظاً في متصفح جهازك ولا يرسله التطبيق لأي جهة سوى المزوّد مباشرة.
        </p>

        {/* الطرز */}
        <label className="mb-1.5 block text-xs font-black text-foreground">الطراز المستخدم</label>
        {models.length > 0 ? (
          <select
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            className="mb-3 w-full rounded-2xl border border-border bg-white px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <div className="mb-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-[11px] font-bold leading-5 text-muted-foreground">
            لم تُجلب الطرز بعد — الطراز الافتراضي الحالي:{" "}
            <span dir="ltr" className="font-mono">
              {modelDraft}
            </span>
          </div>
        )}

        {/* نتيجة التحقق */}
        {checkMsg && (
          <div
            className={`mb-3 flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[11px] font-bold leading-5 ${
              checkState === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {checkState === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {checkMsg}
          </div>
        )}

        {/* الأزرار */}
        <div className="flex gap-2">
          <Button
            onClick={fetchModels}
            disabled={checking}
            variant="outline"
            className="h-12 flex-1 rounded-2xl border-2 font-black"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق وجلب الطرز"}
          </Button>
          <Button
            onClick={() => {
              saveAiSettings({ key: keyDraft.trim(), model: modelDraft });
              onSaved({ key: keyDraft.trim(), model: modelDraft });
            }}
            disabled={!canSave}
            className="h-12 flex-1 rounded-2xl bg-amber-400 font-black text-amber-950 hover:bg-amber-300 disabled:opacity-50"
          >
            حفظ الربط
          </Button>
        </div>
      </div>
    </div>
  );
}


