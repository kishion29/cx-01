# -*- coding: utf-8 -*-
import sys, re, subprocess, tempfile, os
sys.stdout.reconfigure(encoding='utf-8')
s = open('app/index.html', encoding='utf-8', errors='replace').read()
# 语法
pat = re.compile(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>')
f = 0
for i, m in enumerate(pat.finditer(s)):
    c = m.group(1)
    tmp = os.path.join(tempfile.gettempdir(), 'ck_%d_%d.js' % (os.getpid(), i))
    open(tmp, 'w', encoding='utf-8').write(c)
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        f += 1
        print('块', i, ':', r.stderr[:200])
    try:
        os.unlink(tmp)
    except:
        pass
print('语法:', '全部通过' if f == 0 else str(f) + '失败')
for k in ['openMealsPanel', 'mealRemindTick', 'ov-meals', "name:'一日三餐'", "'meals'"]:
    print(k, ':', s.count(k))
# div 配对
s6 = open('app/src/06_body_skeleton.html', encoding='utf-8').read()
print('06 div:', len(re.findall(r'<div[\s>]', s6)), '/', len(re.findall(r'</div>', s6)))
