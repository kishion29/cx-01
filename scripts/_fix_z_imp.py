# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/26_avatar_lib_rest.js'
s = open(p, encoding='utf-8').read()
old = "  var _bov=document.getElementById('ov-beautify');\n  if(_bov){_bov.style.zIndex='99998';}"
new = "  var _bov=document.getElementById('ov-beautify');\n  if(_bov){try{_bov.style.setProperty('z-index','99998','important');}catch(e){_bov.style.zIndex='99998';}}"
n = s.count(old)
s = s.replace(old, new, 1)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('z-index important:', n)
