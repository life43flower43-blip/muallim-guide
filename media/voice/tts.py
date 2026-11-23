# توليد التعليق الصوتي لفيديو الموقع بنموذج النطق في جيميني: ملف صوت لكل جملة (إعادة تشغيل بعد إضافة المفتاح)
import base64, json, os, sys, urllib.request, wave

KEY = os.environ["GEMINI_API_KEY"]
MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-flash-tts", "gemini-2.5-pro-preview-tts"]
VOICE = os.environ.get("VOICE", "Kore")
here = os.path.dirname(__file__)
lines = json.load(open(os.path.join(here, "lines.json"), encoding="utf-8"))

def call(model, text):
    body = {
        "contents": [{"parts": [{"text": "اقرأ بالعربية الفصحى بصوت دافئ وحماسي وواضح، كإعلان قصير: " + text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"content-type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    return base64.b64decode(part["data"]), part.get("mimeType", "")

model = None
for name, text in lines:
    last = None
    for m in ([model] if model else MODELS):
        try:
            pcm, mime = call(m, text)
            model = m
            break
        except Exception as e:  # جرّب النموذج التالي
            last = e
            print("فشل", m, e, file=sys.stderr)
    else:
        raise SystemExit(f"تعذر توليد {name}: {last}")
    with wave.open(os.path.join(here, f"{name}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print(name, model, mime, len(pcm) / 48000, "ثانية")
