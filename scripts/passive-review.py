# مراجعة المبني للمجهول بمساعدة Gemini: يرسل الجمل التي فيها أفعال تحتمل القراءتين،
# ويسأل: أي هذه الأفعال مبني للمجهول في سياق الجملة؟ ثم يضع الضمة على أولها.
# التشغيل: GEMINI_API_KEY=... python3 scripts/passive-review.py collect|ask|apply
import json, re, sys, os, glob, time, urllib.request, collections

CACHE = os.environ.get("PV_CACHE", "/tmp/pv")
os.makedirs(CACHE, exist_ok=True)
MODEL = os.environ.get("PV_MODEL", "gemini-3.1-flash-lite")
L = "ء-ي"
WORD = re.compile(rf"(?<![{L}ً-ْ])(?:[وف])?[يت][{L}ً-ْ]{{2,8}}")

def strip(w): return re.sub(r"[ً-ْ]", "", w)

def files():
    return ["public/data/qbank.json"] + sorted(glob.glob("content/articles/*.md"))

def corpus():
    return "\n".join(open(f).read() for f in files())

def ambiguous_set(text):
    # أفعال وردت في النص بالضمة مرة على الأقل وبدونها مرات: تحتمل القراءتين
    with_d, without = collections.Counter(), collections.Counter()
    for m in WORD.finditer(text):
        w = m.group(0); base = w[1:] if w[0] in "وف" and len(w) > 4 and w[1] in "يت" else w
        if len(base) > 1 and base[1] == "ُ": with_d[strip(base)] += 1
        elif len(base) > 1 and base[1] not in "ًٌٍَُِّْ": without[base] += 1
    return {w for w in without if w in with_d}

def sentences(text):
    return [s for s in re.split(r"(?<=[.!؟?\n])\s+|\\n", text) if 12 < len(s) < 400]

def collect():
    text = corpus(); amb = ambiguous_set(text)
    out, seen = [], set()
    for s in sentences(text):
        ws = [w for w in WORD.findall(s) if (w[1:] if w[0] in "وف" and w[1:2] in ("ي","ت") else w) in amb]
        if ws and s not in seen:
            seen.add(s); out.append(s)
    json.dump(out, open(f"{CACHE}/sentences.json", "w"), ensure_ascii=False)
    print(len(amb), "فعلًا ملتبسًا،", len(out), "جملة")

PROMPT = """أنت مدقق لغوي عربي. في كل جملة مرقمة أدناه، حدد الأفعال المضارعة التي تبدأ بالياء أو التاء وتكون مبنية للمجهول في سياق الجملة (مثل: يُستخدم الاختبار، تُعرض الصور، يُطلب من الطالب). لا تذكر الأفعال المبنية للمعلوم. اكتب كل فعل كما ورد في الجملة حرفيًا تمامًا (مع الواو أو الفاء إن اتصلت به). أجب بـ JSON فقط بهذا الشكل: [{"i": رقم الجملة, "w": ["الفعل", ...]}] ولا تذكر الجمل التي ليس فيها فعل مجهول.

"""

def ask():
    key = os.environ["GEMINI_API_KEY"]
    sents = json.load(open(f"{CACHE}/sentences.json"))
    done = json.load(open(f"{CACHE}/answers.json")) if os.path.exists(f"{CACHE}/answers.json") else {}
    B = 40
    for start in range(0, len(sents), B):
        if str(start) in done: continue
        chunk = sents[start:start + B]
        body = PROMPT + "\n".join(f"{i}. {s}" for i, s in enumerate(chunk))
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
            data=json.dumps({"contents": [{"parts": [{"text": body}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}).encode(),
            headers={"content-type": "application/json", "x-goog-api-key": key})
        for attempt in range(5):
            try:
                with urllib.request.urlopen(req, timeout=120) as r: res = json.load(r)
                txt = res["candidates"][0]["content"]["parts"][0]["text"]
                done[str(start)] = json.loads(txt); break
            except urllib.error.HTTPError as e:
                print("HTTP", e.code, e.read()[:150]); time.sleep(30 * (attempt + 1))
            except Exception as e:
                print("ERR", e); time.sleep(10)
        json.dump(done, open(f"{CACHE}/answers.json", "w"), ensure_ascii=False)
        print(start, "/", len(sents), flush=True)
        time.sleep(4)

# أفعال اقترحها النموذج خطأً (لازمة أو مبنية للمعلوم في سياقنا)، تُستبعد دائمًا
BLOCK = set("""تسقط يسقط يحدث تحدث تبقى يبقى ترتبط يرتبط يصح تصح يقوم تقوم يحتاج تحتاج يعتمد تعتمد تكون يكون تدور يدور يصعب تصعب
يحتمل تحتمل تصمد يصمد تصلح يصلح تركز يركز يرى ترى تمس يمس تظهر يظهر تعكس يعكس يصف تصف تعلم يجعل تجعل يحل تحل يكتمل تكتمل
ينتقل تنتقل ينتهي تنتهي يستمر تستمر يستقر تستقر يتحقق يتبع""".split())

def apply():
    sents = json.load(open(f"{CACHE}/sentences.json"))
    done = json.load(open(f"{CACHE}/answers.json"))
    fixes = {}  # جملة -> جملة مصححة
    for start, items in done.items():
        for it in items if isinstance(items, list) else []:
            try: s = sents[int(start) + int(it["i"])]
            except (KeyError, IndexError, ValueError, TypeError): continue
            t = s
            for w in it.get("w", []):
                w = strip(w)
                pre = w[0] if w[0] in "وف" and w[1:2] in ("ي", "ت") else ""
                core = w[len(pre):]
                if len(core) < 3 or core[0] not in "يت": continue
                # أفعال «تفعّل وتفاعل» (يتـ/تتـ) لا تأتي مجهولة في نصوصنا، والقائمة المستبعدة
                if core[1:2] == "ت" or core in BLOCK: continue
                # الكلمة كما هي في الجملة بلا تشكيل في حرفها الثاني
                t2 = re.sub(rf"(?<![{L}ً-ْ]){re.escape(pre + core)}(?![{L}ً-ْ])", pre + core[0] + "ُ" + core[1:], t, count=1)
                t = t2
            if t != s: fixes[s] = t
    n = 0
    for f in files():
        s = open(f).read(); o = s
        for a, b in fixes.items():
            if a in s: s = s.replace(a, b); n += 1
        if s != o:
            if f.endswith(".json"): json.loads(s)
            open(f, "w").write(s)
    print("جمل مصححة:", len(fixes), "، مواضع:", n)

{"collect": collect, "ask": ask, "apply": apply}[sys.argv[1]]()
