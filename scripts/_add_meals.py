# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

MEALS_JS = r'''
// ==================== 一日三餐记录 ====================
var MEAL_SLOTS=[
  {key:'breakfast',name:'早餐',icon:'☀️',start:420,end:600},
  {key:'lunch',name:'午餐',icon:'🍚',start:660,end:840},
  {key:'dinner',name:'晚餐',icon:'🌙',start:1020,end:1260}
];
function mealDateStr(d){var x=d||new Date();function p(n){return ('0'+n).slice(-2);}return x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate());}
function mealTimeStr(d){var x=d||new Date();return ('0'+x.getHours()).slice(-2)+':'+('0'+x.getMinutes()).slice(-2);}
function mealsStore(){return ls('ml2_meals')||{};}
function mealsTodayRecs(){return mealsStore()[mealDateStr()]||{};}
function openMealsPanel(){
  if(!cid){toast('请先进入聊天');return;}
  showOv('ov-meals');
  renderMealsPanel();
}
function renderMealsPanel(){
  var day=mealsTodayRecs(),cnt=0;
  var html='<div style="padding:16px 14px 6px;display:flex;align-items:baseline;justify-content:space-between;"><div style="font-size:18px;font-weight:700;color:#5C4A3D;">🍽 一日三餐记录</div><div style="font-size:13px;color:#9A8878;">'+mealDateStr()+'</div></div>';
  MEAL_SLOTS.forEach(function(sl){
    var rec=day[sl.key],status='未记录',detail='还没有记录',tagBg='#F3E6D5',tagColor='#9A8878';
    if(rec&&rec.status==='recorded'){status='已记录';tagBg='#E8C8A9';tagColor='#8a5a33';detail=(rec.time||'')+(rec.content?' · '+rec.content:'');cnt++;}
    else if(rec&&rec.status==='eaten'){status='已吃';tagColor='#B96F58';detail=(rec.time||'已吃')+(rec.content?' · '+rec.content:'');}
    else if(rec&&rec.status==='skipped'){status='没吃';detail='这一餐没有吃';}
    html+='<div style="margin:8px 14px;padding:14px;background:#FFFDF8;border-radius:14px;box-shadow:0 1px 6px rgba(90,74,61,0.07);border:1px solid #EFE4D5;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;">'
      +'<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">'+sl.icon+'</span><span style="font-size:15px;font-weight:700;color:#5C4A3D;">'+sl.name+'</span></div>'
      +'<span style="font-size:11px;padding:3px 10px;border-radius:10px;background:'+tagBg+';color:'+tagColor+';font-weight:600;">'+status+'</span></div>'
      +'<div style="margin-top:8px;font-size:13px;color:#9A8878;line-height:1.6;">'+detail+'</div>'
      +'<div style="display:flex;gap:8px;margin-top:12px;">'
      +'<button onclick="openMealEdit(\''+sl.key+'\')" style="flex:1;padding:10px 0;border:none;border-radius:10px;background:#C98F62;color:#FFFDF8;font-size:13px;font-weight:600;cursor:pointer;">'+(rec?'修改这一餐':'＋ 记录这一餐')+'</button>'
      +'<button onclick="mealQuickEat(\''+sl.key+'\')" style="flex:1;padding:10px 0;border:1px solid #E8C8A9;border-radius:10px;background:#FFFDF8;color:#B96F58;font-size:13px;font-weight:600;cursor:pointer;">✓ 已吃</button>'
      +'</div></div>';
  });
  html+='<div style="margin:8px 14px 14px;padding:12px 14px;background:#F3E6D5;border-radius:12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;color:#5C4A3D;">今日已记录：<b style="color:#B96F58;">'+cnt+'</b> / 3</span><button onclick="openMealHistory()" style="padding:7px 14px;border:none;border-radius:10px;background:#FFFDF8;color:#C98F62;font-size:12px;font-weight:600;cursor:pointer;">历史记录</button></div>';
  $('ov-meals-content').innerHTML=html;
}
function mealQuickEat(key){
  var st=mealsStore(),d=mealDateStr();
  if(!st[d])st[d]={};
  st[d][key]={status:'eaten',time:mealTimeStr(),ts:Date.now()};
  ls('ml2_meals',st);
  var sl=MEAL_SLOTS.filter(function(s){return s.key===key;})[0];
  toast(sl.name+'已记录（已吃）');
  renderMealsPanel();
}
var _mealEditKey='lunch';
function openMealEdit(key){
  _mealEditKey=key;
  var day=mealsTodayRecs(),rec=day[key]||{};
  var sl=MEAL_SLOTS.filter(function(s){return s.key===key;})[0];
  var html='<div style="padding:14px 16px 4px;font-size:16px;font-weight:700;color:#5C4A3D;">'+sl.icon+' '+sl.name+'记录</div>';
  html+='<div style="padding:12px 16px 0;">'
    +'<div style="margin-bottom:10px;"><div style="font-size:12px;color:#9A8878;margin-bottom:5px;">时间</div><input id="meal-edit-time" type="time" value="'+(rec.time||mealTimeStr())+'" style="width:100%;padding:9px;border:1px solid #E8DDD0;border-radius:9px;font-size:14px;color:#5C4A3D;background:#FFFDF8;box-sizing:border-box;"></div>'
    +'<div style="margin-bottom:10px;"><div style="font-size:12px;color:#9A8878;margin-bottom:5px;">吃了什么</div><input id="meal-edit-content" placeholder="如：番茄鸡蛋面" value="'+(rec.content||'')+'" style="width:100%;padding:9px;border:1px solid #E8DDD0;border-radius:9px;font-size:14px;color:#5C4A3D;background:#FFFDF8;box-sizing:border-box;"></div>'
    +'<div style="margin-bottom:10px;"><div style="font-size:12px;color:#9A8878;margin-bottom:5px;">备注</div><input id="meal-edit-note" placeholder="选填" value="'+(rec.note||'')+'" style="width:100%;padding:9px;border:1px solid #E8DDD0;border-radius:9px;font-size:14px;color:#5C4A3D;background:#FFFDF8;box-sizing:border-box;"></div>'
    +'<div style="margin-bottom:14px;"><div style="font-size:12px;color:#9A8878;margin-bottom:5px;">心情</div><select id="meal-edit-mood" style="width:100%;padding:9px;border:1px solid #E8DDD0;border-radius:9px;font-size:14px;color:#5C4A3D;background:#FFFDF8;">'
    +['平静','开心','难过','疲惫','烦躁','其他'].map(function(x){return '<option'+(rec.mood===x?' selected':'')+'>'+x+'</option>';}).join('')
    +'</select></div></div>'
    +'<div style="padding:0 16px 14px;display:flex;gap:8px;">'
    +'<button onclick="mealSave(\'recorded\')" style="flex:1;padding:11px 0;border:none;border-radius:10px;background:#C98F62;color:#FFFDF8;font-size:14px;font-weight:600;cursor:pointer;">保存记录</button>'
    +'<button onclick="mealSave(\'skipped\')" style="flex:1;padding:11px 0;border:1px solid #E8C8A9;border-radius:10px;background:#FFFDF8;color:#9A8878;font-size:14px;font-weight:600;cursor:pointer;">这餐没吃</button>'
    +'</div>'
    +'<div style="padding:0 16px 12px;display:flex;justify-content:center;"><button onclick="mealDelete()" style="padding:6px 16px;border:none;background:transparent;color:#c0785f;font-size:12px;cursor:pointer;">删除这条记录</button></div>';
  $('ov-meal-edit-content').innerHTML=html;
  showOv('ov-meal-edit');
}
function mealSave(status){
  var st=mealsStore(),d=mealDateStr();
  if(!st[d])st[d]={};
  st[d][_mealEditKey]={status:status,time:$('meal-edit-time').value||mealTimeStr(),content:$('meal-edit-content').value.trim(),note:$('meal-edit-note').value.trim(),mood:$('meal-edit-mood').value,ts:Date.now()};
  ls('ml2_meals',st);
  hideOv('ov-meal-edit');
  toast(status==='recorded'?'已记录这一餐':'已标记没吃');
  renderMealsPanel();
}
function mealDelete(){
  var st=mealsStore(),d=mealDateStr();
  if(st[d])delete st[d][_mealEditKey];
  ls('ml2_meals',st);
  hideOv('ov-meal-edit');
  toast('已删除');
  renderMealsPanel();
}
function openMealHistory(){
  var st=mealsStore();
  var dates=Object.keys(st).sort().reverse();
  var html='<div style="padding:16px 14px 6px;display:flex;align-items:center;gap:8px;"><button onclick="renderMealsPanel()" style="border:none;background:none;font-size:16px;color:#C98F62;cursor:pointer;">←</button><div style="font-size:18px;font-weight:700;color:#5C4A3D;">📖 历史记录</div></div>';
  if(!dates.length)html+='<div style="padding:30px;text-align:center;color:#9A8878;font-size:13px;">还没有记录</div>';
  dates.forEach(function(d){
    var day=st[d];
    html+='<div style="margin:8px 14px;padding:12px 14px;background:#FFFDF8;border-radius:12px;border:1px solid #EFE4D5;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="font-size:14px;font-weight:600;color:#5C4A3D;">'+d+'</span><span style="font-size:12px;color:#B96F58;font-weight:600;">'+(MEAL_SLOTS.filter(function(s){return day[s.key]&&day[s.key].status==='recorded';}).length)+' / 3</span></div>';
    MEAL_SLOTS.forEach(function(sl){
      var r=day[sl.key];
      var txt='○ 未记录';
      if(r&&r.status==='recorded'){txt=sl.icon+' '+sl.name+' · '+(r.time||'')+(r.content?' '+r.content:'');}
      else if(r&&r.status==='eaten'){txt=sl.icon+' '+sl.name+' · 已吃';}
      else if(r&&r.status==='skipped'){txt=sl.icon+' '+sl.name+' · 没吃';}
      html+='<div style="font-size:12px;color:#9A8878;line-height:2;">'+txt+'</div>';
    });
    html+='</div>';
  });
  $('ov-meals-content').innerHTML=html;
}
// ============ 梦角吃饭提醒 ============
var MEAL_REMIND_MSGS=['到饭点了，记得吃东西。','先去吃点东西吧，别饿着。','到饭点了。别告诉我你又忘了。','去吃饭吧，我等你回来。','该吃饭啦，好好照顾自己。','饭点到了，记得按时吃饭哦。','又在忙吧？先吃饭。','记得吃饭，我不许你饿着。'];
function mealRemindEnabled(){var s=ls('ml2_settings')||{};return s.mealRemind!==false;}
function mealRemindTick(){
  try{
    if(!mealRemindEnabled())return;
    var today=mealDateStr();
    var st=ls('ml2_meal_remind')||{};
    if(st.date!==today){st={date:today,count:0,reminded:{},who:{}};ls('ml2_meal_remind',st);}
    if(st.count>=2)return;
    var now=new Date(),t=now.getHours()*60+now.getMinutes();
    var day=mealsTodayRecs();
    MEAL_SLOTS.forEach(function(sl){
      if(st.reminded[sl.key])return;
      if(day[sl.key])return;
      if(t<sl.start||t>=sl.end)return;
      st.reminded[sl.key]=true;
      var prob=30-(st.count>0?5:0);if(prob<20)prob=20;
      if(Math.random()*100<prob){
        st.count++;
        var contactId=mealPickContact(st);
        if(contactId){
          st.who[sl.key]=contactId;
          ls('ml2_meal_remind',st);
          triggerMealRemind(sl.key,contactId);
          return;
        }
      }
      ls('ml2_meal_remind',st);
    });
  }catch(e){}
}
function mealPickContact(st){
  var cs=contacts||[];
  var used={};
  for(var k in st.who)used[st.who[k]]=true;
  var pool=cs.filter(function(c){return c.id!==SELF&&!used[c.id]&&c.type!=='group';});
  if(!pool.length)pool=cs.filter(function(c){return c.id!==SELF&&c.type!=='group';});
  if(!pool.length)return '';
  return pool[Math.floor(Math.random()*pool.length)].id;
}
function triggerMealRemind(slotKey,contactId){
  var c=contacts.find(function(x){return x.id===contactId;});
  var name=c?c.name:'梦角';
  var text=MEAL_REMIND_MSGS[Math.floor(Math.random()*MEAL_REMIND_MSGS.length)];
  var sl=MEAL_SLOTS.filter(function(s){return s.key===slotKey;})[0];
  var html='<div style="padding:16px 16px 6px;display:flex;align-items:center;gap:10px;">'
    +'<div style="width:40px;height:40px;border-radius:50%;background:#E8C8A9;display:flex;align-items:center;justify-content:center;font-size:18px;color:#8a5a33;">'+(c&&c.avatar?c.avatar:'💫')+'</div>'
    +'<div><div style="font-size:15px;font-weight:700;color:#5C4A3D;">'+name+'</div><div style="font-size:11px;color:#9A8878;">'+sl.name+'时间到</div></div></div>'
    +'<div style="padding:8px 16px;font-size:14px;color:#5C4A3D;line-height:1.8;">'+text+'</div>'
    +'<div style="padding:12px 16px 16px;display:flex;gap:8px;">'
    +'<button onclick="mealRemindGo(\''+slotKey+'\',\''+contactId+'\')" style="flex:1;padding:11px 0;border:none;border-radius:10px;background:#C98F62;color:#FFFDF8;font-size:14px;font-weight:600;cursor:pointer;">去记录</button>'
    +'<button onclick="hideOv(\'ov-meal-remind\')" style="flex:1;padding:11px 0;border:1px solid #E8C8A9;border-radius:10px;background:#FFFDF8;color:#9A8878;font-size:14px;font-weight:600;cursor:pointer;">稍后</button>'
    +'</div>';
  $('ov-meal-remind-content').innerHTML=html;
  showOv('ov-meal-remind');
  mealPushMsg(contactId,name+'：'+text);
}
function mealRemindGo(slotKey,contactId){
  hideOv('ov-meal-remind');
  openMealEdit(slotKey);
}
function mealPushMsg(contactId,text){
  try{
    var arr=msgs(contactId)||[];
    arr.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:contactId,t:text,ts:Date.now(),ty:'t'});
    savemsgs(contactId,arr);
  }catch(e){}
}
try{setInterval(mealRemindTick,60000);mealRemindTick();}catch(e){}
'''

# ---- Part A: 23_pomodoro_icons.js ----
p1 = 'app/src/23_pomodoro_icons.js'
s1 = open(p1, encoding='utf-8').read()
# 1) chatbarItems 加项
old = "{id:'ai_diviner',name:'AI占卜师',icon:'🔮',fixed:false,category:'更多'},"
new = old + "\n  {id:'meals',name:'一日三餐',icon:'🍽️',fixed:false,category:'更多'},"
n1 = s1.count(old)
s1 = s1.replace(old, new, 1)
# 2) 默认列表 + _newIds
n2 = s1.count("'ai_card_records','ai_chat'")
s1 = s1.replace("'ai_card_records','ai_chat'", "'ai_card_records','ai_chat','meals'")
# 3) case
old3 = """      case 'ai_card_records':
        if(typeof openAiCardRecords==='function')openAiCardRecords();
        break;"""
new3 = old3 + """
      case 'meals':
        if(typeof openMealsPanel==='function')openMealsPanel();
        break;"""
n3 = s1.count(old3)
s1 = s1.replace(old3, new3, 1)
# 4) 文件尾追加三餐 JS
s1 = s1.rstrip() + '\n' + MEALS_JS
open(p1, 'w', encoding='utf-8', newline='').write(s1)
print('chatbarItems:', n1, '| 默认列表:', n2, '| case:', n3)

# ---- Part B: 06_body_skeleton.html 弹窗 ----
p2 = 'app/src/06_body_skeleton.html'
s2 = open(p2, encoding='utf-8').read()
ov = '''
<!-- 一日三餐记录 -->
<div class="overlay" id="ov-meals" style="align-items:center;justify-content:center;">
  <div class="modal" style="width:100%;max-width:420px;height:100%;max-height:100vh;border-radius:0;background:#F7F1E8;">
    <div class="modal-head" style="background:#F7F1E8;padding:10px 14px;"><div style="flex:1;"></div><button class="btn-close" onclick="hideOv('ov-meals')">✕</button></div>
    <div class="sb" id="ov-meals-content" style="max-height:calc(100vh - 46px);overflow-y:auto;background:#F7F1E8;"></div>
  </div>
</div>
<div class="overlay" id="ov-meal-edit" style="align-items:center;justify-content:center;">
  <div class="modal" style="width:90%;max-width:380px;background:#F7F1E8;border-radius:16px;">
    <div class="modal-head" style="background:#F7F1E8;border-radius:16px 16px 0 0;padding:10px 14px;"><div style="flex:1;"></div><button class="btn-close" onclick="hideOv('ov-meal-edit')">✕</button></div>
    <div class="sb" id="ov-meal-edit-content" style="max-height:70vh;overflow-y:auto;background:#F7F1E8;"></div>
  </div>
</div>
<div class="overlay" id="ov-meal-remind" style="align-items:center;justify-content:center;">
  <div class="modal" style="width:86%;max-width:340px;background:#FFF7ED;border-radius:16px;border:1px solid #EFE0CE;box-shadow:0 8px 30px rgba(90,74,61,0.18);">
    <div id="ov-meal-remind-content"></div>
  </div>
</div>
'''
anchor2 = '\n</div><!-- .phone -->'
n4 = s2.count(anchor2)
s2 = s2.replace(anchor2, ov + anchor2, 1)
open(p2, 'w', encoding='utf-8', newline='').write(s2)
print('弹窗插入:', n4)
