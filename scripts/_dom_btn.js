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
let err = null;
w.addEventListener('error', e => { err = e.message; });
setTimeout(() => {
  w.cid = 'c1'; w.SELF = 'me';
  w.contacts = [{ id: 'c1', name: '那刻夏', chatSettings: {} }]; w.groups = [];
  w.enterApp && w.enterApp();
  setTimeout(() => {
    w.openAiChat();
    const doc = w.document;
    const ids = ['ai-chat-back', 'ai-chat-new', 'ai-chat-sess', 'ai-chat-beauty', 'ai-chat-set'];
    ids.forEach(id => {
      const el = doc.getElementById(id);
      console.log(id, ':', !!el, el ? 'onclick=' + (!!el.onclick) : '');
    });
    // 点 beauty 看 ov-beautify
    const b = doc.getElementById('ai-chat-beauty');
    if (b && b.onclick) { b.onclick(); console.log('beauty 点击后 ov-beautify show:', doc.getElementById('ov-beautify').classList.contains('show')); }
    else console.log('beauty 无 onclick');
    console.log('页面错误:', err);
    process.exit(0);
  }, 800);
}, 2500);
