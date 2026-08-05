# -*- coding: utf-8 -*-
import os, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')

# 生成"根目录部署版"：把 app/ 内容平铺到打包根，index.html 在最外层
src = 'app'
dst = r'C:\Users\Administrator\Desktop\star-root'

if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)

# 1) app/ 里所有内容平铺到根（index.html、manifest、sw、图标、src/...）
for item in os.listdir(src):
    s = os.path.join(src, item)
    d = os.path.join(dst, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 2) 附加 scripts/docs/说明
for d in ['scripts', 'docs']:
    shutil.copytree(d, os.path.join(dst, d))
for f in ['AGENTS.md', 'README.md', '.gitignore']:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(dst, f))

# 3) 打印结构（前2层）
print('已生成根目录部署版：')
for root, dirs, files in os.walk(dst):
    depth = root.replace(dst, '').count(os.sep)
    if depth <= 1:
        indent = '  ' * depth
        name = os.path.basename(root) or 'star-root'
        print(indent + name + '/')
        for f in sorted(files):
            print(indent + '  ' + f)
        if depth == 0:
            for d in sorted(dirs):
                print(indent + '  ' + d + '/')
