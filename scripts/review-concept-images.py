# مراجعة صور المفاهيم: لكل مفهوم صورته الحالية وكل الصور المرفوعة برقمه في incoming/،
# فيُسأل نموذج رؤية (Gemini) أي صورة تعبّر عن عنوان المفهوم أفضل، وهل تناسبه أصلًا.
# يطبع سطرًا JSON لكل مفهوم يحتاج قرارًا (RESULT {...}) ليُطبَّق بعد ذلك، ولا يعدّل الملفات بنفسه.
# يعمل من GitHub Actions بالسر GEMINI_API_KEY.
import base64, io, json, os, re, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL = os.environ.get("REVIEW_MODEL", "gemini-2.5-flash-lite")
LIMIT = int(os.environ.get("LIMIT", "0") or 0)
if not KEY:
    sys.exit("GEMINI_API_KEY missing")

concepts = {c["id"]: c for c in json.load(open("public/data/qbank.json"))["concepts"]}

def sig(im):
    return list(im.convert("L").resize((16, 9)).getdata())

def dist(a, b):
    return sum(abs(x - y) for x, y in zip(a, b))

def small(path):
    im = Image.open(path).convert("RGB")
    im.thumbnail((512, 512))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode(), sig(im)

# المرشحون: الصورة الحالية أولًا ثم ملفات incoming بالرقم نفسه، بلا تكرار
cands = {}
for f in sorted(os.listdir("incoming")):
    m = re.match(r"^(?:\d+_)?([A-Z]+\d+)[\s_\-(.]", f)
    if m and m.group(1) in concepts and f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        cands.setdefault(m.group(1), []).append("incoming/" + f)
jobs = []
for cid in concepts:
    paths = (["public/concepts/%s.jpg" % cid] if os.path.exists("public/concepts/%s.jpg" % cid) else []) + cands.get(cid, [])
    uniq = []
    for p in paths:
        try:
            b64, s = small(p)
        except Exception:
            continue
        if all(dist(s, u[2]) > 400 * 16 * 9 / 144 for u in uniq):
            uniq.append((p, b64, s))
    if uniq:
        jobs.append((cid, uniq))
if LIMIT:
    jobs = jobs[:LIMIT]
print("concepts to review:", len(jobs), flush=True)

def ask(parts):
    body = {"contents": [{"parts": parts}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}
    for attempt in range(6):
        try:
            req = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                data=json.dumps(body).encode(), headers={"content-type": "application/json", "x-goog-api-key": KEY})
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.load(r)
            return json.loads(res["candidates"][0]["content"]["parts"][0]["text"])
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503):
                time.sleep(20 * (attempt + 1)); continue
            print("HTTP", e.code, e.read()[:300], flush=True); return None
        except Exception as e:
            print("ERR", str(e)[:200], flush=True); time.sleep(10)
    return None

RULES = ("You review illustrations for an Arabic teacher-training app. Judge only whether the picture's content "
         "illustrates the concept's meaning (a metaphor is fine if it clearly relates). ")

# مفاهيم لها أكثر من صورة: سؤال لكل مفهوم
# مفاهيم لها صورة واحدة: ثمانية في الطلب الواحد
single = [j for j in jobs if len(j[1]) == 1]
multi = [j for j in jobs if len(j[1]) > 1]
done = 0
for cid, uniq in multi:
    c = concepts[cid]
    parts = [{"text": RULES + f"Concept title (Arabic): {c['title']}. Summary: {c.get('explanation','')[:300]}\n"
              f"There are {len(uniq)} candidate images numbered 1..{len(uniq)}. "
              'Reply JSON {"best": <number>, "fit": "good"|"weak"|"bad"} where fit describes the best one.'}]
    for i, (p, b64, s) in enumerate(uniq):
        parts += [{"text": f"Image {i+1}:"}, {"inline_data": {"mime_type": "image/jpeg", "data": b64}}]
    r = ask(parts)
    if r:
        best = max(1, min(len(uniq), int(r.get("best", 1))))
        if uniq[best - 1][0].startswith("public/") and r.get("fit") == "good":
            done += 1; time.sleep(4.2); continue
        print("RESULT " + json.dumps({"id": cid, "pick": uniq[best - 1][0], "fit": r.get("fit"), "n": len(uniq)}, ensure_ascii=False), flush=True)
    done += 1
    time.sleep(4.2)

for b in range(0, len(single), 8):
    group = single[b:b + 8]
    parts = [{"text": RULES + 'For each numbered concept and its image, reply JSON list [{"n":<number>,"fit":"good"|"weak"|"bad"}].'}]
    for i, (cid, uniq) in enumerate(group):
        c = concepts[cid]
        parts += [{"text": f"Concept {i+1}: {c['title']}. {c.get('explanation','')[:160]}"}, {"inline_data": {"mime_type": "image/jpeg", "data": uniq[0][1]}}]
    r = ask(parts)
    if isinstance(r, dict):
        r = r.get("results") or r.get("items") or []
    for item in r or []:
        try:
            cid, uniq = group[int(item["n"]) - 1]
        except Exception:
            continue
        if item.get("fit") != "good":
            print("RESULT " + json.dumps({"id": cid, "pick": uniq[0][0], "fit": item.get("fit"), "n": 1}, ensure_ascii=False), flush=True)
    time.sleep(4.2)
print("finished", flush=True)
