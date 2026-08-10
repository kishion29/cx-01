# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = 'app/src/28_misc.js'
s = open(p, encoding='utf-8').read()

NEW = r'''
// ==================== 完整阅读器增强 ====================
function readDetectChapters(paras){
  var chs=[];
  for(var i=0;i<paras.length;i++){
    if(/^(第[一二三四五六七八九十百千万0-9]+[章节回卷部篇]|Chapter\s*\d+|第[0-9一二三四五六七八九十百千]+章)/.test(paras[i])){
      chs.push({title:paras[i],paraStart:i});
    }
  }
  return chs;
}
function readShowToc(){
  if(!readBook)return;
  var chs=readBook.chapters||[];
  var ov=$('ov-read-toc');
  if(!ov)return;
  var html='<div class="sh"><h3>📑 目录</h3><button class="btn-close" onclick="hideOv(\'ov-read-toc\')">✕</button></div><div class="sb" style="padding:10px 0;max-height:60vh;overflow-y:auto;">';
  if(!chs.length)html+='<div style="padding:20px 14px;color:var(--txt3);font-size:12px;text-align:center;">本书没有检测到章节</div>';
  chs.forEach(function(c,idx){
    html+='<div onclick="readGotoChapter('+idx+')" style="padding:10px 14px;font-size:13px;color:var(--txt);cursor:pointer;border-bottom:1px solid var(--border);">'+c.title+'</div>';
  });
  html+='</div>';
  ov.innerHTML=html;
  showOv('ov-read-toc');
}
function readGotoChapter(idx){
  var chs=readBook.chapters||[];
  if(!chs[idx])return;
  hideOv('ov-read-toc');
  var pi=Math.min(readBook.pages.length-1,Math.floor(chs[idx].paraStart/readBook.perPage));
  if(readBookSettings.mode==='scroll'){
    readBook.scrollToPara=pi;
    readRenderPage();
  }else{
    readBook.page=pi;
    readRenderPage();
  }
  toast('已跳转：'+chs[idx].title);
}
// 书签
function readAddBookmark(){
  if(!readBook)return;
  var text=(readBook.pages[readBook.page]||'').replace(/\s+/g,' ').slice(0,24);
  var bm=ls('ml2_read_bookmarks')||{};
  if(!bm[readBook.id])bm[readBook.id]=[];
  bm[readBook.id].push({page:readBook.page,mode:readBookSettings.mode,text:text,ts:Date.now()});
  ls('ml2_read_bookmarks',bm);
  toast('已添加书签：'+text+'…');
}
function readShowBookmarks(){
  if(!readBook)return;
  var bm=ls('ml2_read_bookmarks')||{};
  var arr=bm[readBook.id]||[];
  var html='<div class="sh"><h3>🔖 书签</h3><button class="btn-close" onclick="hideOv(\'ov-read-bookmarks\')">✕</button></div><div class="sb" style="padding:10px 0;max-height:55vh;overflow-y:auto;">';
  if(!arr.length)html+='<div style="padding:24px 14px;text-align:center;color:var(--txt3);font-size:13px;">还没有书签<br>阅读时点「🔖 书签」添加</div>';
  arr.slice().reverse().forEach(function(b,i){
    var idx=arr.length-1-i;
    html+='<div onclick="readGotoBookmark('+idx+')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;">'
      +'<div style="font-size:13px;color:var(--txt);">第 '+(b.page+1)+' 段 · '+b.text+'</div>'
      +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+new Date(b.ts).toLocaleString()+'</div></div>';
  });
  html+='</div>';
  $('ov-read-bookmarks').innerHTML=html;
  showOv('ov-read-bookmarks');
}
function readGotoBookmark(idx){
  var bm=ls('ml2_read_bookmarks')||{};
  var arr=bm[readBook.id]||[];
  var b=arr[idx];
  if(!b)return;
  hideOv('ov-read-bookmarks');
  if(b.mode==='scroll'){
    readBookSettings.mode='scroll';readSaveSettings();
    readBook.scrollToPara=b.page;
    readRenderPage();
  }else{
    readBook.page=Math.min(readBook.pages.length-1,b.page);
    readRenderPage();
  }
}
// 设置面板
function readOpenSettings(){
  readLoadSettings();
  var fs=$('rs-fontsize-val');if(fs)fs.textContent=readBookSettings.fontSize+'px';
  var lh=$('rs-lineheight-val');if(lh)lh.textContent=readBookSettings.lineHeight.toFixed(1);
  var mg=$('rs-margin-val');if(mg)mg.textContent=readBookSettings.margin+'px';
  var ff=$('rs-fontfamily');if(ff)ff.value=readBookSettings.fontFamily;
  var mb=$('rs-mode-btn');if(mb)mb.textContent=readBookSettings.mode==='scroll'?'滚动':'分页';
  var th=$('rs-theme-val');if(th)th.textContent=readThemeNames[readBookSettings.theme]||'';
  var cb=$('rs-company-btn');if(cb)cb.textContent=readBookSettings.company===false?'关':'开';
  showOv('ov-read-settings');
}
function readLineHeight(d){
  readBookSettings.lineHeight=Math.min(2.8,Math.max(1.2,Math.round((readBookSettings.lineHeight+d)*10)/10));
  readSaveSettings();readApplySettings();
  var lh=$('rs-lineheight-val');if(lh)lh.textContent=readBookSettings.lineHeight.toFixed(1);
}
function readMargin(d){
  readBookSettings.margin=Math.min(40,Math.max(4,readBookSettings.margin+d));
  readSaveSettings();readApplySettings();
  var mg=$('rs-margin-val');if(mg)mg.textContent=readBookSettings.margin+'px';
}
function readSetFontFamily(v){
  readBookSettings.fontFamily=v;readSaveSettings();readApplySettings();
}
function readToggleMode(){
  readBookSettings.mode=readBookSettings.mode==='scroll'?'page':'scroll';
  readSaveSettings();
  readRenderPage();
  var mb=$('rs-mode-btn');if(mb)mb.textContent=readBookSettings.mode==='scroll'?'滚动':'分页';
  toast(readBookSettings.mode==='scroll'?'已切换为滚动模式':'已切换为分页模式');
}
function readToggleCompany(){
  readBookSettings.company=readBookSettings.company===false?true:false;
  readSaveSettings();
  readRenderCompanyBtn();
  var cb=$('rs-company-btn');if(cb)cb.textContent=readBookSettings.company===false?'关':'开';
  toast(readBookSettings.company===false?'已关闭梦角陪读':'已开启梦角陪读');
}
function readRenderCompanyBtn(){
  var b=$('read-company-btn');
  if(b)b.style.background=readBookSettings.company===false?'#e5e5e5':'var(--c2)';
}
function readJumpProgress(ev){
  if(!readBook||!ev)return;
  var bar=document.getElementById('read-progress-bar');
  if(!bar)return;
  var rect=bar.getBoundingClientRect();
  var ratio=Math.max(0,Math.min(1,(ev.clientX-rect.left)/rect.width));
  if(readBookSettings.mode==='scroll'){
    var c=$('read-book-content');
    if(c)c.scrollTop=ratio*c.scrollHeight;
  }else{
    readBook.page=Math.round(ratio*(readBook.pages.length-1));
    readRenderPage();
  }
  readUpdateProgressBar();
}
function readUpdateProgressBar(){
  var fill=$('read-progress-fill'),dot=$('read-progress-dot');
  if(!fill||!dot||!readBook)return;
  var ratio=0;
  if(readBookSettings.mode==='scroll'){
    var c=$('read-book-content');
    if(c&&c.scrollHeight>c.clientHeight)ratio=c.scrollTop/(c.scrollHeight-c.clientHeight);
  }else{
    ratio=readBook.pages.length?readBook.page/(readBook.pages.length-1):0;
  }
  fill.style.width=(ratio*100)+'%';
  dot.style.left=(ratio*100)+'%';
}
// 进度保存
function readSaveBookProgress(){
  if(!readBook)return;
  var b=readBooks.find(function(x){return x.id===readBook.id;});
  if(!b)return;
  var ratio=0;
  if(readBookSettings.mode==='scroll'){
    var c=$('read-book-content');
    if(c&&c.scrollHeight>c.clientHeight)ratio=c.scrollTop/(c.scrollHeight-c.clientHeight);
  }else{
    ratio=readBook.pages.length?readBook.page/(readBook.pages.length-1):0;
  }
  b.progress=Math.round(ratio*100);
  b.lastOpen=Date.now();
  if(!b.finished&&readBook.page>=readBook.pages.length-1&&readBookSettings.mode!=='scroll')b.finished=true;
  readShelfSave();
}
function readMarkFinished(){
  var b=readBooks.find(function(x){return x.id===readBook.id;});
  if(b&&!b.finished){b.finished=true;readShelfSave();toast('🎉 已读完本书');}
}
// EPUB 解析
async function readParseEpub(file){
  try{
    toast('正在解析 EPUB…');
    var buf=await file.arrayBuffer();
    var z=await zipEntries(buf);
    var dec=new TextDecoder();
    var cont=dec.decode(z['META-INF/container.xml']||new Uint8Array(0));
    var m=cont.match(/full-path="([^"]+)"/);
    if(!m)throw new Error('EPUB 结构错误（缺 container.xml）');
    var opfPath=m[1];
    var opf=dec.decode(z[opfPath]||new Uint8Array(0));
    var xp=new DOMParser().parseFromString(opf,'application/xml');
    var base=opfPath.split('/').slice(0,-1).join('/');
    var items={};
    var mn=xp.querySelectorAll('manifest item');
    for(var i=0;i<mn.length;i++){
      var id=mn[i].getAttribute('id'),href=mn[i].getAttribute('href');
      if(id&&href)items[id]=(base?base+'/':'')+href;
    }
    var order=[];
    var sp=xp.querySelectorAll('spine itemref');
    for(var j=0;j<sp.length;j++){
      var ir=sp[j].getAttribute('idref');
      if(items[ir])order.push(items[ir]);
    }
    if(!order.length)throw new Error('EPUB 没有阅读顺序（spine）');
    var full='',chapters=[],paraCnt=0;
    order.forEach(function(href){
      var key=href.replace(/^\.\//,'');
      var raw=z[key]||z[key.replace(/^.*?\//,'')]||null;
      if(!raw)return;
      var html=dec.decode(raw);
      var div=document.createElement('div');
      div.innerHTML=html;
      var h=div.querySelector('h1,h2,h3,h4,h5');
      var title=h?h.textContent.trim():'第'+(chapters.length+1)+'节';
      var txt=div.textContent.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
      if(!txt)return;
      chapters.push({title:title,paraStart:paraCnt});
      full+=(full?'\n\n':'')+txt;
      paraCnt+=txt.split('\n').length;
    });
    if(!full)throw new Error('EPUB 内容为空');
    var bk={id:'b_'+Date.now().toString(36),name:file.name.replace(/\.epub$/i,''),author:'',cover:'📕',content:full,chapters:chapters,lastOpen:Date.now(),progress:0,finished:false,size:Math.round(file.size/1024)};
    readBooks.unshift(bk);
    readShelfSave();
    toast('已导入：'+bk.name);
    readRenderShelf();
  }catch(e){
    console.error('epub parse error:',e);
    toast('EPUB 解析失败：'+(e.message||'未知错误'));
  }
}
async function zipEntries(buf){
  var u8=new Uint8Array(buf),dv=new DataView(buf);
  var eocd=-1;
  for(var i=u8.length-22;i>=0;i--){
    if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}
  }
  if(eocd<0)throw new Error('不是有效的 ZIP/EPUB');
  var count=dv.getUint16(eocd+10,true);
  var cdOff=dv.getUint32(eocd+16,true);
  var out={},p=cdOff,dec=new TextDecoder();
  for(var n=0;n<count;n++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    var method=dv.getUint16(p+10,true);
    var compSize=dv.getUint32(p+20,true);
    var nameLen=dv.getUint16(p+28,true);
    var extraLen=dv.getUint16(p+30,true);
    var commentLen=dv.getUint16(p+32,true);
    var localOff=dv.getUint32(p+42,true);
    var name=dec.decode(u8.subarray(p+46,p+46+nameLen));
    var lNameLen=dv.getUint16(localOff+26,true);
    var lExtraLen=dv.getUint16(localOff+28,true);
    var dataStart=localOff+30+lNameLen+lExtraLen;
    var comp=u8.subarray(dataStart,dataStart+compSize);
    if(method===0){
      out[name]=comp.slice();
    }else if(method===8){
      try{
        var ds=new DecompressionStream('deflate-raw');
        var st=new Blob([comp]).stream().pipeThrough(ds);
        var ab=await new Response(st).arrayBuffer();
        out[name]=new Uint8Array(ab);
      }catch(e2){
        out[name]=comp.slice();
      }
    }
    p+=46+nameLen+extraLen+commentLen;
  }
  return out;
}
// 陪读：关掉时不触发
function readTriggerTACompat(){}
'''
s = s.rstrip() + '\n' + NEW
open(p, 'w', encoding='utf-8', newline='').write(s)
print('新函数追加完成')
