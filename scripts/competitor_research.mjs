// بحث في الويب عن ميزات تطبيقات المنافسين — يُحفظ الناتج في JSON
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const QUERIES = [
  { q: 'أفضل تطبيقات المذاكرة والمراجعة للطلاب 2025 ميزات', tag: 'ar-study-apps' },
  { q: 'best study apps 2025 exam prep features students', tag: 'en-study-apps' },
  { q: 'Quizlet features learn mode test mode flashcards spaced repetition', tag: 'quizlet' },
  { q: 'Anki RemNote spaced repetition app features comparison', tag: 'srs-apps' },
  { q: 'Kahoot Quizizz Blooket features classroom quiz game modes', tag: 'quiz-games' },
  { q: 'تطبيق الرخصة المهنية للمعلمين تجربة أسئلة تدريب', tag: 'ar-teacher-license' },
  { q: 'teacher certification exam prep app features practice tests review', tag: 'teacher-prep' },
  { q: 'exam prep mobile app UX features mastery progress review mistakes', tag: 'exam-ux' },
  { q: 'flashcard app best features UI design 2025', tag: 'flashcards' },
  { q: 'Duolingo gamification features streaks what makes it effective', tag: 'gamification' },
  { q: 'AI tutor study app features personalized practice explanations 2025', tag: 'ai-tutor' },
  { q: 'تطبيقات اختبارات تجريبية للمعلمين بالعربية منصة تدريب', tag: 'ar-quiz-platforms' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const zai = await ZAI.create();
  const all = {};
  for (const { q, tag } of QUERIES) {
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.functions.invoke('web_search', { query: q, num: 8 });
        all[tag] = (res || []).map((r) => ({
          name: r.name, url: r.url, host: r.host_name, snippet: r.snippet, date: r.date,
        }));
        ok = true;
        console.log(`✓ [${tag}] ${all[tag].length} نتائج`);
      } catch (e) {
        console.error(`✗ [${tag}] محاولة ${attempt}: ${e.message}`);
        await sleep(3000 * attempt);
      }
    }
    await sleep(1500);
  }
  fs.writeFileSync('/home/z/my-project/scripts/competitor_results.json', JSON.stringify(all, null, 2), 'utf-8');
  const tags = Object.keys(all);
  console.log(`\nانتهى: ${tags.length}/${QUERIES.length} استعلام ناجح`);
}

main().catch((e) => { console.error('فشل عام:', e.message); process.exit(1); });
