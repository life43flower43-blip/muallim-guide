# توليد التعليق الصوتي لفيديو الموقع بنموذج النطق في جيميني: ملف صوت لكل جملة (إعادة تشغيل بعد إضافة المفتاح)
import base64, json, os, sys, time, urllib.error, urllib.request, wave

KEY = os.environ["GEMINI_API_KEY"]
MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts", "gemini-2.5-pro-preview-tts"]
VOICE = os.environ.get("VOICE", "Kore")
here = os.path.dirname(__file__)
lines = json.load(open(os.path.join(here, os.environ.get("LINES", "lines.json")), encoding="utf-8"))

def call(model, text):
    # الحد المجاني يسمح بطلبات قليلة في الدقيقة: انتظر وأعد المحاولة عند الرفض المؤقت
    for wait in (0, 25, 45, 65):
        time.sleep(wait)
        try:
            return call_once(model, text)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    return call_once(model, text)

def call_once(model, text):
    body = {
        "contents": [{"parts": [{"text": os.environ.get("STYLE", "اقرأ بالعربية الفصحى بصوت دافئ وحماسي وواضح، كإعلان قصير: ") + text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"content-type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    return base64.b64decode(part["data"]), part.get("mimeType", "")

if os.environ.get("PER_LINE"):
    # ملف لكل جملة، مع انتظار بين الطلبات حتى لا يتجاوز الحد المجاني
    done = 0
    for name, text in lines:
        out = os.path.join(here, f"{os.environ.get('PREFIX', 'c_')}{name}.wav")
        if os.path.exists(out):
            continue  # وُلِّد سابقًا
        if done:
            time.sleep(22)
        try:
            pcm, mime = call(MODELS[0], text)
        except urllib.error.HTTPError as e:
            print("توقف عند", name, e)  # الحد اليومي: تُحفظ الملفات الجاهزة ويُكمل غدًا
            break
        done += 1
        with wave.open(out, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
        print(name, len(pcm) / 48000, "ثانية")
    raise SystemExit(0)

# طلب واحد للنص كله (الحد المجاني للطلبات قليل)، مع وقفة قصيرة بين الجمل
full = os.environ.get("SEP", " ... ").join(t for _, t in lines)
for m in MODELS:
    try:
        pcm, mime = call(m, full)
        break
    except Exception as e:
        print("فشل", m, e, file=sys.stderr)
else:
    raise SystemExit("تعذر توليد الصوت")
with wave.open(os.path.join(here, os.environ.get("OUT", "voice.wav")), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
print("voice", m, mime, len(pcm) / 48000, "ثانية")
