#!/usr/bin/env python3
# توليد أيقونات PWA لتطبيق تربوي (أخضر جامعي + قبعة تخرج مبسطة)
from PIL import Image, ImageDraw

GREEN = (27, 67, 50)        # #1B4332
GREEN2 = (45, 106, 79)      # #2D6A4F
AMBER = (251, 191, 36)      # #FBBF24
CREAM = (250, 250, 244)     # #FAFAF4


def grad_bg(size):
    img = Image.new("RGB", (size, size), GREEN)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / size
        c = tuple(int(GREEN[i] + (GREEN2[i] - GREEN[i]) * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c)
    return img


def draw_cap(d, s, scale=1.0):
    # قبعة تخرج مبسطة: معيّن + قاعدة + شرّابة ذهبية
    cx, cy = s / 2, s * 0.42
    w = s * 0.62 * scale
    h = s * 0.30 * scale
    # المعيّن (اللوح العلوي)
    d.polygon([(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)], fill=CREAM)
    # القاعدة
    bw = w * 0.52
    d.rounded_rectangle([cx - bw / 2, cy + h * 0.18, cx + bw / 2, cy + h * 0.75], radius=int(s * 0.02), fill=CREAM)
    # الشرّابة
    d.line([(cx, cy), (cx + w * 0.34, cy + h * 0.55)], fill=AMBER, width=max(2, int(s * 0.014)))
    d.ellipse([cx + w * 0.30, cy + h * 0.50, cx + w * 0.40, cy + h * 0.62], fill=AMBER)


def make(size, path, maskable=False):
    img = grad_bg(size)
    d = ImageDraw.Draw(img)
    if maskable:
        # منطقة آمنة 80% للأيقونات القابلة للقناع
        pad = int(size * 0.12)
        inner = grad_bg(size - pad * 2)
        img.paste(inner, (pad, pad))
        d = ImageDraw.Draw(img)
        draw_cap(d, size, scale=0.78)
    else:
        # إطار دائري فاتح + القبعة
        d.ellipse([size * 0.14, size * 0.14, size * 0.86, size * 0.86], fill=(255, 255, 255, 0))
        draw_cap(d, size, scale=0.95)
    img.save(path, "PNG")
    print("saved", path)


import os
os.makedirs("/home/z/my-project/public/icons", exist_ok=True)
make(192, "/home/z/my-project/public/icons/icon-192.png")
make(512, "/home/z/my-project/public/icons/icon-512.png")
make(512, "/home/z/my-project/public/icons/icon-maskable-512.png", maskable=True)
make(180, "/home/z/my-project/public/icons/apple-touch-icon.png")
make(64, "/home/z/my-project/public/favicon-app.png")
print("OK icons")
