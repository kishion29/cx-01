# -*- coding: utf-8 -*-
"""
构建：按文件名顺序拼接 app/src/ 下的片段，生成 app/index.html。
用法: python scripts/build.py
说明：每次构建会自动把开屏「最新版本部署时间」更新为当前时间（写回 06_body_skeleton.html）。
"""
import os, sys, re, datetime

SRC_DIR = os.path.join('app', 'src')
OUT = os.path.join('app', 'index.html')
# 开屏部署时间所在片段 + 匹配正则（如：最新版本部署时间<br>2026-08-13 13:47）
DEPLOY_TIME_FILE = '06_body_skeleton.html'
DEPLOY_TIME_RE = re.compile(r'(最新版本部署时间<br>)\d{4}-\d{2}-\d{2} \d{2}:\d{2}')

def update_deploy_time():
    """把开屏「最新版本部署时间」自动更新为构建时刻的当前时间。返回新时间戳；找不到则 None。"""
    p = os.path.join(SRC_DIR, DEPLOY_TIME_FILE)
    if not os.path.isfile(p):
        return None
    with open(p, 'r', encoding='utf-8', newline='') as f:
        c = f.read()
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    nc, n = DEPLOY_TIME_RE.subn(lambda m: m.group(1) + ts, c)
    if n == 0:
        return None
    if nc != c:  # 时间有变化才写回，避免每次构建都改文件 mtime
        with open(p, 'w', encoding='utf-8', newline='') as f:
            f.write(nc)
    return ts

def main():
    ts = update_deploy_time()
    if ts:
        print(f'已更新开屏部署时间 → {ts}')
    else:
        print('⚠ 未找到开屏部署时间占位，跳过自动更新')
    parts = []
    for name in sorted(os.listdir(SRC_DIR)):
        p = os.path.join(SRC_DIR, name)
        if os.path.isfile(p):
            with open(p, 'r', encoding='utf-8', newline='') as f:
                content = f.read().lstrip('\ufeff')
                parts.append(content)
    content = ''.join(parts)
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print(f'已生成 {OUT}: {len(content.splitlines())} 行, {len(content)} 字符')
    print(f'片段数: {len(parts)}')

    # 若存在拆前备份，做一致性校验
    bk = os.path.join('backup', 'index_拆前备份.html')
    if os.path.isfile(bk):
        with open(bk, 'r', encoding='utf-8', newline='') as f:
            orig = f.read()
        if orig == content:
            print('✓ 与备份 index_拆前备份.html 逐字节一致')
        else:
            print('✗ 与备份不一致！请检查 src/ 片段是否被修改')
            for i, (a, b) in enumerate(zip(orig, content)):
                if a != b:
                    print(f'首个差异位置: 字符 #{i}')
                    print('备份:', repr(orig[max(0,i-60):i+60]))
                    print('生成:', repr(content[max(0,i-60):i+60]))
                    sys.exit(1)
                    break

if __name__ == '__main__':
    main()
