const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('app/index.html', 'utf-8');
// 共享 storage
const store = {};
function setup(w) {
  w.localStorage.getItem = k => (k in store ? store[k] : null);
  w.localStorage.setItem = (k, v) => { store[k] = String(v); };
  w.localStorage.removeItem = k => { delete store[k]; };
}
// 第一次加载
const dom1 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
setup(dom1.window);
const w1 = dom1.window;
w1.addEventListener('error', e => console.log('错误1:', e.message));
setTimeout(() => {
  try {
    w1.cid = 'c1'; w1.contacts = [{ id: 'c1', name: '那刻夏' }]; w1.groups = [];
    w1.enterApp && w1.enterApp();
    setTimeout(() => {
      try {
        w1.openAiChat();
        // 手动模拟发送（绕过 fetch）
        w1.aiChatMsgs.push({ role: 'user', content: '测试消息', ts: Date.now() });
        try { w1.ls('ml2_ai_chat_msgs', w1.aiChatMsgs); } catch (e) { console.log('ls保存失败:', e.message); }
        console.log('保存后 ls 读取:', JSON.stringify(w1.ls('ml2_ai_chat_msgs') || []).slice(0, 80));
        console.log('store keys:', Object.keys(store).filter(k => k.includes('ai_chat')).join(','));
      } catch (e) { console.log('发送失败:', e.message); }
      // 第二次加载（模拟刷新）
      const dom2 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
      setup(dom2.window);
      const w2 = dom2.window;
      w2.addEventListener('error', e => console.log('错误2:', e.message));
      setTimeout(() => {
        w2.cid = 'c1'; w2.contacts = [{ id: 'c1', name: '那刻夏' }]; w2.groups = [];
        w2.enterApp && w2.enterApp();
        setTimeout(() => {
          try {
            w2.openAiChat();
            console.log('刷新后 aiChatMsgs:', JSON.stringify(w2.aiChatMsgs).slice(0, 80));
            console.log('刷新后 ls 读取:', JSON.stringify(w2.ls('ml2_ai_chat_msgs') || []).slice(0, 80));
          } catch (e) { console.log('刷新后失败:', e.message); }
          process.exit(0);
        }, 800);
      }, 2500);
    }, 800);
  } catch (e) { console.log('前置失败:', e.message); process.exit(0); }
}, 2500);
