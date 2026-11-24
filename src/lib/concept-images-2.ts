// الصورة الثانية لكل مفهوم، محفوظة في public/concepts/<id>-2.jpg
// السجل يُعاد توليده تلقائيًا مع كل دفعة تطبيق (12 مفهومًا)
export const CONCEPT_IMAGES_2 = new Set<string>(["D901", "D902", "D903", "D904", "D905", "D906", "D907", "D908", "D909", "D910", "D911", "D912"]);

export const conceptImage2 = (id: string) => (CONCEPT_IMAGES_2.has(id) ? `/concepts/${id}-2.jpg?v=1` : null);
