# توقيت كلمات التعليق الصوتي (يُمرَّر الصوت مصفوفةً لتجنب مكتبة فك الترميز)
import wave
import numpy as np
from faster_whisper import WhisperModel
w = wave.open("media/voice/q2.wav")
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
n = int(len(x) * 16000 / sr)
x16 = np.interp(np.arange(n) * sr / 16000, np.arange(len(x)), x).astype(np.float32)
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(x16, language="ar", word_timestamps=True)
with open("media/voice/q2-words.txt", "w", encoding="utf-8") as f:
    for s in segs:
        for wd in s.words:
            f.write("%.2f %.2f %s\n" % (wd.start, wd.end, wd.word.strip()))
