"use client";

// أزرار المشاركة: كل المنصات التي لها رابط مشاركة، وزر مشاركة الهاتف الذي يفتح إنستغرام وتيك توك وسناب شات وغيرها، ونسخ الرابط
import { useState } from "react";
import { Check, Facebook, Instagram, Link as LinkIcon, Linkedin, Mail, MessageCircle, Send, Share2 } from "lucide-react";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: "واتساب", href: `https://wa.me/?text=${t}%20${u}`, bg: "#25D366", icon: <MessageCircle className="h-5 w-5" /> },
    { label: "فيسبوك", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, bg: "#1877F2", icon: <Facebook className="h-5 w-5" /> },
    { label: "إكس", href: `https://x.com/intent/post?text=${t}&url=${u}`, bg: "#000000", icon: <XLogo className="h-4 w-4" /> },
    { label: "لينكدإن", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, bg: "#0A66C2", icon: <Linkedin className="h-5 w-5" /> },
    { label: "تيليجرام", href: `https://t.me/share/url?url=${u}&text=${t}`, bg: "#229ED9", icon: <Send className="h-5 w-5" /> },
    { label: "البريد", href: `mailto:?subject=${t}&body=${t}%0A${u}`, bg: "#5B7268", icon: <Mail className="h-5 w-5" /> },
  ];

  // إنستغرام وتيك توك وسناب شات لا تقبل رابط مشاركة من المواقع، فتُفتح من قائمة المشاركة في الهاتف
  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
    } catch {
      return;
    }
    copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const btn = "flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:-translate-y-0.5";

  return (
    <div>
      <p className="mb-3 text-[15px] font-extrabold text-[#14302A]">شارك المقال مع زملائك</p>
      <div className="flex flex-wrap gap-2.5">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`مشاركة عبر ${l.label}`} title={l.label} className={btn} style={{ background: l.bg }}>
            {l.icon}
          </a>
        ))}
        <button type="button" onClick={nativeShare} aria-label="مشاركة عبر إنستغرام وتيك توك وتطبيقات أخرى" title="إنستغرام وتيك توك وتطبيقات أخرى" className={btn} style={{ background: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" }}>
          <Instagram className="h-5 w-5" />
        </button>
        <button type="button" onClick={nativeShare} aria-label="مشاركة عبر تطبيقات الهاتف" title="تطبيقات أخرى" className={btn} style={{ background: "#136F5C" }}>
          <Share2 className="h-5 w-5" />
        </button>
        <button type="button" onClick={copy} aria-label="نسخ الرابط" title="نسخ الرابط" className={`${btn} ${copied ? "bg-[#1E7B4A]" : "bg-[#8AA095]"}`}>
          {copied ? <Check className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
        </button>
      </div>
      <p className="mt-2 h-5 text-[12px] text-[#6B8077]">{copied ? "نُسخ الرابط" : "زر إنستغرام يفتح قائمة المشاركة في هاتفك، ومنها تيك توك وسناب شات وغيرها."}</p>
    </div>
  );
}
