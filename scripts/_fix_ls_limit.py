# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/09_storage.js'
s = open(p, encoding='utf-8').read()
old = "      if(serialized.length < 50000){"
new = "      if(serialized.length < 600000){"
n = s.count(old)
s = s.replace(old, new, 1)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('阈值 50KB→600KB:', n)
