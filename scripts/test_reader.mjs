// اختبار: محاولة بحث واحدة + قراءة صفحة مباشرة عبر web_reader
import ZAI from 'z-ai-web-dev-sdk';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function trySearch() {
  try {
    const zai = await ZAI.create();
    const res = await zai.functions.invoke('web_search', { query: 'best study app features 2025', num: 3 });
    console.log('SEARCH_OK:', JSON.stringify(res?.slice(0, 2), null, 1).slice(0, 500));
  } catch (e) { console.log('SEARCH_FAIL:', e.message.slice(0, 120)); }
}

async function tryRead(url) {
  try {
    const zai = await ZAI.create();
    const res = await zai.functions.invoke('web_reader', { url });
    console.log(`READ_OK ${url}:`, JSON.stringify(res).slice(0, 300));
  } catch (e) { console.log(`READ_FAIL ${url}:`, e.message.slice(0, 120)); }
}

await trySearch();
await sleep(2000);
await tryRead('https://quizlet.com/features');
