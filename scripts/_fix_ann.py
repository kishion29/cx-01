# -*- coding: utf-8 -*-
import sys, subprocess, os, shutil, hashlib
sys.stdout.reconfigure(encoding='utf-8')

p = 'app/src/06_body_skeleton.html'
t = open(p, encoding='utf-8').read()
old = """<div style="text-align:center;font-size:11px;color:#8c7b6b;line-height:1.9;letter-spacing:0.5px;margin-top:16px;padding:10px 14px;background:rgba(255,255,255,0.55);border-radius:10px;border:1px solid rgba(0,0,0,0.04);">
        星言字卡传讯本身为完整独立功能，添加字卡即可使用，无需接入 AI。AI 为附带功能，可在设置的 api 接口中按需接入（可选）。不接入 AI 也能正常使用全部核心功能。<br>
        内容参考：AI 生成的所有内容仅供参考，不代表任何事实，请理性看待。
      </div>"""
new = """<div style="text-align:center;font-size:11px;color:#7a6a58;line-height:1.9;letter-spacing:0.5px;margin-top:16px;padding:12px 14px;background:rgba(255,255,255,0.7);border-radius:10px;border:1px solid rgba(201,169,110,0.35);box-shadow:0 1px 6px rgba(0,0,0,0.04);">
        ⓘ 星言字卡传讯本身为完整独立功能，添加字卡即可使用，无需接入 AI。AI 为附带功能，可在设置的 api 接口中按需接入（可选）。不接入 AI 也能正常使用全部核心功能。<br>
        内容参考：AI 生成的所有内容仅供参考，不代表任何事实，请理性看待。
      </div>"""
n = t.count(old)
assert n == 1, '概念页小字 %d' % n
t = t.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(t)
print('概念页小字已强化（ⓘ + 金色边框）')

# 构建 + 备份
r = subprocess.run([sys.executable, 'scripts/build.py'], capture_output=True, text=True, encoding='utf-8')
print(r.stdout.strip().splitlines()[-1] if r.stdout else r.stderr[:200])
shutil.copy2('app/index.html', 'backup/index_拆前备份.html')
print('md5:', hashlib.md5(open('app/index.html', 'rb').read()).hexdigest()[:12])

# 打包 star-root
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
m1 = hashlib.md5(open('app/index.html', 'rb').read()).hexdigest()
m2 = hashlib.md5(open(os.path.join(dst, 'index.html'), 'rb').read()).hexdigest()
print('star-root md5 一致:', m1 == m2, m1[:12])
