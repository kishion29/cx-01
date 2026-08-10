# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/28_misc.js'
s = open(p, encoding='utf-8').read()
ok = True
def rep(old, new):
    global s, ok
    n = s.count(old)
    if n != 1:
        print('FAIL', n, ':', old[:60]); ok = False
    else:
        s = s.replace(old, new, 1)

# 1) 设置对象
rep("var readBookSettings={fontSize:16,theme:'paper'};",
    "var readBookSettings={fontSize:16,theme:'paper',lineHeight:1.9,margin:16,fontFamily:'default',mode:'page',company:true};")

# 2) 主题 5 种
rep("var readThemes={\n  white:{bg:'#ffffff',color:'#333333'},\n  paper:{bg:'#f7f0e1',color:'#5a4a3a'},\n  green:{bg:'#cfe8cf',color:'#3a5a3a'},\n  night:{bg:'#1e2229',color:'#c8ccd4'}\n};\nvar readThemeNames={white:'白色',paper:'米黄',green:'护眼绿',night:'夜间黑'};",
    "var readThemes={\n  white:{bg:'#FFFFFF',color:'#3a3a3a'},\n  paper:{bg:'#F8F4EC',color:'#4a3f35'},\n  beige:{bg:'#EFE6D5',color:'#5a4a35'},\n  gray:{bg:'#E7E7E5',color:'#333333'},\n  night:{bg:'#202020',color:'#cfcfcf'}\n};\nvar readThemeNames={white:'纯白',paper:'暖白',beige:'米色',gray:'浅灰',night:'深色'};")

# 3) 读取设置
rep("function readLoadSettings(){\n  try{var s=ls('ml2_read_book_settings');if(s){if(s.fontSize)readBookSettings.fontSize=s.fontSize;if(s.theme)readBookSettings.theme=s.theme;}}catch(e){}\n}",
    "function readLoadSettings(){\n  try{var s=ls('ml2_read_book_settings');if(s){if(s.fontSize)readBookSettings.fontSize=s.fontSize;if(s.theme)readBookSettings.theme=s.theme;if(s.lineHeight)readBookSettings.lineHeight=s.lineHeight;if(s.margin!==undefined)readBookSettings.margin=s.margin;if(s.fontFamily)readBookSettings.fontFamily=s.fontFamily;if(s.mode)readBookSettings.mode=s.mode;if(s.company!==undefined)readBookSettings.company=s.company;}}catch(e){}\n}")

# 4) 应用设置
rep("function readApplySettings(){\n  var content=$('read-book-content');\n  if(!content)return;\n  var th=readThemes[readBookSettings.theme]||readThemes.paper;\n  content.style.fontSize=readBookSettings.fontSize+'px';\n  content.style.lineHeight='1.9';\n  content.style.background=th.bg;\n  content.style.color=th.color;\n  content.style.transition='all 0.2s';\n  var tn=$('read-theme-name');\n  if(tn)tn.textContent=readThemeNames[readBookSettings.theme]||'';\n}",
    "function readApplySettings(){\n  var content=$('read-book-content');\n  if(!content)return;\n  var th=readThemes[readBookSettings.theme]||readThemes.paper;\n  content.style.fontSize=readBookSettings.fontSize+'px';\n  content.style.lineHeight=readBookSettings.lineHeight;\n  content.style.background=th.bg;\n  content.style.color=th.color;\n  content.style.padding=readBookSettings.margin+'px';\n  content.style.boxSizing='border-box';\n  var ffs={default:'',serif:'\\'Songti SC\\',\\'SimSun\\',serif',hei:'\\'Heiti SC\\',\\'SimHei\\',sans-serif',kai:'\\'Kaiti SC\\',\\'KaiTi\\',serif',yuan:'\\'Yuanti SC\\',\\'PingFang SC\\',sans-serif'};\n  content.style.fontFamily=ffs[readBookSettings.fontFamily]||'';\n  content.style.transition='background 0.2s,color 0.2s';\n  var tn=$('read-theme-name');\n  if(tn)tn.textContent=readThemeNames[readBookSettings.theme]||'';\n  readRenderCompanyBtn();\n  readUpdateProgressBar();\n}")

# 5) 主题切换 5 keys
rep("function readThemeNext(){\n  var keys=['white','paper','green','night'];",
    "function readThemeNext(){\n  var keys=['white','paper','beige','gray','night'];")

# 6) readOpenBook 恢复进度/章节
rep("function readOpenBook(idx){\n  var b=readBooks[idx];\n  if(!b)return;\n  readBook={name:b.name,content:b.content||'',pages:readSplitPages(b.content||''),page:0,perPage:8};\n  var shelf=$('read-shelf'),bk=$('read-book-area');\n  if(shelf)shelf.style.display='none';\n  if(bk){bk.style.display='block';var tt=$('read-book-title');if(tt)tt.textContent=readBook.name;}\n  readRenderPage();\n}",
    "function readOpenBook(idx){\n  var b=readBooks[idx];\n  if(!b)return;\n  var paras=String(b.content||'').split(/\\n+/).map(function(x){return x.trim();}).filter(Boolean);\n  readBook={id:b.id||('b_'+idx),name:b.name,content:b.content||'',paras:paras,pages:readSplitPages(b.content||''),page:0,perPage:8,chapters:b.chapters||readDetectChapters(paras),scrollToPara:-1};\n  if(b.progress&&b.progress>0&&b.progress<100&&!b.finished){\n    readBook.page=Math.max(0,Math.min(readBook.pages.length-1,Math.round(b.progress/100*(readBook.pages.length-1))));\n  }\n  readLoadSettings();\n  b.lastOpen=Date.now();readShelfSave();\n  var shelf=$('read-shelf'),bk=$('read-book-area');\n  if(shelf)shelf.style.display='none';\n  if(bk){bk.style.display='block';var tt=$('read-book-title');if(tt)tt.textContent=readBook.name;}\n  readRenderPage();\n  if(b.finished)toast('本书已读完，重新从上次位置打开');\n}")

# 7) renderPage 滚动模式 + 进度条
rep("function readRenderPage(){\n  if(!readBook.pages.length)return;\n  readLoadSettings();\n  var content=$('read-book-content');\n  if(content){\n    content.textContent=readBook.pages[readBook.page]||'';\n    content.style.padding='16px';\n    content.style.boxSizing='border-box';\n  }\n  var pg=$('read-book-progress');\n  if(pg)pg.textContent='第 '+(readBook.page+1)+' / '+readBook.pages.length+' 页';\n  readApplySettings();\n}",
    "function readRenderPage(){\n  if(!readBook.pages.length)return;\n  readLoadSettings();\n  var content=$('read-book-content');\n  if(content){\n    if(readBookSettings.mode==='scroll'){\n      content.innerHTML=readBook.pages.map(function(p,i){return '<p data-para=\"'+i+'\" style=\"margin:0 0 1.2em;\">'+String(p).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</p>';}).join('');\n      if(readBook.scrollToPara>=0&&readBook.scrollToPara<readBook.pages.length){\n        var ps=content.querySelectorAll('p');\n        if(ps[readBook.scrollToPara])ps[readBook.scrollToPara].scrollIntoView();\n        readBook.scrollToPara=-1;\n      }\n    }else{\n      content.textContent=readBook.pages[readBook.page]||'';\n    }\n  }\n  var pg=$('read-book-progress');\n  if(pg)pg.textContent=readBookSettings.mode==='scroll'?'滚动阅读（共 '+readBook.pages.length+' 段）':'第 '+(readBook.page+1)+' / '+readBook.pages.length+' 页';\n  readApplySettings();\n}")

# 8) next/prev：已读完 + 进度
rep("function readNextPage(){\n  if(!readBook.pages.length)return;\n  if(readBook.page<readBook.pages.length-1){\n    readBook.page++;\n    readRenderPage();",
    "function readNextPage(){\n  if(!readBook.pages.length)return;\n  if(readBookSettings.mode==='scroll'){var c=$('read-book-content');if(c)c.scrollTop+=c.clientHeight*0.8;return;}\n  if(readBook.page<readBook.pages.length-1){\n    readBook.page++;\n    readRenderPage();\n    if(readBook.page>=readBook.pages.length-1){readMarkFinished();}")

# 9) readBackShelf 保存进度
rep("function readBackShelf(){\n  var shelf=$('read-shelf'),bk=$('read-book-area');\n  if(shelf)shelf.style.display='block';\n  if(bk)bk.style.display='none';\n  readRenderShelf();\n}",
    "function readBackShelf(){\n  readSaveBookProgress();\n  var shelf=$('read-shelf'),bk=$('read-book-area');\n  if(shelf)shelf.style.display='block';\n  if(bk)bk.style.display='none';\n  readRenderShelf();\n}")

# 10) 上传：epub 分支
rep("function readUploadBook(inp){\n  var file=inp&&inp.files&&inp.files[0];\n  if(!file)return;\n  var reader=new FileReader();",
    "function readUploadBook(inp){\n  var file=inp&&inp.files&&inp.files[0];\n  if(!file)return;\n  if(/\\.epub$/i.test(file.name)){readParseEpub(file);return;}\n  var reader=new FileReader();")

# 11) 书架渲染：进度/时间/已读完 + 排序
rep("  readBooks.forEach(function(b,idx){\n    var row=document.createElement('div');\n    row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--c2);border:1px solid var(--border);borde",
    "  readBooks.sort(function(a,c2){return (c2.lastOpen||0)-(a.lastOpen||0);});\n  readBooks.forEach(function(b,idx){\n    var row=document.createElement('div');\n    row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--c2);border:1px solid var(--border);borde")

print('核心替换完成:', ok)
open(p, 'w', encoding='utf-8', newline='').write(s)
