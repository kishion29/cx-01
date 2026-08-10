# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/06_body_skeleton.html'
s = open(p, encoding='utf-8').read()

# 撤销上轮错误 + 正确位置补 overlay 闭合
old = 'onclick="applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Letter settings -->'
new = 'onclick="applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n    </div>\n  </div>\n</div>\n</div>\n\n<!-- Overlay: Letter settings -->'
n = s.count(old)
s = s.replace(old, new, 1)
print('ov-speed overlay 闭合修复:', n)

# 全量 overlay 检查
def check_all():
    bad = []
    i = 0
    while True:
        st = s.find('<div class="overlay"', i)
        if st < 0:
            break
        nxt = s.find('<div class="overlay"', st + 1)
        en = nxt if nxt > 0 else len(s)
        seg = s[st:en]
        o = len(re.findall(r'<div[\s>]', seg))
        c = len(re.findall(r'</div>', seg))
        m = re.search(r'id="([^"]+)"', seg) or re.search(r"id='([^']+)'", seg)
        name = m.group(1) if m else '?'
        if o != c:
            bad.append((name, o, c))
        i = nxt if nxt > 0 else len(s)
    print('不配对 overlay:', bad if bad else '无')

open(p, 'w', encoding='utf-8', newline='').write(s)
check_all()
