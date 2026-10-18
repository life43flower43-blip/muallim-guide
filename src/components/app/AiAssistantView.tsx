"use client";

// المساعد الذكي — يجيب فوراً من محرك التطبيق التربوي المحلي
// بلا مفتاح، بلا إعدادات، بلا اتصال: يفتح ويعمل مباشرة،
// والإجابات كلها عربية فصحى من مكتبة التطبيق وإجابات خبيرة جاهزة.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  SendHorizonal,
  Sparkles,
  AlertTriangle,
  Loader2,
  Trash2,
  Bot,
  GraduationCap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUi } from "@/lib/ui-store";
import { answerLocally, type LocalChatMessage } from "@/lib/ai-local";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  meta?: string;
}

// اقتراحات جاهزة تشعل المحادثة
const QUICK_PROMPTS = [
  { icon: Bot, text: "كيف تطور الذكاء الاصطناعي وما دوره في العملية التعليمية؟" },
  { icon: GraduationCap, text: "اقترح لي ثلاثة أنشطة تشويقية لافتتاح حصة الطلاب بفاعلية" },
  { icon: Sparkles, text: "كيف أتعامل بذكاء مع طالب يقاطع الشرح باستمرار؟" },
  { icon: Target, text: "ساعدني في صياغة أهداف تعليمية سلوكية لدرس قادم" },
];

let uidSeq = 1;
const newId = () => uidSeq++;

export default function AiAssistantView() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const clearAi = useUi((s) => s.clearAi);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // تمرير تلقائي لآخر رسالة
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // ---------- الإرسال ----------
  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;

      const userMsg: ChatMsg = { id: newId(), role: "user", content };
      const botMsg: ChatMsg = { id: newId(), role: "assistant", content: "", pending: true };
      setMsgs((m) => [...m, userMsg, botMsg]);
      setInput("");
      setBusy(true);

      // سياق خفيف: آخر رسائل الحوار لقراءة أسئلة المتابعة القصيرة
      const history: LocalChatMessage[] = msgs
        .filter((m) => !m.pending && !m.error && m.content)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const reply = await answerLocally(content, history);
        setMsgs((m) =>
          m.map((x) =>
            x.id === botMsg.id
              ? { ...x, content: reply, pending: false, meta: "رد فوري من محرك التطبيق التربوي" }
              : x
          )
        );
      } catch {
        setMsgs((m) =>
          m.map((x) =>
            x.id === botMsg.id
              ? {
                  ...x,
                  content: "حدث خلل مؤقت في محرك الإجابة — أعد طرح سؤالك من فضلك.",
                  pending: false,
                  error: true,
                }
              : x
          )
        );
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, msgs]
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
      <div className="safe-top shrink-0 bg-gradient-to-bl from-[#0A5A62] via-[#0B6870] to-[#0E7C86] px-4 pb-4">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </span>
            <div>
              <h1 className="text-base font-black leading-5 text-white">المساعد الذكي</h1>
              <p className="text-[10px] font-bold text-white/85">يجيبك فوراً — بلا إعدادات ولا انتظار</p>
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
              onClick={clearAi}
              aria-label="إغلاق المساعد الذكي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-2 ring-white/25 backdrop-blur transition hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======= المحادثة ======= */}
      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 ? (
          <EmptyState onPick={(t) => send(t)} />
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
            placeholder="اسأل عن أي شيء تربوي…"
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
    </motion.div>
  );
}

// ---------- حالة الفراغ: ترحيب واقتراحات ----------
function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="rounded-3xl border border-border bg-white p-5 text-center shadow-sm">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-bl from-[#0B6870] to-[#0E7C86]">
          <Sparkles className="h-7 w-7 text-amber-300" />
        </span>
        <h2 className="text-lg font-black text-foreground">كيف أساعدك اليوم؟</h2>
        <p className="mx-auto mt-1.5 max-w-[19rem] text-xs font-semibold leading-6 text-muted-foreground">
          اسألني عن المفاهيم التربوية، وإدارة الصف، وخطط الدروس، وأساليب التقويم، وتطور الذكاء
          الاصطناعي ودوره في التعليم — وسأجيبك فوراً من داخل التطبيق.
        </p>
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
  const paragraphs = msg.content.split(/\n{2,}/).filter(Boolean);
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
