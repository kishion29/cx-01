# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))

def make_icon(size, out_path):
    bg = (248, 246, 243, 255)      # #f8f6f3
    fg = (201, 169, 110, 255)      # #c9a96e
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 圆角矩形背景
    radius = int(size * 0.22)
    d.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=bg)
    # 星言符号 ✦ U+2726
    symbol = "\u2726"
    font_size = int(size * 0.57)
    font = None
    candidates = [
        "C:/Windows/Fonts/seguisym.ttf",
        "C:/Windows/Fonts/seguiui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/msyh.ttc",
    ]
    for fp in candidates:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()
    # 测量并居中
    try:
        bbox = d.textbbox((0, 0), symbol, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        tx = (size - w) / 2 - bbox[0]
        ty = (size - h) / 2 - bbox[1] - int(size * 0.02)
    except Exception:
        tx = size * 0.25
        ty = size * 0.2
    d.text((tx, ty), symbol, font=font, fill=fg)
    img.save(out_path, "PNG")
    print("saved:", out_path)

make_icon(192, os.path.join(BASE, "icon-192.png"))
make_icon(512, os.path.join(BASE, "icon-512.png"))
make_icon(180, os.path.join(BASE, "apple-touch-icon.png"))
print("done")
