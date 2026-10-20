"use client";

// مِسرح الإلقاء — من ميزة «د» في بحث مشاكل الطلبة:
// الخوف من التحدث أمام الجمهور يصيب ٦١-٦٤٪ من طلبة الجامعات، وهو مهنة المعلم كلها.
// سلم تدريجي: شرح لنفسك ← دقيقة مؤقتة ← شرح بسؤال مفاجئ. التسجيل محلي يبقى على الجهاز ولا يُرسل لأحد.
// قواعد صارمة: صفر أرقام لاتينية ولا إيموجي، العد بالأرقام المشرقية عبر ad()، والتنصيص بعلامات «».

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Mic,
  Square,
  Play,
  RotateCcw,
  Star,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Search,
  Award,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { CONCEPTS, conceptById, questionsOfConcept, shuffle } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Button } from "@/components/ui/button";

type Phase = "pick" | "prep" | "rec" | "review" | "rated" | "done";

// سلّم التدريج الثلاثي — بلا أرقام لاتينية في العرض
const LEVELS = [
  {
    n: 1,
    title: "شرح لنفسك",
    desc: "بلا مؤقت — سجّل شرحك مرتاحًا حتى تتوقف، واستمع إليك ببساطة",
    maxSec: 180,
  },
  {
    n: 2,
    title: "دقيقة مؤقتة",
    desc: "ستون ثانية بالضبط — اختصر شرحك في جوهر المفهوم كأنك أمام الصف",
    maxSec: 60,
  },
  {
    n: 3,
    title: "أسئلة مفاجئة",
    desc: "تسعون ثانية وفي منتصفها يقذفنا سؤال مفاجئ — أدمج إجابته في شرحك",
    maxSec: 90,
  },
] as const;

const RATING_DIMS = [
  { key: "clarity", label: "وضوح الصوت والكلام" },
  { key: "order", label: "ترتيب الأفكار" },
  { key: "confidence", label: "الثقة والجرأة" },
] as const;

// شارة الحجم الزمني — كلمات لا أرقام خام
function durWord(sec: number): string {
  if (sec < 20) return "وقفة قصيرة جدًا";
  if (sec < 45) return "وقفة قصيرة";
  if (sec < 80) return "وقفة جيدة";
  return "وقفة طويلة واثقة";
}

export default function SpeechStage() {
  const clearStage = useUi((s) => s.clearStage);
  const addSpeechRecord = useApp((s) => s.addSpeechRecord);
  const finishSession = useApp((s) => s.finishSession);
  const speechRecords = useApp((s) => s.speechRecords);
  const haptics = useApp((s) => s.haptics);

  const [phase, setPhase] = useState<Phase>("pick");
  const [conceptId, setConceptId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<number>(1);

  // حالة التسجيل
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const surpriseFiredRef = useRef(false);

  // التقييم الذاتي — ثلاثة محاور من خمس نجوم
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const concept = conceptId ? conceptById(conceptId) : undefined;
  const levelDef = LEVELS.find((l) => l.n === level) ?? LEVELS[0];

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return CONCEPTS.filter((c) => c.title.includes(q) || c.explanation.includes(q)).slice(0, 8);
  }, [query]);

  // تنظيف صارم للميكروفون والمؤقتات عند المغادرة
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAllMedia() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (url) URL.revokeObjectURL(url);
  }

  const pickRandom = () => {
    const c = shuffle(CONCEPTS)[0];
    setConceptId(c.id);
    setPhase("prep");
  };

  // ---------- بدء التسجيل ----------
  const startRecording = async () => {
    setDenied(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setDenied(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      surpriseFiredRef.current = false;
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecording(false);
        setPhase("review");
      };
      rec.start();
      setRecording(true);
      setElapsed(0);
      setSurprise(null);
      setPhase("rec");
      tickRef.current = setInterval(() => {
        setElapsed((e) => {
          const nxt = e + 1;
          // السؤال المفاجئ في منتصف زمن المستوى الثالث
          if (level === 3 && !surpriseFiredRef.current && nxt >= Math.ceil(levelDef.maxSec / 2)) {
            surpriseFiredRef.current = true;
            const qs = conceptId ? questionsOfConcept(conceptId) : [];
            if (qs.length > 0) setSurprise(shuffle(qs)[0].question);
            else setSurprise("أعطِ مثالًا واقعيًا من صف مدرسي يجسّد هذا المفهوم الآن");
          }
          // توقف تلقائي عند بلوغ الحد
          if (nxt >= levelDef.maxSec) {
            stopRecording();
            return levelDef.maxSec;
          }
          return nxt;
        });
      }, 1000);
    } catch {
      setDenied(true);
    }
  };

  const stopRecording = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    try {
      recorderRef.current?.stop();
    } catch {}
  };

  const rate = (dim: string, v: number) => {
    try {
      if ("vibrate" in navigator && haptics) navigator.vibrate(15);
    } catch {}
    setRatings((r) => ({ ...r, [dim]: v }));
  };

  const saveRecord = () => {
    const vals = RATING_DIMS.map((d) => ratings[d.key]).filter((x) => typeof x === "number");
    if (vals.length < RATING_DIMS.length) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    addSpeechRecord({ level, durSec: elapsed, score: avg });
    finishSession({
      mode: "stage",
      label: `مِسرح الإلقاء — ${concept?.title ?? "شرح صوتي"}`,
      total: 1,
      correctCount: 1,
      xp: 15,
      durationSec: elapsed,
    });
    setPhase("done");
  };

  const resetAll = () => {
    stopAllMedia();
    setUrl(null);
    setRatings({});
    setElapsed(0);
    setSurprise(null);
    setRecording(false);
    setPhase("prep");
  };

  // ---------- شاشة الاختيار ----------
  if (phase === "pick") {
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
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#BE185D] text-white">
                <Mic className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black">مِسرح الإلقاء</h2>
            </div>
            <button onClick={clearStage} className="rounded-full bg-muted p-2" aria-label="إغلاق المسرح">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-2xl border-2 border-[#BE185D]/20 bg-gradient-to-l from-[#BE185D]/10 to-transparent p-4">
            <p className="text-sm font-black leading-7">
              ستشرح مفهومًا بصوتك كما تفعل أمام الصف — ثم تستمع لنفسك وتقيّم نفسك.
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold leading-6 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
              تسجيلك يبقى على جهازك وحده ولا يُرسل إلى أي أحد — والوسيلة الآمنة لكسر رهبة المسرح.
            </p>
          </div>

          {speechRecords.length > 0 && (
            <div className="mt-3 rounded-2xl border border-border bg-white p-4">
              <p className="flex items-center gap-1.5 text-sm font-black">
                <Award className="h-4 w-4 text-[#BE185D]" />
                وقفاتك السابقة: {ad(speechRecords.length)}
              </p>
              <div className="mt-2 space-y-1.5">
                {speechRecords.slice(0, 3).map((r) => (
                  <p key={r.ts} className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>{LEVELS.find((l) => l.n === r.level)?.title ?? "شرح"}</span>
                    <span className="flex items-center gap-1 text-[#BE185D]">
                      <Star className="h-3.5 w-3.5" fill="currentColor" />
                      {ad(r.score.toFixed(1))}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={pickRandom}
            className="mt-4 h-14 w-full rounded-2xl bg-[#BE185D] text-base font-black text-white hover:bg-[#A11050]"
          >
            <Sparkles className="ml-2 h-5 w-5" />
            فاجئني بمفهوم وابدأ التدريب
          </Button>

          <div className="mt-5">
            <p className="mb-2 text-sm font-black text-muted-foreground">أو اختر مفهومًا بنفسك</p>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب كلمة من عنوان المفهوم…"
                className="w-full rounded-2xl border-2 border-border bg-white p-3 pr-10 text-sm font-bold outline-none focus:border-primary"
              />
            </div>
            <div className="mt-2 space-y-1.5">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setConceptId(c.id);
                    setPhase("prep");
                  }}
                  className="w-full rounded-xl border-2 border-border bg-white p-3 text-right transition hover:border-primary"
                >
                  <span className="block text-sm font-black">{c.title}</span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-muted-foreground">
                    {c.chapter}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة التجهيز واختيار المستوى ----------
  if (phase === "prep") {
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
            onClick={() => {
              setConceptId(null);
              setPhase("pick");
            }}
            className="mb-4 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" /> عودة إلى اختيار المفهوم
          </button>

          {concept && (
            <>
              <div className="rounded-2xl border-2 border-primary/20 bg-accent p-4">
                <p className="text-[11px] font-black text-primary">مفهومك لهذه الوقفة</p>
                <h2 className="mt-1 text-lg font-black leading-7">{concept.title}</h2>
                <p className="mt-2 text-sm leading-7">{concept.explanation}</p>
                <p className="mt-2 rounded-xl bg-white/70 p-3 text-xs leading-6 text-muted-foreground">
                  <span className="font-black text-primary">مثال يذكّرك: </span>
                  {concept.example}
                </p>
              </div>

              <p className="mt-5 mb-2 text-sm font-black text-muted-foreground">
                اختر درجة التحدي من سلّم المسرح
              </p>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.n}
                    onClick={() => setLevel(l.n)}
                    className={`w-full rounded-2xl border-2 p-4 text-right transition ${
                      level === l.n ? "border-[#BE185D] bg-[#BE185D]/5" : "border-border bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                          level === l.n ? "bg-[#BE185D] text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ad(l.n)}
                      </span>
                      <span className="text-base font-black">{l.title}</span>
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-6 text-muted-foreground">
                      {l.desc}
                    </span>
                  </button>
                ))}
              </div>

              {denied && (
                <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold leading-6 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  لم نستطع الوصول إلى الميكروفون — تأكد من منح الإذن للمتصفح ثم أعد المحاولة.
                </div>
              )}

              <Button
                onClick={startRecording}
                className="mt-4 h-14 w-full rounded-2xl bg-[#BE185D] text-base font-black text-white hover:bg-[#A11050]"
              >
                <Mic className="ml-2 h-5 w-5" />
                ابدأ التسجيل — {levelDef.title}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة التسجيل ----------
  if (phase === "rec") {
    const remaining = Math.max(levelDef.maxSec - elapsed, 0);
    const pct = Math.min((elapsed / levelDef.maxSec) * 100, 100);
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 pb-28 pt-4">
          <p className="text-sm font-black text-muted-foreground">{levelDef.title}</p>
          <h2 className="mt-1 text-lg font-black">{concept?.title}</h2>

          <div className="relative mt-8 flex h-48 w-48 items-center justify-center">
            <motion.div
              animate={{ scale: recording ? [1, 1.12, 1] : 1 }}
              transition={{ repeat: recording ? Infinity : 0, duration: 1.6 }}
              className="absolute inset-0 rounded-full bg-[#BE185D]/15"
            />
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-b from-[#BE185D] to-[#831843] shadow-lg">
              <Mic className="h-14 w-14 text-white" />
            </div>
          </div>

          {level === 1 ? (
            <p className="mt-6 rounded-full bg-muted px-4 py-1.5 text-sm font-black text-muted-foreground">
              بلا مؤقت — سجّل مرتاحًا حتى تتوقف
            </p>
          ) : (
            <>
              <p className="mt-6 text-3xl font-black tabular-nums" dir="ltr">
                {ad(String(Math.floor(remaining / 60)).padStart(2, "0"))}:
                {ad(String(remaining % 60).padStart(2, "0"))}
              </p>
              <div className="progress-track mt-3 h-2.5 w-56">
                <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}

          {surprise && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4"
            >
              <p className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                <Sparkles className="h-4 w-4" /> سؤال مفاجئ — أدمج إجابته في شرحك فورًا
              </p>
              <p className="mt-1.5 text-sm font-bold leading-7 text-amber-950">{surprise}</p>
            </motion.div>
          )}

          <Button
            onClick={stopRecording}
            className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-red-600 text-base font-black text-white hover:bg-red-700"
          >
            <Square className="ml-2 h-5 w-5" fill="currentColor" />
            إنهاء التسجيل
          </Button>
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة الاستماع والتقييم الذاتي ----------
  if (phase === "review" || phase === "rated") {
    const ready = RATING_DIMS.every((d) => typeof ratings[d.key] === "number");
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <p className="text-sm font-black text-muted-foreground">انتهت وقفتك — الآن أهم خطوة</p>
          <h2 className="mt-1 text-xl font-black">استمع إلى نفسك بعين المعلّم</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">
            {concept?.title} · {durWord(elapsed)}
          </p>

          {url && (
            <div className="mt-4 rounded-2xl border-2 border-border bg-white p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-black">
                <Play className="h-4 w-4 text-[#BE185D]" /> تسجيلك
              </p>
              <audio controls src={url} className="w-full" />
            </div>
          )}

          <div className="mt-4 rounded-2xl border-2 border-primary/15 bg-accent/60 p-4">
            <p className="text-sm font-black">قيّم أداءك بصدق — النجوم لا يراها أحد غيرك</p>
            <div className="mt-3 space-y-3">
              {RATING_DIMS.map((d) => (
                <div key={d.key}>
                  <p className="mb-1 text-xs font-black text-muted-foreground">{d.label}</p>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => rate(d.key, v)}
                        aria-label={`${d.label}: ${ad(v)} من خمس`}
                        className="rounded-lg p-1 transition active:scale-90"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            (ratings[d.key] ?? 0) >= v
                              ? "text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                          fill={(ratings[d.key] ?? 0) >= v ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={resetAll}
              className="h-13 flex-1 rounded-2xl border-2 border-border text-sm font-black"
            >
              <RotateCcw className="ml-1.5 h-4 w-4" />
              وقفة جديدة
            </Button>
            <Button
              onClick={saveRecord}
              disabled={!ready}
              className="h-13 flex-1 rounded-2xl bg-[#BE185D] text-sm font-black text-white hover:bg-[#A11050] disabled:opacity-40"
            >
              <CheckCircle2 className="ml-1.5 h-4 w-4" />
              احفظ تقييمي
            </Button>
          </div>
          {!ready && (
            <p className="mt-2 text-center text-[11px] font-bold text-muted-foreground">
              علّم النجوم في المحاور الثلاثة كلها لتفعيل الحفظ
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- شاشة الختام ----------
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="safe-top" />
      <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 pb-28 pt-4 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
        >
          <CheckCircle2 className="h-20 w-20 text-indigo-600" />
        </motion.div>
        <h2 className="mt-4 text-2xl font-black">وقفتك محفوظة</h2>
        <p className="mt-2 max-w-xs text-sm font-bold leading-7 text-muted-foreground">
          كل وقفة تكسر رهبة المسرح شيئًا من هيبته — كررها مرات حتى يصبح شرحك أمام الصف أمرًا
          مألوفًا. وبهذا أتممت {durWord(elapsed)} على مستوى «{levelDef.title}».
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <Button
            onClick={() => {
              setConceptId(null);
              setRatings({});
              setUrl(null);
              setElapsed(0);
              setSurprise(null);
              setPhase("pick");
            }}
            className="h-13 w-full rounded-2xl bg-[#BE185D] text-base font-black text-white hover:bg-[#A11050]"
          >
            <Mic className="ml-2 h-5 w-5" />
            وقفة جديدة
          </Button>
          <Button
            onClick={clearStage}
            variant="outline"
            className="h-13 w-full rounded-2xl border-2 border-border text-base font-black"
          >
            مغادرة المسرح
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
