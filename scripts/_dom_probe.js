// 用 jsdom 渲染产物，抓页面文本找乱码
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'http://localhost/index.html'
});
const w = dom.window;
// 模拟 localStorage
const store = {};
w.localStorage.getItem = k => (k in store ? store[k] : null);
w.localStorage.setItem = (k, v) => { store[k] = String(v); };
w.localStorage.removeItem = k => { delete store[k]; };
// 等待 JS 执行
setTimeout(() => {
  try {
    const doc = w.document;
    // 检查概念页和主界面
    const ann = doc.getElementById('announcement-screen');
    const phone = doc.querySelector('.phone');
    console.log('announcement display:', ann ? ann.style.display : 'nf');
    console.log('phone display:', phone ? phone.style.display : 'nf');
    const bodyText = doc.body ? doc.body.textContent.slice(0, 400) : 'no body';
    console.log('body 文本前 400:', JSON.stringify(bodyText));
    // 检查 clist
    const clist = doc.getElementById('clist-inner');
    console.log('clist 子节点:', clist ? clist.childNodes.length : 'nf');
    // 找乱码特征
    const full = doc.body ? doc.body.textContent : '';
    const fffd = (full.match(/\uFFFD/g) || []).length;
    console.log('U+FFFD 数量:', fffd);
  } catch (e) {
    console.log('检查出错:', e.message);
  }
  process.exit(0);
}, 3000);
