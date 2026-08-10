const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
const store = {};
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
let err = null;
w.addEventListener('error', e => { err = e.message; });
setTimeout(() => {
  w.cid = 'c1';
  w.contacts = [{ id: 'c1', name: '那刻夏', chatSettings: {} }];
  w.groups = [];
  w.enterApp && w.enterApp();
  setTimeout(() => {
    try { w.openAiDiviner(); } catch (e) { console.log('打开占卜师失败:', e.message); }
    const doc = w.document;
    const btn = doc.getElementById('ai-diviner-beauty');
    console.log('占卜师美化按钮:', !!btn);
    if (btn) {
      btn.click();
      setTimeout(() => {
        const ov = doc.getElementById('ov-beautify');
        console.log('点击后 ov-beautify 存在:', !!ov, 'display:', ov ? ov.style.display : 'nf');
        console.log('classList:', ov ? ov.className : '');
        process.exit(0);
      }, 300);
    } else { process.exit(0); }
  }, 800);
}, 2500);
