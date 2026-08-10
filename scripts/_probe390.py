# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
s = open('app/index.html', encoding='utf-8', errors='replace').read()
# 所有含 z-index 且涉及 overlay/beautify 的规则
for m in re.finditer(r'[^{}]*z-index[^{}]*\{[^}]*\}', s):
    t = m.group(0)[:200].replace('\n', ' ')
    if 'overlay' in t or 'beautify' in t or '99998' in t or '9997' in t:
        print('RULE:', t)
print('---')
# .overlay.show 完整
for m in re.finditer(r'\.overlay(\.show)?[^{]*\{[^}]*\}', s):
    print('OV:', m.group(0)[:200].replace('\n', ' '))
