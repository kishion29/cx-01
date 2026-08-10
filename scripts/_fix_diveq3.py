# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/06_body_skeleton.html'
s = open(p, encoding='utf-8').read()

# 1) ov-speed: 按钮后 4 个闭合 → 5 个（补 overlay 闭合）
old1 = 'applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Letter settings -->'
new1 = 'applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n    </div>\n  </div>\n</div>\n</div>\n\n<!-- Overlay: Letter settings -->'
n1 = s.count(old1)
s = s.replace(old1, new1, 1)

# 2) ov-group-speed: 按钮后 5 个闭合 → 4 个（撤销误加）
old2 = 'applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Group speed settings -->'
new2 = 'applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Group speed settings -->'
n2 = s.count(old2)
s = s.replace(old2, new2, 1)
print('ov-speed 补:', n1, '| ov-group-speed 删:', n2)

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
