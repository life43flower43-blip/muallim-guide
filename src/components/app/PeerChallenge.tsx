"use client";

// تحدّي الأقران — من ميزة «ح» في بحث مشاكل الطلبة: غياب المساندة الاجتماعية والأقران.
// تُنشئ تحديًا من أسئلة البنك، ويُشفر كاملًا في رابط تشاركه مع زميلك — من يفتح الرابط
// يجيب عن الأسئلة نفسها ثم يقارن نتيجتكم. كل ذلك بلا سيرفر: المعطيات في معطيات الرابط.
// قواعد صارمة: النص المعروض بلا حروف لاتينية، الأرقام المشرقية عبر ad()، والتنصيص ب«».

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Users,
  Link2,
  Copy,
  Share2,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  ClipboardPaste,
  Swords,
  ArrowLeft,
} from "lucide-react";
import { COURSES, COURSE_SHORT, questionById, conceptById, shuffle, questionsOfCourse, QUESTIONS } from "@/lib/qbank";
import { buildPeerLink, decodePeer, type PeerPayload } from "@/lib/peer";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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

  const [screen, setScreen] = useState<Screen>("menu");
  const [scope, setScope] = useState<string>("all");
  const [size, setSize] = useState<number>(5);

  // جلسة الحل
  const [payload, setPayload] = useState<PeerPayload | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [review, setReview] = useState<Review[]>([]);
  const [linkText, setLinkText] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const startedAt = useRef(Date.now());

  // تحدٍّ واصل عبر الرابط — يبدأ الحل مباشرة عند فتح الطبقة
  useEffect(() => {
    if (peerIncoming) {
      beginSolve(peerIncoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تنظيف peerIncoming عند مغادرة الطبقة كي لا يعود التحدي بعد إغلاقه
  useEffect(() => {
    return () => setPeerIncoming(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const beginSolve = (p: PeerPayload) => {
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
    beginSolve(p);
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
    beginSolve(p);
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
    if (payload && !peerIncoming) {
      const finalPayload: PeerPayload = {
        ...payload,
        sender: userName || "زميلك",
        senderCorrect: correctCount,
      };
      setLinkText(buildPeerLink(finalPayload));
    }
    finishSession({
      mode: "peer",
      label: peerIncoming ? "تحدّي أقران — من رابط زميل" : "تحدّي أقران — تحديك الخاص",
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

  // ---------- قائمة البداية ----------
  if (screen === "menu") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B45309] text-white">
                <Users className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black">تحدّي الأقران</h2>
            </div>
            <button onClick={clearPeer} className="rounded-full bg-muted p-2" aria-label="إغلاق التحدي">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 rounded-2xl border-2 border-[#B45309]/20 bg-gradient-to-l from-[#B45309]/10 to-transparent p-4 text-sm font-bold leading-7">
            الدرس يثبت أكثر حين تنافس فيه زميلك: أنشئ تحديًا من أسئلة البنك، وشارك رابطه مع زميل —
            سيجيب عن الأسئلة نفسها في تطبيقه ويقارن نتيجتكم. كل شيء ينتقل في الرابط نفسه بلا حسابات
            ولا سيرفرات.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setScreen("create")}
              className="card-soft flex w-full items-center gap-3 rounded-2xl border-2 border-[#B45309]/30 bg-[#B45309]/5 p-4 text-right transition hover:border-[#B45309]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B45309] text-white">
                <Swords className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black">أنشئ تحديًا وشاركه</span>
                <span className="mt-0.5 block text-xs font-bold leading-6 text-muted-foreground">
                  اختر المحور وعدد الأسئلة، حلّها، ثم أرسل الرابط لزميلك
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>

            <button
              onClick={() => setScreen("paste")}
              className="card-soft flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-white p-4 text-right transition hover:border-primary"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
                <ClipboardPaste className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black">وصلني رابط تحدٍّ</span>
                <span className="mt-0.5 block text-xs font-bold leading-6 text-muted-foreground">
                  ألصق الرابط الذي أرسله زميلك وابدأ الحل والمقارنة
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة إعداد التحدي ----------
  if (screen === "create") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <button
            onClick={() => setScreen("menu")}
            className="mb-4 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" /> عودة
          </button>

          <h2 className="text-lg font-black">جهّز تحديك</h2>

          <p className="mt-4 mb-2 text-sm font-black text-muted-foreground">من أي محور تكون الأسئلة؟</p>
          <div className="space-y-1.5">
            <button
              onClick={() => setScope("all")}
              className={`w-full rounded-xl border-2 p-3 text-right text-sm font-black transition ${
                scope === "all" ? "border-[#B45309] bg-[#B45309]/5" : "border-border bg-white"
              }`}
            >
              كل المحاور — تحدٍّ عام
            </button>
            {COURSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setScope(c.id)}
                className={`w-full rounded-xl border-2 p-3 text-right text-sm font-black transition ${
                  scope === c.id ? "border-[#B45309] bg-[#B45309]/5" : "border-border bg-white"
                }`}
              >
                {COURSE_SHORT[c.id]}
              </button>
            ))}
          </div>

          <p className="mt-4 mb-2 text-sm font-black text-muted-foreground">كم سؤالًا في التحدي؟</p>
          <div className="grid grid-cols-2 gap-2">
            {[5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                className={`rounded-xl border-2 p-3 text-center text-sm font-black transition ${
                  size === n ? "border-[#B45309] bg-[#B45309]/5" : "border-border bg-white"
                }`}
              >
                {ad(n)} أسئلة
              </button>
            ))}
          </div>

          <Button
            onClick={startOwnChallenge}
            className="mt-5 h-14 w-full rounded-2xl bg-[#B45309] text-base font-black text-white hover:bg-[#92400E]"
          >
            <Swords className="ml-2 h-5 w-5" />
            حلّ التحدي الآن وأرسل الرابط
          </Button>
          <p className="mt-2 text-center text-[11px] font-bold text-muted-foreground">
            ستحل أولًا لتُعرف نتيجتك، ثم يُبنى الرابط حاملًا الأسئلة ونتيجتك معًا
          </p>
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة لصق الرابط ----------
  if (screen === "paste") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <button
            onClick={() => setScreen("menu")}
            className="mb-4 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" /> عودة
          </button>
          <h2 className="text-lg font-black">ألصق رابط التحدي</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">
            الصق الرابط كاملًا كما أرسله زميلك — نقرأ منه الأسئلة ونتيجته ونبدأ مقارنتكم
          </p>
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            rows={3}
            placeholder="ألصق الرابط هنا…"
            className="mt-3 w-full rounded-xl border-2 border-border bg-background p-3 text-xs font-bold leading-6 outline-none focus:border-primary"
            dir="ltr"
          />
          <Button
            onClick={tryPaste}
            disabled={!pasteInput.trim()}
            className="mt-3 h-14 w-full rounded-2xl bg-[#B45309] text-base font-black text-white hover:bg-[#92400E] disabled:opacity-40"
          >
            <Link2 className="ml-2 h-5 w-5" />
            ابدأ حل التحدي
          </Button>
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة الحل ----------
  if (screen === "solve" && q) {
    const opts = q.options;
    const progress = (idx / questions.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 flex flex-col bg-background"
      >
        <div className="safe-top px-4 pb-2 pt-2">
          <div className="flex items-center gap-3">
            <button onClick={clearPeer} className="rounded-full p-1.5 text-muted-foreground" aria-label="خروج">
              <X className="h-6 w-6" />
            </button>
            <div className="progress-track h-3.5 flex-1">
              <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
              {ad(idx + 1)} من {ad(questions.length)}
            </span>
          </div>
          <p className="mt-2 text-center text-xs font-bold text-muted-foreground">
            {peerIncoming ? `تحدّي زميلك: ${payload?.sender || "مرسل"}` : "تحدّيك — حلّه ثم شارك رابطه"}
          </p>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
          <motion.div key={q.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            {concept && (
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
                {COURSE_SHORT[concept.courseId]}، {concept.chapter}
              </span>
            )}
            <h2 className="text-lg font-extrabold leading-8">{q.question}</h2>
            <div className="space-y-2.5">
              {opts.map((o, i) => {
                const isSel = selected === o.text;
                const isCorrect = o.isCorrect;
                let cls = "border-border bg-white";
                if (graded !== null && isCorrect) cls = "border-emerald-500 bg-emerald-50";
                else if (graded === false && isSel) cls = "border-red-400 bg-red-50";
                else if (isSel) cls = "border-primary bg-accent";
                return (
                  <button
                    key={i}
                    disabled={graded !== null}
                    onClick={() => setSelected(o.text)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-right ${cls}`}
                  >
                    <span className="min-w-0 flex-1 text-sm font-bold leading-6">{o.text}</span>
                    {graded !== null && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                    {graded === false && isSel && <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                  </button>
                );
              })}
            </div>
            {graded !== null && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-3 text-xs font-bold leading-6 ${
                  graded ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
                }`}
              >
                {graded ? "إجابة صحيحة — أحسنت" : `الصحيح: ${q.correct} — ${q.reason}`}
              </motion.p>
            )}
          </motion.div>
        </div>

        <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
          {graded === null ? (
            <Button
              disabled={selected === null}
              onClick={grade}
              className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground disabled:opacity-40"
            >
              تحقق
            </Button>
          ) : (
            <Button onClick={next} className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground">
              {idx + 1 >= questions.length ? "عرض المقارنة" : "السؤال التالي"}
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة النتيجة والمقارنة ----------
  if (screen === "done") {
    const myCorrect = review.filter((r) => r.ok).length;
    const isReceiver = Boolean(peerIncoming);
    const senderCorrect = payload?.senderCorrect ?? 0;
    const iWon = myCorrect > senderCorrect;
    const tie = myCorrect === senderCorrect;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-5">
          <div className="flex flex-col items-center text-center">
            <Trophy className={`h-16 w-16 ${tie ? "text-amber-500" : iWon ? "text-amber-500" : "text-muted-foreground"}`} />
            <h2 className="mt-3 text-2xl font-black">
              {isReceiver ? (tie ? "تعادلتما!" : iWon ? "تفوقت على زميلك!" : "زميلك تفوق هذه المرة") : "تحديك جاهز للإرسال"}
            </h2>
          </div>

          {/* لوحة المقارنة */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <ScoreTile
              name={userName || "أنت"}
              correct={myCorrect}
              total={questions.length}
              highlight={!isReceiver || iWon || tie}
            />
            {isReceiver && (
              <ScoreTile
                name={payload?.sender || "زميلك"}
                correct={senderCorrect}
                total={payload?.total ?? questions.length}
                highlight={!iWon}
              />
            )}
          </div>

          {isReceiver ? (
            <Button
              onClick={shareMyResult}
              variant="outline"
              className="mt-4 h-13 w-full rounded-2xl border-2 border-[#B45309]/40 text-sm font-black text-[#B45309]"
            >
              <Share2 className="ml-2 h-5 w-5" />
              شارك نتيجتك مع زميلك
            </Button>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border-2 border-border bg-white p-4">
                <p className="flex items-center gap-1.5 text-sm font-black">
                  <Link2 className="h-4 w-4 text-[#B45309]" /> رابط التحدي — الأسئلة ونتيجتك فيه معًا
                </p>
                <p className="mt-2 break-all rounded-xl bg-muted/70 p-3 text-[11px] leading-5 text-muted-foreground" dir="ltr">
                  {linkText}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={copyLink}
                    className="h-12 flex-1 rounded-xl bg-[#B45309] text-sm font-black text-white hover:bg-[#92400E]"
                  >
                    <Copy className="ml-1.5 h-4 w-4" /> انسخ الرابط
                  </Button>
                  <Button
                    onClick={shareLink}
                    variant="outline"
                    className="h-12 flex-1 rounded-xl border-2 border-border text-sm font-black"
                  >
                    <Share2 className="ml-1.5 h-4 w-4" /> شارك
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] font-bold leading-6 text-muted-foreground">
                من يفتح الرابط في التطبيق سيجيب عن الأسئلة نفسها وستقارن نتيجتاكم تلقائيًا — بلا حسابات ولا سيرفرات
              </p>
            </>
          )}

          {/* مراجعة الأسئلة */}
          <p className="mb-2 mt-5 text-sm font-extrabold text-muted-foreground">مراجعة أسئلة التحدي</p>
          <div className="space-y-2">
            {review.map((r) => {
              const rq = questionById(r.qid)!;
              return (
                <details key={r.qid} className="rounded-2xl border border-border bg-white p-3.5">
                  <summary className="flex cursor-pointer list-none items-start gap-2.5">
                    {r.ok ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <span className="text-xs font-bold leading-6">{rq.question}</span>
                  </summary>
                  {!r.ok && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                      الإجابة الصحيحة: {rq.correct}
                    </p>
                  )}
                </details>
              );
            })}
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => setScreen("menu")}
              variant="outline"
              className="h-13 flex-1 rounded-2xl border-2 border-border text-sm font-black"
            >
              تحدٍّ جديد
            </Button>
            <Button onClick={clearPeer} className="h-13 flex-1 rounded-2xl bg-primary text-sm font-black text-primary-foreground">
              إغلاق
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

function ScoreTile({
  name,
  correct,
  total,
  highlight,
}: {
  name: string;
  correct: number;
  total: number;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 text-center ${
        highlight ? "border-[#B45309] bg-[#B45309]/5" : "border-border bg-white"
      }`}
    >
      <p className="truncate text-xs font-black text-muted-foreground">{name}</p>
      <p className="mt-1 text-3xl font-black tabular-nums" dir="ltr">
        {ad(correct)}/{ad(total)}
      </p>
    </div>
  );
}
