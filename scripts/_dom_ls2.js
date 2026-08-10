const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const store = {};
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
globalThis.localStorage = w.localStorage;
setTimeout(() => {
  try {
    // 直接调 ls 保存
    w.ls('ml2_ai_chat_msgs', [{ role: 'user', content: 'x', ts: 1 }]);
    console.log('保存后 store 全部 key:', Object.keys(store).slice(0, 10).join(','));
    console.log('保存后 store 长度:', Object.keys(store).length);
    // 检查 Storage 内部
    console.log('memoryCache 有值:', JSON.stringify(w.ls('ml2_ai_chat_msgs')).slice(0, 60));
  } catch (e) { console.log('错误:', e.message); }
  process.exit(0);
}, 1500);
