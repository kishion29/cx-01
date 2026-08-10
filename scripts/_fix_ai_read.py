# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/23_pomodoro_icons.js'
s = open(p, encoding='utf-8').read()
ok = True
def rep(old, new):
    global s, ok
    n = s.count(old)
    if n != 1:
        print('FAIL', n, ':', old[:60]); ok = False
    else:
        s = s.replace(old, new, 1)

# openAiChat 读取后异步补读（两套都要改——用 replace_all）
old_read = """  aiChatMsgs=ls('ml2_ai_chat_msgs')||[];
  if(!Array.isArray(aiChatMsgs))aiChatMsgs=[];"""
new_read = """  aiChatMsgs=ls('ml2_ai_chat_msgs')||[];
  if(!Array.isArray(aiChatMsgs))aiChatMsgs=[];
  if(!aiChatMsgs.length&&window.localforage){
    window.localforage.getItem('ml2_ai_chat_msgs').then(function(v){
      if(v&&Array.isArray(v)&&v.length){aiChatMsgs=v;try{ls('ml2_ai_chat_msgs',aiChatMsgs);}catch(e){}if(typeof renderAiChatMsgs==='function')renderAiChatMsgs();}
    }).catch(function(){});
  }"""
n1 = s.count(old_read)
s = s.replace(old_read, new_read)
print('AI聊天异步补读:', n1)

# 占卜师同样
old_read2 = """  aiDivinerMsgs=ls('ml2_ai_diviner_msgs')||[];
  if(!Array.isArray(aiDivinerMsgs))aiDivinerMsgs=[];"""
new_read2 = """  aiDivinerMsgs=ls('ml2_ai_diviner_msgs')||[];
  if(!Array.isArray(aiDivinerMsgs))aiDivinerMsgs=[];
  if(!aiDivinerMsgs.length&&window.localforage){
    window.localforage.getItem('ml2_ai_diviner_msgs').then(function(v){
      if(v&&Array.isArray(v)&&v.length){aiDivinerMsgs=v;try{ls('ml2_ai_diviner_msgs',aiDivinerMsgs);}catch(e){}if(typeof renderAiDivinerMsgs==='function')renderAiDivinerMsgs();}
    }).catch(function(){});
  }"""
n2 = s.count(old_read2)
s = s.replace(old_read2, new_read2)
print('占卜师异步补读:', n2)

open(p, 'w', encoding='utf-8', newline='').write(s)
