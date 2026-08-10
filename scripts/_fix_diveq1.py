# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/06_body_skeleton.html'
s = open(p, encoding='utf-8').read()

def analyze_seg(st, en, label):
    seg = s[st:en]
    stack = []
    for m in re.finditer(r'<(/?)(div|overlay|sheet|modal)([\s>])', seg):
        tag = m.group(2)
        if m.group(1) == '/':
            if stack and stack[-1][0] == tag:
                stack.pop()
            elif stack and stack[-1][0] != tag:
                print(label, '错位闭合', tag, '@', m.start(), '栈顶', stack[-1])
            else:
                print(label, '多余闭合', tag, '@', m.start())
        else:
            stack.append((tag, m.start()))
    print(label, '未闭合:', stack[-3:] if stack else 'OK')

# 修复1: ov-speed 补一个 </div>
old = 'onclick="applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Group speed settings -->'
new = 'onclick="applySpeedToAllContacts()">应用所有联系人</button>\n      </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Overlay: Group speed settings -->'
n1 = s.count(old)
s = s.replace(old, new, 1)
print('ov-speed 补 div:', n1)
open(p, 'w', encoding='utf-8', newline='').write(s)

# 重分析后续
i = s.find('id="ov-speed"')
i2 = s.find('id="ov-group-speed"', i)
j2 = s.find('id="ov-contact-switcher"', i2)
i3 = s.find('id="ov-contact-switcher"')
analyze_seg(i, i2, 'ov-speed')
analyze_seg(i2, j2, 'ov-group-speed')
analyze_seg(i3, min(j2, len(s)), 'ov-contact-switcher(粗)')
