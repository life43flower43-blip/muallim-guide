// فيديوهات الأسئلة المحلولة المعروضة داخل المقالات (ملفاتها في public/videos)
export type ArticleVideo = { src: string; poster: string; title: string; description: string; uploadDate: string; duration: string };

export const ARTICLE_VIDEOS: Record<string, ArticleVideo> = {
  "negative-reinforcement": {
    src: "/videos/negative-reinforcement-q1.mp4",
    poster: "/videos/negative-reinforcement-q1.jpg",
    title: "سؤال محلول بالفيديو",
    description: "معلم وعد طلابه بإعفائهم من الواجب إذا أنهوا مهامهم في وقتها، فزاد التزامهم. ما المبدأ الذي طبّقه؟ الإجابة مع سبب خطأ كل خيار.",
    uploadDate: "2026-11-25",
    duration: "PT49S",
  },
};
