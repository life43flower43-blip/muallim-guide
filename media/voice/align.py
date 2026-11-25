from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe("media/voice/q1.wav", language="ar", word_timestamps=True)
with open("media/voice/q1-words.txt", "w", encoding="utf-8") as f:
    for s in segs:
        for w in s.words:
            f.write("%.2f %.2f %s\n" % (w.start, w.end, w.word.strip()))
