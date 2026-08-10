const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
setTimeout(() => {
  try {
    w.localStorage.setItem('ml2_lf_test', 'hello');
    console.log('jsdom localStorage 写入成功:', w.localStorage.getItem('ml2_lf_test'));
  } catch (e) {
    console.log('jsdom localStorage 抛错:', e.message);
  }
  // 检查全局
  try {
    console.log('裸 localStorage 读取:', typeof localStorage === 'undefined' ? 'undefined' : localStorage.getItem('ml2_lf_test'));
  } catch (e) { console.log('裸 localStorage:', e.message); }
  process.exit(0);
}, 500);
