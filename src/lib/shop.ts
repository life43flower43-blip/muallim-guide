// متجر الجواهر — قطع تظهر كشارات صغيرة على الجنية في مسار رحلتك
// (الجنية تقف على المسار عند العالم التالي الذي لم تُنجزه بعد)

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "bow",
    name: "فيونكة الورد",
    emoji: "🎀",
    desc: "لمسة وردية لطيفة تزيّن الجنية في المسار",
    price: 45,
  },
  {
    id: "halo",
    name: "هالة النجوم",
    emoji: "✨",
    desc: "توهج نجمي ذهبي يحيط بالجنية أثناء رحلتها",
    price: 60,
  },
  {
    id: "wand",
    name: "العصا السحرية",
    emoji: "🪄",
    desc: "عصا صغيرة تحملها الجنية في طريقها نحو الاحتراف",
    price: 90,
  },
  {
    id: "crown",
    name: "التاج الملكي",
    emoji: "👑",
    desc: "تاج لامع يُعلن أن الجنية ملكة رحلتك إلى الاحتراف",
    price: 120,
  },
];

export const shopItemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id);

// جواهر الجلسة الواحدة: 5 لكل جلسة مكتملة، و+5 إضافية إن كانت كاملة بلا خطأ
export const gemsForSession = (total: number, correctCount: number) =>
  total > 0 && correctCount === total ? 10 : 5;
