// صور تعليمية للمفاهيم، محفوظة في public/concepts/<id>.jpg
// فارغة الآن. عند إضافة صورة لمفهوم أضف رقمه هنا، فتظهر في الموقع ويرسلها بوت تيليجرام مع «معلومة اليوم».
export const CONCEPT_IMAGES = new Set<string>([]);

export const conceptImage = (id: string) => (CONCEPT_IMAGES.has(id) ? `/concepts/${id}.jpg` : null);
