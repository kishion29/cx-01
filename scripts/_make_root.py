# -*- coding: utf-8 -*-
import os, shutil, sys, hashlib
sys.stdout.reconfigure(encoding='utf-8')
src = 'app'
dst = r'C:\Users\Administrator\Desktop\star-root'
if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)
for item in os.listdir(src):
    s = os.path.join(src, item)
    d = os.path.join(dst, item)
    shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)
for d in ['scripts', 'docs']:
    shutil.copytree(d, os.path.join(dst, d))
for f in ['AGENTS.md', 'README.md', '.gitignore', 'LICENSE']:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(dst, f))
def md5(p):
    return hashlib.md5(open(p, 'rb').read()).hexdigest()
m1 = md5('app/index.html')
m2 = md5(os.path.join(dst, 'index.html'))
print('index md5 一致:', m1 == m2)
print('md5:', m1[:12])
# 关键修复验证
bt = open(os.path.join(dst, 'index.html'), encoding='utf-8', errors='replace').read()
print('收纳按钮在消息工具最前:', "categories['消息工具']=_drawerItems.concat" in bt)
print('聊天互动分类:', "category:'聊天互动'" in bt)
print('导出进度标题:', "showImportProgress('导出数据中...')" in bt)
