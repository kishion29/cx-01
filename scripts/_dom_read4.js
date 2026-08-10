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
  w.cid = 'c1'; w.SELF = 'me';
  w.contacts = [{ id: 'c1', name: '那刻夏', avatar: '🌟' }, { id: 'c2', name: '景元', avatar: '☀️' }];
  w.groups = [];
  w.enterApp && w.enterApp();
  setTimeout(() => {
    try {
      w.showReadTogether();
      w.readBooks = [{ id: 't1', name: '测试书', content: '第一章\n测试一\n第二章\n测试二\n第三章\n测试三', progress: 0 }];
      w.readShelfSave(); w.readRenderShelf(); w.readOpenBookById('t1');
      console.log('打开书成功');
      w.readNextPage();
      console.log('翻页成功, 页码:', w.document.getElementById('read-book-progress').textContent);
      w.readAddBookmark();
      w.readShowBookmarks();
      const bl = w.document.getElementById('read-bookmark-list');
      console.log('书签列表渲染:', !!bl && bl.childNodes.length > 0);
      w.readToggleMode();
      console.log('切换模式成功:', w.readBookSettings.mode);
      w.readShowCompanyPick();
      const cl = w.document.getElementById('read-bookmark-list');
      console.log('联系人选择渲染:', !!cl && cl.innerHTML.includes('景元'));
      // 字卡库
      w.readShowReadCards();
      w.readCardsTab('private');
      const cw = w.document.getElementById('read-cards-contact-wrap');
      console.log('字卡库联系人区:', !!cw && cw.innerHTML.includes('景元'));
      const bw = w.document.getElementById('read-cards-batch-wrap');
      console.log('批量导入区:', !!bw);
    } catch (e) { console.log('失败:', e.message); }
    console.log('页面错误:', err);
    process.exit(0);
  }, 800);
}, 2500);
