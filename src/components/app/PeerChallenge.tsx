"use client";

// تحدّي الأقران — من ميزة «ح» في بحث مشاكل الطلبة: غياب المساندة الاجتماعية والأقران.
// تُنشئ تحديًا من أسئلة البنك، ويُشفر كاملًا في رابط تشاركه مع زميلك — من يفتح الرابط
// يجيب عن الأسئلة نفسها ثم يقارن نتيجتكم. كل ذلك بلا سيرفر: المعطيات في معطيات الرابط.
// قواعد صارمة: النص المعروض بلا حروف لاتينية، الأرقام المشرقية عبر ad()، والتنصيص ب«».

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, Share2, CheckCircle2, XCircle, Trophy, ClipboardPaste, Swords, ArrowLeft, Check } from "lucide-react";
import { COURSES, COURSE_SHORT, questionById, conceptById, shuffle, questionsOfCourse, QUESTIONS } from "@/lib/qbank";
import { buildPeerLink, decodePeer, type PeerPayload } from "@/lib/peer";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import { Callout, Card, Chip, Divided, ListRow, OptionButton, PrimaryButton, ProgressBar, ScreenShell, SecondaryButton, SectionHeader } from "./ui-kit";

const LETTERS = ["أ", "ب", "ج", "د", "هـ"];

type Screen = "menu" | "create" | "paste" | "solve" | "done";
type Review = { qid: string; ok: boolean };

const PEER_XP_PER_CORRECT = 8;

export default function PeerChallenge() {
  const clearPeer = useUi((s) => s.clearPeer);
  const peerIncoming = useUi((s) => s.peerIncoming);
  const setPeerIncoming = useUi((s) => s.setPeerIncoming);
  const userName = useApp((s) => s.name);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const haptics = useApp((s) => s.haptics);

  // تحدٍّ واصل عبر الرابط يبدأ الحل مباشرة عند فتح الطبقة
  const [screen, setScreen] = useState<Screen>(() => (peerIncoming ? "solve" : "menu"));
  const [scope, setScope] = useState<string>("all");
  const [size, setSize] = useState<number>(5);

  // جلسة الحل
  const [payload, setPayload] = useState<PeerPayload | null>(() => peerIncoming);
  const [questions, setQuestions] = useState<string[]>(() => (peerIncoming ? peerIncoming.qids.filter((id) => questionById(id)) : []));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [review, setReview] = useState<Review[]>([]);
  const [linkText, setLinkText] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  // هل التحدي واصل من زميل (رابط مفتوح أو ملصق) أم تحدٍّ أنشأه المستخدم؟
  const [fromPeer, setFromPeer] = useState(() => Boolean(peerIncoming));
  const startedAt = useRef(Date.now());

  // تنظيف peerIncoming عند مغادرة الطبقة كي لا يعود التحدي بعد إغلاقه
  useEffect(() => {
    return () => setPeerIncoming(null);
  }, []);

  const pool = useMemo(() => {
    const qs = scope === "all" ? QUESTIONS : questionsOfCourse(scope);
    return qs.map((q) => q.id);
  }, [scope]);

  const createPayload = (): PeerPayload => ({
    qids: shuffle(pool).slice(0, size),
    sender: userName || "زميلك",
    senderCorrect: 0, // تُملأ بعد حلّ المرسل
    total: size,
  });

  const beginSolve = (p: PeerPayload, incoming: boolean) => {
    setFromPeer(incoming);
    setPayload(p);
    setQuestions(p.qids.filter((id) => questionById(id)));
    setIdx(0);
    setSelected(null);
    setGraded(null);
    setReview([]);
    startedAt.current = Date.now();
    setScreen("solve");
  };

  const startOwnChallenge = () => {
    const p = createPayload();
    beginSolve(p, false);
  };

  const tryPaste = () => {
    // نستخرج الشيفرة بعد علامة المعرف في الرابط مهما كان شكل الرابط
    const marker = "#c=";
    const pos = pasteInput.indexOf(marker);
    if (pos === -1) {
      toast({ title: "الرابط لا يحمل تحديًا — انسخ الرابط كاملًا كما أرسله زميلك" });
      return;
    }
    const p = decodePeer(pasteInput.slice(pos + marker.length));
    if (!p) {
      toast({ title: "تعذر قراءة التحدي من هذا الرابط" });
      return;
    }
    beginSolve(p, true);
  };

  const grade = () => {
    const q = questionById(questions[idx]);
    if (!q || selected === null) return;
    const ok = selected === q.correct;
    setGraded(ok);
    setReview((r) => [...r, { qid: q.id, ok }]);
    recordAttempt(q.id, ok, selected);
    try {
      if ("vibrate" in navigator && haptics) navigator.vibrate(ok ? 35 : [60, 40, 60]);
    } catch {}
  };

  const next = () => {
    setSelected(null);
    setGraded(null);
    if (idx + 1 >= questions.length) {
      finishPeerSession();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const finishPeerSession = () => {
    const correctCount = review.filter((r) => r.ok).length;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    // إن كان المرسل يحل تحديه الخاص — نضع نتيجته في الرابط
    if (payload && !fromPeer) {
      const finalPayload: PeerPayload = {
        ...payload,
        sender: userName || "زميلك",
        senderCorrect: correctCount,
      };
      setLinkText(buildPeerLink(finalPayload));
    }
    finishSession({
      mode: "peer",
      label: fromPeer ? "تحدّي أقران — من رابط زميل" : "تحدّي أقران — تحديك الخاص",
      total: questions.length,
      correctCount,
      xp: correctCount * PEER_XP_PER_CORRECT,
      durationSec,
    });
    setScreen("done");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkText);
      toast({ title: "نُسخ رابط التحدي — أرسله لزميلك" });
    } catch {
      toast({ title: "تعذر النسخ — انسخ الرابط يدويًا" });
    }
  };

  const shareLink = async () => {
    const res = await shareText(
      "تحدّي تربوي بين الأقران",
      `تحداني بأسئلة إعداد المعلم — افتح الرابط في التطبيق وقارن نتيجتك بنتيجتي: ${linkText}`
    );
    if (res === "failed") toast({ title: "المشاركة غير متاحة — انسخ الرابط يدويًا" });
  };

  const shareMyResult = async () => {
    if (!payload) return;
    const myCorrect = review.filter((r) => r.ok).length;
    const res = await shareText(
      "نتيجة تحدّي الأقران",
      `في تحدينا المشترك: أجابت ${payload.sender || "المرسل"} عن ${ad(payload.senderCorrect)} من ${ad(payload.total)}، وأجبت أنت عن ${ad(myCorrect)} من ${ad(questions.length)}.`
    );
    if (res === "failed") toast({ title: "المشاركة غير متاحة على هذا الجهاز" });
  };

  const q = questions[idx] ? questionById(questions[idx]) : undefined;
  const concept = q ? conceptById(q.conceptId) : undefined;
  const back = () => setScreen("menu");

  // ---------- قائمة البداية ----------
  if (screen === "menu") {
    return (
      <ScreenShell title="تحدّي الأقران" sub="نافس زميلك على الأسئلة نفسها" onClose={clearPeer}>
        <div className="space-y-6">
          <p className="text-base leading-7 text-secondary-foreground">
            الدرس يثبت أكثر حين تنافس فيه زميلك. أنشئ تحديًا من أسئلة البنك وشارك رابطه، فيجيب زميلك عن الأسئلة نفسها وتقارنان النتيجة. كل شيء ينتقل في الرابط نفسه.
          </p>
          <Divided>
            <ListRow icon={Swords} title="أنشئ تحديًا وشاركه" sub="اختر المحور وعدد الأسئلة، حلّها، ثم أرسل الرابط" onClick={() => setScreen("create")} />
            <ListRow icon={ClipboardPaste} title="وصلني رابط تحدٍّ" sub="ألصق الرابط الذي أرسله زميلك وابدأ" onClick={() => setScreen("paste")} />
          </Divided>
        </div>
      </ScreenShell>
    );
  }

  // ---------- شاشة إعداد التحدي ----------
  if (screen === "create") {
    const scopes = [{ id: "all", label: "كل المحاور" }, ...COURSES.map((c) => ({ id: c.id, label: COURSE_SHORT[c.id] ?? c.name }))];
    return (
      <ScreenShell
        title="جهّز تحديك"
        sub="ستحل أولًا، ثم يُبنى الرابط بالأسئلة ونتيجتك"
        onBack={back}
        onClose={clearPeer}
        footer={
          <PrimaryButton onClick={startOwnChallenge} className="w-full">
            <Swords className="h-4 w-4" /> ابدأ الحل
          </PrimaryButton>
        }
      >
        <div className="space-y-6">
          <section>
            <SectionHeader title="المحور" />
            <Divided>
              {scopes.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={scope === o.id}
                  onClick={() => setScope(o.id)}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-right text-base transition-colors hover:bg-muted/60"
                >
                  <span className="flex-1">{o.label}</span>
                  {scope === o.id && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </Divided>
          </section>
          <section>
            <SectionHeader title="عدد الأسئلة" />
            <div role="radiogroup" className="grid grid-cols-2 rounded-xl bg-muted p-1">
              {[5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={size === n}
                  onClick={() => setSize(n)}
                  className={`min-h-[40px] rounded-lg text-sm transition-colors ${size === n ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  {ad(n)} أسئلة
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScreenShell>
    );
  }

  // ---------- شاشة لصق الرابط ----------
  if (screen === "paste") {
    return (
      <ScreenShell
        title="رابط تحدٍّ من زميل"
        onBack={back}
        onClose={clearPeer}
        footer={
          <PrimaryButton onClick={tryPaste} disabled={!pasteInput.trim()} className="w-full">
            <Link2 className="h-4 w-4" /> ابدأ الحل
          </PrimaryButton>
        }
      >
        <label htmlFor="peer-link" className="mb-2 block text-sm font-medium">
          ألصق الرابط كاملًا كما وصلك
        </label>
        <textarea
          id="peer-link"
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          rows={4}
          dir="ltr"
          className="w-full rounded-xl border border-input bg-card p-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-2 text-sm leading-6 text-muted-foreground">نقرأ من الرابط الأسئلة ونتيجة زميلك، ثم نقارن نتيجتكما بعد الحل.</p>
      </ScreenShell>
    );
  }

  // ---------- شاشة الحل ----------
  if (screen === "solve" && q) {
    return (
      <ScreenShell
        title={fromPeer ? `تحدّي ${payload?.sender || "زميلك"}` : "تحدّيك"}
        sub={`السؤال ${ad(idx + 1)} من ${ad(questions.length)}`}
        onClose={clearPeer}
        footer={
          graded === null ? (
            <PrimaryButton disabled={selected === null} onClick={grade} className="w-full">
              تحقّق
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={next} className="w-full">
              {idx + 1 >= questions.length ? "عرض المقارنة" : "السؤال التالي"} <ArrowLeft className="h-4 w-4" />
            </PrimaryButton>
          )
        }
      >
        <ProgressBar value={((idx + (graded !== null ? 1 : 0)) / questions.length) * 100} className="mb-5" />
        <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {concept && <Chip>{COURSE_SHORT[concept.courseId]}، {concept.chapter}</Chip>}
          <h2 className="font-display text-lg font-semibold leading-8">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((o, i) => {
              const isSel = selected === o.text;
              let state: "idle" | "selected" | "correct" | "wrong" | "dim" = isSel ? "selected" : "idle";
              if (graded !== null) state = o.isCorrect ? "correct" : isSel ? "wrong" : "dim";
              return (
                <OptionButton key={i} letter={LETTERS[i]} state={state} disabled={graded !== null} onClick={() => setSelected(o.text)}>
                  {o.text}
                </OptionButton>
              );
            })}
          </div>
          {graded !== null && (
            <Callout tone={graded ? "success" : "danger"} icon={graded ? CheckCircle2 : XCircle} title={graded ? "إجابة صحيحة" : `الصحيح: ${q.correct}`}>
              {!graded && q.reason}
            </Callout>
          )}
        </motion.div>
      </ScreenShell>
    );
  }

  // ---------- شاشة النتيجة والمقارنة ----------
  if (screen === "done") {
    const myCorrect = review.filter((r) => r.ok).length;
    const isReceiver = fromPeer;
    const senderCorrect = payload?.senderCorrect ?? 0;
    const iWon = myCorrect > senderCorrect;
    const tie = myCorrect === senderCorrect;

    return (
      <ScreenShell
        title={isReceiver ? "نتيجة المقارنة" : "تحديك جاهز"}
        onClose={clearPeer}
        footer={
          <>
            <SecondaryButton onClick={back} className="flex-1">
              تحدٍّ جديد
            </SecondaryButton>
            <PrimaryButton onClick={clearPeer} className="flex-1">
              إنهاء
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center pt-2 text-center">
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isReceiver && !iWon && !tie ? "bg-muted text-muted-foreground" : "bg-gem-soft text-gem"}`}>
              <Trophy className="h-8 w-8" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold">
              {isReceiver ? (tie ? "تعادلتما" : iWon ? "تفوقت على زميلك" : "زميلك تفوق هذه المرة") : "أرسل الرابط لزميلك"}
            </h2>
          </div>

          <div className={`grid gap-3 ${isReceiver ? "grid-cols-2" : "grid-cols-1"}`}>
            <ScoreTile name={userName || "أنت"} correct={myCorrect} total={questions.length} highlight={!isReceiver || iWon || tie} />
            {isReceiver && <ScoreTile name={payload?.sender || "زميلك"} correct={senderCorrect} total={payload?.total ?? questions.length} highlight={!iWon} />}
          </div>

          {isReceiver ? (
            <SecondaryButton onClick={shareMyResult} className="w-full">
              <Share2 className="h-4 w-4" /> شارك نتيجتك مع زميلك
            </SecondaryButton>
          ) : (
            <Card className="p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-primary" /> رابط التحدي
              </p>
              <p className="mt-2 break-all rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground" dir="ltr">
                {linkText}
              </p>
              <div className="mt-3 flex gap-3">
                <PrimaryButton onClick={copyLink} className="flex-1">
                  <Copy className="h-4 w-4" /> انسخ
                </PrimaryButton>
                <SecondaryButton onClick={shareLink} className="flex-1">
                  <Share2 className="h-4 w-4" /> شارك
                </SecondaryButton>
              </div>
            </Card>
          )}

          <section>
            <SectionHeader title="مراجعة الأسئلة" />
            <Divided>
              {review.map((r) => {
                const rq = questionById(r.qid)!;
                return (
                  <div key={r.qid} className="flex items-start gap-3 px-4 py-3">
                    {r.ok ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-7">{rq.question}</p>
                      {!r.ok && <p className="mt-1 text-sm text-success">الصحيح: {rq.correct}</p>}
                    </div>
                  </div>
                );
              })}
            </Divided>
          </section>
        </div>
      </ScreenShell>
    );
  }

  return null;
}

function ScoreTile({ name, correct, total, highlight }: { name: string; correct: number; total: number; highlight: boolean }) {
  return (
    <Card className={`p-4 text-center ${highlight ? "border-primary bg-accent/40" : ""}`}>
      <p className="truncate text-sm text-muted-foreground">{name}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">
        {ad(correct)} من {ad(total)}
      </p>
    </Card>
  );
}
