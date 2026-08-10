const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
  url: 'http://localhost/index.html'
});
const w = dom.window;
const store = {};
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
// 拦截错误
w.addEventListener('error', e => console.log('[页面错误]', e.message));
w.onerror = (msg, src, line) => console.log('[onerror]', msg, 'line', line);
setTimeout(() => {
  try {
    const doc = w.document;
    // 找概念页按钮
    const btn = doc.getElementById('splash-notice-btn');
    console.log('按钮存在:', !!btn, btn ? btn.textContent : '');
    if (btn) btn.click();
    setTimeout(() => {
      const ann = doc.getElementById('announcement-screen');
      const phone = doc.querySelector('.phone');
      console.log('点击后 announcement display:', ann ? ann.style.display : 'nf');
      console.log('点击后 phone display:', phone ? phone.style.display : 'nf');
      // 当前显示的页面
      const pages = doc.querySelectorAll('.page');
      let active = '';
      pages.forEach(p => { if (p.classList.contains('active')) active = p.id; });
      console.log('active page:', active);
      // 页面文本
      const activeEl = doc.getElementById(active);
      if (activeEl) {
        console.log('active 页面文本前 300:', JSON.stringify(activeEl.textContent.slice(0, 300)));
      }
      const bodyText = doc.body.textContent;
      const fffd = (bodyText.match(/\uFFFD/g) || []).length;
      console.log('body U+FFFD:', fffd);
      // 找可疑乱码：大量重复替换字符
      if (fffd > 0) {
        const i = bodyText.indexOf('\uFFFD');
        console.log('乱码上下文:', JSON.stringify(bodyText.slice(Math.max(0, i - 100), i + 100)));
      }
    }, 1500);
  } catch (e) { console.log('err:', e.message); }
}, 3000);
