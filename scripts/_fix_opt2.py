# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/23_pomodoro_icons.js'
s = open(p, encoding='utf-8').read()
old_opt = """var contactOpts='<option value="">不关联（仅 TA 本体）</option>';"""
new_opt = """var contactOpts='<option value="none"'+(aiChatSettings.contactId==='none'?' selected':'')+'>不关联（仅 TA 本体）</option>';"""
n = s.count(old_opt)
assert n == 2, '下拉匹配 %d' % n
s = s.replace(old_opt, new_opt)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('下拉 x%d done' % n)
