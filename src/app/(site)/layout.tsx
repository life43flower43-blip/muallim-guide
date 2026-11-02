// قالب صفحات الموقع العامة بالنمط المعتاد للمواقع، وسكربت الإعلانات هنا وحده لا في التطبيق
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

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
      {ADS && <Script async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}`} />}
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
