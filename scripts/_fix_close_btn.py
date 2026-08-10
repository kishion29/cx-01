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

# 1) 删占卜师 × 按钮
rep("+'<div id=\"ai-diviner-close\" style=\"font-size:16px;color:var(--txt2);cursor:pointer;padding:5px 8px;flex-shrink:0;\">✕</div>'",
    "+'<div style=\"width:8px;flex-shrink:0;\"></div>'")
# 2) 删 AI 聊天 × 按钮
rep("+'<div id=\"ai-chat-close\" style=\"font-size:16px;color:var(--txt2);cursor:pointer;padding:5px 8px;flex-shrink:0;\">✕</div>'",
    "+'<div style=\"width:8px;flex-shrink:0;\"></div>'")
# 3) 删对应绑定（防 null.onclick 崩溃）
rep("head.querySelector('#ai-diviner-close').onclick=function(){closeAiDiviner();};",
    "")
rep("  head.querySelector('#ai-chat-close').onclick=function(){closeAiChat();}",
    "")
print('× 按钮删除:', ok)
open(p, 'w', encoding='utf-8', newline='').write(s)
