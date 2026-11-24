// الصورة الثانية لكل مفهوم، محفوظة في public/concepts/<id>-2.jpg
// السجل يُعاد توليده تلقائيًا مع كل دفعة تطبيق (40 مفهومًا)
export const CONCEPT_IMAGES_2 = new Set<string>(["C002", "C008", "C009", "C010", "C011", "C019", "C020", "C022", "C023", "C025", "D901", "D902", "D903", "D904", "D905", "D906", "D907", "D908", "D909", "D910", "D911", "D912", "D913", "D914", "D915", "D916", "D917", "D918", "D919", "D920", "D921", "D922", "D923", "D924", "D925", "D926", "D927", "D928", "D929", "NC019"]);

export const conceptImage2 = (id: string) => (CONCEPT_IMAGES_2.has(id) ? `/concepts/${id}-2.jpg?v=1` : null);
