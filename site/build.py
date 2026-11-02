#!/usr/bin/env python3
"""يبني موقع مدونة تربوي الثابت من ملفات content/ إلى public/.

التشغيل: python3 site/build.py
لا يحتاج أي مكتبة خارجية.
"""
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
CONF = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
OUT = ROOT / "public"
SITE = CONF["site_url"].rstrip("/")
APP = CONF["app_url"].rstrip("/")


def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', t)
    email = CONF.get("contact_email") or ""
    mail = f'<a href="mailto:{email}">{email}</a>' if email else "(يُضاف البريد قريبًا)"
    return t.replace("{{APP}}", APP).replace("{{EMAIL}}", mail)


def md(src: str) -> str:
    """محوّل صغير: عناوين ## و###، فقرات، قوائم - و1.، اقتباس >، وصندوق ::: للدعوة."""
    out, para, lst, kind = [], [], [], None

    def flush():
        nonlocal para, lst, kind
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>")
            para = []
        if lst:
            tag = "ol" if kind == "ol" else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(i)}</li>" for i in lst) + f"</{tag}>")
            lst, kind = [], None

    lines = src.strip().split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith(":::"):
            flush()
            body = []
            i += 1
            while i < len(lines) and not lines[i].startswith(":::"):
                body.append(lines[i])
                i += 1
            text = " ".join(b.strip() for b in body if b.strip())
            out.append(f'<aside class="cta"><p>{inline(text)}</p><a class="btn" href="{APP}">افتح تطبيق تربوي</a></aside>')
        elif not line.strip():
            flush()
        elif line.startswith("### "):
            flush(); out.append(f"<h3>{inline(line[4:])}</h3>")
        elif line.startswith("## "):
            flush(); out.append(f"<h2>{inline(line[3:])}</h2>")
        elif line.startswith("> "):
            flush(); out.append(f"<blockquote><p>{inline(line[2:])}</p></blockquote>")
        elif re.match(r"^- ", line):
            if para: flush()
            if kind == "ol": flush()
            kind = "ul"; lst.append(line[2:])
        elif re.match(r"^\d+\. ", line):
            if para: flush()
            if kind == "ul": flush()
            kind = "ol"; lst.append(re.sub(r"^\d+\. ", "", line))
        else:
            if lst: flush()
            para.append(line.strip())
        i += 1
    flush()
    return "\n".join(out)


def parse(path: Path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S)
    meta = dict(l.split(": ", 1) for l in m.group(1).split("\n") if l.strip())
    meta["body"] = m.group(2)
    meta["slug"] = path.stem
    return meta


AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]


def ar_date(iso: str) -> str:
    y, mo, d = iso.split("-")
    digits = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")
    return f"{int(d)} {AR_MONTHS[int(mo) - 1]} {y}".translate(digits)


def page(title, desc, body, path, extra_head=""):
    canonical = f"{SITE}{path}"
    ads = ""
    if CONF.get("adsense_client"):
        ads = f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={CONF["adsense_client"]}" crossorigin="anonymous"></script>'
    full = title if title == CONF["name"] else f"{title} | {CONF['name']}"
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(full)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="ar_AR">
<meta property="og:image" content="{SITE}/og.png">
<meta name="theme-color" content="#136F5C">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
{extra_head}{ads}
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="/"><img src="/logo.svg" alt="" width="32" height="32"><span>{CONF['name']}</span></a>
<nav><a href="/articles/">المقالات</a><a href="/about/">من نحن</a><a class="btn sm" href="{APP}">التطبيق</a></nav>
</div></header>
<main class="wrap">
{body}
</main>
<footer class="foot"><div class="wrap">
<p>{CONF['name']}: مقالات تربوية عربية للمعلمين وطلاب كليات التربية والمستعدين لاختبارات الرخصة والتوظيف.</p>
<nav><a href="/about/">من نحن</a><a href="/contact/">تواصل معنا</a><a href="/privacy/">سياسة الخصوصية</a><a href="/terms/">شروط الاستخدام</a></nav>
</div></footer>
</body>
</html>
"""


def card(a):
    return f"""<a class="card" href="/articles/{a['slug']}/">
<span class="tag">{a['category']}</span>
<h3>{html.escape(a['title'])}</h3>
<p>{html.escape(a['description'])}</p>
<span class="meta"><bdi>{ar_date(a['date'])}</bdi>، <bdi>{a['minutes']} دقائق قراءة</bdi></span>
</a>"""


def write(rel, content):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "static", OUT)
    arts = sorted((parse(p) for p in (ROOT / "content" / "articles").glob("*.md")), key=lambda a: a["date"], reverse=True)
    for a in arts:
        words = len(re.findall(r"\S+", a["body"]))
        a["minutes"] = str(max(3, round(words / 180))).translate(str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩"))

    # الصفحة الرئيسية
    home = f"""<section class="hero">
<h1>{CONF['tagline']}</h1>
<p>{CONF['intro']}</p>
<div class="row"><a class="btn" href="/articles/">اقرأ المقالات</a><a class="btn ghost" href="{APP}">جرّب التطبيق مجانًا</a></div>
</section>
<section><h2 class="sec">أحدث المقالات</h2><div class="grid">{''.join(card(a) for a in arts[:6])}</div>
<p class="more"><a href="/articles/">كل المقالات</a></p></section>
<aside class="cta"><p>{CONF['app_pitch']}</p><a class="btn" href="{APP}">افتح تطبيق تربوي</a></aside>"""
    write("index.html", page(CONF["name"], CONF["description"], home, "/"))

    # قائمة المقالات
    cats = sorted({a["category"] for a in arts})
    lst = f"""<h1 class="title">المقالات</h1>
<p class="lead">{str(len(arts)).translate(str.maketrans("0123456789","٠١٢٣٤٥٦٧٨٩"))} مقالًا في التعلم والتدريس والتقويم والاستعداد للاختبارات المهنية.</p>""" + "".join(
        f'<section><h2 class="sec">{c}</h2><div class="grid">{"".join(card(a) for a in arts if a["category"] == c)}</div></section>' for c in cats)
    write("articles/index.html", page("المقالات", "كل مقالات " + CONF["name"] + " مرتبة بحسب الموضوع.", lst, "/articles/"))

    # المقالات
    for idx, a in enumerate(arts):
        related = [b for b in arts if b["category"] == a["category"] and b is not a][:2] or [b for b in arts if b is not a][:2]
        ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["description"],
                         "datePublished": a["date"], "inLanguage": "ar", "author": {"@type": "Organization", "name": CONF["name"]}}, ensure_ascii=False)
        body = f"""<article class="post">
<p class="crumbs"><a href="/articles/">المقالات</a>، {a["category"]}</p>
<h1 class="title">{html.escape(a['title'])}</h1>
<p class="meta"><bdi>{ar_date(a['date'])}</bdi>، <bdi>{a['minutes']} دقائق قراءة</bdi></p>
{md(a['body'])}
</article>
<section><h2 class="sec">اقرأ أيضًا</h2><div class="grid">{''.join(card(b) for b in related)}</div></section>"""
        write(f"articles/{a['slug']}/index.html", page(a["title"], a["description"], body, f"/articles/{a['slug']}/",
                                                       f'<script type="application/ld+json">{ld}</script>\n'))

    # الصفحات الثابتة
    for p in (ROOT / "content" / "pages").glob("*.md"):
        m = parse(p)
        body = f'<article class="post"><h1 class="title">{html.escape(m["title"])}</h1>\n{md(m["body"])}</article>'
        write(f"{m['slug']}/index.html", page(m["title"], m["description"], body, f"/{m['slug']}/"))

    write("404.html", page("الصفحة غير موجودة", "الصفحة غير موجودة.", '<section class="hero"><h1>الصفحة غير موجودة</h1><p>ربما نُقلت أو حُذفت.</p><div class="row"><a class="btn" href="/">الرئيسية</a></div></section>', "/404"))

    urls = ["/", "/articles/"] + [f"/articles/{a['slug']}/" for a in arts] + [f"/{p.stem}/" for p in (ROOT / "content" / "pages").glob("*.md")]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"<url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    if CONF.get("adsense_client"):
        write("ads.txt", f"google.com, {CONF['adsense_client'].replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    print(f"built {len(arts)} articles, {len(urls)} pages -> {OUT}")


if __name__ == "__main__":
    main()
