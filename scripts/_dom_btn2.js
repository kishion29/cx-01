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
  w.cid = 'c1';
  w.contacts = [{ id: 'c1', name: '那刻夏', chatSettings: {} }]; w.groups = [];
  w.enterApp && w.enterApp();
  setTimeout(() => {
    try {
      w.openAiChat();
      const b = w.document.getElementById('ai-chat-beauty');
      console.log('beauty onclick 类型:', typeof b.onclick);
      try {
        b.onclick();
        console.log('openBeautify 无异常, show:', w.document.getElementById('ov-beautify').classList.contains('show'));
      } catch (e) {
        console.log('openBeautify 异常:', e.message);
        console.log('堆栈:', (e.stack || '').split('\n').slice(0, 3).join(' | '));
      }
    } catch (e) { console.log('外层:', e.message); }
    process.exit(0);
  }, 800);
}, 2500);
