# -*- coding: utf-8 -*-
import sys, subprocess, tempfile, os, re, hashlib, shutil
sys.stdout.reconfigure(encoding='utf-8')
log = []

# ========== Bug1 + Bug3：23_pomodoro_icons.js ==========
p = 'app/src/23_pomodoro_icons.js'
s = open(p, encoding='utf-8').read()

# 1a) aiChatMsgsKey → 全局（修复刷新后历史"全没了"）
old_key = """function aiChatMsgsKey(){
  var _c=aiChatSettings&&aiChatSettings.contactId;
  return 'ml2_ai_chat_msgs'+(_c&&_c!=='none'?'_'+_c:'');
}"""
new_key = """function aiChatMsgsKey(){
  // ★ v2: 全局存储。按联系人分 key 会导致刷新后打开时 cid 不同而"丢失"历史；
  // 联系人仅用于设定（人设/音色），消息统一存一份
  return 'ml2_ai_chat_msgs';
}"""
n = s.count(old_key)
assert n == 1, 'aiChatMsgsKey 匹配 %d' % n
s = s.replace(old_key, new_key)
log.append('aiChatMsgsKey 全局 x%d' % n)

# 1b) load 迁移：把历史按联系人分 key 的数据合并回全局
old_mig = """  if(!aiChatMsgs.length&&_aik!=='ml2_ai_chat_msgs'){
    var _old=null;
    try{var _raw=localStorage.getItem('ml2_lf_ml2_ai_chat_msgs');if(_raw){_old=JSON.parse(_raw);}}catch(e){}
    if(!_old||!_old.length){try{var _m=window.memoryCache||{};if(_m['ml2_ai_chat_msgs'])_old=_m['ml2_ai_chat_msgs'];}catch(e){}}
    if(_old&&_old.length){aiChatMsgs=_old;try{ls('ml2_ai_chat_msgs',[]);}catch(e){}try{ls(_aik,aiChatMsgs);}catch(e){}}
  }"""
new_mig = """  if(!aiChatMsgs.length){
    // ★ v2: 一次性迁移——把此前按联系人分 key(ml2_ai_chat_msgs_*)存的历史合并回全局，避免"消失"
    try{
      var _parts=[];
      for(var _li=0;_li<localStorage.length;_li++){
        var _lk=localStorage.key(_li);
        if(_lk&&_lk.indexOf('ml2_lf_ml2_ai_chat_msgs_')===0){
          try{var _pv=JSON.parse(localStorage.getItem(_lk));if(Array.isArray(_pv)&&_pv.length)_parts.push(_pv);}catch(e){}
        }
      }
      if(_parts.length){
        _parts.sort(function(a,b){return ((b[b.length-1]&&b[b.length-1].ts)||0)-((a[a.length-1]&&a[a.length-1].ts)||0);});
        aiChatMsgs=_parts[0];
        for(var _pi=1;_pi<_parts.length;_pi++){_parts[_pi].forEach(function(_m){aiChatMsgs.push(_m);});}
        aiChatMsgs.sort(function(a,b){return (a.ts||0)-(b.ts||0);});
        try{ls('ml2_ai_chat_msgs',aiChatMsgs);}catch(e){}
      }
    }catch(e){}
  }"""
n = s.count(old_mig)
assert n == 2, '迁移段匹配 %d' % n
s = s.replace(old_mig, new_mig)
log.append('迁移合并 x%d' % n)

# 1c) 新增 showAiInterpretPanel helper（放 aiChatMsgsKey 前）
anchor = "function aiChatMsgsKey(){"
helper = """function showAiInterpretPanel(){
  var ov=document.getElementById('ov-ai-interpret');
  if(ov){
    try{
      if(ov.parentNode&&ov.parentNode!==document.body){document.body.appendChild(ov);}
      ov.style.setProperty('z-index','99998','important');
    }catch(e){try{ov.style.zIndex='99998';}catch(e2){}}
  }
  showOv('ov-ai-interpret');
}
"""
n = s.count(anchor)
assert n == 1, 'anchor 匹配 %d' % n
s = s.replace(anchor, helper + anchor)
log.append('showAiInterpretPanel x%d' % n)

# 1d) aiInterpretText 用 showAiInterpretPanel
old_show = "showOv('ov-ai-interpret');"
n = s.count(old_show)
s = s.replace(old_show, "showAiInterpretPanel();")
log.append('aiInterpretText showOv x%d' % n)

# 1e) d2AiInterpret：解读区改为 ov-ai-interpret 大面板
old_area = """  var area=$('d2-ai-area');
  if(area){
    area.style.display='block';
    // ★ 修复：解读区限高可滚动，避免撑开弹窗把牌面挤出可视区
    area.style.maxHeight='38vh';
    area.style.overflowY='auto';
    area.style.marginTop='8px';
    area.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);"><span style="display:inline-block;animation:aiPulse 1s ease-in-out infinite;">📜 TA正在解读牌面...</span></div>';
    area.scrollIntoView({behavior:'smooth',block:'nearest'});
  }"""
new_area = """  var area=$('ai-interpret-body');
  if(area){
    // ★ v2: 复用全局 AI 解读大面板（底部弹出 88vh 可滚动），不再用占卜弹窗内的 38vh 小框
    area.style.cssText='flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;';
    var _titleEl=document.querySelector('#ov-ai-interpret .modal-title');
    if(_titleEl)_titleEl.textContent='🔮 AI 占卜解读';
    area.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3);"><div style="font-size:28px;margin-bottom:10px;">🌙</div><div style="font-size:13px;">TA正在解读牌面...</div></div>';
    showAiInterpretPanel();
  }"""
n = s.count(old_area)
assert n == 1, 'd2 area 匹配 %d' % n
s = s.replace(old_area, new_area)
log.append('d2 area x%d' % n)

# 1f) d2AiInterpret 纠错 onDone 的目标元素
old_done = "var a=$('d2-ai-area');"
new_done = "var a=$('ai-interpret-body');"
n = s.count(old_done)
s = s.replace(old_done, new_done)
log.append('d2 onDone x%d' % n)

open(p, 'w', encoding='utf-8', newline='').write(s)
print('23 完成:', log)
