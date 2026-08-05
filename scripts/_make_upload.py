# -*- coding: utf-8 -*-
import os, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')
dst = 'C:/Users/Administrator/Desktop/star-github'
if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)
for d in ['app', 'scripts', 'docs']:
    shutil.copytree(d, os.path.join(dst, d))
for f in ['AGENTS.md', 'README.md', '.gitignore']:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(dst, f))
total = 0
for root, dirs, files in os.walk(dst):
    for f in files:
        total += os.path.getsize(os.path.join(root, f))
print('上传文件夹已生成:', dst)
print('总大小 MB:', round(total/1048576, 1))
print('顶层内容:', sorted(os.listdir(dst)))
