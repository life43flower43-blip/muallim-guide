"use client";

// المساعد الذكي — يجيب فوراً من محرك التطبيق التربوي المحلي
// بلا مفتاح، بلا إعدادات، بلا اتصال: يفتح ويعمل مباشرة،
// والإجابات كلها عربية فصحى من مكتبة التطبيق وإجابات خبيرة جاهزة.

import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizonal, Sparkles, AlertTriangle, Loader2, Trash2, Bot, GraduationCap, Target, MessageSquareText } from "lucide-react";
import { Divided, ScreenShell, SectionHeader } from "./ui-kit";
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
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // تمرير تلقائي لآخر رسالة
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
              ? { ...x, content: reply, pending: false }
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
    <ScreenShell
      title="المساعد التربوي"
      sub="إجابات فورية من مكتبة التطبيق"
      onClose={clearAi}
      actions={
        msgs.length > 0 ? (
          <button
            type="button"
            onClick={clearChat}
            disabled={busy}
            aria-label="محادثة جديدة"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--t900)] hover:bg-black/5 dark:text-foreground disabled:opacity-40"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        ) : undefined
      }
      footer={
        <div className="flex w-full items-end gap-2">
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
            aria-label="سؤالك"
            placeholder="اكتب سؤالك التربوي"
            disabled={busy}
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-base leading-6 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label="إرسال"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5 -scale-x-100" />}
          </button>
        </div>
      }
    >
      {msgs.length === 0 ? (
        <EmptyState onPick={(t) => send(t)} />
      ) : (
        <div className="space-y-4">
          {msgs.map((m) => (
            <ChatBubble key={m.id} msg={m} />
          ))}
        </div>
      )}
      <div ref={endRef} />
    </ScreenShell>
  );
}

// ---------- حالة الفراغ: تعريف واقتراحات ----------
function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Sparkles className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">بماذا أساعدك؟</h2>
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          اسأل عن المفاهيم التربوية، وإدارة الصف، وتخطيط الدروس، والتقويم، والذكاء الاصطناعي في التعليم.
        </p>
      </div>
      <section>
        <SectionHeader title="أسئلة مقترحة" />
        <Divided>
          {QUICK_PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.text}
                type="button"
                onClick={() => onPick(p.text)}
                className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-base leading-6">{p.text}</span>
              </button>
            );
          })}
        </Divided>
      </section>
    </div>
  );
}

// ---------- رسالة ----------
function ChatBubble({ msg }: { msg: ChatMsg }) {
  const paragraphs = msg.content.split(/\n{2,}/).filter(Boolean);
  if (msg.role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3">
          <p className="whitespace-pre-wrap text-base leading-7 text-primary-foreground">{msg.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <MessageSquareText className="h-4 w-4" />
      </span>
      <div className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 ${msg.error ? "border-destructive/40 bg-danger-soft" : "border-border bg-card"}`}>
        {msg.pending ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">يكتب الإجابة</span>
          </div>
        ) : (
          <>
            {msg.error && (
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> تعذر إتمام الطلب
              </span>
            )}
            <div className="space-y-3">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-wrap text-base leading-8">
                  {p}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
