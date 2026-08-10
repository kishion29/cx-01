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
    w.openAiChat();
    const b = w.document.getElementById('ai-chat-beauty');
    console.log('beauty onclick:', typeof b.onclick);
    if (b.onclick) {
      b.onclick();
      // 等 async 完成
      setTimeout(() => {
        const ov = w.document.getElementById('ov-beautify');
        console.log('等1s后 ov-beautify show:', ov ? ov.classList.contains('show') : 'nf');
        console.log('zIndex:', ov ? ov.style.zIndex : '');
        process.exit(0);
      }, 1200);
    } else { process.exit(0); }
  }, 800);
}, 2500);
