const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
const store = {};
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
let pageErr = null;
w.addEventListener('error', e => { pageErr = e.message; });
setTimeout(() => {
  try {
    w.cid = 'c1';
    w.contacts = [{ id: 'c1', name: '那刻夏', avatar: '🌟' }];
    w.groups = [];
    // 模拟进入
    w.enterApp && w.enterApp();
    setTimeout(() => {
      try {
        w.showReadTogether();
        console.log('showReadTogether 调用成功');
        const ov = w.document.getElementById('ov-read-together');
        console.log('overlay 显示:', ov ? ov.style.display : 'nf');
      } catch (e) {
        console.log('打开失败错误:', e.message);
        console.log('堆栈:', (e.stack || '').split('\n').slice(0, 4).join('\n'));
      }
      console.log('页面错误:', pageErr);
      process.exit(0);
    }, 800);
  } catch (e) {
    console.log('前置错误:', e.message);
    process.exit(0);
  }
}, 2500);
