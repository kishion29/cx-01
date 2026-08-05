# -*- coding: utf-8 -*-
import os, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')

src = 'app'
dst = r'C:\Users\Administrator\Desktop\star-root'

if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)

# 1) app/ 内容平铺到根（index.html、manifest、sw、图标、src/...）
for item in os.listdir(src):
    s = os.path.join(src, item)
    d = os.path.join(dst, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 2) 附加 scripts/docs/说明/License
for d in ['scripts', 'docs']:
    shutil.copytree(d, os.path.join(dst, d))
for f in ['AGENTS.md', 'README.md', '.gitignore', 'LICENSE']:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(dst, f))

# 3) 打印根目录内容（只第一层）
print('最新 star-root 已生成，根目录内容：')
for item in sorted(os.listdir(dst)):
    print('  ' + item)
