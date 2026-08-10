# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
R = []
def patch(path, old, new, label, count=1):
    s = open(path, encoding='utf-8').read()
    n = s.count(old)
    if n == 0:
        R.append(f'[FAIL 0] {label}')
        return
    s = s.replace(old, new, count)
    open(path, 'w', encoding='utf-8', newline='').write(s)
    R.append(f'[OK {n}] {label}')

p = 'app/src/23_pomodoro_icons.js'

# ===== AI 聊天：美化字段 =====
old = "var aiChatSettings={background:'',worldviewMode:'default',customWorldview:'',contactId:'',personaMode:'contact',personaCustom:'',memory:[]};"
new = "var aiChatSettings={background:'',worldviewMode:'default',customWorldview:'',contactId:'',personaMode:'contact',personaCustom:'',memory:[],beauty:{taAvatar:'',myAvatar:'',bgImage:'',myBubble:'#e3d9f5',taBubble:'#ffffff'}};"
patch(p, old, new, 'M1 美化字段')

# ===== AI 聊天：渲染应用美化 =====
old = """function renderAiChatMsgs(){
  var box=document.getElementById('ai-chat-box');
  if(!box)return;
  box.innerHTML='';
  if(!aiChatMsgs.length){
    box.innerHTML='<div style="text-align:center;padding:44px 20px;color:var(--txt3);font-size:13px;line-height:2.2;">💬 开始你们的 if 线故事吧<br>点击右上 ⚙️ 设定背景 / 关联梦角</div>';
    return;
  }
  aiChatMsgs.forEach(function(m){
    var isUser=m.role==='user';
    var row=document.createElement('div');
    row.style.cssText='display:flex;justify-content:'+(isUser?'flex-end':'flex-start')+';';
    var b=document.createElement('div');
    b.style.cssText='max-width:82%;padding:10px 13px;border-radius:'+(isUser?'14px 14px 4px 14px':'14px 14px 14px 4px')+';background:'+(isUser?'var(--c3)':'var(--c2)')+';color:var(--txt);font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;';
    b.textContent=m.content;
    row.appendChild(b);
    box.appendChild(row);
  });
  box.scrollTop=box.scrollHeight;
}"""
new = """function renderAiChatMsgs(){
  var box=document.getElementById('ai-chat-box');
  if(!box)return;
  // ★ 美化：背景图片
  var _beauty=aiChatSettings.beauty||{};
  if(_beauty.bgImage){
    box.style.background='url('+_beauty.bgImage+') center/cover no-repeat';
  }else{
    box.style.background='';
  }
  box.innerHTML='';
  if(!aiChatMsgs.length){
    box.innerHTML='<div style="text-align:center;padding:44px 20px;color:var(--txt3);font-size:13px;line-height:2.2;">💬 开始你们的 if 线故事吧<br>点击右上 ⚙️ 设定背景 / 关联梦角</div>';
    return;
  }
  // ★ 头像
  var _taAva=_beauty.taAvatar
    ?'<img src="'+_beauty.taAvatar+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,0.06);">'
    :'<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c9a961,#e8c88a);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🌙</div>';
  var _myAva=_beauty.myAvatar
    ?'<img src="'+_beauty.myAvatar+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(0,0,0,0.06);">'
    :'<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8ec5e8,#6fa8d9);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">✨</div>';
  var _myBubble=_beauty.myBubble||'#e3d9f5';
  var _taBubble=_beauty.taBubble||'#ffffff';
  aiChatMsgs.forEach(function(m){
    var isUser=m.role==='user';
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:flex-start;gap:8px;flex-direction:'+(isUser?'row-reverse':'row')+';';
    var av=document.createElement('div');
    av.innerHTML=isUser?_myAva:_taAva;
    var b=document.createElement('div');
    b.style.cssText='max-width:72%;padding:10px 14px;border-radius:'+(isUser?'14px 14px 4px 14px':'14px 14px 14px 4px')+';background:'+(isUser?_myBubble:_taBubble)+';color:var(--txt);font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.05);';
    b.textContent=m.content;
    row.appendChild(av);
    row.appendChild(b);
    box.appendChild(row);
  });
  box.scrollTop=box.scrollHeight;
}"""
patch(p, old, new, 'M2 渲染美化')

# ===== AI 聊天：设定弹窗加美化区 =====
old = """    +'<div style="font-size:12px;color:var(--txt2);margin:12px 0 6px;">📌 会话记忆库（TA 会记住这些）</div>'"""
new = """    +'<div style="font-size:13px;font-weight:600;color:var(--txt);margin:14px 0 6px;">🎨 聊天美化</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:8px;">'
    +'<div style="flex:1;text-align:center;"><div style="font-size:11px;color:var(--txt2);margin-bottom:4px;">TA 头像</div><label style="display:block;width:52px;height:52px;margin:0 auto;border-radius:50%;border:1px dashed var(--border);background:var(--c2);cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;">'+(aiChatSettings.beauty&&aiChatSettings.beauty.taAvatar?'<img src="'+aiChatSettings.beauty.taAvatar+'" style="width:100%;height:100%;object-fit:cover;">':'<span style="font-size:20px;">🌙</span>')+'<input type="file" id="ac-taava" accept="image/*" style="display:none;"></label></div>'
    +'<div style="flex:1;text-align:center;"><div style="font-size:11px;color:var(--txt2);margin-bottom:4px;">我的头像</div><label style="display:block;width:52px;height:52px;margin:0 auto;border-radius:50%;border:1px dashed var(--border);background:var(--c2);cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;">'+(aiChatSettings.beauty&&aiChatSettings.beauty.myAvatar?'<img src="'+aiChatSettings.beauty.myAvatar+'" style="width:100%;height:100%;object-fit:cover;">':'<span style="font-size:20px;">✨</span>')+'<input type="file" id="ac-myava" accept="image/*" style="display:none;"></label></div>'
    +'<div style="flex:1;text-align:center;"><div style="font-size:11px;color:var(--txt2);margin-bottom:4px;">背景图</div><label style="display:block;width:52px;height:52px;margin:0 auto;border-radius:12px;border:1px dashed var(--border);background:var(--c2);cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;">'+(aiChatSettings.beauty&&aiChatSettings.beauty.bgImage?'<img src="'+aiChatSettings.beauty.bgImage+'" style="width:100%;height:100%;object-fit:cover;">':'<span style="font-size:20px;">🖼️</span>')+'<input type="file" id="ac-bgimg" accept="image/*" style="display:none;"></label></div>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--txt2);margin:6px 0 4px;">我的气泡颜色</div>'
    +'<div id="ac-mycolors" style="display:flex;gap:6px;margin-bottom:8px;">'
    +'["#e3d9f5","#f5d9d9","#d9f0e1","#d9e8f5","#f5ecd9"].forEach(function(c){'
    +'var sel=(aiChatSettings.beauty&&aiChatSettings.beauty.myBubble===c);'
    +'_mbHtml+=\'<div data-c="\'+c+\'" style="width:26px;height:26px;border-radius:50%;background:\'+c+\';cursor:pointer;border:2px solid \'+(sel?\'var(--accent)\':\'transparent\')+\';\"></div>\';'
    +'})'
    +'</div>'
    +'<div style="font-size:11px;color:var(--txt2);margin:6px 0 4px;">TA 气泡颜色</div>'
    +'<div id="ac-tacolors" style="display:flex;gap:6px;margin-bottom:8px;">'
    +'["#ffffff","#f7f0e1","#eef3f7","#f5eef7"].forEach(function(c){'
    +'var sel=(aiChatSettings.beauty&&aiChatSettings.beauty.taBubble===c);'
    +'_tbHtml+=\'<div data-c="\'+c+\'" style="width:26px;height:26px;border-radius:50%;background:\'+c+\';cursor:pointer;border:2px solid \'+(sel?\'var(--accent)\':\'transparent\')+\';\"></div>\';'
    +'})'
    +'</div>'
    +'<div style="font-size:12px;color:var(--txt2);margin:12px 0 6px;">📌 会话记忆库（TA 会记住这些）</div>'"""
patch(p, old, new, 'M3 美化UI')

# 保存逻辑加 beauty
old = """    aiChatSettings.personaMode=pmSel.value;
    aiChatSettings.personaCustom=box.querySelector('#ac-pc').value.trim();
    aiChatSettings.contactId=box.querySelector('#ac-cid').value;"""
new = """    aiChatSettings.personaMode=pmSel.value;
    aiChatSettings.personaCustom=box.querySelector('#ac-pc').value.trim();
    aiChatSettings.contactId=box.querySelector('#ac-cid').value;
    if(!aiChatSettings.beauty)aiChatSettings.beauty={};
    aiChatSettings.beauty.myBubble=box.getAttribute('data-mycolor')||aiChatSettings.beauty.myBubble||'#e3d9f5';
    aiChatSettings.beauty.taBubble=box.getAttribute('data-tacolor')||aiChatSettings.beauty.taBubble||'#ffffff';"""
patch(p, old, new, 'M4 保存美化')

# ===== AI 占卜师：页面美化（标题渐变+背景+气泡阴影）=====
old = "  head.innerHTML='<div style=\"font-size:16px;font-weight:600;color:var(--txt);flex:1;\">🔮 AI占卜师</div>'"
new = "  head.style.background='linear-gradient(135deg,rgba(201,169,97,0.12),rgba(255,255,255,0))';\n  head.innerHTML='<div style=\"font-size:16px;font-weight:600;color:var(--txt);flex:1;\">🔮 AI占卜师</div>'"
patch(p, old, new, 'D1 占卜师标题渐变')

old = "  ov.id='ai-diviner-page';\n  ov.style.cssText='position:fixed;inset:0;z-index:9997;background:var(--c1);display:flex;flex-direction:column;';"
new = "  ov.id='ai-diviner-page';\n  ov.style.cssText='position:fixed;inset:0;z-index:9997;background:linear-gradient(160deg,rgba(201,169,97,0.07),rgba(255,255,255,0) 40%),var(--c1);display:flex;flex-direction:column;';"
patch(p, old, new, 'D2 占卜师页面渐变')

# 占卜师气泡美化（TA 气泡带月亮装饰 + 阴影）
old = "    b.style.cssText='max-width:82%;padding:10px 13px;border-radius:'+(isUser?'14px 14px 4px 14px':'14px 14px 14px 4px')+';background:'+(isUser?'var(--c3)':'var(--c2)')+';color:var(--txt);font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;';"
new = "    b.style.cssText='max-width:82%;padding:10px 13px;border-radius:'+(isUser?'14px 14px 4px 14px':'14px 14px 14px 4px')+';background:'+(isUser?'var(--c3)':'#ffffff')+';color:var(--txt);font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.04);';"
patch(p, old, new, 'D3 占卜师气泡阴影')

print()
for r in R:
    print(r)
