// صور تعليمية للمفاهيم، محفوظة في public/concepts/<id>.jpg
// عند إضافة صورة لمفهوم أضف رقمه هنا، فتظهر في الموقع ويرسلها بوت تيليجرام مع «معلومة اليوم».
export const CONCEPT_IMAGES = new Set<string>(["G205", "D2044", "D1455", "D959", "D901", "D1984", "C475", "D1272", "A812"]);

export const conceptImage = (id: string) => (CONCEPT_IMAGES.has(id) ? `/concepts/${id}.jpg` : null);
