# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
s = open('app/index.html', encoding='utf-8', errors='replace').read()
# 所有含 z-index 的 overlay 相关规则
for m in re.finditer(r'[^{}]*overlay[^{}]*\{[^}]*z-index[^}]*\}', s):
    print('规则:', m.group(0)[:150])
# 通用 z-index 层级
for m in re.finditer(r'z-index:\s*(\d+)', s[:100000]):
    pass
# AI 页面 z-index 9997 相关
i = s.find("z-index:9997")
print('AI 页面 z-index 9997 @', i)
# overlay 一般 z-index（搜 .overlay 附近）
for m in re.finditer(r'\.overlay[^{,]*\{[^}]*\}', s):
    txt = m.group(0)
    if 'z-index' in txt or 'position' in txt:
        print('overlay 规则:', txt[:160])
