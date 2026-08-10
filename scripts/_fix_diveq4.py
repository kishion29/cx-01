# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/06_body_skeleton.html'
s = open(p, encoding='utf-8').read()

# 补 ov-group-speed overlay 闭合（在 contact-touch 前）
old = 'onclick="saveGroupSpeedSettings();toast(\\\'设置已保存\\\')">保存设置</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Sound settings -->'
new = 'onclick="saveGroupSpeedSettings();toast(\\\'设置已保存\\\')">保存设置</button>\n      </div>\n    </div>\n  </div>\n</div>\n</div>\n\n<!-- Overlay: Sound settings -->'
n = s.count(old)
s = s.replace(old, new, 1)
print('group-speed 补 overlay 闭合:', n)
open(p, 'w', encoding='utf-8', newline='').write(s)

# 全量检查
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
check_all()
