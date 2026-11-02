// قالب صفحات الموقع العامة بالنمط المعتاد للمواقع، وسكربت الإعلانات هنا وحده لا في التطبيق
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SITE_URL } from "@/lib/public-bank";
import AppBar from "@/components/site/AppBar";
import CopyGuard from "@/components/site/CopyGuard";

const ADS = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F4F7F5] text-[#14302A]">
      {/* التطبيق المثبّت على الهاتف يفتح دائمًا على التطبيق لا على الموقع، حتى لو ثُبّت قديمًا على الرابط الرئيسي */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var m=function(q){return window.matchMedia&&matchMedia("(display-mode: "+q+")").matches};if(m("standalone")||m("fullscreen")||m("minimal-ui")||navigator.standalone||document.referrer.indexOf("android-app://")===0){location.replace("/app")}}catch(e){}`,
        }}
      />
      {/* بيانات منظمة يقرؤها Google: اسم الموقع، وخانة البحث في نتائج Google، والجهة الناشرة */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "تربوي",
              alternateName: "Turbawy",
              url: `${SITE_URL}/`,
              inLanguage: "ar",
              potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
            },
            { "@context": "https://schema.org", "@type": "EducationalOrganization", name: "تربوي", url: `${SITE_URL}/`, logo: `${SITE_URL}/icons/icon-512-v3.png` },
          ]),
        }}
      />
      {ADS && <Script async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}`} />}
      <SiteHeader />
      <main className="mx-auto max-w-6xl select-none px-4 pb-24 pt-6 md:pb-6 [&_input]:select-text [&_textarea]:select-text">{children}</main>
      <SiteFooter />
      <AppBar />
      <CopyGuard />
    </div>
  );
}
