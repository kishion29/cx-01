# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/06_body_skeleton.html'
s = open(p, encoding='utf-8').read()
print('Sound settings 注释次数:', s.count('<!-- Overlay: Sound settings -->'))
old = '</div>\n\n<!-- Overlay: Sound settings -->'
new = '</div>\n</div>\n\n<!-- Overlay: Sound settings -->'
n = s.count(old)
s = s.replace(old, new, 1)
print('插入闭合:', n)
open(p, 'w', encoding='utf-8', newline='').write(s)
