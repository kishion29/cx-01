const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
const store = {};
function setup(w) {
  w.localStorage.getItem = k => (k in store ? store[k] : null);
  w.localStorage.setItem = (k, v) => { store[k] = String(v); };
  w.localStorage.removeItem = k => { delete store[k]; };
  globalThis.localStorage = w.localStorage; // 补全局
}
const dom1 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
setup(dom1.window);
const w1 = dom1.window;
setTimeout(() => {
  w1.cid = 'c1'; w1.contacts = [{ id: 'c1', name: '那刻夏' }]; w1.groups = [];
  w1.enterApp && w1.enterApp();
  setTimeout(() => {
    w1.openAiChat();
    w1.aiChatMsgs.push({ role: 'user', content: '测试消息', ts: Date.now() });
    w1.ls('ml2_ai_chat_msgs', w1.aiChatMsgs);
    console.log('保存后 ls 读取:', JSON.stringify(w1.ls('ml2_ai_chat_msgs') || []).slice(0, 60));
    console.log('store ai_chat key:', Object.keys(store).filter(k => k.includes('ai_chat')).join(','));
    const dom2 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
    setup(dom2.window);
    const w2 = dom2.window;
    setTimeout(() => {
      w2.cid = 'c1'; w2.contacts = [{ id: 'c1', name: '那刻夏' }]; w2.groups = [];
      w2.enterApp && w2.enterApp();
      setTimeout(() => {
        w2.openAiChat();
        console.log('刷新后 aiChatMsgs:', JSON.stringify(w2.aiChatMsgs).slice(0, 60));
        console.log('刷新后 ls 读取:', JSON.stringify(w2.ls('ml2_ai_chat_msgs') || []).slice(0, 60));
        process.exit(0);
      }, 800);
    }, 2500);
  }, 800);
}, 2500);
