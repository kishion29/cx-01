# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

# ========== Bug2：19_board_letters.js 清除数据 ==========
p = 'app/src/19_board_letters.js'
s = open(p, encoding='utf-8').read()
old = """['clear-cache-btn',async function(){
      if(window._clearingData)return;
      window._clearingData=true;
      try{
        var confirmed=await customConfirm('确定清除所有数据？包括联系人、聊天记录、信箱、朋友圈等，且无法恢复。');
        if(!confirmed){window._clearingData=false;return;}
        try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
        if(window.localforage){
          await window.localforage.clear().catch(function(){});
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        }else{
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        }
      }catch(e){window._clearingData=false;}
    }],"""
new = """['clear-cache-btn',async function(){
      if(window._clearingData)return;
      window._clearingData=true;
      try{
        var confirmed=await customConfirm('确定清除所有数据？包括联系人、聊天记录、信箱、朋友圈等，且无法恢复。');
        if(!confirmed){window._clearingData=false;return;}
        // ★ v2: deleteDatabase 必须 await 完成，否则 location.reload() 会打断删除，IndexedDB 数据"复活"
        var _delDB=function(n){return new Promise(function(res){
          try{
            if(!window.indexedDB){res();return;}
            var rq=window.indexedDB.deleteDatabase(n);
            rq.onsuccess=function(){res();};
            rq.onerror=function(){res();};
            rq.onblocked=function(){res();};
          }catch(e){res();}
        });};
        await _delDB('Star');
        await _delDB('StarDB');
        if(window.localforage){
          await window.localforage.clear().catch(function(){});
        }
        try{localStorage.clear();}catch(e){}
        try{sessionStorage.clear();}catch(e){}
        location.reload();
      }catch(e){window._clearingData=false;}
    }],"""
n = s.count(old)
assert n == 1, 'clear-cache-btn 匹配 %d' % n
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('清除数据 await 删除 x%d' % n)
