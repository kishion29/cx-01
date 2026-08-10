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

# 1) 撤回概率默认 5 → 25
p = 'app/src/17_upload_speed_toast.js'
old = "'rc-prob':{key:'rc_prob',default:5,min:0,max:100,step:1,val:'rc-prob-val'},"
new = "'rc-prob':{key:'rc_prob',default:25,min:0,max:100,step:1,val:'rc-prob-val'},"
patch(p, old, new, 'P1 默认25%')

# 2) 数据迁移默认 5 → 25
p = 'app/src/26_avatar_lib_rest.js'
old = "rc_prob"
s = open(p, encoding='utf-8').read()
import re
for m in re.finditer(r'rc_prob', s):
    seg = s[max(0,m.start()-40):m.start()+60]
    if '5' in seg:
        print('26 迁移处:', seg.replace('\n',' ')[:110])
        break
# 直接找缺省赋值 5 的地方
for m in re.finditer(r'rc_prob[^,}]*[:=]\s*5', s):
    print('26 默认5 @', m.start(), ':', s[max(0,m.start()-50):m.start()+50].replace('\n',' '))
