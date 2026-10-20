import re, os, json

CJK = re.compile(r'[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]')
KANA = re.compile(r'[\u3040-\u30ff]')
HANGUL = re.compile(r'[\uac00-\ud7af\u1100-\u11ff]')

results = []
root = '/home/z/my-project/src'
for dirpath, dirs, files in os.walk(root):
    for f in files:
        if not f.endswith(('.ts', '.tsx', '.css', '.json')): continue
        path = os.path.join(dirpath, f)
        try:
            with open(path, encoding='utf-8') as fh:
                for i, line in enumerate(fh, 1):
                    if CJK.search(line):
                        snippet = line.strip()[:200]
                        chars = set(CJK.findall(line))
                        results.append((path.replace('/home/z/my-project/', ''), i, snippet, ' '.join(sorted(chars))))
        except Exception as e:
            results.append((path, -1, f'ERROR: {e}', ''))

print(f"=== CJK matches: {len(results)} lines ===")
for p, i, s, c in results:
    print(f"{p}:{i} [{c}]")
    print(f"    {s}")
