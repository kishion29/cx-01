const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
const store = {};
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
setTimeout(() => {
  const doc = w.document;
  const btn = doc.getElementById('splash-notice-btn');
  if (btn) btn.click();
  setTimeout(() => {
    const bt = doc.body.textContent;
    // 检查是否有源码残留特征
    const bad1 = bt.includes('fullscreenchange');
    const bad2 = bt.includes('function(');
    console.log('body 含 fullscreenchange(应false):', bad1);
    console.log('body 含 function(源码特征,应false):', bad2);
    console.log('body 前 200:', JSON.stringify(bt.slice(0, 200)));
    process.exit(0);
  }, 1200);
}, 2500);
