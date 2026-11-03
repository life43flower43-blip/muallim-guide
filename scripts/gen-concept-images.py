# يولّد صورًا تعليمية للمفاهيم بـ Gemini، كل يوم عددًا محددًا، ويحفظها في public/concepts/<id>.jpg
# ثم يعيد كتابة src/lib/concept-images.ts. يعمل من GitHub Actions بالسر GEMINI_API_KEY.
# الأولوية: مفاهيم «معلومة اليوم» القادمة في جدول تيليجرام، ثم بقية المفاهيم بالترتيب.
import base64, datetime, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = os.environ.get("GEMINI_API_KEY", "").strip()
COUNT = int(os.environ.get("IMAGES_PER_DAY", "20"))
MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
if not KEY:
    sys.exit("GEMINI_API_KEY غير موجود")

bank = json.load(open("public/data/qbank.json"))
concepts = {c["id"]: c for c in bank["concepts"]}
os.makedirs("public/concepts", exist_ok=True)
have = {f[:-4] for f in os.listdir("public/concepts") if f.endswith(".jpg")}

today = datetime.date.today().isoformat()
order = []
try:
    for d in json.load(open("content/telegram-schedule.json")):
        if d["date"] >= today:
            order.append(d["tip"])
except FileNotFoundError:
    pass
order += [c["id"] for c in bank["concepts"]]
todo, seen = [], set()
for cid in order:
    if cid in seen or cid in have or cid not in concepts:
        continue
    seen.add(cid); todo.append(cid)
todo = todo[:COUNT]

STYLE = (
    "A clean, modern educational editorial illustration in soft flat style with gentle shading, "
    "calm green and teal palette with small warm accents, white background space. "
    "Setting: an Arab school in the Gulf region; teachers and students wear modest clothing "
    "(women and girls in hijab, men in thobe or smart casual). Friendly, respectful, realistic proportions. "
    "Absolutely no text, letters, numbers, labels, logos or watermarks anywhere in the image. 16:9 landscape."
)

def prompt(c):
    return (f"{STYLE}\nIllustrate this educational concept for teachers preparing for a teaching license exam. "
            f"Concept (Arabic): {c['title']}. Key idea: {c.get('rule') or ''} "
            f"Show a concrete classroom or school scene that makes the idea easy to grasp.")

def generate(c):
    body = {
        "contents": [{"parts": [{"text": prompt(c)}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(), headers={"content-type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.load(r)
    for part in res["candidates"][0]["content"]["parts"]:
        data = part.get("inlineData") or part.get("inline_data")
        if data:
            return base64.b64decode(data["data"])
    raise RuntimeError("لم تصل صورة")

made = 0
for cid in todo:
    c = concepts[cid]
    try:
        raw = generate(c)
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        # قص إلى ١٦:٩ وتصغير إلى ١٢٠٠×٦٧٥ لتخفيف الحجم
        w, h = im.size; th = int(w * 9 / 16)
        if th <= h:
            top = (h - th) // 2; im = im.crop((0, top, w, top + th))
        else:
            tw = int(h * 16 / 9); left = (w - tw) // 2; im = im.crop((left, 0, left + tw, h))
        im = im.resize((1200, 675), Image.LANCZOS)
        im.save(f"public/concepts/{cid}.jpg", "JPEG", quality=78, optimize=True, progressive=True)
        made += 1
        print("✓", cid, c["title"])
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:300]
        print("✗", cid, e.code, msg)
        if e.code in (400, 401, 403):
            break  # مفتاح غير صالح أو نموذج غير متاح: لا فائدة من المتابعة
        if e.code == 429:
            break  # تجاوز الحصة اليومية
    except Exception as e:
        print("✗", cid, e)
    time.sleep(4)

ids = sorted(f[:-4] for f in os.listdir("public/concepts") if f.endswith(".jpg"))
with open("src/lib/concept-images.ts", "w") as f:
    f.write("// صور تعليمية للمفاهيم، محفوظة في public/concepts/<id>.jpg\n")
    f.write("// يكتبها scripts/gen-concept-images.py تلقائيًا كل يوم، فتظهر في الموقع ويرسلها بوت تيليجرام مع «معلومة اليوم».\n")
    f.write("export const CONCEPT_IMAGES = new Set<string>([\n")
    for i in ids:
        f.write(f'  "{i}",\n')
    f.write("]);\n\nexport const conceptImage = (id: string) => (CONCEPT_IMAGES.has(id) ? `/concepts/${id}.jpg` : null);\n")
print(f"صور اليوم: {made}، المجموع: {len(ids)} من {len(concepts)}")
