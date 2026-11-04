# يضع الضمة على أول حرف (ياء أو تاء المضارعة) في أفعال المبني للمجهول التي لا تحتمل قراءة أخرى،
# حتى يفهم القارئ أنها مبنية للمجهول. القائمة محصورة في صيغ لا تلتبس بالمبني للمعلوم.
import re, sys, glob, json

# صيغ مجهولة لا تلتبس (معلومها مختلف الحروف): يسمى/يسمي، يعطى/يعطي، يضاف/يضيف...
FIXED = ["سمى", "سمّى", "عطى", "راعى", "ستثنى", "جرى", "ؤدى", "دعى", "رجى",
         "قال", "عاد", "راد", "ستفاد", "قام", "تاح", "ضاف", "شار", "ستعان", "عان", "ستخلص"]
# صيغ تحتاج سياقًا يحسمها (مثل: يُقصد بـ، يُعد من)
CTX = [(r"قصد", r" ب"), (r"شترط", r" (?:أن|في|ل)"), (r"قاس", r" ب"), (r"طلق", r" عل"), (r"نصح", r" ب"), (r"ستحسن", r" (?:أن|في|ل)"),
       (r"عد", r" (?:من|أحد|إحدى|أساس|مؤشرًا|مؤشرا|أداة|جزءًا|جزءا|مرحلة|عاملًا|عاملا|نوعًا|نوعا|شكلًا|شكلا|أهم|أكثر|أقوى|أبرز)"),
       (r"عتبر", r" (?:من|أحد|إحدى)")]
L = "ء-يٰ"
def fix(t):
    n = 0
    for stem in FIXED:
        # الياء أو التاء في أول الكلمة، أو بعد و/ف، وبعد الجذع نهاية الكلمة (أو ضمير متصل)
        pat = re.compile(rf"(?<![{L}])((?:[وف])?)([يت])({stem})(?=(?:ه|ها|هم|هن|ان|ون|ين)?(?![{L}ً-ْ]))")
        t, k = pat.subn(lambda m: m.group(1) + m.group(2) + "ُ" + m.group(3), t); n += k
    for stem, after in CTX:
        pat = re.compile(rf"(?<![{L}])((?:[وف])?)([يت])({stem})(?=(?:ه|ها)?{after})")
        t, k = pat.subn(lambda m: m.group(1) + m.group(2) + "ُ" + m.group(3), t); n += k
    return t, n

total = 0
files = ["public/data/qbank.json"] + glob.glob("content/articles/*.md") + glob.glob("content/bank/*.json") + \
        ["src/lib/comparisons.ts", "src/lib/comparisons-more.ts", "src/lib/misconceptions.ts", "src/lib/site-problems.ts", "src/lib/telegram-promos.ts"]
for f in files:
    try: s = open(f).read()
    except FileNotFoundError: continue
    s2, n = fix(s)
    if n and f.endswith(".json"): json.loads(s2)
    if n: open(f, "w").write(s2); total += n; print(f, n)
print("المجموع", total)
