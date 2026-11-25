// فيديوهات الأسئلة المحلولة المعروضة داخل المقالات (ملفاتها في public/videos)
export type ArticleVideo = { src: string; poster: string; title: string; description: string; uploadDate: string; duration: string };

export const ARTICLE_VIDEOS: Record<string, ArticleVideo> = {
  "negative-reinforcement": {
    src: "/videos/negative-reinforcement-q1.mp4",
    poster: "/videos/negative-reinforcement-q1.jpg",
    title: "سؤال محلول: تعزيز سلبي أم عقاب سلبي؟",
    description: "معلم وعد طلابه بإعفائهم من الواجب إذا أنهوا مهامهم في وقتها، فزاد التزامهم. ما المبدأ الذي طبّقه؟ الإجابة مع سبب خطأ كل خيار.",
    uploadDate: "2026-11-25",
    duration: "PT49S",
  },
  "zpd-scaffolding": {
    src: "/videos/zpd-scaffolding-q1.mp4",
    poster: "/videos/zpd-scaffolding-q1.jpg",
    title: "سؤال محلول: منطقة النمو القريبة عند فيجوتسكي",
    description: "طالبة لا تستطيع حل المسألة وحدها لكنها تحلها بمساعدة معلمتها. في أي منطقة تقع المهارة بحسب فيجوتسكي؟ الإجابة مع سبب خطأ كل خيار.",
    uploadDate: "2026-11-25",
    duration: "PT51S",
  },
};
