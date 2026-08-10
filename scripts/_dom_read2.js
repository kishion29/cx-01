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
  w.cid = 'c1'; w.contacts = [{ id: 'c1', name: '那刻夏' }]; w.groups = [];
  w.enterApp && w.enterApp();
  setTimeout(() => {
    // 检查一起阅读相关函数是否存在
    const fns = ['showReadTogether', 'readRenderShelf', 'readOpenBook', 'readOpenBookById', 'readBackShelf', 'readRenderPage', 'readNextPage', 'readPrevPage', 'readSplitPages', 'readUploadBook', 'readParseEpub', 'readShowToc', 'readGotoChapter', 'readAddBookmark', 'readShowBookmarks', 'readOpenSettings', 'readToggleFullscreen', 'readToggleCompany', 'loadReadCards', 'saveReadCards', 'readPickCard', 'readTriggerTA', 'readDanmaku', 'readDanmakuText', 'readRemoveBook'];
    const missing = fns.filter(f => typeof w[f] !== 'function');
    console.log('缺失函数:', missing.length ? missing.join(', ') : '无');
    // 打开一起阅读
    try { w.showReadTogether(); console.log('打开成功'); } catch (e) { console.log('打开失败:', e.message); }
    // 加一本测试书并打开
    try {
      w.readBooks = [{ id: 't1', name: '测试书', content: '第一章\n测试内容一\n第二章\n测试内容二', progress: 0 }];
      w.readShelfSave();
      w.readRenderShelf();
      w.readOpenBookById('t1');
      console.log('打开书籍成功, 页面:', w.document.getElementById('read-book-page').style.display);
      console.log('正文:', w.document.getElementById('read-book-content').textContent.slice(0, 30));
    } catch (e) { console.log('打开书籍失败:', e.message); }
    process.exit(0);
  }, 800);
}, 2500);
