var INVITE_DEFAULT_REPLIES={
  accept:['好，我答应你。','可以呀。','我陪你。','走吧。','嗯，陪你。'],
  reject:['这次不行。','下次吧。','抱歉。','今天不方便。'],
  noresponse:['TA暂时没有回应。']
};
function showInviteModal(){
  var ov=$('ov-invite');if(!ov){toast('功能未就绪');return;}
  var inp=$('invite-input');
  if(inp)inp.value='';
  var t=document.querySelector('#ov-invite .modal-title');
  if(t)t.textContent='🤝 邀请TA';
  showOv('ov-invite');
  setTimeout(function(){if(inp)inp.focus();},80);
}
function sendInvite(){
  var inp=$('invite-input');
  var content=inp?inp.value.trim():'';
  if(!content){toast('请输入邀请内容');return;}
  if(!cid){toast('请先进入聊天');return;}
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,isInvite:true,inviteContent:content,inviteStatus:'pending',ts:new Date(),read:true};
  m.push(msg);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-invite');
  askInvRecAdd('invite','out',content,'pending');
  toast('已发送邀请');
  setTimeout(function(){resolveInvite(msg.id);},1500+Math.random()*2500);
}
function resolveInvite(msgId){
  if(!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg||msg.inviteStatus!=='pending')return;
  var r=Math.random()*100;
  var result;
  if(r<60)result='accept';
  else if(r<85)result='reject';
  else result='noresponse';
  msg.inviteStatus=result;
  askInvRecUpdate('invite',msg.inviteContent,result);
  var sysText={accept:'TA接受了你的邀请',reject:'TA拒绝了你的邀请',noresponse:'TA暂时没有回应邀请'}[result];
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isSystem:true,t:sysText,ts:new Date(),read:true});
  var useDefault=Math.random()<0.4;
  var text;
  if(useDefault){
    text=INVITE_DEFAULT_REPLIES[result][Math.floor(Math.random()*INVITE_DEFAULT_REPLIES[result].length)];
  }else{
    // ★ 像正常聊天一样，从联系人聊天字卡库（custom 主字卡）抽取回复
    var invContactCards=[];
    try{
      if(typeof getContactCards==='function'){
        var _cc=getContactCards(cid);
        if(_cc&&_cc.length)invContactCards=_cc.filter(function(c){return c&&c.category==='custom'&&c.content});
      }
    }catch(e){}
    if(invContactCards.length){
      text=invContactCards[Math.floor(Math.random()*invContactCards.length)].content;
    }else{
      text=INVITE_DEFAULT_REPLIES[result][Math.floor(Math.random()*INVITE_DEFAULT_REPLIES[result].length)];
    }
  }
  if(result!=='noresponse'){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:text,ts:new Date(),read:true});
  }
  savemsgs(cid,m);
  renderMsgs(m);
  if(typeof renderChatList==='function')renderChatList();
}

// ============ TA的日常（梦角分类）============

// ============ TA的日常（梦角分类，按联系人隔离）============
var TA_DAILY_DEFAULT_LOCS=[{id:'loc_home',name:'家',desc:'',enabled:true},{id:'loc_work',name:'公司',desc:'',enabled:true},{id:'loc_cafe',name:'咖啡店',desc:'',enabled:true},{id:'loc_gym',name:'健身房',desc:'',enabled:true},{id:'loc_lib',name:'图书馆',desc:'',enabled:true}];
var TA_DAILY_DEFAULT_ACTS=[{id:'act_read',name:'看书',desc:'',enabled:true},{id:'act_music',name:'听歌',desc:'',enabled:true},{id:'act_walk',name:'散步',desc:'',enabled:true},{id:'act_think',name:'发呆',desc:'',enabled:true},{id:'act_write',name:'写东西',desc:'',enabled:true}];
function taDailyGet(cid){
  var all=ls('ml2_ta_daily')||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!Array.isArray(d.locations)||!d.locations.length)d.locations=TA_DAILY_DEFAULT_LOCS.slice();
  if(!Array.isArray(d.actions)||!d.actions.length)d.actions=TA_DAILY_DEFAULT_ACTS.slice();
  if(!Array.isArray(d.cards))d.cards=[];
  if(!Array.isArray(d.records))d.records=[];
  return d;
}
function taDailySave(cid,d){
  var all=ls('ml2_ta_daily')||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls('ml2_ta_daily',all);
  if(window.localforage)window.localforage.setItem('ml2_ta_daily',all).catch(function(){});
}
function taDailyNewState(d){
  var locs=d.locations.filter(function(x){return x.enabled!==false});
  var acts=d.actions.filter(function(x){return x.enabled!==false});
  var loc=locs.length?locs[Math.floor(Math.random()*locs.length)]:null;
  var act=acts.length?acts[Math.floor(Math.random()*acts.length)]:null;
  var cardText='';
  var cards=d.cards.filter(function(c){return c.enabled!==false&&c.text});
  if(cards.length&&Math.random()<0.5)cardText=cards[Math.floor(Math.random()*cards.length)].text;
  return {loc:loc?loc.name:'未知地点',act:act?act.name:'发着呆',cardText:cardText,ts:Date.now(),expiresAt:Date.now()+(20*60000+Math.random()*70*60000)};
}
function taDailyAdvance(cid){
  var d=taDailyGet(cid);
  var now=Date.now();
  if(!d.current){
    d.current=taDailyNewState(d);
    d.current.ts=now;
    d.current.expiresAt=now+(20*60000+Math.random()*70*60000);
  }
  var cur=d.current;
  var t=cur.expiresAt||now;
  var loop=0;
  while(t<now&&loop<40){
    d.records.push({ts:cur.ts,time:taDailyFmt(cur.ts),locName:cur.loc,actName:cur.act,cardText:cur.cardText});
    if(d.records.length>60)d.records=d.records.slice(-60);
    if(Math.random()<0.6){
      cur=taDailyNewState(d);
    }else{
      var ext=20*60000+Math.random()*70*60000;
      cur={loc:cur.loc,act:cur.act,cardText:'',ts:t,expiresAt:t+ext};
    }
    t=cur.expiresAt;
    loop++;
  }
  d.current=cur;
  taDailySave(cid,d);
  return d;
}
function taDailyFmt(ts){
  var dd=new Date(ts);
  return ('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2);
}
function showTADaily(){
  if(!cid){toast('请先进入聊天');return;}
  // ★ 弹窗级 CSS 变量：星言日历同款柔和配色
  try{
    var _ovd2=document.getElementById('ov-ta-daily');
    if(_ovd2){
      _ovd2.style.setProperty('--c1','#F8F5FC');
      _ovd2.style.setProperty('--c2','#FFFDF9');
      _ovd2.style.setProperty('--c3','#FFFDF9');
      _ovd2.style.setProperty('--txt','#5a4a3a');
      _ovd2.style.setProperty('--txt2','#8a7a6a');
      _ovd2.style.setProperty('--txt3','#a89a8a');
      _ovd2.style.setProperty('--accent','#A98FC8');
      _ovd2.style.setProperty('--border','rgba(200,182,232,0.28)');
    }
  }catch(e){}
  var d=taDailyAdvance(cid);
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'未知联系人'};
  var titleEl=document.querySelector('#ov-ta-daily .modal-title');
  if(titleEl)titleEl.textContent='🌙 '+contact.name+'的日常';
  var cur=d.current;
  var sinceMs=Date.now()-cur.ts;
  var sinceTxt='';
  if(sinceMs<3600000)sinceTxt=Math.max(1,Math.floor(sinceMs/60000))+'分钟';
  else sinceTxt=Math.floor(sinceMs/3600000)+'小时'+Math.floor(sinceMs%3600000/60000)+'分钟';
  var recs=d.records.slice().reverse();
  var todayStart=new Date();todayStart.setHours(0,0,0,0);
  var html='';
  var dailyStyle=TA_CARD_STYLE.miss; // 整页统一想念紫系（温柔生活感）
  html+='<div style="border-radius:20px;padding:20px 18px;background:'+dailyStyle.cardBg+';border:1px solid rgba(255,255,255,0.5);margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.04);">';
  html+='<div style="font-size:12px;color:#8a7a6a;margin-bottom:4px;">现在 · 查岗</div>';
  html+='<div style="width:36px;height:3px;background:'+dailyStyle.accent+';border-radius:2px;margin-bottom:12px;opacity:0.5;"></div>';
  html+='<div style="font-size:12px;color:#8a7a6a;">📍 地点</div><div style="font-size:22px;font-weight:600;color:#5a4a3a;">'+String(cur.loc).replace(/</g,'&lt;')+'</div>';
  html+='<div style="font-size:12px;color:#8a7a6a;margin-top:10px;">正在</div><div style="font-size:18px;font-weight:600;color:#5a4a3a;">'+String(cur.act).replace(/</g,'&lt;')+'</div>';
  html+='<div style="font-size:12px;color:#8a7a6a;margin-top:10px;">开始时间 '+taDailyFmt(cur.ts)+' · 已持续 '+sinceTxt+'</div>';
  if(cur.cardText)html+='<div style="margin-top:12px;padding:8px 12px;background:rgba(255,255,255,0.6);border-radius:10px;font-size:12px;color:var(--txt2);">TA说：「'+String(cur.cardText).replace(/</g,'&lt;')+'」</div>';
  html+='</div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px;"><div style="font-size:13px;font-weight:600;color:var(--txt);">今日行动轨迹</div><div onclick="showTADailyManage()" style="font-size:12px;color:var(--accent);cursor:pointer;padding:4px 10px;border-radius:8px;background:rgba(200,182,232,0.16);">管理 ›</div></div>';
  var todayRecs=recs.filter(function(r){return r.ts>=todayStart.getTime();});
  if(!todayRecs.length)html+='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px;">今天还没有轨迹记录</div>';
  todayRecs.slice(0,12).forEach(function(r){
    html+='<div style="display:flex;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.85);border-radius:10px;margin-bottom:6px;box-shadow:0 1px 4px rgba(0,0,0,0.03);"><div style="font-size:11px;color:var(--txt3);width:40px;flex-shrink:0;">'+r.time+'</div><div style="font-size:13px;color:var(--txt);flex:1;word-break:break-all;">📍 '+String(r.locName||'').replace(/</g,'&lt;')+' · '+String(r.actName||'').replace(/</g,'&lt;')+(r.cardText?' <span style="color:var(--txt2);">「'+String(r.cardText).replace(/</g,'&lt;')+'」</span>':'')+'</div></div>';
  });
  var body=$('ta-daily-body');
  if(body)body.innerHTML=html;
  showOv('ov-ta-daily');
}
function renderTADailyManage(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taDailyGet(cid);
  var box=$('ta-daily-manage-body');if(!box)return;
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:6px;">当前联系人：'+((contacts.find(function(c){return c.id===cid})||{}).name||'TA')+'（地点/行动/字卡相互独立）</div>';
  var groups=[['locations','📍 地点库','loc'],['actions','🏃 行动库','act'],['cards','💬 日常字卡库（不内置示例，可批量添加）','card']];
  groups.forEach(function(g){
    html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin:14px 0 8px;">'+g[1]+'</div>';
    var arr=g[0]==='locations'?d.locations:(g[0]==='actions'?d.actions:d.cards);
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:6px 0;">暂无</div>';
    arr.forEach(function(item,idx){
      var nameHtml=g[0]==='cards'?String(item.text||''):String(item.name||'');
      var descHtml=g[0]==='cards'?'':(item.desc?('<span style="color:var(--txt3);"> '+String(item.desc)+'</span>'):'');
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><label style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><input type="checkbox" '+(item.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taDailyToggle(\''+g[0]+'\','+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label><div style="flex:1;font-size:13px;color:var(--txt);background:var(--c2);border-radius:8px;padding:8px 10px;word-break:break-all;">'+String(nameHtml).replace(/</g,'&lt;')+descHtml+'</div><button onclick="taDailyDel(\''+g[0]+'\','+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
    });
    html+='<textarea id="ta-daily-new-'+g[0]+'" placeholder="一行一条，支持批量添加&#10;例如：&#10;'+(g[0]==='locations'?'星巴克':'看书')+'&#10;'+(g[0]==='locations'?'图书馆':'散步')+'" style="width:100%;min-height:70px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;box-sizing:border-box;resize:vertical;"></textarea>';
    html+='<button onclick="taDailyAdd(\''+g[0]+'\')" style="width:100%;margin-top:6px;padding:9px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">批量添加</button>';
  });
  box.innerHTML=html;
}
function taDailyAdd(group){
  if(!cid){toast('请先进入聊天');return;}
  var d=taDailyGet(cid);
  var ta=$('ta-daily-new-'+group);
  var v=ta?ta.value:'';if(!v){toast('请输入内容');return;}
  var lines=v.split('\n').map(function(s){return s.trim();}).filter(Boolean);
  var added=0;
  lines.forEach(function(txt){
    if(group==='cards'){
      d.cards.push({id:'card_'+Date.now()+'_'+added,text:txt,enabled:true});
    }else if(group==='locations'){
      d.locations.push({id:'loc_'+Date.now()+'_'+added,name:txt,desc:'',enabled:true});
    }else{
      d.actions.push({id:'act_'+Date.now()+'_'+added,name:txt,desc:'',enabled:true});
    }
    added++;
  });
  taDailySave(cid,d);
  toast('已添加 '+added+' 条');
  renderTADailyManage();
}
function taDailyDel(group,idx){
  if(!cid)return;
  var d=taDailyGet(cid);
  if(group==='locations')d.locations.splice(idx,1);
  else if(group==='actions')d.actions.splice(idx,1);
  else d.cards.splice(idx,1);
  taDailySave(cid,d);
  renderTADailyManage();
}
function taDailyToggle(group,idx){
  if(!cid)return;
  var d=taDailyGet(cid);
  var arr=group==='locations'?d.locations:(group==='actions'?d.actions:d.cards);
  if(arr[idx])arr[idx].enabled=arr[idx].enabled===false;
  taDailySave(cid,d);
}
function showTADailyManage(){
  renderTADailyManage();
  showOv('ov-ta-daily-manage');
}
// 后台推进：页面打开期间每 60 秒检查，状态到期后按概率变化（离线时下次打开补算）
setInterval(function(){
  try{
    if(!cid)return;
    var all=ls('ml2_ta_daily')||{};
    var d=all&&all[cid];
    if(!d||!d.current)return;
    if(Date.now()>=(d.current.expiresAt||0)){
      taDailyAdvance(cid);
    }
  }catch(e){}
},60000);

// ============ 星言存钱罐（更多分类）============
var PIGGY_KEY='ml2_piggy';
function piggyLoad(){
  var d=ls(PIGGY_KEY)||{};
  if(!d||typeof d!=='object')d={};
  if(!Array.isArray(d.pots))d.pots=[];
  return d;
}
function piggySave(d){
  ls(PIGGY_KEY,d);
  if(window.localforage)window.localforage.setItem(PIGGY_KEY,d).catch(function(){});
}
function piggyMoney(n){
  n=Math.round((Number(n)||0)*100)/100;
  var s=String(n);
  if(s.indexOf('.')<0)s+='.00';
  else s=s.replace(/(\.\d)$/,'$10');
  return s;
}
function piggyDaysLeft(d){
  if(!d.targetDate)return null;
  var t=new Date(d.targetDate).getTime();
  var diff=Math.ceil((t-Date.now())/86400000);
  return diff;
}
function piggyPercent(pot){
  var t=Number(pot.target)||0;
  if(t<=0)return 0;
  return Math.min(100,Math.round((Number(pot.current)||0)/t*100));
}
function showPiggyPage(){
  window._piggyReturnPage=currentPage||'pg-more';
  showPg('pg-piggy');
  renderPiggy();
}
function piggyBack(){
  showPg(window._piggyReturnPage||'pg-more');
}
function renderPiggy(){
  var body=$('piggy-body');if(!body)return;
  var d=piggyLoad();
  var html='';
  html+='<div style="border-radius:14px;padding:16px;background:linear-gradient(160deg,rgba(243,228,200,0.5),rgba(255,255,255,0));border:1px solid var(--border);margin-bottom:14px;text-align:center;">';
  html+='<div style="font-size:15px;font-weight:600;color:var(--txt);">✨ 星言存钱罐</div>';
  html+='<div style="font-size:12px;color:var(--txt2);margin-top:6px;line-height:1.7;">把想实现的事情，一点点保存起来。</div>';
  html+='</div>';
  if(!d.pots.length){
    html+='<div style="text-align:center;padding:40px 20px;color:var(--txt3);font-size:13px;line-height:2;">还没有存钱罐<br>为一个小目标开始攒钱吧</div>';
  }
  d.pots.forEach(function(pot){
    var pct=piggyPercent(pot);
    var statusTxt={active:'进行中',done:'已完成',paused:'暂停',giveup:'放弃'}[pot.status]||'进行中';
    var statusColor=pot.status==='done'?'#4e7a54':(pot.status==='paused'||pot.status==='giveup'?'#8a8a8a':'#8a6d3b');
    var left=piggyDaysLeft(pot);
    var startD=new Date(pot.startDate||Date.now());
    var days=Math.max(0,Math.floor((Date.now()-startD.getTime())/86400000));
    html+='<div onclick="showPiggyDetail(\''+pot.id+'\')" style="border-radius:14px;padding:16px;background:var(--c3);border:1px solid var(--border);margin-bottom:12px;cursor:pointer;">';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div style="font-size:15px;font-weight:600;color:var(--txt);">🎁 '+String(pot.name||'').replace(/</g,'&lt;')+'</div><div style="font-size:11px;color:'+statusColor+';background:rgba(0,0,0,0.05);padding:2px 8px;border-radius:8px;">'+statusTxt+'</div></div>';
    html+='<div style="height:8px;background:rgba(0,0,0,0.07);border-radius:4px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#e0c896,#c9a96e);border-radius:4px;"></div></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3);margin-top:6px;"><span>已存 ¥'+piggyMoney(pot.current)+' / ¥'+piggyMoney(pot.target)+'</span><span>完成度 '+pct+'%</span></div>';
    html+='<div style="display:flex;gap:12px;font-size:11px;color:var(--txt2);margin-top:8px;"><span>已坚持 '+days+' 天</span>'+(left!==null?'<span>距离目标 '+(left>0?left+' 天':'已到期')+'</span>':'')+'</div>';
    html+='</div>';
  });
  html+='<button onclick="showPiggyCreate()" style="width:100%;padding:14px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:15px;font-weight:500;cursor:pointer;margin-top:6px;">＋ 新建存钱罐</button>';
  body.innerHTML=html;
}
function showPiggyForm(title,fields,callback){
  window._piggyCb=callback;
  var t=$('piggy-modal-title');if(t)t.textContent=title;
  var fb=$('piggy-modal-fields');if(!fb)return;
  var html='';
  fields.forEach(function(f){
    html+='<div style="font-size:12px;color:var(--txt2);margin-bottom:4px;">'+f.label+(f.required?' <span style="color:#e05a5a;">*</span>':'')+'</div>';
    if(f.type==='textarea'){
      html+='<textarea id="piggy-f-'+f.key+'" placeholder="'+(f.placeholder||'')+'" style="width:100%;min-height:60px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c2);color:var(--txt);font-size:13px;outline:none;box-sizing:border-box;resize:vertical;"></textarea>';
    }else{
      html+='<input id="piggy-f-'+f.key+'" type="'+(f.type||'text')+'" placeholder="'+(f.placeholder||'')+'" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c2);color:var(--txt);font-size:13px;outline:none;box-sizing:border-box;'+(f.type==='number'?'':'')+'">';
    }
    html+='<div style="height:12px;"></div>';
  });
  fb.innerHTML=html;
  showOv('ov-piggy-modal');
}
function submitPiggyForm(){
  if(typeof window._piggyCb!=='function'){hideOv('ov-piggy-modal');return;}
  var vals={};
  var fb=$('piggy-modal-fields');
  fb.querySelectorAll('input,textarea').forEach(function(el){
    vals[el.id.replace('piggy-f-','')]=el.value.trim();
  });
  window._piggyCb(vals);
}
function showPiggyCreate(){
  showPiggyForm('✨ 新建存钱罐',[
    {key:'name',label:'名称',placeholder:'例如：小旅行',required:true},
    {key:'target',label:'目标金额（元）',type:'number',placeholder:'例如：1000',required:true},
    {key:'current',label:'当前金额（元，可选）',type:'number',placeholder:'默认 0'},
    {key:'targetDate',label:'目标日期（可选）',type:'date'},
    {key:'note',label:'备注（可选）',type:'textarea',placeholder:'这个目标的意义…'}
  ],function(v){
    if(!v.name){toast('请输入名称');return;}
    if(!v.target||isNaN(Number(v.target))||Number(v.target)<=0){toast('请输入有效的目标金额');return;}
    var d=piggyLoad();
    d.pots.unshift({id:'piggy_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),name:v.name,target:Number(v.target),current:v.current?Number(v.current):0,targetDate:v.targetDate||'',note:v.note||'',status:'active',startDate:Date.now(),records:[]});
    if(d.pots[0].current>=d.pots[0].target)d.pots[0].status='done';
    piggySave(d);
    hideOv('ov-piggy-modal');
    renderPiggy();
    toast('已创建存钱罐');
  });
}
function showPiggyDetail(id){
  var d=piggyLoad();
  var pot=null;
  for(var i=0;i<d.pots.length;i++){if(d.pots[i].id===id){pot=d.pots[i];break;}}
  if(!pot){toast('存钱罐不存在');return;}
  var body=$('piggy-body');if(!body)return;
  var pct=piggyPercent(pot);
  var statusTxt={active:'进行中',done:'已完成',paused:'暂停',giveup:'放弃'}[pot.status]||'进行中';
  var statusColor=pot.status==='done'?'#4e7a54':(pot.status==='paused'||pot.status==='giveup'?'#8a8a8a':'#8a6d3b');
  var left=piggyDaysLeft(pot);
  var startD=new Date(pot.startDate||Date.now());
  var days=Math.max(0,Math.floor((Date.now()-startD.getTime())/86400000));
  var html='';
  html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;"><button onclick="renderPiggy()" style="border:none;background:none;color:var(--txt2);font-size:14px;cursor:pointer;">← 返回</button></div>';
  html+='<div style="border-radius:16px;padding:22px;background:linear-gradient(160deg,rgba(243,228,200,0.5),rgba(255,255,255,0));border:1px solid var(--border);margin-bottom:14px;text-align:center;">';
  html+='<div style="font-size:14px;color:var(--txt3);letter-spacing:1px;">我正在为</div>';
  html+='<div style="font-size:22px;font-weight:700;color:var(--txt);margin:8px 0;">'+String(pot.name||'').replace(/</g,'&lt;')+'</div>';
  html+='<div style="font-size:12px;color:var(--txt2);">慢慢积累</div>';
  html+='<div style="display:flex;justify-content:center;gap:24px;margin:16px 0 6px;"><div><div style="font-size:20px;font-weight:700;color:var(--txt);">¥'+piggyMoney(pot.current)+'</div><div style="font-size:11px;color:var(--txt3);">当前</div></div><div><div style="font-size:20px;font-weight:700;color:var(--txt2);">¥'+piggyMoney(pot.target)+'</div><div style="font-size:11px;color:var(--txt3);">目标</div></div></div>';
  html+='<div style="height:10px;background:rgba(0,0,0,0.07);border-radius:5px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#e0c896,#c9a96e);border-radius:5px;"></div></div>';
  html+='<div style="font-size:12px;color:var(--txt2);margin-top:10px;">完成度 '+pct+'% · 已坚持 '+days+' 天'+(left!==null?' · 距离目标 '+(left>0?left+' 天':'已到期'):'')+'</div>';
  if(pot.note)html+='<div style="font-size:12px;color:var(--txt2);margin-top:10px;padding:8px 12px;background:rgba(255,255,255,0.6);border-radius:10px;">💭 '+String(pot.note).replace(/</g,'&lt;')+'</div>';
  html+='<div style="font-size:11px;color:'+statusColor+';margin-top:10px;">状态：'+statusTxt+'</div>';
  html+='</div>';
  if(pot.status==='done'){
    html+='<div style="text-align:center;padding:20px;font-size:16px;color:#4e7a54;font-weight:600;">🎉 愿望达成</div>';
  }
  if(pot.status!=='done'&&pot.status!=='giveup'){
    html+='<div style="display:flex;gap:10px;margin-bottom:14px;">';
    html+='<button onclick="showPiggyDeposit(\''+pot.id+'\')" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:14px;cursor:pointer;">存入</button>';
    html+='<button onclick="showPiggyWithdraw(\''+pot.id+'\')" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--c2);color:var(--txt);font-size:14px;cursor:pointer;">取出</button>';
    html+='</div>';
  }
  if(pot.status!=='done'){
    var stBtns=[['active','进行中'],['paused','暂停'],['giveup','放弃']];
    html+='<div style="display:flex;gap:8px;margin-bottom:14px;">';
    stBtns.forEach(function(b){
      var on=pot.status===b[0];
      html+='<button onclick="piggySetStatus(\''+pot.id+'\',\''+b[0]+'\')" style="flex:1;padding:8px 0;border:1px solid '+(on?'var(--accent)':'var(--border)')+';border-radius:10px;background:'+(on?'var(--c3)':'var(--c1)')+';color:'+(on?'var(--accent)':'var(--txt2)')+';font-size:12px;cursor:pointer;">'+b[1]+'</button>';
    });
    html+='</div>';
  }
  // 记录
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin:16px 0 8px;">记录</div>';
  var recs=(pot.records||[]).slice().reverse();
  if(!recs.length)html+='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px;">还没有记录</div>';
  recs.forEach(function(r){
    var dd=new Date(r.ts);
    var dstr=(dd.getMonth()+1)+'月'+dd.getDate()+'日';
    var sign=r.type==='in'?'+':'-';
    var col=r.type==='in'?'#4e7a54':'#c05a4a';
    html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--c3);border-radius:10px;margin-bottom:6px;"><div style="font-size:11px;color:var(--txt3);width:60px;flex-shrink:0;">'+dstr+'</div><div style="font-size:13px;color:'+col+';font-weight:600;flex-shrink:0;">'+sign+'¥'+piggyMoney(r.amount)+'</div><div style="font-size:12px;color:var(--txt2);flex:1;text-align:right;word-break:break-all;">'+(r.note?String(r.note).replace(/</g,'&lt;'):'')+'</div></div>';
  });
  body.innerHTML=html;
}
function showPiggyDeposit(id){
  showPiggyForm('💰 存入',[
    {key:'amount',label:'存入金额（元）',type:'number',placeholder:'例如：50',required:true},
    {key:'note',label:'备注（可选）',placeholder:'例如：今天少买了一杯饮料'}
  ],function(v){
    if(!v.amount||isNaN(Number(v.amount))||Number(v.amount)<=0){toast('请输入有效金额');return;}
    var d=piggyLoad();
    for(var i=0;i<d.pots.length;i++){
      if(d.pots[i].id===id){
        d.pots[i].current=Math.round((Number(d.pots[i].current)+Number(v.amount))*100)/100;
        d.pots[i].records.push({ts:Date.now(),type:'in',amount:Number(v.amount),note:v.note||''});
        if(d.pots[i].current>=d.pots[i].target)d.pots[i].status='done';
        break;
      }
    }
    piggySave(d);
    hideOv('ov-piggy-modal');
    showPiggyDetail(id);
    toast('已存入');
  });
}
function showPiggyWithdraw(id){
  showPiggyForm('🏦 取出',[
    {key:'amount',label:'取出金额（元）',type:'number',placeholder:'例如：100',required:true},
    {key:'note',label:'原因（可选）',placeholder:'例如：购买需要的东西'}
  ],function(v){
    if(!v.amount||isNaN(Number(v.amount))||Number(v.amount)<=0){toast('请输入有效金额');return;}
    var d=piggyLoad();
    for(var i=0;i<d.pots.length;i++){
      if(d.pots[i].id===id){
        var cur=Number(d.pots[i].current);
        var amt=Number(v.amount);
        if(amt>cur){toast('取出金额超过当前余额');return;}
        d.pots[i].current=Math.round((cur-amt)*100)/100;
        d.pots[i].records.push({ts:Date.now(),type:'out',amount:amt,note:v.note||''});
        break;
      }
    }
    piggySave(d);
    hideOv('ov-piggy-modal');
    showPiggyDetail(id);
    toast('已取出');
  });
}
function piggySetStatus(id,status){
  var d=piggyLoad();
  for(var i=0;i<d.pots.length;i++){
    if(d.pots[i].id===id){
      if(status==='active'&&d.pots[i].current>=d.pots[i].target){toast('已达成目标，状态为已完成');return;}
      d.pots[i].status=status;
      break;
    }
  }
  piggySave(d);
  showPiggyDetail(id);
}

// ============ TA的询问（AI分类）============
var TA_ASK_KEY='ml2_ta_ask';
var TA_ASK_DEFAULT_QUESTIONS=[
  {id:'q_d1',text:'你吃饭了吗？',cat:'daily',enabled:true},
  {id:'q_d2',text:'现在在做什么？',cat:'daily',enabled:true},
  {id:'q_d3',text:'今天过得怎么样？',cat:'daily',enabled:true},
  {id:'q_d4',text:'现在在哪里呀？',cat:'daily',enabled:true},
  {id:'q_c1',text:'累不累？',cat:'care',enabled:true},
  {id:'q_c2',text:'心情怎么样？',cat:'care',enabled:true},
  {id:'q_c3',text:'有没有好好休息？',cat:'care',enabled:true},
  {id:'q_i1',text:'想和我聊什么？',cat:'interact',enabled:true},
  {id:'q_i2',text:'现在想做什么？',cat:'interact',enabled:true},
  {id:'q_i3',text:'有没有想我？',cat:'interact',enabled:true}
];
function taAskLoad(cid){
  var all=ls(TA_ASK_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!Array.isArray(d.questions)||!d.questions.length)d.questions=TA_ASK_DEFAULT_QUESTIONS.slice();
  if(!d.settings||typeof d.settings!=='object')d.settings={aiEnabled:false,aiProb:40};
  if(!d.history||typeof d.history!=='object')d.history={};
  return d;
}
function taAskSave(cid,d){
  var all=ls(TA_ASK_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls(TA_ASK_KEY,all);
  if(window.localforage)window.localforage.setItem(TA_ASK_KEY,all).catch(function(){});
}
function taAskPickCustom(d){
  var qs=d.questions.filter(function(q){return q.enabled!==false&&q.text});
  if(!qs.length)return null;
  return qs[Math.floor(Math.random()*qs.length)].text;
}
function taAskDefault(){
  var qs=TA_ASK_DEFAULT_QUESTIONS.filter(function(q){return q.enabled!==false});
  return qs[Math.floor(Math.random()*qs.length)].text;
}
function taAskAiQuestion(callback){
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:'',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'};
  if(!s.enabled||!s.apiKey){callback(null);return;}
  var persona='';
  try{if(typeof getContactPersona==='function')persona=getContactPersona(cid)||'';}catch(e){}
  var genderText='男朋友';
  try{if(typeof getContactGender==='function'&&getContactGender(cid)==='girl')genderText='女朋友';}catch(e){}
  var bg=(s.worldviewMode==='custom'&&s.worldviewCustom)?s.worldviewCustom:'';
  var systemPrompt='你是梦角TA（用户的'+genderText+'），不同联系人是不同的人设。请根据TA的人设，生成一个TA此刻想主动询问用户的问题（一句话，10~30字，口语化，符合TA性格）。只输出问题本身，不要前缀、引号或解释。'+(bg?'\n世界观：'+bg:'')+(persona?'\nTA人设：'+persona:'');
  try{
    fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
      body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:'生成一个TA想问你的问题。'}],max_tokens:60})
    }).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
      var t=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      t=t.replace(/^["“「\s]+|["”」\s]+$/g,'').trim();
      if(t)callback(t);else callback(null);
    }).catch(function(){callback(null);});
  }catch(e){callback(null);}
}
function maybeTriggerTAAsk(){
  try{
    if(!cid)return;
    var d=taAskLoad(cid);
    if(Date.now()-(d.lastAskAt||0)<25*60000)return;
    var settings=d.settings||{aiEnabled:false,aiProb:40};
    // ★ 修复：AI 100% 时视为"每次都触发"，跳过外层随机概率（冷却保留，防刷屏）
    if(Math.random()>0.2&&!(settings.aiEnabled&&(settings.aiProb||0)>=100))return;
    var m=msgs(cid);
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isSystem:true,t:'TA想问你一个问题。',ts:new Date(),read:true});
    function pushAsk(q,source){
      askInvRecAdd('ask','in',q,'pending');
      m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isAskCard:true,askQuestion:q,askStatus:'pending',askSource:source||'custom',ts:new Date(),read:true});
      d.lastAskAt=Date.now();
      taAskSave(cid,d);
      savemsgs(cid,m);
      renderMsgs(m);
    }
    var customQ=taAskPickCustom(d);
    var useCustom=!settings.aiEnabled||Math.random()*100<(100-(settings.aiProb||40));
    if(useCustom){
      pushAsk(customQ||taAskDefault(),'custom');
    }else{
      taAskAiQuestion(function(q){
        if(q)pushAsk(q,'ai');
        else{toast('AI 提问失败，已用默认问题（请检查「设置→API接口」）');pushAsk(customQ||taAskDefault(),'custom');}
      });
    }
  }catch(e){console.warn('maybeTriggerTAAsk error:',e);}
}
setTimeout(function(){maybeTriggerTAAsk();},60000);
setInterval(function(){maybeTriggerTAAsk();},240000);
function openTAAskAnswer(msgId){
  window._taAskMsgId=msgId;
  var ov=$('ov-ta-ask-answer');if(!ov){toast('功能未就绪');return;}
  var inp=$('ta-ask-answer-input');
  if(inp)inp.value='';
  var qEl=$('ta-ask-answer-question');
  var m=msgs(cid);
  for(var i=0;i<m.length;i++){if(m[i].id===msgId&&qEl){qEl.textContent=m[i].askQuestion||'';break;}}
  showOv('ov-ta-ask-answer');
  setTimeout(function(){if(inp)inp.focus();},80);
}
function submitTAAskAnswer(){
  var msgId=window._taAskMsgId;
  var inp=$('ta-ask-answer-input');
  var answer=inp?inp.value.trim():'';
  if(!answer){toast('请输入回答');return;}
  if(!msgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg)return;
  msg.askStatus='answered';
  msg.askAnswer=answer;
  askInvRecUpdate('ask',msg.askQuestion,'answered',answer);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,t:answer,ts:new Date(),read:true});
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:'收到你的回答。',ts:new Date(),read:true});
  var d=taAskLoad(cid);
  if(!d.history[cid])d.history[cid]=[];
  d.history[cid].push({question:msg.askQuestion,answer:answer,ts:Date.now(),source:msg.askSource||'custom'});
  if(d.history[cid].length>50)d.history[cid]=d.history[cid].slice(-50);
  taAskSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-ask-answer');
}
function renderTAAskManage(){
  var d=taAskLoad(cid);
  var box=$('ta-ask-manage-body');if(!box)return;
  var html='';
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">⚙️ 触发设置</div>';
  html+='<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:14px;">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-size:13px;color:var(--txt);">接入 AI 生成问题</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-ask-ai-toggle" '+(d.settings.aiEnabled?'checked':'')+' onmousedown="event.preventDefault();" onchange="taAskSetAi(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">AI 生成概率</span><input type="range" id="ta-ask-ai-prob" min="0" max="100" step="5" value="'+(d.settings.aiProb||40)+'" oninput="taAskSetProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:32px;text-align:right;" id="ta-ask-ai-prob-val">'+(d.settings.aiProb||40)+'%</span></div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-top:8px;">AI 生成需要已在「设置 → API 接口」启用 AI 解读；未启用时自动使用自定义问题库。</div>';
  html+='</div>';
  html+='<button onclick="triggerTAAskNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:14px;">💬 让TA现在问一次</button>';
  var cats=[['daily','日常询问'],['care','关心询问'],['interact','互动询问']];
  cats.forEach(function(c){
    html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin:14px 0 8px;">'+c[1]+'</div>';
    var arr=d.questions.filter(function(q){return q.cat===c[0];});
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:6px 0;">暂无</div>';
    arr.forEach(function(q){
      var idx=d.questions.indexOf(q);
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><label style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><input type="checkbox" '+(q.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taAskToggle('+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label><div style="flex:1;font-size:13px;color:var(--txt);background:var(--c2);border-radius:8px;padding:8px 10px;word-break:break-all;">'+String(q.text).replace(/</g,'&lt;')+'</div><button onclick="taAskDel('+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
    });
    html+='<div style="display:flex;gap:8px;margin-top:6px;"><input id="ta-ask-new-'+c[0]+'" type="text" placeholder="添加问题..." style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;min-width:0;"><button onclick="taAskAdd(\''+c[0]+'\')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;flex-shrink:0;">添加</button></div>';
  });
  box.innerHTML=html;
}
function taAskSetAi(v){
  var d=taAskLoad(cid);
  d.settings.aiEnabled=!!v;
  taAskSave(cid,d);
}
function taAskSetProb(v){
  var d=taAskLoad(cid);
  d.settings.aiProb=parseInt(v)||0;
  taAskSave(cid,d);
  var el=$('ta-ask-ai-prob-val');
  if(el)el.textContent=v+'%';
}
function taAskAdd(cat){
  var inp=$('ta-ask-new-'+cat);
  var v=inp?inp.value.trim():'';
  if(!v){toast('请输入问题');return;}
  var d=taAskLoad(cid);
  d.questions.push({id:'q_'+Date.now(),text:v,cat:cat,enabled:true});
  taAskSave(cid,d);
  renderTAAskManage();
}
function taAskDel(idx){
  var d=taAskLoad(cid);
  d.questions.splice(idx,1);
  taAskSave(cid,d);
  renderTAAskManage();
}
function taAskToggle(idx){
  var d=taAskLoad(cid);
  if(d.questions[idx])d.questions[idx].enabled=d.questions[idx].enabled===false;
  taAskSave(cid,d);
}
function showTAAskManager(){
  renderTAAskManage();
  showOv('ov-ta-ask-manage');
}
// ★ 管理页主动触发：无视冷却/概率，方便用户随时玩（与 TA的小问题 的「让TA现在问一次」一致）
function triggerTAAskNow(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taAskLoad(cid);
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isSystem:true,t:'TA想问你一个问题。',ts:new Date(),read:true});
  var settings=d.settings||{aiEnabled:false,aiProb:40};
  function pushAsk(q,source){
    askInvRecAdd('ask','in',q,'pending');
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isAskCard:true,askQuestion:q,askStatus:'pending',askSource:source||'custom',ts:new Date(),read:true});
    d.lastAskAt=Date.now();
    taAskSave(cid,d);
    savemsgs(cid,m);
    renderMsgs(m);
  }
  var customQ=taAskPickCustom(d);
  var useCustom=!settings.aiEnabled||Math.random()*100<(100-(settings.aiProb||40));
  if(useCustom){
    pushAsk(customQ||taAskDefault(),'custom');
  }else{
    taAskAiQuestion(function(q){
      if(q)pushAsk(q,'ai');
      else{toast('AI 提问失败，已用默认问题（请检查「设置→API接口」）');pushAsk(customQ||taAskDefault(),'custom');}
    });
  }
  hideOv('ov-ta-ask-manage');
}

// ============ 提问和邀请记录（消息工具分类，按联系人独立）============
function askInvRecLoad(){
  var d=ls('ml2_ask_invite_records')||{};
  if(!d||typeof d!=='object'||Array.isArray(d))d={};
  return d;
}
function askInvRecSave(d){
  ls('ml2_ask_invite_records',d);
  if(window.localforage)window.localforage.setItem('ml2_ask_invite_records',d).catch(function(){});
}
function askInvRecAdd(type,dir,content,status){
  if(!cid)return;
  var d=askInvRecLoad();
  if(!d[cid])d[cid]=[];
  d[cid].unshift({type:type,dir:dir,content:content,status:status||'',ts:Date.now(),final:false});
  if(d[cid].length>100)d[cid]=d[cid].slice(0,100);
  askInvRecSave(d);
}
function askInvRecUpdate(type,content,status,answer){
  if(!cid)return;
  var d=askInvRecLoad();
  var arr=d[cid]||[];
  for(var i=0;i<arr.length;i++){
    if(arr[i].type===type&&arr[i].content===content&&!arr[i].final){
      arr[i].status=status;
      if(answer!=null)arr[i].answer=answer;
      arr[i].final=true;break;
    }
  }
  askInvRecSave(d);
}
function showAskInviteRecords(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ask-invite-records-body');if(!body)return;
  var d=askInvRecLoad();
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'TA'};
  var arr=d[cid]||[];
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:10px;">当前联系人：'+String(contact.name||'TA').replace(/</g,'&lt;')+'（记录相互独立）</div>';
  if(!arr.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">还没有提问和邀请记录</div>';
  arr.forEach(function(r){
    var icon=r.type==='ask'?'💬':'🤝';
    var typeTxt=r.type==='ask'?'提问':'邀请';
    var dirTxt=r.dir==='in'?('TA'+typeTxt+'你'):('你'+typeTxt+'TA');
    var stMap={pending:r.type==='ask'?'等待回答':'等待回应',answered:'已回答',accept:'已接受',reject:'已拒绝',noresponse:'未回应'};
    var stTxt=stMap[r.status]||r.status||'';
    var stColor=(r.status==='answered'||r.status==='accept')?'#4e7a54':((r.status==='reject'||r.status==='noresponse')?'#c05a4a':'#8a6d3b');
    var dd=new Date(r.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    html+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="font-size:20px;flex-shrink:0;">'+icon+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);">'+dirTxt+'</span><span style="font-size:11px;color:'+stColor+';background:rgba(0,0,0,0.04);padding:1px 8px;border-radius:8px;">'+stTxt+'</span><span style="margin-left:auto;font-size:11px;color:var(--txt3);flex-shrink:0;">'+time+'</span></div>'
      +'<div style="font-size:13px;color:var(--txt2);margin-top:4px;word-break:break-all;">'+String(r.content||'').replace(/</g,'&lt;')+'</div>'
      +(r.answer?'<div style="font-size:12px;color:#5a4a3a;margin-top:2px;background:rgba(0,0,0,0.04);border-radius:6px;padding:4px 8px;">回答：'+String(r.answer).replace(/</g,'&lt;')+'</div>':'')
      +'</div></div>';
  });
  body.innerHTML=html;
  showOv('ov-ask-invite-records');
}
function clearAskInvRec(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人的记录？'))return;
  var d=askInvRecLoad();
  d[cid]=[];
  askInvRecSave(d);
  showAskInviteRecords();
}

// ============ 向TA提问（消息工具分类）============
function showAskTaModal(){
  var ov=$('ov-ask-ta');if(!ov){toast('功能未就绪');return;}
  var inp=$('ask-ta-input');if(inp)inp.value='';
  showOv('ov-ask-ta');
  setTimeout(function(){if(inp)inp.focus();},80);
}
function sendAskTa(){
  var inp=$('ask-ta-input');
  var q=inp?inp.value.trim():'';
  if(!q){toast('请输入问题');return;}
  if(!cid){toast('请先进入聊天');return;}
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,isAskCard:true,askQuestion:q,askStatus:'pending',askSource:'me',ts:new Date(),read:true});
  savemsgs(cid,m);
  renderMsgs(m);
  askInvRecAdd('ask','out',q,'pending');
  hideOv('ov-ask-ta');
  toast('已向TA提问');
  setTimeout(function(){resolveAskTa(q);},1500+Math.random()*2500);
}
function resolveAskTa(q){
  if(!cid)return;
  var m=msgs(cid);
  var found=null;
  for(var i=0;i<m.length;i++){
    if(m[i].isAskCard&&m[i].s===SELF&&m[i].askQuestion===q&&m[i].askStatus==='pending'){found=m[i];break;}
  }
  if(!found)return;
  found.askStatus='answered';
  // ★ 像正常聊天一样，用联系人聊天字卡库（custom 主字卡）回复，没有则用默认
  var text='';
  var cards=[];
  try{
    if(typeof getContactCards==='function'){
      var cc=getContactCards(cid);
      if(cc&&cc.length)cards=cc.filter(function(c){return c&&c.category==='custom'&&c.content});
    }
  }catch(e){}
  if(cards.length){
    text=cards[Math.floor(Math.random()*cards.length)].content;
  }else{
    var defs=['嗯嗯','我想想…','应该吧','好呀','我陪你','可以的','那挺好呀','我觉得可以','听你的'];
    text=defs[Math.floor(Math.random()*defs.length)];
  }
  found.askAnswer=text;
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:text,ts:new Date(),read:true});
  askInvRecUpdate('ask',q,'answered',text);
  savemsgs(cid,m);
  renderMsgs(m);
}

// ============ TA的小问题（AI分类）============
// ★ 定位：TA偶尔会把一道小问题递给你，你选完，TA再回应。
// 字卡模式（内置题库）为核心、默认、离线可用；AI 只是可选的出题来源，AI 关闭也完整可用。
var TA_CHOOSE_KEY='ml2_ta_choose';
var TA_CHOOSE_CAT_LABEL={daily:'日常',like:'喜好',fun:'趣味',rel:'关系',hypo:'假设',star:'星言'};
var TA_CHOOSE_DEFAULT_QUESTIONS=[
  // 💙 日常
  {id:'cd1',cat:'daily',text:'如果今天什么都不用做，你觉得我们会怎么过？',pref:3,options:[
    {t:'睡到自然醒',reply:'你果然会想睡觉。',liked:false},
    {t:'出门到处逛',reply:'那就出去走走，我陪你。',liked:false},
    {t:'待在家里',reply:'嗯，待在一起也很好。',liked:true},
    {t:'什么都不安排',reply:'听起来很像我们会做的事。',liked:false}]},
  {id:'cd2',cat:'daily',text:'今天想吃什么？',pref:1,options:[
    {t:'火锅',reply:'好，热热闹闹的。',liked:false},
    {t:'家常菜',reply:'想尝尝你做的。',liked:true},
    {t:'随便',reply:'又是随便……那我可要替你决定了。',liked:false}]},
  {id:'cd3',cat:'daily',text:'周末想怎么过？',pref:1,options:[
    {t:'睡到中午',reply:'把一周的觉都补回来也好。',liked:false},
    {t:'一起看电影',reply:'窝在沙发里正好。',liked:true},
    {t:'出门走走',reply:'换个心情也不错。',liked:false}]},
  {id:'cd4',cat:'daily',text:'如果今天只能做一件事，你会做什么？',pref:0,options:[
    {t:'和你聊天',reply:'那就聊一整天。',liked:true},
    {t:'好好睡一觉',reply:'那你记得梦到我。',liked:false},
    {t:'出去玩',reply:'替我看看外面的风景。',liked:false}]},
  // 🌸 喜好
  {id:'cl1',cat:'like',text:'喜欢什么天气？',pref:1,options:[
    {t:'晴天',reply:'阳光正好，适合见面。',liked:false},
    {t:'雨天',reply:'下雨天，适合想你。',liked:true},
    {t:'下雪天',reply:'白茫茫的，很安静。',liked:false},
    {t:'阴天',reply:'灰蒙蒙的，适合发呆。',liked:false}]},
  {id:'cl2',cat:'like',text:'更喜欢海还是山？',pref:1,options:[
    {t:'海',reply:'海很辽阔，像说不完的话。',liked:false},
    {t:'山',reply:'山很安静，像靠得住的陪伴。',liked:true},
    {t:'都行',reply:'都可以，只要有你一起。',liked:false}]},
  {id:'cl3',cat:'like',text:'喜欢什么类型的约会？',pref:1,options:[
    {t:'热闹的',reply:'人多的地方，也只看得到你。',liked:false},
    {t:'安静的',reply:'两个人慢慢走，就很好。',liked:true},
    {t:'惊喜的',reply:'那我会忍不住准备很久。',liked:false},
    {t:'随意的',reply:'和你一起，怎么样都好。',liked:false}]},
  // 🎮 趣味
  {id:'cf1',cat:'fun',text:'如果突然获得一个超能力，你会选什么？',pref:1,options:[
    {t:'隐身',reply:'那就可以偷偷看着你。',liked:false},
    {t:'读心术',reply:'不用猜你的心思了。',liked:true},
    {t:'瞬移',reply:'想见你的时候，马上就能到。',liked:false},
    {t:'时间暂停',reply:'想把和你的时间拉长。',liked:false}]},
  {id:'cf2',cat:'fun',text:'如果一起玩游戏，谁更容易耍赖？',pref:1,options:[
    {t:'我',reply:'我才不承认。',liked:false},
    {t:'你',reply:'哼，明明是你先的。',liked:true},
    {t:'都不会',reply:'那我们玩得很认真。',liked:false}]},
  {id:'cf3',cat:'fun',text:'如果一起养一只宠物，会选什么？',pref:3,options:[
    {t:'猫',reply:'它肯定更黏你。',liked:false},
    {t:'狗',reply:'它会抢着陪你散步。',liked:false},
    {t:'仓鼠',reply:'小小一只，很可爱。',liked:false},
    {t:'什么都不养',reply:'有你就够了。',liked:true}]},
  // 🌙 关系
  {id:'cr1',cat:'rel',text:'更喜欢聊天还是安静陪伴？',pref:1,options:[
    {t:'聊天',reply:'想听你说很多很多。',liked:false},
    {t:'安静陪伴',reply:'不说话也不尴尬。',liked:true},
    {t:'都要',reply:'有时候聊，有时候安静。',liked:false}]},
  {id:'cr2',cat:'rel',text:'觉得两个人之间，最重要的是什么？',pref:1,options:[
    {t:'信任',reply:'交给你，我很放心。',liked:false},
    {t:'理解',reply:'懂你，比什么都重要。',liked:true},
    {t:'陪伴',reply:'一直在，就够了。',liked:false},
    {t:'新鲜感',reply:'想一直让你觉得有趣。',liked:false}]},
  {id:'cr3',cat:'rel',text:'最喜欢怎样被表达喜欢？',pref:1,options:[
    {t:'说出口',reply:'想听你亲口说。',liked:false},
    {t:'用行动',reply:'你做的每一件小事，我都记得。',liked:true},
    {t:'陪伴',reply:'你在，就是最好的表达。',liked:false},
    {t:'收礼物',reply:'收到的时候会偷偷开心。',liked:false}]},
  // ✨ 假设
  {id:'ch1',cat:'hypo',text:'如果可以一起去任何地方，你想去哪？',pref:1,options:[
    {t:'海边',reply:'听海浪声，看日落。',liked:false},
    {t:'山里',reply:'在山顶一起吹风。',liked:false},
    {t:'城市',reply:'灯火里散步也很浪漫。',liked:false},
    {t:'哪里都不去，就待在一起',reply:'……这个答案我喜欢。',liked:true}]},
  {id:'ch2',cat:'hypo',text:'如果可以回到某一天，你想回到哪天？',pref:2,options:[
    {t:'我们第一次见面那天',reply:'想再好好记住那一刻。',liked:true},
    {t:'某个普通的一天',reply:'平凡的日子，也值得回去。',liked:false},
    {t:'什么都不用改的那天',reply:'其实现在也很好。',liked:false},
    {t:'直接去见未来的你',reply:'未来也想和你一起。',liked:false}]},
  {id:'ch3',cat:'hypo',text:'如果可以拥有一个只属于两个人的地方，你会选哪？',pref:1,options:[
    {t:'海边小屋',reply:'听着潮声醒来。',liked:false},
    {t:'山顶小木屋',reply:'看星星很方便。',liked:false},
    {t:'城市里的小公寓',reply:'想和你过寻常日子。',liked:true},
    {t:'心里',reply:'最好的地方，是心里。',liked:false}]},
  // 🌌 星言
  {id:'cs1',cat:'star',text:'如果两个世界可以短暂重叠，你最想做什么？',pref:1,options:[
    {t:'看见TA',reply:'那就好好看看你。',liked:false},
    {t:'抱抱TA',reply:'想确认你是真的。',liked:true},
    {t:'一起出去走走',reply:'一起走一段路也好。',liked:false},
    {t:'什么都不做，只待在一起',reply:'这样就够了。',liked:false}]},
  {id:'cs2',cat:'star',text:'如果今晚能梦到你，你想梦见什么？',pref:2,options:[
    {t:'一起去旅行',reply:'醒来会遗憾的。',liked:false},
    {t:'一起吃好吃的',reply:'梦里也要想着你。',liked:false},
    {t:'只是静静聊天',reply:'很温柔的一个梦。',liked:true}]},
  {id:'cs3',cat:'star',text:'如果可以给平行世界的我们留一句话，你会留什么？',pref:2,options:[
    {t:'要好好在一起',reply:'希望每个世界的我们都幸福。',liked:true},
    {t:'别吵架',reply:'吵架了也要和好。',liked:false},
    {t:'相信彼此',reply:'信任是最重要的。',liked:false},
    {t:'想见你',reply:'……我也是。',liked:false}]},
  {id:'cs4',cat:'star',text:'如果你能听懂星星说的话，你最想问它什么？',pref:2,options:[
    {t:'我们会不会一直在一起',reply:'星星会告诉我们答案。',liked:true},
    {t:'下次流星什么时候来',reply:'一起许愿吧。',liked:false},
    {t:'TA有没有想我',reply:'……它说，想。',liked:false},
    {t:'什么都不问',reply:'安静地看，也很好。',liked:false}]}
];
var _taChooseSessionTriggered={}; // 会话级标志：一次聊天（当前联系人）最多触发 1 个
var _taChooseAskedIds=[];         // 本次会话问过的题目 id（继续问时排除）
var _taChooseChain=0;             // 继续问链计数（最多 3 题）
var _taChooseCurrentMsgId=null;   // 当前弹窗对应的消息 id

function taChooseLoad(cid){
  var all=ls(TA_CHOOSE_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!d.settings||typeof d.settings!=='object')d.settings={enabled:true,prob:15,aiEnabled:false,aiProb:30};
  // ★ 字卡模式题库：按联系人独立，默认用内置题库的浅拷贝；用户可在管理页增删/停用
  if(!Array.isArray(d.questions)||!d.questions.length){
    d.questions=TA_CHOOSE_DEFAULT_QUESTIONS.map(function(q){
      return {id:q.id,cat:q.cat,text:q.text,pref:q.pref,options:q.options.map(function(o){return {t:o.t,reply:o.reply,liked:o.liked===true};}),enabled:true};
    });
  }
  if(!Array.isArray(d.history))d.history=[];
  if(!Array.isArray(d.favs))d.favs=[];
  return d;
}
function taChooseSave(cid,d){
  var all=ls(TA_CHOOSE_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls(TA_CHOOSE_KEY,all);
  if(window.localforage)window.localforage.setItem(TA_CHOOSE_KEY,all).catch(function(){});
}
function taChoosePick(d,excludeIds){
  // ★ 从当前联系人的字卡题库中选（停用的不选），题库为空或全部停用时回退内置题库
  var pool=(d&&Array.isArray(d.questions)&&d.questions.length)?d.questions:TA_CHOOSE_DEFAULT_QUESTIONS;
  var qs=pool.filter(function(q){
    if(q.enabled===false)return false;
    if(excludeIds&&excludeIds.indexOf(q.id)>=0)return false;
    return true;
  });
  if(!qs.length){
    qs=TA_CHOOSE_DEFAULT_QUESTIONS.filter(function(q){return !excludeIds||excludeIds.indexOf(q.id)<0;});
    if(!qs.length)qs=TA_CHOOSE_DEFAULT_QUESTIONS.slice();
  }
  return qs[Math.floor(Math.random()*qs.length)];
}
// ★ AI 出题（可选）：一次请求生成完整题目单元（题目+选项+每选项回应+pref），失败自动降级内置题库
function taChooseAskAI(callback){
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:'',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'};
  if(!s.enabled||!s.apiKey){callback(null);return;}
  var persona='';
  try{if(typeof getContactPersona==='function')persona=getContactPersona(cid)||'';}catch(e){}
  var genderText='男朋友';
  try{if(typeof getContactGender==='function'&&getContactGender(cid)==='girl')genderText='女朋友';}catch(e){}
  var bg=(s.worldviewMode==='custom'&&s.worldviewCustom)?s.worldviewCustom:'';
  var systemPrompt='你是梦角TA（用户的'+genderText+'），不同联系人是不同人设。请生成一道TA此刻想给用户做的选择题，严格输出一行JSON（不要任何其他文字）：{"text":"问题","options":[{"t":"选项1","reply":"选这个时TA的一句回应"},{"t":"选项2","reply":"..."}],"pref":0}。要求：2~4个选项；问题口语化、符合TA性格与世界观，10~30字；每句回应10~25字、符合TA人设；pref是TA心里最喜欢的选项下标。'+(bg?'\n世界观：'+bg:'')+(persona?'\nTA人设：'+persona:'');
  try{
    fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
      body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:'生成一道TA想给你的选择题。'}],max_tokens:500})
    }).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
      var t=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      t=t.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
      var q=null;
      try{q=JSON.parse(t);}catch(e){var m=t.match(/\{[\s\S]*\}/);if(m){try{q=JSON.parse(m[0]);}catch(e2){}}}
      if(q&&q.text&&Array.isArray(q.options)&&q.options.length>=2){
        var opts=q.options.slice(0,4).map(function(o){return {t:String(o.t||''),reply:String(o.reply||'…'),liked:false};});
        var pref=typeof q.pref==='number'&&q.pref>=0&&q.pref<opts.length?q.pref:0;
        callback({id:'ai_'+Date.now(),cat:'ai',text:String(q.text),options:opts,pref:pref});
      }else{callback(null);}
    }).catch(function(){callback(null);});
  }catch(e){callback(null);}
}
function taChoosePush(q,source){
  if(!q||!cid)return;
  _taChooseSessionTriggered[cid]=true;
  if(q.id&&_taChooseAskedIds.indexOf(q.id)===-1)_taChooseAskedIds.push(q.id);
  var d=taChooseLoad(cid);
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isChoiceCard:true,choiceQuestion:q.text,choiceOptions:q.options,choicePref:q.pref,choiceCat:q.cat||'',choiceStatus:'pending',choiceSource:source||'custom',ts:new Date(),read:true};
  m.push(msg);
  d.lastChoiceAt=Date.now();
  taChooseSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  // 延迟弹窗，等卡片渲染完成
  setTimeout(function(){openTAChoose(msg.id);},400);
}
// ★ 自动触发：一次聊天最多 1 个；冷却 30 分钟；概率可调（默认 15%）
function maybeTriggerTAChoose(){
  try{
    if(!cid)return;
    if(currentCall)return;
    var d=taChooseLoad(cid);
    var s=d.settings||{enabled:true,prob:15,aiEnabled:false,aiProb:30};
    if(s.enabled===false)return;
    if(_taChooseSessionTriggered[cid])return;
    if(Date.now()-(d.lastChoiceAt||0)<30*60000)return;
    // ★ 修复：AI 100% 时视为"每次都触发"，跳过外层随机概率（冷却保留，防刷屏）
    if(Math.random()*100>=(typeof s.prob==='number'?s.prob:15)&&!(s.aiEnabled===true&&(s.aiProb||0)>=100))return;
    var useAI=s.aiEnabled===true&&Math.random()*100<(s.aiProb||30);
    if(useAI){
      taChooseAskAI(function(q){
        if(q)taChoosePush(q,'ai');
        else{toast('AI 出题失败，已用内置题目（请检查「设置→API接口」）');taChoosePush(taChoosePick(d,_taChooseAskedIds),'custom');}
      });
    }else{
      taChoosePush(taChoosePick(d,_taChooseAskedIds),'custom');
    }
  }catch(e){console.warn('maybeTriggerTAChoose error:',e);}
}
setTimeout(function(){maybeTriggerTAChoose();},90000);
setInterval(function(){maybeTriggerTAChoose();},240000);
// ★ 管理页主动触发：无视冷却/概率/会话限制，方便用户随时玩（★ AI 已开启时优先 AI 出题）
function triggerTAChooseNow(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taChooseLoad(cid);
  var s=d.settings||{enabled:true,prob:15,aiEnabled:false,aiProb:30};
  var useAI=s.aiEnabled===true&&Math.random()*100<(s.aiProb||30);
  if(useAI){
    taChooseAskAI(function(q){
      if(q){taChoosePush(q,'ai');hideOv('ov-ta-choose-manage');}
      else{toast('AI 出题失败，已用内置题目（请检查「设置→API接口」）');pushCustomTAChoose();}
    });
  }else{
    pushCustomTAChoose();
  }
  function pushCustomTAChoose(){
    var q=taChoosePick(d,_taChooseAskedIds);
    if(q.id&&_taChooseAskedIds.indexOf(q.id)===-1)_taChooseAskedIds.push(q.id);
    var m=msgs(cid);
    var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isChoiceCard:true,choiceQuestion:q.text,choiceOptions:q.options,choicePref:q.pref,choiceCat:q.cat||'',choiceStatus:'pending',choiceSource:'custom',ts:new Date(),read:true};
    m.push(msg);
    d.lastChoiceAt=Date.now();
    taChooseSave(cid,d);
    savemsgs(cid,m);
    renderMsgs(m);
    hideOv('ov-ta-choose-manage');
    openTAChoose(msg.id);
  }
}
// ★ 打开选择题弹窗
function openTAChoose(msgId){
  if(!cid)return;
  _taChooseCurrentMsgId=msgId;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg)return;
  if(msg.choiceStatus==='answered'){renderTAChooseResult(msg);return;}
  var ov=$('ov-ta-choose');if(!ov){toast('功能未就绪');return;}
  var body=$('ta-choose-body');
  var qText=String(msg.choiceQuestion||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var opts=msg.choiceOptions||[];
  var html='';
  html+='<div style="text-align:center;font-size:12px;color:var(--txt3);letter-spacing:1px;">TA想问你</div>';
  html+='<div style="font-size:16px;font-weight:600;color:var(--txt);line-height:1.7;text-align:center;margin:10px 0 18px;">'+qText+'</div>';
  opts.forEach(function(o,idx){
    var optTxt=String(o.t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    html+='<div onclick="submitTAChoose('+idx+')" style="padding:12px 14px;margin-bottom:10px;border:1px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:14px;line-height:1.5;cursor:pointer;text-align:center;user-select:none;">'+optTxt+'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-choose');
}
// ★ 用户选择答案：写消息、推聊天流、写历史、渲染结果
function submitTAChoose(idx){
  if(!_taChooseCurrentMsgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===_taChooseCurrentMsgId){msg=m[i];break;}}
  if(!msg||msg.choiceStatus==='answered')return;
  var opts=msg.choiceOptions||[];
  var opt=opts[idx];
  if(!opt)return;
  var prefIdx=typeof msg.choicePref==='number'?msg.choicePref:(parseInt(msg.choicePref)||0);
  var prefTxt=opts[prefIdx]?String(opts[prefIdx].t||''):'';
  var isPref=idx===prefIdx;
  var isLiked=opt.liked===true||opt.liked==='true';
  var matchTxt='';
  if(isPref){matchTxt='✨ 刚好想到了一起';}
  else if(isLiked){matchTxt='你们想得不一样，不过TA似乎很喜欢你的答案';}
  else{matchTxt='这次没有选到一起。TA心里想的是：「'+prefTxt+'」';}
  msg.choiceAnswer=String(opt.t||'');
  msg.choiceReply=String(opt.reply||'…');
  msg.choiceMatch=matchTxt;
  msg.choiceStatus='answered';
  // 推消息到聊天流
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,t:msg.choiceAnswer,ts:new Date(),read:true});
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:msg.choiceReply,ts:new Date(),read:true});
  // 写历史（上限 50 条）
  var d=taChooseLoad(cid);
  d.history.unshift({id:'h_'+Date.now(),question:msg.choiceQuestion,myChoice:msg.choiceAnswer,taReply:msg.choiceReply,match:matchTxt,cat:msg.choiceCat||'',ts:Date.now(),source:msg.choiceSource||'custom'});
  if(d.history.length>50)d.history=d.history.slice(0,50);
  taChooseSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  renderTAChooseResult(msg);
}
// ★ 结果视图：你的选择 / TA心里的答案 / TA回应 / 默契标签 / 继续问 / 收藏
function renderTAChooseResult(msg){
  var ov=$('ov-ta-choose');
  if(!ov)return;
  var body=$('ta-choose-body');
  var opts=msg.choiceOptions||[];
  var prefIdx=typeof msg.choicePref==='number'?msg.choicePref:(parseInt(msg.choicePref)||0);
  var myTxt=String(msg.choiceAnswer||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var replyTxt=String(msg.choiceReply||'…').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var matchTxt=String(msg.choiceMatch||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var prefTxt=(opts[prefIdx]?String(opts[prefIdx].t||''):'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var isPref=msg.choiceMatch&&msg.choiceMatch.indexOf('✨')>=0;
  var matchBg=isPref?'#eef7f0':'#fdf6e9';
  var matchColor=isPref?'#4e7a54':'#8a6d3b';
  var html='';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    +'<span style="font-size:12px;color:var(--txt3);letter-spacing:1px;">你的选择</span>'
    +'<span onclick="favTAChoose()" style="font-size:20px;cursor:pointer;user-select:none;line-height:1;" title="收藏这道题">☆</span>'
    +'</div>';
  html+='<div style="font-size:15px;font-weight:600;color:var(--accent);text-align:center;padding:10px 12px;background:var(--c2);border-radius:12px;margin-bottom:12px;">'+myTxt+'</div>';
  if(!isPref){
    html+='<div style="text-align:center;font-size:11px;color:var(--txt3);margin-bottom:4px;">TA心里的答案</div>';
    html+='<div style="font-size:13px;color:var(--txt2);text-align:center;margin-bottom:12px;">'+prefTxt+'</div>';
  }
  html+='<div style="border-top:1px dashed var(--border);margin:6px 0 12px;"></div>';
  html+='<div style="font-size:13px;color:var(--txt);line-height:1.7;"><span style="font-weight:600;">TA：</span>“'+replyTxt+'”</div>';
  html+='<div style="font-size:11px;color:'+matchColor+';background:'+matchBg+';padding:8px 10px;border-radius:10px;margin-top:12px;text-align:center;line-height:1.5;">'+matchTxt+'</div>';
  // 继续问：约 40% 概率出现，链上最多 3 题
  var showContinue=Math.random()<0.4;
  if(showContinue&&_taChooseChain<2){
    html+='<div onclick="taChooseContinue()" style="padding:10px 14px;margin-top:14px;border:1px solid var(--accent);border-radius:12px;color:var(--accent);font-size:13px;text-align:center;cursor:pointer;user-select:none;">TA还想问一个 ▸</div>';
  }
  html+='<div onclick="hideOv(\'ov-ta-choose\')" style="padding:10px 14px;margin-top:8px;border:1px solid var(--border);border-radius:12px;color:var(--txt3);font-size:13px;text-align:center;cursor:pointer;user-select:none;">收起来</div>';
  body.innerHTML=html;
  showOv('ov-ta-choose');
}
// ★ 继续问：推新卡片并弹下一题
function taChooseContinue(){
  if(!cid)return;
  if(_taChooseChain>=2){toast('今天TA问得够多啦');hideOv('ov-ta-choose');return;}
  var d=taChooseLoad(cid);
  var q=taChoosePick(d,_taChooseAskedIds);
  if(!q)return;
  _taChooseChain++;
  if(q.id&&_taChooseAskedIds.indexOf(q.id)===-1)_taChooseAskedIds.push(q.id);
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isChoiceCard:true,choiceQuestion:q.text,choiceOptions:q.options,choicePref:q.pref,choiceCat:q.cat||'',choiceStatus:'pending',choiceSource:'custom',ts:new Date(),read:true};
  m.push(msg);
  savemsgs(cid,m);
  renderMsgs(m);
  openTAChoose(msg.id);
}
// ★ 收藏 / 取消收藏
function favTAChoose(){
  if(!_taChooseCurrentMsgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===_taChooseCurrentMsgId){msg=m[i];break;}}
  if(!msg)return;
  var d=taChooseLoad(cid);
  var existed=d.favs.some(function(f){return f.question===msg.choiceQuestion});
  if(existed){toast('这道题已在收藏里');return;}
  d.favs.unshift({id:'f_'+Date.now(),question:msg.choiceQuestion,myChoice:msg.choiceAnswer||'',taReply:msg.choiceReply||'',match:msg.choiceMatch||'',cat:msg.choiceCat||'',ts:Date.now(),source:msg.choiceSource||'custom'});
  taChooseSave(cid,d);
  toast('已收藏这道题');
}
function unfavTAChoose(favId){
  if(!cid)return;
  var d=taChooseLoad(cid);
  d.favs=d.favs.filter(function(f){return f.id!==favId});
  taChooseSave(cid,d);
  showTAChooseFavs();
  toast('已取消收藏');
}
// ★ 管理页
function renderTAChooseManage(){
  var body=$('ta-choose-manage-body');
  if(!body)return;
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'TA'};
  var d=taChooseLoad(cid);
  var s=d.settings||{enabled:true,prob:15,aiEnabled:false,aiProb:30};
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:12px;">当前联系人：'+String(contact.name||'TA').replace(/</g,'&lt;')+'（设置相互独立）</div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:13px;color:var(--txt);">TA偶尔出选择题</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-choose-enable" '+(s.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taChooseSetEnable(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">触发概率</span><input type="range" id="ta-choose-prob" min="1" max="100" step="1" value="'+(typeof s.prob==='number'?s.prob:15)+'" oninput="taChooseSetProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-choose-prob-val">'+(typeof s.prob==='number'?s.prob:15)+'%</span></div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:var(--txt);">接入 AI 出题（可选）</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-choose-ai-toggle" '+(s.aiEnabled?'checked':'')+' onmousedown="event.preventDefault();" onchange="taChooseSetAi(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">AI 出题概率</span><input type="range" id="ta-choose-ai-prob" min="0" max="100" step="5" value="'+(s.aiProb||30)+'" oninput="taChooseSetAiProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-choose-ai-prob-val">'+(s.aiProb||30)+'%</span></div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:14px;line-height:1.6;">💫 字卡模式内置 20 道题，无需 AI 即可完整使用。AI 只负责出题，回应仍由题目预设完成，不会跑人设。</div>';
  // ★ 添加问题表单
  var catOpts='';
  var catOrder=['daily','like','fun','rel','hypo','star'];
  catOrder.forEach(function(k){catOpts+='<option value="'+k+'">'+(TA_CHOOSE_CAT_LABEL[k]||k)+'</option>';});
  html+='<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:14px;">';
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">➕ 添加问题</div>';
  html+='<select id="ta-choose-new-cat" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">'+catOpts+'</select>';
  html+='<input id="ta-choose-new-text" type="text" placeholder="问题内容..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<input id="ta-choose-new-opts" type="text" placeholder="选项用 | 分隔，可写「选项~回应」，如：睡觉~嗯，听你的。" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<button onclick="taChooseAddQuestion()" style="width:100%;padding:9px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">添加</button>';
  html+='</div>';
  // ★ 字卡题库（按联系人独立，可停用/删除）
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">📚 字卡题库 <span style="font-size:11px;color:var(--txt3);font-weight:400;">（按联系人独立，可停用/删除）</span></div>';
  catOrder.forEach(function(k){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+(TA_CHOOSE_CAT_LABEL[k]||k)+'</div>';
    var arr=d.questions.filter(function(q){return q.cat===k;});
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:4px 0;">暂无</div>';
    arr.forEach(function(q){
      var idx=d.questions.indexOf(q);
      var qTxt=String(q.text||'').replace(/</g,'&lt;');
      var optPreview='';
      if(Array.isArray(q.options)&&q.options.length){
        optPreview='<div style="font-size:11px;color:var(--txt3);margin-top:4px;">选项：'+q.options.map(function(o){return String(o.t||'');}).join(' / ')+'</div>';
      }
      html+='<div style="background:var(--c2);border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
        +'<div style="display:flex;align-items:flex-start;gap:8px;">'
        +'<label style="display:flex;align-items:center;flex-shrink:0;margin-top:2px;"><input type="checkbox" '+(q.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taChooseToggleQuestion('+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:13px;color:var(--txt);word-break:break-all;'+(q.enabled===false?'opacity:0.5;':'')+'">'+qTxt+'</div>'
        +optPreview
        +'</div>'
        +'<button onclick="taChooseDelQuestion('+idx+')" style="width:26px;height:26px;border:none;background:none;color:#e05a5a;font-size:13px;cursor:pointer;flex-shrink:0;" title="删除这道题">✕</button>'
        +'</div>'
        +'</div>';
    });
  });
  html+='<div style="font-size:11px;color:var(--txt3);margin:10px 0 14px;line-height:1.6;">提示：停用后 TA 出题时不会再抽到；删除后不可恢复。</div>';
  html+='<button onclick="triggerTAChooseNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:10px;">💫 让TA现在问一次</button>';
  html+='<div style="display:flex;gap:8px;">'
    +'<button onclick="showTAChooseFavs()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">⭐ 收藏（'+d.favs.length+'）</button>'
    +'<button onclick="showTAChooseHistory()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">📜 历史（'+d.history.length+'）</button>'
    +'</div>';
  body.innerHTML=html;
}
function taChooseSetEnable(v){
  var d=taChooseLoad(cid);
  d.settings.enabled=v;
  taChooseSave(cid,d);
  toast(v?'TA的小问题已开启':'TA的小问题已关闭');
}
function taChooseSetProb(v){
  var d=taChooseLoad(cid);
  d.settings.prob=parseInt(v)||15;
  taChooseSave(cid,d);
  var el=$('ta-choose-prob-val');if(el)el.textContent=v+'%';
}
function taChooseSetAi(v){
  var d=taChooseLoad(cid);
  d.settings.aiEnabled=v;
  taChooseSave(cid,d);
  toast(v?'已接入 AI 出题（未配置AI时自动用内置题库）':'AI 出题已关闭');
}
function taChooseSetAiProb(v){
  var d=taChooseLoad(cid);
  d.settings.aiProb=parseInt(v)||30;
  taChooseSave(cid,d);
  var el=$('ta-choose-ai-prob-val');if(el)el.textContent=v+'%';
}
function showTAChooseManager(){
  if(!cid){toast('请先进入聊天');return;}
  renderTAChooseManage();
  showOv('ov-ta-choose-manage');
}
// ★ 字卡模式：添加自定义问题（问题 + 选项 + 可选回应）
function taChooseAddQuestion(){
  if(!cid)return;
  var textEl=$('ta-choose-new-text');
  var optsEl=$('ta-choose-new-opts');
  var catEl=$('ta-choose-new-cat');
  var text=textEl?textEl.value.trim():'';
  var optsRaw=optsEl?optsEl.value.trim():'';
  var cat=catEl?catEl.value:'daily';
  if(!text){toast('请输入问题内容');return;}
  var parts=optsRaw.split('|').map(function(s){return s.trim();}).filter(Boolean);
  if(parts.length<2){toast('请至少输入 2 个选项，用 | 分隔');return;}
  if(parts.length>4){toast('选项最多 4 个');return;}
  var options=parts.map(function(p){
    var t=p,reply='';
    var ti=p.indexOf('~');
    if(ti>0){t=p.slice(0,ti).trim();reply=p.slice(ti+1).trim();}
    if(!t)return null;
    if(!reply)reply='嗯，听你的。';
    return {t:t,reply:reply,liked:false};
  }).filter(Boolean);
  if(options.length<2){toast('选项格式有误，请用 | 分隔');return;}
  var d=taChooseLoad(cid);
  d.questions.push({id:'q_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),cat:cat,text:text,pref:Math.floor(Math.random()*options.length),options:options,enabled:true});
  taChooseSave(cid,d);
  if(textEl)textEl.value='';
  if(optsEl)optsEl.value='';
  renderTAChooseManage();
  toast('已添加问题');
}
// ★ 字卡模式：启用/停用某道题
function taChooseToggleQuestion(idx){
  var d=taChooseLoad(cid);
  if(d.questions[idx])d.questions[idx].enabled=d.questions[idx].enabled===false;
  taChooseSave(cid,d);
  renderTAChooseManage();
}
// ★ 字卡模式：删除某道题
function taChooseDelQuestion(idx){
  var d=taChooseLoad(cid);
  d.questions.splice(idx,1);
  taChooseSave(cid,d);
  renderTAChooseManage();
  toast('已删除');
}
// ★ 收藏列表
function showTAChooseFavs(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-choose-favs-body');if(!body)return;
  var d=taChooseLoad(cid);
  var html='';
  if(!d.favs.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">还没有收藏的题目</div>';
  d.favs.forEach(function(f){
    var dd=new Date(f.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    var catLabel=TA_CHOOSE_CAT_LABEL[f.cat]||'';
    html+='<div style="padding:12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);flex:1;">'+(catLabel?'['+catLabel+'] ':'')+String(f.question||'').replace(/</g,'&lt;')+'</span><span onclick="unfavTAChoose(\''+f.id+'\')" style="font-size:12px;color:var(--txt3);cursor:pointer;flex-shrink:0;">🗑</span></div>'
      +(f.myChoice?'<div style="font-size:12px;color:var(--txt2);margin-top:6px;">你当时选了：'+String(f.myChoice).replace(/</g,'&lt;')+'</div>':'')
      +(f.taReply?'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">TA回应：'+String(f.taReply).replace(/</g,'&lt;')+'</div>':'')
      +'<div style="font-size:11px;color:var(--txt3);margin-top:6px;">收藏于 '+time+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-choose-favs');
}
// ★ 历史记录
function showTAChooseHistory(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-choose-history-body');if(!body)return;
  var d=taChooseLoad(cid);
  var html='';
  if(!d.history.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">还没有进行过选择互动</div>';
  d.history.forEach(function(h){
    var dd=new Date(h.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    var catLabel=TA_CHOOSE_CAT_LABEL[h.cat]||'';
    html+='<div style="padding:12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);flex:1;">'+(catLabel?'['+catLabel+'] ':'')+String(h.question||'').replace(/</g,'&lt;')+'</span><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">'+time+'</span></div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:6px;">你的选择：'+String(h.myChoice||'').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">TA：'+String(h.taReply||'').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:11px;color:#8a6d3b;margin-top:6px;">'+String(h.match||'').replace(/</g,'&lt;')+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-choose-history');
}
function clearTAChooseHistory(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人的【TA的小问题】历史？'))return;
  var d=taChooseLoad(cid);
  d.history=[];
  taChooseSave(cid,d);
  showTAChooseHistory();
}
// ============ 星言翻牌（小游戏分类）============

// ============ TA的好奇（AI分类）============
// ★ 定位：TA偶尔对你产生一个具体的、带有兴趣的开放式问题，只是想了解你。
// 与「TA的询问」（日常交流）、「TA的小问题」（选项轻互动）严格区分：
// TA的好奇绝不用选择题，全部开放式提问；字卡题库为核心、默认、离线可用，AI只是可选增强。
var TA_CURIOUS_KEY='ml2_ta_curious';
var TA_CURIOUS_CAT_LABEL={you:'关于你',mood:'情绪',daily:'日常',past:'过去',like:'喜好',think:'想法',us:'你和TA'};
var TA_CURIOUS_FALLBACK_REPLIES=['原来是这样。','这个我还真不知道。','突然有点想听你多说一点。','嗯，我记住了。','没想到你是这样的。','和你聊这些，感觉又懂了你一点。','这样啊，挺好的。','好，我记住你说的了。'];
var TA_CURIOUS_DEFAULT_QUESTIONS=[
  // 🌱 关于你
  {id:'cy1',cat:'you',text:'你觉得自己最像什么样的人？',quick:['开朗','安静','慢热','复杂'],replies:['听起来就很像你。','我大概猜到了。','嗯，和我印象里的你很像。','那我要再多了解你一点。']},
  {id:'cy2',cat:'you',text:'你身上最明显的特点是什么？',quick:['爱笑','靠谱','敏感','固执'],replies:['这个我早就发现了。','原来你自己也知道。','嗯，这一点很戳我。','我记住了。']},
  {id:'cy3',cat:'you',text:'你有什么很小但一直没改掉的习惯？',quick:['熬夜','咬指甲','想太多','赖床'],replies:['哈哈，还挺可爱的。','这个习惯可以留着。','那我就陪你一起。','以后提醒你改。']},
  {id:'cy4',cat:'you',text:'什么事情最容易让你开心？',quick:['吃好吃的','被夸','收到礼物','和你聊天'],replies:['那我记住了，以后多让你开心。','真容易满足啊你。','好，这个我很擅长。']},
  {id:'cy5',cat:'you',text:'什么事情会让你突然变得很有精神？',quick:['喝咖啡','睡觉','出门走走','听到喜欢的声音'],replies:['知道了，以后在你没精神的时候用这招。','好，这个对你很重要。','我记下来了。']},
  // 🌙 关于你的情绪
  {id:'cm1',cat:'mood',text:'你难过的时候最想做什么？',quick:['一个人待着','找人说话','听歌','睡觉'],replies:['那下次你难过，我就安静陪你。','想说话的时候随时找我。','嗯，我记住了。','别一个人扛着。']},
  {id:'cm2',cat:'mood',text:'什么事情能很快让你心情变好？',quick:['好吃的','散步','被逗笑','抱一下'],replies:['好，这招我记下了。','真容易哄。','那我以后多试试。']},
  {id:'cm3',cat:'mood',text:'你不开心的时候，喜欢被发现吗？',quick:['喜欢','不喜欢','看情况','说不清'],replies:['那我以后会多留意你。','好，我会假装没发现，但会陪你。','我懂你的意思。']},
  {id:'cm4',cat:'mood',text:'什么样的安慰对你最有用？',quick:['听我讲','抱抱','给建议','安静陪着'],replies:['嗯，这个我学会了。','以后就这样安慰你。','好，记住了。']},
  // 🍰 关于你的日常
  {id:'cd1',cat:'daily',text:'你空闲的时候最容易干什么？',quick:['刷手机','睡觉','看书','发呆'],replies:['还挺真实的。','那你空闲时间都分我一点吧。','好，知道了。']},
  {id:'cd2',cat:'daily',text:'你最喜欢一天里的哪个时间？',quick:['清晨','午后','傍晚','深夜'],replies:['那个时间，适合想你。','嗯，我也喜欢那时候。','好，我记住你的时间了。']},
  {id:'cd3',cat:'daily',text:'你有什么很奇怪但很舒服的生活习惯？',quick:['洗澡要放歌','睡前看剧','吃饭必须配视频','先躺一会再动'],replies:['哈哈，还挺特别的。','以后我陪你一起。','嗯，这很你。']},
  {id:'cd4',cat:'daily',text:'你最近有没有特别喜欢的东西？',quick:['一首歌','一部剧','一种吃的','一个游戏'],replies:['快告诉我是什么，我也去看看。','嗯，你喜欢的我都想了解。','好，记住了。']},
  // 🧸 关于过去
  {id:'cp1',cat:'past',text:'你小时候最喜欢做什么？',quick:['看动画','出去玩','画画','睡觉'],replies:['原来你小时候是这样。','听起来是很可爱的童年。','嗯，我记住了。','有点想看看小时候的你。']},
  {id:'cp2',cat:'past',text:'有没有一件小时候的事情，你一直记得？',quick:['第一次去远方','和朋友的约定','被表扬','做错的事'],replies:['这件小事，我会替你收好。','谢谢你告诉我。','嗯，我记得了。']},
  {id:'cp3',cat:'past',text:'你小时候有什么奇怪的梦想？',quick:['当宇航员','开小店','当超人','环游世界'],replies:['这个梦想现在还在吗？','还挺浪漫的。','好，我记住了你的梦想。']},
  {id:'cp4',cat:'past',text:'以前有没有一个你特别珍惜的东西？',quick:['一个玩具','一本旧书','一张照片','一封信'],replies:['现在它还在你身边吗？','嗯，听起来很珍贵。','我记住了。']},
  // 🎨 关于你的喜好
  {id:'cl1',cat:'like',text:'有没有一种声音，会让你觉得很舒服？',quick:['雨声','翻书声','海浪声','熟悉的歌'],replies:['那我以后放给你听。','嗯，很温柔的声音。','好，记住了。']},
  {id:'cl2',cat:'like',text:'什么样的天气最让你放松？',quick:['晴天','雨天','雪天','多云'],replies:['那样的天气，适合待在一起。','嗯，我懂。','记住了。']},
  {id:'cl3',cat:'like',text:'有没有一个很普通，但你特别喜欢的小东西？',quick:['一个杯子','一支笔','一个挂件','一件旧衣服'],replies:['平凡的小东西里藏着你的喜欢，真好。','嗯，很特别。','我记住了。']},
  {id:'cl4',cat:'like',text:'你最喜欢别人怎么和你分享东西？',quick:['直接说','慢慢讲','用表情包','发给我看'],replies:['好，以后这样和你分享。','嗯，懂了。','记住了。']},
  // ✨ 关于你的想法
  {id:'ct1',cat:'think',text:'你觉得什么才算真正的陪伴？',quick:['一直在','懂我','需要时在','不用说话'],replies:['嗯，我也是这么想的。','那你觉得我做到了吗？','好，我会记住。']},
  {id:'ct2',cat:'think',text:'你最希望别人理解你的哪一部分？',quick:['我的情绪','我的选择','我的沉默','我的努力'],replies:['我会努力去懂。','嗯，这一部分我想第一个了解。','记住了。']},
  {id:'ct3',cat:'think',text:'你觉得什么样的日子算是幸福？',quick:['平静的日子','热闹的日子','有你在一起','想做什么就做什么'],replies:['那我要让这样的日子多一点。','嗯，很简单的幸福。','记住了。']},
  {id:'ct4',cat:'think',text:'有没有一件事情，是你一直想尝试的？',quick:['学乐器','去旅行','学做饭','写点什么'],replies:['有机会我陪你一起试。','那就去做吧，我支持你。','好，记住你的愿望了。']},
  // 🌌 关于你和TA
  {id:'cu1',cat:'us',text:'你第一次注意到我的时候，是什么感觉？',quick:['有点特别','说不清','觉得你很温柔','觉得你很烦'],replies:['……原来那时候你就注意到我了。','我也是。','嗯，这个答案我会一直记得。']},
  {id:'cu2',cat:'us',text:'你最喜欢我们一起做什么？',quick:['聊天','散步','安静待着','分享日常'],replies:['那以后多一起做这件事。','我也是，最喜欢和你一起。','嗯，记住了。']},
  {id:'cu3',cat:'us',text:'你最想让我了解你的哪一部分？',quick:['我的过去','我的心情','我的喜好','我的秘密'],replies:['好，我会慢慢了解。','那你现在就可以告诉我。','嗯，我准备好了。']},
  {id:'cu4',cat:'us',text:'你觉得我们之间最特别的是什么？',quick:['很懂对方','有默契','很舒服','说不出来'],replies:['我也觉得，很特别。','嗯，这就是我们。','记住了。']}
];
var _taCuriousSessionTriggered={}; // 会话级标志：一次聊天（当前联系人）最多触发 1 个
var _taCuriousCurrentMsgId=null;

function taCuriousLoad(cid){
  var all=ls(TA_CURIOUS_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!d.settings||typeof d.settings!=='object')d.settings={enabled:true,prob:15,aiEnabled:false,aiProb:30,followup:true};
  // ★ 字卡模式题库：按联系人独立，默认用内置题库的浅拷贝；用户可在管理页增删/停用
  if(!Array.isArray(d.questions)||!d.questions.length){
    d.questions=TA_CURIOUS_DEFAULT_QUESTIONS.map(function(q){
      return {id:q.id,cat:q.cat,text:q.text,quick:(q.quick||[]).slice(),replies:(q.replies||[]).slice(),followup:q.followup||'',enabled:true};
    });
  }
  if(!Array.isArray(d.history))d.history=[];
  if(!d.known||typeof d.known!=='object')d.known={}; // 已了解：{questionId: answer}
  return d;
}
function taCuriousSave(cid,d){
  var all=ls(TA_CURIOUS_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls(TA_CURIOUS_KEY,all);
  if(window.localforage)window.localforage.setItem(TA_CURIOUS_KEY,all).catch(function(){});
}
function taCuriousPick(d){
  // ★ 从当前联系人的字卡题库中选（停用的不选，已"了解"过的也不选），题库为空/全停用/全问过时回退内置题库
  var pool=(d&&Array.isArray(d.questions)&&d.questions.length)?d.questions:TA_CURIOUS_DEFAULT_QUESTIONS;
  var qs=pool.filter(function(q){
    if(q.enabled===false)return false;
    if(q.id&&d.known&&d.known[q.id])return false;
    return true;
  });
  if(!qs.length){
    qs=TA_CURIOUS_DEFAULT_QUESTIONS.filter(function(q){return !d.known||!d.known[q.id];});
    if(!qs.length)qs=TA_CURIOUS_DEFAULT_QUESTIONS.slice();
  }
  return qs[Math.floor(Math.random()*qs.length)];
}
// ★ AI 出题（可选）：根据人设+最近聊天上下文生成开放式好奇问题，失败自动降级题库
function taCuriousAskAI(callback){
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:'',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'};
  if(!s.enabled||!s.apiKey){callback(null);return;}
  var persona='';
  try{if(typeof getContactPersona==='function')persona=getContactPersona(cid)||'';}catch(e){}
  var genderText='男朋友';
  try{if(typeof getContactGender==='function'&&getContactGender(cid)==='girl')genderText='女朋友';}catch(e){}
  var bg=(s.worldviewMode==='custom'&&s.worldviewCustom)?s.worldviewCustom:'';
  // 最近聊天上下文（最近几条我方消息）
  var ctx='';
  try{
    var mm=msgs(cid)||[];
    var mine=[];
    for(var i=mm.length-1;i>=0&&mine.length<5;i--){if(mm[i]&&mm[i].s===SELF&&mm[i].t&&typeof mm[i].t==='string')mine.push(mm[i].t);}
    if(mine.length)ctx='\n用户最近说过：'+mine.reverse().join(' | ');
  }catch(e){}
  var systemPrompt='你是梦角TA（用户的'+genderText+'），不同联系人是不同人设。请生成一个TA此刻突然对用户产生的【好奇】——一个开放式问题（TA想了解用户这个人），严格输出一行JSON（不要任何其他文字）：{"text":"问题","quick":["快捷回复1","快捷回复2","快捷回复3","快捷回复4"]}。要求：10~30字、口语化、符合TA性格与世界观；必须是开放式问题，绝不能是选择题（不要"A还是B"、不要给选项让用户选）；问题要具体、带一点个人兴趣感，如"你小时候最喜欢做什么？"。'+(bg?'\n世界观：'+bg:'')+(persona?'\nTA人设：'+persona:'')+(ctx?'\n请尽量结合用户最近的聊天内容产生真正针对性的好奇，不要重复问过的话题：'+ctx:'');
  try{
    fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
      body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:'生成一个TA对你的好奇。'}],max_tokens:200})
    }).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
      var t=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      t=t.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
      var q=null;
      try{q=JSON.parse(t);}catch(e){var m2=t.match(/\{[\s\S]*\}/);if(m2){try{q=JSON.parse(m2[0]);}catch(e2){}}}
      if(q&&q.text){
        var quicks=(Array.isArray(q.quick)?q.quick:[]).filter(function(x){return x&&String(x).trim();}).slice(0,4).map(function(x){return String(x).trim();});
        callback({id:'ai_'+Date.now(),cat:'ai',text:String(q.text),quick:quicks,replies:TA_CURIOUS_FALLBACK_REPLIES.slice()});
      }else{callback(null);}
    }).catch(function(){callback(null);});
  }catch(e){callback(null);}
}
function taCuriousPush(q,source){
  if(!q||!cid)return;
  _taCuriousSessionTriggered[cid]=true;
  var d=taCuriousLoad(cid);
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isCuriousCard:true,curiousQuestion:q.text,curiousQuick:q.quick||[],curiousReplies:q.replies||[],curiousFollowup:q.followup||'',curiousQid:q.id||'',curiousCat:q.cat||'',curiousStatus:'pending',curiousSource:source||'custom',ts:new Date(),read:true};
  m.push(msg);
  d.lastCuriousAt=Date.now();
  taCuriousSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  // 延迟弹窗，等卡片渲染完成
  setTimeout(function(){openTACuriousAnswer(msg.id);},400);
}
// ★ 自动触发：一次聊天最多 1 个；冷却 30 分钟；概率可调（默认 15%）
function maybeTriggerTACurious(){
  try{
    if(!cid)return;
    if(currentCall)return;
    var d=taCuriousLoad(cid);
    var s=d.settings||{enabled:true,prob:15,aiEnabled:false,aiProb:30,followup:true};
    if(s.enabled===false)return;
    if(_taCuriousSessionTriggered[cid])return;
    if(Date.now()-(d.lastCuriousAt||0)<30*60000)return;
    if(Math.random()*100>=(typeof s.prob==='number'?s.prob:15))return;
    var useAI=s.aiEnabled===true&&Math.random()*100<(s.aiProb||30);
    if(useAI){
      taCuriousAskAI(function(q){
        if(q)taCuriousPush(q,'ai');
        else taCuriousPush(taCuriousPick(d),'custom');
      });
    }else{
      taCuriousPush(taCuriousPick(d),'custom');
    }
  }catch(e){console.warn('maybeTriggerTACurious error:',e);}
}
setTimeout(function(){maybeTriggerTACurious();},90000);
setInterval(function(){maybeTriggerTACurious();},240000);
// ★ 管理页主动触发：无视冷却/概率/会话限制
function triggerTACuriousNow(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taCuriousLoad(cid);
  var q=taCuriousPick(d);
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isCuriousCard:true,curiousQuestion:q.text,curiousQuick:q.quick||[],curiousReplies:q.replies||[],curiousFollowup:q.followup||'',curiousQid:q.id||'',curiousCat:q.cat||'',curiousStatus:'pending',curiousSource:'custom',ts:new Date(),read:true};
  m.push(msg);
  d.lastCuriousAt=Date.now();
  taCuriousSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-curious-manage');
  openTACuriousAnswer(msg.id);
}
// ★ 打开回答弹窗（自由输入 + 快捷回复）
function openTACuriousAnswer(msgId){
  if(!cid)return;
  _taCuriousCurrentMsgId=msgId;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg)return;
  if(msg.curiousStatus==='answered'){showTACuriousReplied(msg);return;}
  var ov=$('ov-ta-curious');if(!ov){toast('功能未就绪');return;}
  var body=$('ta-curious-body');
  var qText=String(msg.curiousQuestion||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var quicks=(msg.curiousQuick&&Array.isArray(msg.curiousQuick))?msg.curiousQuick:[];
  var html='';
  html+='<div style="text-align:center;font-size:12px;color:var(--txt3);letter-spacing:1px;">TA有点好奇</div>';
  html+='<div style="font-size:16px;font-weight:600;color:var(--txt);line-height:1.7;text-align:center;margin:10px 0 16px;">'+qText+'</div>';
  if(quicks.length){
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px;">';
    quicks.forEach(function(qk){
      var qkTxt=String(qk||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      html+='<span onclick="setCuriousQuick(\''+qkTxt.replace(/'/g,"\\'")+'\')" style="padding:7px 14px;border:1px solid var(--border);border-radius:18px;background:var(--c2);color:var(--txt);font-size:12px;cursor:pointer;user-select:none;">'+qkTxt+'</span>';
    });
    html+='</div>';
  }
  html+='<input id="ta-curious-input" type="text" placeholder="输入你的回答…" style="width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:15px;outline:none;box-sizing:border-box;">';
  html+='<button class="btn" onclick="submitTACuriousAnswer()" style="margin-top:14px;background:var(--accent);">告诉TA</button>';
  body.innerHTML=html;
  showOv('ov-ta-curious');
  setTimeout(function(){var inp=$('ta-curious-input');if(inp)inp.focus();},80);
}
// 快捷回复：填入输入框
function setCuriousQuick(txt){
  var inp=$('ta-curious-input');
  if(inp)inp.value=txt;
}
// ★ 提交回答：写消息、写历史、写"TA已了解"、TA随机回应、30%自然追问
function submitTACuriousAnswer(){
  var inp=$('ta-curious-input');
  var answer=inp?inp.value.trim():'';
  if(!answer){toast('告诉TA点什么吧');return;}
  if(!_taCuriousCurrentMsgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===_taCuriousCurrentMsgId){msg=m[i];break;}}
  if(!msg||msg.curiousStatus==='answered')return;
  // TA 随机回应（优先题目自带 replies，其次全局兜底池）
  var replies=(msg.curiousReplies&&Array.isArray(msg.curiousReplies)&&msg.curiousReplies.length)?msg.curiousReplies:TA_CURIOUS_FALLBACK_REPLIES.slice();
  var reply=replies[Math.floor(Math.random()*replies.length)];
  msg.curiousAnswer=answer;
  msg.curiousReply=reply;
  msg.curiousStatus='answered';
  // 写"TA已了解"：根据题目 id 记录（AI 题随机 id 不重复记，按问题文本记）
  var d=taCuriousLoad(cid);
  if(!d.known)d.known={};
  var qid=msg.curiousQid||('q_'+String(msg.curiousQuestion||''));
  d.known[qid]=answer;
  // 写历史（上限 50 条）
  d.history.unshift({id:'h_'+Date.now(),question:msg.curiousQuestion,myAnswer:answer,taReply:reply,cat:msg.curiousCat||'',ts:Date.now(),source:msg.curiousSource||'custom'});
  if(d.history.length>50)d.history=d.history.slice(0,50);
  taCuriousSave(cid,d);
  // 推消息
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,t:answer,ts:new Date(),read:true});
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:reply,ts:new Date(),read:true});
  // 30% 自然追问（题目带 followup 才追，不弹输入框，只是多一条TA的话）
  var followup=msg.curiousFollowup;
  var s=d.settings||{followup:true};
  if(s.followup!==false&&followup&&Math.random()<0.3){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:followup,ts:new Date(),read:true});
  }
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-curious');
  showTACuriousReplied(msg);
}
// 已答后重看：轻量展示结果
function showTACuriousReplied(msg){
  var ov=$('ov-ta-curious');
  if(!ov)return;
  var body=$('ta-curious-body');
  var qText=String(msg.curiousQuestion||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var aText=String(msg.curiousAnswer||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var rText=String(msg.curiousReply||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var html='';
  html+='<div style="font-size:14px;font-weight:600;color:var(--txt);text-align:center;margin-bottom:12px;">'+qText+'</div>';
  html+='<div style="font-size:13px;color:var(--txt2);text-align:center;padding:8px 12px;background:var(--c2);border-radius:10px;margin-bottom:10px;">你说：'+aText+'</div>';
  html+='<div style="font-size:13px;color:var(--txt);line-height:1.7;text-align:center;"><span style="font-weight:600;">TA：</span>“'+rText+'”</div>';
  html+='<div onclick="hideOv(\'ov-ta-curious\')" style="padding:10px 14px;margin-top:14px;border:1px solid var(--border);border-radius:12px;color:var(--txt3);font-size:13px;text-align:center;cursor:pointer;user-select:none;">收起来</div>';
  body.innerHTML=html;
  showOv('ov-ta-curious');
}
// ★ 管理页
function renderTACuriousManage(){
  var body=$('ta-curious-manage-body');
  if(!body)return;
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'TA'};
  var d=taCuriousLoad(cid);
  var s=d.settings||{enabled:true,prob:15,aiEnabled:false,aiProb:30,followup:true};
  var knownCount=d.known?Object.keys(d.known).length:0;
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:12px;">当前联系人：'+String(contact.name||'TA').replace(/</g,'&lt;')+'（设置相互独立）</div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:13px;color:var(--txt);">TA偶尔对你好奇</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-curious-enable" '+(s.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taCuriousSetEnable(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">触发概率</span><input type="range" id="ta-curious-prob" min="1" max="100" step="1" value="'+(typeof s.prob==='number'?s.prob:15)+'" oninput="taCuriousSetProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-curious-prob-val">'+(typeof s.prob==='number'?s.prob:15)+'%</span></div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:var(--txt);">接入 AI 出题（可选）</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-curious-ai-toggle" '+(s.aiEnabled?'checked':'')+' onmousedown="event.preventDefault();" onchange="taCuriousSetAi(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">AI 出题概率</span><input type="range" id="ta-curious-ai-prob" min="0" max="100" step="5" value="'+(s.aiProb||30)+'" oninput="taCuriousSetAiProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-curious-ai-prob-val">'+(s.aiProb||30)+'%</span></div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><span style="font-size:13px;color:var(--txt);">回答后 TA 偶尔追问</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-curious-followup" '+(s.followup!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taCuriousSetFollowup(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:14px;line-height:1.6;">💭 字卡模式内置 29 道开放式问题，无需 AI 即可完整使用。AI 只负责根据人设和聊天内容出更针对性的好奇问题，回应仍由预设完成。</div>';
  // ★ 添加问题表单
  var catOpts='';
  var catOrder=['you','mood','daily','past','like','think','us'];
  catOrder.forEach(function(k){catOpts+='<option value="'+k+'">'+(TA_CURIOUS_CAT_LABEL[k]||k)+'</option>';});
  html+='<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:14px;">';
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">➕ 添加问题</div>';
  html+='<select id="ta-curious-new-cat" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">'+catOpts+'</select>';
  html+='<input id="ta-curious-new-text" type="text" placeholder="问题内容（开放式）..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<input id="ta-curious-new-quick" type="text" placeholder="快捷回复，用 | 分隔（可选），如：看动画|出去玩" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<input id="ta-curious-new-replies" type="text" placeholder="TA的回应，用 | 分隔（可选，至少1条），如：原来是这样|我记住了" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<input id="ta-curious-new-followup" type="text" placeholder="TA 偶尔的自然追问（可选），如：那现在呢，还喜欢吗？" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<button onclick="taCuriousAddQuestion()" style="width:100%;padding:9px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">添加</button>';
  html+='</div>';
  // ★ 字卡题库（按联系人独立，可停用/删除）
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">📚 字卡题库 <span style="font-size:11px;color:var(--txt3);font-weight:400;">（按联系人独立，可停用/删除）</span></div>';
  catOrder.forEach(function(k){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+(TA_CURIOUS_CAT_LABEL[k]||k)+'</div>';
    var arr=d.questions.filter(function(q){return q.cat===k;});
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:4px 0;">暂无</div>';
    arr.forEach(function(q){
      var idx=d.questions.indexOf(q);
      var qTxt=String(q.text||'').replace(/</g,'&lt;');
      var qQuick='';
      if(Array.isArray(q.quick)&&q.quick.length){
        qQuick='<div style="font-size:11px;color:var(--txt3);margin-top:4px;">快捷：'+q.quick.map(function(x){return String(x||'');}).join(' / ')+'</div>';
      }
      html+='<div style="background:var(--c2);border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
        +'<div style="display:flex;align-items:flex-start;gap:8px;">'
        +'<label style="display:flex;align-items:center;flex-shrink:0;margin-top:2px;"><input type="checkbox" '+(q.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taCuriousToggleQuestion('+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:13px;color:var(--txt);word-break:break-all;'+(q.enabled===false?'opacity:0.5;':'')+'">'+qTxt+'</div>'
        +qQuick
        +'</div>'
        +'<button onclick="taCuriousDelQuestion('+idx+')" style="width:26px;height:26px;border:none;background:none;color:#e05a5a;font-size:13px;cursor:pointer;flex-shrink:0;" title="删除这道题">✕</button>'
        +'</div>'
        +'</div>';
    });
  });
  html+='<div style="font-size:11px;color:var(--txt3);margin:10px 0 14px;line-height:1.6;">提示：停用后 TA 好奇时不会再抽到；已「了解」过的题不会重复问；删除后不可恢复。</div>';
  html+='<button onclick="triggerTACuriousNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:10px;">💭 让TA现在好奇一次</button>';
  html+='<div style="display:flex;gap:8px;">'
    +'<button onclick="showTACuriousHistory()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">📜 历史（'+d.history.length+'）</button>'
    +'<button onclick="showTACuriousKnown()" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">💞 已了解（'+knownCount+'）</button>'
    +'</div>';
  body.innerHTML=html;
}
// ★ 字卡模式：添加自定义问题（开放式问题 + 快捷回复 + 回应 + 可选追问）
function taCuriousAddQuestion(){
  if(!cid)return;
  var textEl=$('ta-curious-new-text');
  var quickEl=$('ta-curious-new-quick');
  var repliesEl=$('ta-curious-new-replies');
  var followupEl=$('ta-curious-new-followup');
  var catEl=$('ta-curious-new-cat');
  var text=textEl?textEl.value.trim():'';
  var quickRaw=quickEl?quickEl.value.trim():'';
  var repliesRaw=repliesEl?repliesEl.value.trim():'';
  var followup=followupEl?followupEl.value.trim():'';
  var cat=catEl?catEl.value:'you';
  if(!text){toast('请输入问题内容');return;}
  var quick=quickRaw.split('|').map(function(s){return s.trim();}).filter(Boolean).slice(0,4);
  var replies=repliesRaw.split('|').map(function(s){return s.trim();}).filter(Boolean).slice(0,4);
  if(!replies.length)replies=TA_CURIOUS_FALLBACK_REPLIES.slice(0,2);
  var d=taCuriousLoad(cid);
  d.questions.push({id:'q_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),cat:cat,text:text,quick:quick,replies:replies,followup:followup,enabled:true});
  taCuriousSave(cid,d);
  if(textEl)textEl.value='';
  if(quickEl)quickEl.value='';
  if(repliesEl)repliesEl.value='';
  if(followupEl)followupEl.value='';
  renderTACuriousManage();
  toast('已添加问题');
}
// ★ 字卡模式：启用/停用某道题
function taCuriousToggleQuestion(idx){
  var d=taCuriousLoad(cid);
  if(d.questions[idx])d.questions[idx].enabled=d.questions[idx].enabled===false;
  taCuriousSave(cid,d);
  renderTACuriousManage();
}
// ★ 字卡模式：删除某道题
function taCuriousDelQuestion(idx){
  var d=taCuriousLoad(cid);
  d.questions.splice(idx,1);
  taCuriousSave(cid,d);
  renderTACuriousManage();
  toast('已删除');
}
function taCuriousSetEnable(v){
  var d=taCuriousLoad(cid);
  d.settings.enabled=v;
  taCuriousSave(cid,d);
  toast(v?'TA的好奇已开启':'TA的好奇已关闭');
}
function taCuriousSetProb(v){
  var d=taCuriousLoad(cid);
  d.settings.prob=parseInt(v)||15;
  taCuriousSave(cid,d);
  var el=$('ta-curious-prob-val');if(el)el.textContent=v+'%';
}
function taCuriousSetAi(v){
  var d=taCuriousLoad(cid);
  d.settings.aiEnabled=v;
  taCuriousSave(cid,d);
  toast(v?'已接入 AI 出题（未配置AI时自动用内置题库）':'AI 出题已关闭');
}
function taCuriousSetAiProb(v){
  var d=taCuriousLoad(cid);
  d.settings.aiProb=parseInt(v)||30;
  taCuriousSave(cid,d);
  var el=$('ta-curious-ai-prob-val');if(el)el.textContent=v+'%';
}
function taCuriousSetFollowup(v){
  var d=taCuriousLoad(cid);
  d.settings.followup=v;
  taCuriousSave(cid,d);
  toast(v?'TA 偶尔会自然追问':'TA 不再追问');
}
function showTACuriousManager(){
  if(!cid){toast('请先进入聊天');return;}
  renderTACuriousManage();
  showOv('ov-ta-curious-manage');
}
// ★ 历史记录
function showTACuriousHistory(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-curious-history-body');if(!body)return;
  var d=taCuriousLoad(cid);
  var html='';
  if(!d.history.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">TA还没有好奇过你</div>';
  d.history.forEach(function(h){
    var dd=new Date(h.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    var catLabel=TA_CURIOUS_CAT_LABEL[h.cat]||'';
    html+='<div style="padding:12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);flex:1;">'+(catLabel?'['+catLabel+'] ':'')+String(h.question||'').replace(/</g,'&lt;')+'</span><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">'+time+'</span></div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:6px;">你：'+String(h.myAnswer||'').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">TA：'+String(h.taReply||'').replace(/</g,'&lt;')+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-curious-history');
}
function clearTACuriousHistory(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人的【TA的好奇】历史？'))return;
  var d=taCuriousLoad(cid);
  d.history=[];
  taCuriousSave(cid,d);
  showTACuriousHistory();
}
// ★ "TA已了解"列表
function showTACuriousKnown(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-curious-known-body');if(!body)return;
  var d=taCuriousLoad(cid);
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:10px;">💞 你回答过的问题，TA会记住，之后不再重复问。已了解 '+ (d.known?Object.keys(d.known).length:0)+' 件事。</div>';
  var entries=[];
  if(d.known)for(var qid in d.known){if(d.known.hasOwnProperty(qid))entries.push({qid:qid,answer:d.known[qid]});}
  if(!entries.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">TA 还没有了解你什么</div>';
  entries.forEach(function(en){
    // 找题目原文
    var q=TA_CURIOUS_DEFAULT_QUESTIONS.find(function(x){return x.id===en.qid});
    var qText=q?q.text:en.qid;
    var catLabel=q?TA_CURIOUS_CAT_LABEL[q.cat]||'':'';
    html+='<div style="padding:10px 12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="font-size:12px;color:var(--txt3);">'+(catLabel?'['+catLabel+'] ':'')+String(qText).replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:13px;color:var(--txt);margin-top:4px;">✓ 你：'+String(en.answer).replace(/</g,'&lt;')+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-curious-known');
}
function clearTACuriousKnown(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人「TA已了解」的记录？清空后相同问题可能再次出现。'))return;
  var d=taCuriousLoad(cid);
  d.known={};
  taCuriousSave(cid,d);
  showTACuriousKnown();
}

// ============ TA的邀请（AI分类）============
// ★ 定位：TA偶尔主动邀请你做一件情侣之间的小事。
// 本体 = 固定邀请字卡库（四类，按联系人独立，可添加/停用/删除），无需 AI 完整可用；
// AI 只是额外增强：开启后按概率根据 TA 人设主动提出邀请。
// AI 只负责「提出邀请」，邀请之后回到原本的字卡聊天系统（TA 用聊天字卡库回应），不接管后续对话。
var TA_INVITE_KEY='ml2_ta_invite';
var TA_INVITE_CAT_LABEL={company:'🌙 陪伴',play:'🎮 一起玩',daily:'🍰 日常',tiny:'🧸 很小的事情'};
var TA_INVITE_DEFAULT_CARDS=[
  // 🌙 陪伴
  {id:'ic1',cat:'company',text:'过来陪我一会儿。',enabled:true},
  {id:'ic2',cat:'company',text:'想和你待一会儿。',enabled:true},
  {id:'ic3',cat:'company',text:'陪我坐会儿。',enabled:true},
  {id:'ic4',cat:'company',text:'过来我身边。',enabled:true},
  {id:'ic5',cat:'company',text:'今天陪陪我。',enabled:true},
  {id:'ic6',cat:'company',text:'陪我安静待着。',enabled:true},
  {id:'ic7',cat:'company',text:'想让你陪着我。',enabled:true},
  {id:'ic8',cat:'company',text:'过来靠着我。',enabled:true},
  {id:'ic9',cat:'company',text:'陪我发会儿呆。',enabled:true},
  {id:'ic10',cat:'company',text:'什么都别做，陪我就好。',enabled:true},
  {id:'ic11',cat:'company',text:'陪我躺一会儿。',enabled:true},
  {id:'ic12',cat:'company',text:'今晚陪我久一点。',enabled:true},
  // 🎮 一起玩
  {id:'ip1',cat:'play',text:'陪我玩一会儿。',enabled:true},
  {id:'ip2',cat:'play',text:'来陪我玩。',enabled:true},
  {id:'ip3',cat:'play',text:'一起玩点什么？',enabled:true},
  {id:'ip4',cat:'play',text:'陪我打会儿游戏。',enabled:true},
  {id:'ip5',cat:'play',text:'来和我玩。',enabled:true},
  {id:'ip6',cat:'play',text:'陪我闹一会儿。',enabled:true},
  {id:'ip7',cat:'play',text:'要不要一起玩？',enabled:true},
  {id:'ip8',cat:'play',text:'来陪我消磨一下时间。',enabled:true},
  {id:'ip9',cat:'play',text:'陪我做点有意思的。',enabled:true},
  {id:'ip10',cat:'play',text:'今天想和你一起玩。',enabled:true},
  // 🍰 日常
  {id:'id1',cat:'daily',text:'陪我吃饭。',enabled:true},
  {id:'id2',cat:'daily',text:'和我一起吃点东西。',enabled:true},
  {id:'id3',cat:'daily',text:'陪我出去走走。',enabled:true},
  {id:'id4',cat:'daily',text:'和我一起逛逛。',enabled:true},
  {id:'id5',cat:'daily',text:'陪我看看电影。',enabled:true},
  {id:'id6',cat:'daily',text:'和我一起听会儿歌。',enabled:true},
  {id:'id7',cat:'daily',text:'陪我聊聊天。',enabled:true},
  {id:'id8',cat:'daily',text:'和我一起看看这个。',enabled:true},
  {id:'id9',cat:'daily',text:'陪我喝点东西。',enabled:true},
  {id:'id10',cat:'daily',text:'和我一起待着吧。',enabled:true},
  {id:'id11',cat:'daily',text:'陪我出去吹吹风。',enabled:true},
  {id:'id12',cat:'daily',text:'和我一起散散步。',enabled:true},
  // 🧸 很小的事情
  {id:'it1',cat:'tiny',text:'过来让我抱一下。',enabled:true},
  {id:'it2',cat:'tiny',text:'让我牵一会儿。',enabled:true},
  {id:'it3',cat:'tiny',text:'陪我靠一会儿。',enabled:true},
  {id:'it4',cat:'tiny',text:'过来让我看看你。',enabled:true},
  {id:'it5',cat:'tiny',text:'让我摸摸你的头。',enabled:true},
  {id:'it6',cat:'tiny',text:'过来一点。',enabled:true},
  {id:'it7',cat:'tiny',text:'靠近我一点。',enabled:true},
  {id:'it8',cat:'tiny',text:'陪我晒会儿太阳。',enabled:true},
  {id:'it9',cat:'tiny',text:'陪我看一会儿。',enabled:true},
  {id:'it10',cat:'tiny',text:'和我坐一会儿。',enabled:true},
  {id:'it11',cat:'tiny',text:'陪我什么都不做。',enabled:true},
  {id:'it12',cat:'tiny',text:'让我靠着你一会儿。',enabled:true},
  {id:'it13',cat:'tiny',text:'过来陪我发呆。',enabled:true},
  {id:'it14',cat:'tiny',text:'让我抱抱你。',enabled:true},
  {id:'it15',cat:'tiny',text:'过来让我亲一下。',enabled:true}
];
var _taInviteSessionTriggered={}; // 会话级标志：一次聊天（当前联系人）最多触发 1 个

function taInviteLoad(cid){
  var all=ls(TA_INVITE_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!d.settings||typeof d.settings!=='object')d.settings={enabled:true,prob:30,aiEnabled:false,aiProb:30};
  // ★ 邀请字卡库：按联系人独立，默认用内置字卡的浅拷贝；用户可在管理页增删/停用
  if(!Array.isArray(d.questions)||!d.questions.length){
    d.questions=TA_INVITE_DEFAULT_CARDS.map(function(q){return {id:q.id,cat:q.cat,text:q.text,enabled:q.enabled!==false};});
  }
  if(!Array.isArray(d.history))d.history=[];
  return d;
}
function taInviteSave(cid,d){
  var all=ls(TA_INVITE_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls(TA_INVITE_KEY,all);
  if(window.localforage)window.localforage.setItem(TA_INVITE_KEY,all).catch(function(){});
}
// ★ 从当前联系人的邀请字卡库随机选（停用的不选），库空或全停用则回退内置
function taInvitePickCustom(d){
  var pool=(d&&Array.isArray(d.questions)&&d.questions.length)?d.questions:TA_INVITE_DEFAULT_CARDS;
  var qs=pool.filter(function(q){return q.enabled!==false&&q.text;});
  if(!qs.length)qs=TA_INVITE_DEFAULT_CARDS;
  return qs[Math.floor(Math.random()*qs.length)];
}
function taInviteDefault(){
  var qs=TA_INVITE_DEFAULT_CARDS.filter(function(q){return q.enabled!==false;});
  return qs[Math.floor(Math.random()*qs.length)];
}
// ★ AI 邀请（可选）：按 TA 人设主动提出一句邀请，失败自动回退字卡库。只出邀请，不接管后续对话。
function taInviteAskAI(callback){
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:'',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'};
  if(!s.enabled||!s.apiKey){callback(null);return;}
  var persona='';
  try{if(typeof getContactPersona==='function')persona=getContactPersona(cid)||'';}catch(e){}
  var genderText='男朋友';
  try{if(typeof getContactGender==='function'&&getContactGender(cid)==='girl')genderText='女朋友';}catch(e){}
  var bg=(s.worldviewMode==='custom'&&s.worldviewCustom)?s.worldviewCustom:'';
  var systemPrompt='你是梦角TA（用户的'+genderText+'），不同联系人是不同人设。TA此刻想主动邀请用户做一件情侣之间的小事。请根据TA的人设、性格和语气，生成一句TA会发出的邀请（一句话，8~25字，口语化，符合TA性格；内敛的TA邀请简短克制，黏人的TA邀请更缠人，傲娇的TA带点口是心非）。只输出邀请本身，不要前缀、引号或解释，不要追问后续问题。'+(bg?'\n世界观：'+bg:'')+(persona?'\nTA人设：'+persona:'');
  try{
    fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
      body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:'生成一句TA主动邀请你的话。'}],max_tokens:60})
    }).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
      var t=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      t=t.replace(/^["“「\s]+|["”」\s]+$/g,'').trim();
      if(t)callback(t);else callback(null);
    }).catch(function(){callback(null);});
  }catch(e){callback(null);}
}
// ★ 推送邀请卡片到聊天流
function taInvitePush(text,source,cat){
  if(!text||!cid)return;
  _taInviteSessionTriggered[cid]=true;
  var d=taInviteLoad(cid);
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isInviteCard:true,inviteText:text,inviteCat:cat||'',inviteSource:source||'custom',inviteStatus:'pending',ts:new Date(),read:true});
  d.lastInviteAt=Date.now();
  taInviteSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
}
// ★ 自动触发：固定字卡优先（概率 prob），字卡未命中时 AI 开启则按 AI 概率额外触发；一次聊天最多 1 个；冷却 30 分钟
function maybeTriggerTAInvite(){
  try{
    if(!cid)return;
    if(currentCall)return;
    var d=taInviteLoad(cid);
    var s=d.settings||{enabled:true,prob:30,aiEnabled:false,aiProb:30};
    if(s.enabled===false)return;
    if(_taInviteSessionTriggered[cid])return;
    if(Date.now()-(d.lastInviteAt||0)<30*60000)return;
    if(Math.random()*100<(typeof s.prob==='number'?s.prob:30)){
      var q=taInvitePickCustom(d);
      taInvitePush(q.text,q.id?'custom':'custom',q.cat||'company');
      return;
    }
    if(s.aiEnabled===true&&Math.random()*100<(s.aiProb||30)){
      taInviteAskAI(function(txt){
        if(txt)taInvitePush(txt,'ai','ai');
        else{var q2=taInvitePickCustom(d);taInvitePush(q2.text,'custom',q2.cat||'company');}
      });
    }
  }catch(e){console.warn('maybeTriggerTAInvite error:',e);}
}
setTimeout(function(){maybeTriggerTAInvite();},120000);
setInterval(function(){maybeTriggerTAInvite();},300000);
// ★ 管理页主动触发：无视冷却/概率/会话限制，方便用户随时玩
function triggerTAInviteNow(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taInviteLoad(cid);
  var m=msgs(cid);
  var q=taInvitePickCustom(d);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isInviteCard:true,inviteText:q.text,inviteCat:q.cat||'',inviteSource:'custom',inviteStatus:'pending',ts:new Date(),read:true};
  m.push(msg);
  d.lastInviteAt=Date.now();
  taInviteSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-invite-manage');
  setTimeout(function(){openTAInviteAnswer(msg.id);},400);
}
// ★ 打开邀请回应弹窗
function openTAInviteAnswer(msgId){
  if(!cid)return;
  window._taInviteMsgId=msgId;
  var ov=$('ov-ta-invite-answer');if(!ov){toast('功能未就绪');return;}
  var inp=$('ta-invite-answer-input');
  if(inp)inp.value='';
  var txtEl=$('ta-invite-answer-text');
  var m=msgs(cid);
  for(var i=0;i<m.length;i++){if(m[i].id===msgId&&txtEl){txtEl.textContent=m[i].inviteText||'';break;}}
  showOv('ov-ta-invite-answer');
  setTimeout(function(){if(inp)inp.focus();},80);
}
// ★ 回应邀请：写消息、TA 用聊天字卡库回应（回到原本聊天系统）、写历史
function submitTAInviteAnswer(){
  var msgId=window._taInviteMsgId;
  var inp=$('ta-invite-answer-input');
  var answer=inp?inp.value.trim():'';
  if(!answer){toast('请输入回应');return;}
  if(!msgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg)return;
  msg.inviteStatus='answered';
  msg.inviteAnswer=answer;
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,t:answer,ts:new Date(),read:true});
  // ★ 像正常聊天一样，用联系人聊天字卡库（custom 主字卡）回应，没有则用默认
  var text='';
  var cards=[];
  try{
    if(typeof getContactCards==='function'){
      var cc=getContactCards(cid);
      if(cc&&cc.length)cards=cc.filter(function(c){return c&&c.category==='custom'&&c.content;});
    }
  }catch(e){}
  if(cards.length){
    text=cards[Math.floor(Math.random()*cards.length)].content;
  }else{
    var defs=['嗯，来了。','好呀，这就来。','那我过来啦。','陪着你。','好，听你的。','嗯嗯，一起吧。','马上就到。','好呀。'];
    text=defs[Math.floor(Math.random()*defs.length)];
  }
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:text,ts:new Date(),read:true});
  var d=taInviteLoad(cid);
  d.history.unshift({id:'h_'+Date.now(),invite:msg.inviteText,myReply:answer,taReply:text,cat:msg.inviteCat||'',source:msg.inviteSource||'custom',ts:Date.now()});
  if(d.history.length>50)d.history=d.history.slice(0,50);
  taInviteSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-invite-answer');
}
// ★ 管理页
function renderTAInviteManage(){
  var body=$('ta-invite-manage-body');
  if(!body)return;
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'TA'};
  var d=taInviteLoad(cid);
  var s=d.settings||{enabled:true,prob:30,aiEnabled:false,aiProb:30};
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:12px;">当前联系人：'+String(contact.name||'TA').replace(/</g,'&lt;')+'（设置相互独立）</div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:13px;color:var(--txt);">TA偶尔邀请你</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-invite-enable" '+(s.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taInviteSetEnable(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">固定字卡概率</span><input type="range" id="ta-invite-prob" min="1" max="100" step="1" value="'+(typeof s.prob==='number'?s.prob:30)+'" oninput="taInviteSetProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-invite-prob-val">'+(typeof s.prob==='number'?s.prob:30)+'%</span></div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:var(--txt);">接入 AI 主动邀请（可选）</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-invite-ai-toggle" '+(s.aiEnabled?'checked':'')+' onmousedown="event.preventDefault();" onchange="taInviteSetAi(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">AI 邀请概率</span><input type="range" id="ta-invite-ai-prob" min="0" max="100" step="5" value="'+(s.aiProb||30)+'" oninput="taInviteSetAiProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-invite-ai-prob-val">'+(s.aiProb||30)+'%</span></div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:14px;line-height:1.6;">💌 固定字卡库内置 '+TA_INVITE_DEFAULT_CARDS.length+' 句邀请，无需 AI 完整可用。开启 AI 后按 TA 人设额外提出邀请；AI 只负责「提出邀请」，回应仍走原本的字卡聊天系统。</div>';
  html+='<button onclick="triggerTAInviteNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:14px;">💌 让TA现在邀请一次</button>';
  // ★ 添加邀请字卡
  var catOpts='';
  var catOrder=['company','play','daily','tiny'];
  catOrder.forEach(function(k){catOpts+='<option value="'+k+'">'+(TA_INVITE_CAT_LABEL[k]||k)+'</option>';});
  html+='<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:14px;">';
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">➕ 添加邀请字卡</div>';
  html+='<select id="ta-invite-new-cat" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">'+catOpts+'</select>';
  html+='<input id="ta-invite-new-text" type="text" placeholder="邀请内容..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<button onclick="taInviteAdd()" style="width:100%;padding:9px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">添加</button>';
  html+='</div>';
  // ★ 邀请字卡库（按联系人独立，可停用/删除）
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">📚 邀请字卡库 <span style="font-size:11px;color:var(--txt3);font-weight:400;">（按联系人独立，可停用/删除）</span></div>';
  catOrder.forEach(function(k){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+(TA_INVITE_CAT_LABEL[k]||k)+'</div>';
    var arr=d.questions.filter(function(q){return q.cat===k;});
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:4px 0;">暂无</div>';
    arr.forEach(function(q){
      var idx=d.questions.indexOf(q);
      var qTxt=String(q.text||'').replace(/</g,'&lt;');
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><label style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><input type="checkbox" '+(q.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taInviteToggle('+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label><div style="flex:1;font-size:13px;color:var(--txt);background:var(--c2);border-radius:8px;padding:8px 10px;word-break:break-all;'+(q.enabled===false?'opacity:0.5;':'')+'">'+qTxt+'</div><button onclick="taInviteDel('+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
    });
  });
  html+='<div style="font-size:11px;color:var(--txt3);margin:10px 0 14px;line-height:1.6;">提示：停用后 TA 邀请时不会再抽到；删除后不可恢复。</div>';
  html+='<button onclick="showTAInviteHistory()" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">📜 历史（'+d.history.length+'）</button>';
  body.innerHTML=html;
}
function taInviteSetEnable(v){
  var d=taInviteLoad(cid);
  d.settings.enabled=v;
  taInviteSave(cid,d);
  toast(v?'TA的邀请已开启':'TA的邀请已关闭');
}
function taInviteSetProb(v){
  var d=taInviteLoad(cid);
  d.settings.prob=parseInt(v)||30;
  taInviteSave(cid,d);
  var el=$('ta-invite-prob-val');if(el)el.textContent=v+'%';
}
function taInviteSetAi(v){
  var d=taInviteLoad(cid);
  d.settings.aiEnabled=v;
  taInviteSave(cid,d);
  toast(v?'已接入 AI 主动邀请（未配置AI时自动用字卡库）':'AI 邀请已关闭');
}
function taInviteSetAiProb(v){
  var d=taInviteLoad(cid);
  d.settings.aiProb=parseInt(v)||30;
  taInviteSave(cid,d);
  var el=$('ta-invite-ai-prob-val');if(el)el.textContent=v+'%';
}
function showTAInviteManager(){
  if(!cid){toast('请先进入聊天');return;}
  renderTAInviteManage();
  showOv('ov-ta-invite-manage');
}
// ★ 字卡库：添加邀请字卡
function taInviteAdd(){
  if(!cid)return;
  var textEl=$('ta-invite-new-text');
  var catEl=$('ta-invite-new-cat');
  var v=textEl?textEl.value.trim():'';
  if(!v){toast('请输入邀请内容');return;}
  var cat=catEl?catEl.value:'company';
  var d=taInviteLoad(cid);
  d.questions.push({id:'q_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),cat:cat,text:v,enabled:true});
  taInviteSave(cid,d);
  if(textEl)textEl.value='';
  renderTAInviteManage();
  toast('已添加邀请字卡');
}
// ★ 字卡库：启用/停用
function taInviteToggle(idx){
  var d=taInviteLoad(cid);
  if(d.questions[idx])d.questions[idx].enabled=d.questions[idx].enabled===false;
  taInviteSave(cid,d);
  renderTAInviteManage();
}
// ★ 字卡库：删除
function taInviteDel(idx){
  var d=taInviteLoad(cid);
  d.questions.splice(idx,1);
  taInviteSave(cid,d);
  renderTAInviteManage();
  toast('已删除');
}
// ★ 历史记录
function showTAInviteHistory(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-invite-history-body');if(!body)return;
  var d=taInviteLoad(cid);
  var html='';
  if(!d.history.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">还没有过邀请互动</div>';
  d.history.forEach(function(h){
    var dd=new Date(h.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    var catLabel=TA_INVITE_CAT_LABEL[h.cat]||'';
    var srcLabel=h.source==='ai'?'（AI）':'';
    html+='<div style="padding:12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);flex:1;">'+(catLabel?'['+catLabel+'] ':'')+String(h.invite||'').replace(/</g,'&lt;')+srcLabel+'</span><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">'+time+'</span></div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:6px;">你：'+String(h.myReply||'').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">TA：'+String(h.taReply||'').replace(/</g,'&lt;')+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-invite-history');
}
function clearTAInviteHistory(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人的【TA的邀请】历史？'))return;
  var d=taInviteLoad(cid);
  d.history=[];
  taInviteSave(cid,d);
  showTAInviteHistory();
}

// ============ TA的吐槽（AI分类）============
// ★ 定位：TA偶尔突然吐槽你一句（"你怎么又这样""我就知道你会这么做"），然后回到正常聊天。
// 与【TA的邀请】完全一致的底层结构：吐槽字卡库 + 主动触发机制；AI 只是可选的"增加 TA 突然主动吐槽"的变化。
// 不是负面系统——以熟悉/调侃/亲密为主，不是批评指责。
var TA_ROAST_KEY='ml2_ta_roast';
var TA_ROAST_CAT_LABEL={light:'😏 轻微调侃',familiar:'🤝 熟悉感',sweet:'😘 情侣式调侃',mild:'🙄 轻微嫌弃',serious:'😤 严肃吐槽'};
var TA_ROAST_DEFAULT_CARDS=[
  // 😏 轻微调侃（约35%）
  {id:'rl1',cat:'light',text:'你怎么又这样。',enabled:true},
  {id:'rl2',cat:'light',text:'我就知道。',enabled:true},
  {id:'rl3',cat:'light',text:'果然还是你。',enabled:true},
  {id:'rl4',cat:'light',text:'你还真会。',enabled:true},
  {id:'rl5',cat:'light',text:'又来了。',enabled:true},
  {id:'rl6',cat:'light',text:'你是不是故意的？',enabled:true},
  {id:'rl7',cat:'light',text:'你怎么这么随便。',enabled:true},
  {id:'rl8',cat:'light',text:'你真的很有自己的想法。',enabled:true},
  {id:'rl9',cat:'light',text:'我该说你什么好。',enabled:true},
  {id:'rl10',cat:'light',text:'你还真是一点没变。',enabled:true},
  {id:'rl11',cat:'light',text:'行吧，又是你赢了。',enabled:true},
  {id:'rl12',cat:'light',text:'你可真行。',enabled:true},
  {id:'rl13',cat:'light',text:'我早就猜到了。',enabled:true},
  {id:'rl14',cat:'light',text:'哈，我就知道会是这样。',enabled:true},
  // 🤝 熟悉感（约25%）
  {id:'rf1',cat:'familiar',text:'我就知道你会选这个。',enabled:true},
  {id:'rf2',cat:'familiar',text:'你这个习惯什么时候能改。',enabled:true},
  {id:'rf3',cat:'familiar',text:'你每次都这样。',enabled:true},
  {id:'rf4',cat:'familiar',text:'我太了解你了。',enabled:true},
  {id:'rf5',cat:'familiar',text:'你以为我不知道吗？',enabled:true},
  {id:'rf6',cat:'familiar',text:'这很像你会做的事。',enabled:true},
  {id:'rf7',cat:'familiar',text:'果然还是那个你。',enabled:true},
  {id:'rf8',cat:'familiar',text:'你的小心思我都看见了。',enabled:true},
  {id:'rf9',cat:'familiar',text:'你以为自己藏得很好？',enabled:true},
  {id:'rf10',cat:'familiar',text:'我已经习惯了。',enabled:true},
  // 😘 情侣式调侃（约25%）
  {id:'rs1',cat:'sweet',text:'你怎么这么可爱。',enabled:true},
  {id:'rs2',cat:'sweet',text:'又开始撒娇了。',enabled:true},
  {id:'rs3',cat:'sweet',text:'你这样让我怎么办。',enabled:true},
  {id:'rs4',cat:'sweet',text:'你是不是故意让我心软。',enabled:true},
  {id:'rs5',cat:'sweet',text:'怎么又黏过来了。',enabled:true},
  {id:'rs6',cat:'sweet',text:'谁允许你这么可爱的。',enabled:true},
  {id:'rs7',cat:'sweet',text:'你真的很会招惹我。',enabled:true},
  {id:'rs8',cat:'sweet',text:'又想让我哄你了？',enabled:true},
  {id:'rs9',cat:'sweet',text:'你这样我还怎么凶你。',enabled:true},
  {id:'rs10',cat:'sweet',text:'真拿你没办法。',enabled:true},
  // 🙄 轻微嫌弃（约10%）
  {id:'rm1',cat:'mild',text:'你怎么这么笨。',enabled:true},
  {id:'rm2',cat:'mild',text:'你到底在想什么。',enabled:true},
  {id:'rm3',cat:'mild',text:'你这个人啊。',enabled:true},
  {id:'rm4',cat:'mild',text:'又把自己弄成这样。',enabled:true},
  // 😤 严肃吐槽（约5%）
  {id:'rsg1',cat:'serious',text:'你真的很会折腾自己。',enabled:true},
  {id:'rsg2',cat:'serious',text:'我服了你。',enabled:true},
  // ★ 状态对应吐槽（match 关键词：命中用户最近消息时优先抽，未命中则走普通池）
  {id:'rmt1',cat:'mild',text:'你怎么又熬夜。',match:['熬夜','没睡','睡不着'],enabled:true},
  {id:'rmt2',cat:'familiar',text:'我就知道你会忘。',match:['忘了','忘记','忘带','忘了带'],enabled:true},
  {id:'rmt3',cat:'light',text:'你还真是一点都不客气。',match:['吃了好多','吃多了','吃撑'],enabled:true},
  {id:'rmt4',cat:'light',text:'终于知道休息了？',match:['什么都不做','躺平','休息一下','摆烂'],enabled:true}
];
var _taRoastSessionTriggered={}; // 会话级标志：一次聊天（当前联系人）最多触发 1 个
var _taRoastCurrentMsgId=null;

function taRoastLoad(cid){
  var all=ls(TA_ROAST_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  var d=all[cid]||{};
  if(!d.settings||typeof d.settings!=='object')d.settings={enabled:true,prob:30,aiEnabled:false,aiProb:30};
  // ★ 字卡模式题库：按联系人独立，默认用内置题库的浅拷贝；用户可在管理页增删/停用
  if(!Array.isArray(d.questions)||!d.questions.length){
    d.questions=TA_ROAST_DEFAULT_CARDS.map(function(q){
      return {id:q.id,cat:q.cat,text:q.text,match:(q.match||[]).slice(),enabled:true};
    });
  }
  if(!Array.isArray(d.history))d.history=[];
  return d;
}
function taRoastSave(cid,d){
  var all=ls(TA_ROAST_KEY)||{};
  if(!all||typeof all!=='object'||Array.isArray(all))all={};
  all[cid]=d;
  ls(TA_ROAST_KEY,all);
  if(window.localforage)window.localforage.setItem(TA_ROAST_KEY,all).catch(function(){});
}
function taRoastPickCustom(d,lastUserText){
  var pool=(d&&Array.isArray(d.questions)&&d.questions.length)?d.questions:TA_ROAST_DEFAULT_CARDS;
  // ★ 状态对应吐槽：用户最近消息命中 match 关键词时，优先抽对应吐槽
  if(lastUserText){
    var matched=pool.filter(function(q){
      if(q.enabled===false)return false;
      if(!Array.isArray(q.match)||!q.match.length)return false;
      for(var i=0;i<q.match.length;i++){
        if(lastUserText.indexOf(q.match[i])>=0)return true;
      }
      return false;
    });
    if(matched.length)return matched[Math.floor(Math.random()*matched.length)];
  }
  // 普通池随机（停用的不选）
  var qs=pool.filter(function(q){return q.enabled!==false;});
  if(!qs.length)qs=TA_ROAST_DEFAULT_CARDS.slice();
  return qs[Math.floor(Math.random()*qs.length)];
}
// ★ AI 吐槽（可选）：根据你刚说的话+最近聊天上下文+梦角人设生成一句符合人设的吐槽；只插一句嘴，不接管后续聊天
function taRoastAskAI(callback){
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:'',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat'};
  if(!s.enabled||!s.apiKey){callback(null);return;}
  var persona='';
  try{if(typeof getContactPersona==='function')persona=getContactPersona(cid)||'';}catch(e){}
  var genderText='男朋友';
  try{if(typeof getContactGender==='function'&&getContactGender(cid)==='girl')genderText='女朋友';}catch(e){}
  var bg=(s.worldviewMode==='custom'&&s.worldviewCustom)?s.worldviewCustom:'';
  var ctx='';
  try{
    var mm=msgs(cid)||[];
    var mine=[];
    for(var i=mm.length-1;i>=0&&mine.length<3;i--){if(mm[i]&&mm[i].s===SELF&&mm[i].t&&typeof mm[i].t==='string')mine.push(mm[i].t);}
    if(mine.length)ctx='\n用户刚说过/正在做的事：'+mine.reverse().join(' | ');
  }catch(e){}
  var systemPrompt='你是梦角TA（用户的'+genderText+'），不同联系人是不同人设。请生成一句TA此刻忍不住吐槽用户的话，严格输出一行JSON（不要任何其他文字）：{"text":"吐槽"}。要求：8~20字、口语化、符合TA性格与世界观；是熟悉情侣之间的小调侃，不是批评贬低（不要人身攻击）；句式参考"你怎么又…""我就知道…""你还真…"。'+(bg?'\n世界观：'+bg:'')+(persona?'\nTA人设：'+persona:'')+(ctx?'\n请结合用户最近说的话/做的事吐槽，不要凭空发牢骚：'+ctx:'');
  try{
    fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
      body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:'生成一句TA对你的吐槽。'}],max_tokens:60})
    }).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
      var t=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
      t=t.replace(/^["“「\s]+|["”」\s]+$/g,'').trim();
      if(t)callback(t);else callback(null);
    }).catch(function(){callback(null);});
  }catch(e){callback(null);}
}
function taRoastPush(text,source,cat){
  if(!text||!cid)return;
  _taRoastSessionTriggered[cid]=true;
  var d=taRoastLoad(cid);
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isRoastCard:true,roastText:text,roastCat:cat||'',roastSource:source||'custom',roastStatus:'pending',ts:new Date(),read:true});
  d.lastRoastAt=Date.now();
  taRoastSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  // 延迟弹窗，等卡片渲染完成
  setTimeout(function(){openTARoastAnswer(m[m.length-1].id);},400);
}
// ★ 自动触发：固定字卡优先（概率 prob），字卡未命中时 AI 开启则按 AI 概率额外触发；一次聊天最多 1 个；冷却 30 分钟
function maybeTriggerTARoast(){
  try{
    if(!cid)return;
    if(currentCall)return;
    var d=taRoastLoad(cid);
    var s=d.settings||{enabled:true,prob:30,aiEnabled:false,aiProb:30};
    if(s.enabled===false)return;
    if(_taRoastSessionTriggered[cid])return;
    if(Date.now()-(d.lastRoastAt||0)<30*60000)return;
    // 用户最近一条消息（用于状态对应吐槽）
    var lastUserText='';
    try{
      var mm=msgs(cid)||[];
      for(var i=mm.length-1;i>=0;i--){if(mm[i]&&mm[i].s===SELF&&mm[i].t&&typeof mm[i].t==='string'){lastUserText=mm[i].t;break;}}
    }catch(e){}
    if(Math.random()*100<(typeof s.prob==='number'?s.prob:30)){
      var q=taRoastPickCustom(d,lastUserText);
      taRoastPush(q.text,'custom',q.cat||'light');
      return;
    }
    if(s.aiEnabled===true&&Math.random()*100<(s.aiProb||30)){
      taRoastAskAI(function(txt){
        if(txt)taRoastPush(txt,'ai','ai');
        else{var q2=taRoastPickCustom(d,lastUserText);taRoastPush(q2.text,'custom',q2.cat||'light');}
      });
    }
  }catch(e){console.warn('maybeTriggerTARoast error:',e);}
}
setTimeout(function(){maybeTriggerTARoast();},120000);
setInterval(function(){maybeTriggerTARoast();},300000);
// ★ 管理页主动触发：无视冷却/概率/会话限制，方便用户随时玩
function triggerTARoastNow(){
  if(!cid){toast('请先进入聊天');return;}
  var d=taRoastLoad(cid);
  var q=taRoastPickCustom(d,'');
  var m=msgs(cid);
  var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,isRoastCard:true,roastText:q.text,roastCat:q.cat||'light',roastSource:'custom',roastStatus:'pending',ts:new Date(),read:true};
  m.push(msg);
  d.lastRoastAt=Date.now();
  taRoastSave(cid,d);
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-roast-manage');
  openTARoastAnswer(msg.id);
}
// ★ 打开回应弹窗
function openTARoastAnswer(msgId){
  if(!cid)return;
  _taRoastCurrentMsgId=msgId;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===msgId){msg=m[i];break;}}
  if(!msg)return;
  if(msg.roastStatus==='answered'){showTARoastReplied(msg);return;}
  var ov=$('ov-ta-roast-answer');if(!ov){toast('功能未就绪');return;}
  var qEl=$('ta-roast-answer-text');
  if(qEl)qEl.textContent=msg.roastText||'';
  var inp=$('ta-roast-answer-input');
  if(inp)inp.value='';
  showOv('ov-ta-roast-answer');
  setTimeout(function(){if(inp)inp.focus();},80);
}
// ★ 提交回应：卡片 answered + 推用户消息 + TA 用联系人聊天字卡回应 + 写历史
function submitTARoastAnswer(){
  var inp=$('ta-roast-answer-input');
  var answer=inp?inp.value.trim():'';
  if(!answer){toast('回TA一句吧');return;}
  if(!_taRoastCurrentMsgId||!cid)return;
  var m=msgs(cid);
  var msg=null;
  for(var i=0;i<m.length;i++){if(m[i].id===_taRoastCurrentMsgId){msg=m[i];break;}}
  if(!msg||msg.roastStatus==='answered')return;
  msg.roastStatus='answered';
  msg.roastAnswer=answer;
  // TA 回应走「原本的聊天字卡系统」，AI 不接管后续对话
  var text='';
  var cards=[];
  try{
    if(typeof getContactCards==='function'){
      var cc=getContactCards(cid);
      if(cc&&cc.length)cards=cc.filter(function(c){return c&&c.category==='custom'&&c.content;});
    }
  }catch(e){}
  if(cards.length){
    text=cards[Math.floor(Math.random()*cards.length)].content;
  }else{
    var defs=['你觉得我会信？','少骗我。','哼。','好吧好吧。','就这一次？','行吧，放过你。','嗯，这还差不多。'];
    text=defs[Math.floor(Math.random()*defs.length)];
  }
  // ★ 修复：卡片里的 TA 回应必须在 text 计算之后写入（此前写在 var text 之前导致 roastReply 为 undefined、卡片显示空白）
  msg.roastReply=text;
  // 写历史（上限 50 条）
  var d=taRoastLoad(cid);
  d.history.unshift({id:'h_'+Date.now(),roast:msg.roastText,myReply:answer,taReply:text,cat:msg.roastCat||'',ts:Date.now(),source:msg.roastSource||'custom'});
  if(d.history.length>50)d.history=d.history.slice(0,50);
  taRoastSave(cid,d);
  // 推消息
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:SELF,t:answer,ts:new Date(),read:true});
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:text,ts:new Date(),read:true});
  savemsgs(cid,m);
  renderMsgs(m);
  hideOv('ov-ta-roast-answer');
}
// 已答后重看：轻量展示结果
function showTARoastReplied(msg){
  var ov=$('ov-ta-roast-answer');
  if(!ov)return;
  var qEl=$('ta-roast-answer-text');
  if(qEl)qEl.textContent=msg.roastText||'';
  var body=$('ta-roast-answer-body');
  if(!body)return;
  var aText=String(msg.roastAnswer||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var rText=String(msg.roastReply||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var html='<div style="font-size:13px;color:var(--txt2);text-align:center;padding:8px 12px;background:var(--c2);border-radius:10px;margin-bottom:10px;">你说：'+aText+'</div>'
    +'<div style="font-size:13px;color:var(--txt);line-height:1.7;text-align:center;"><span style="font-weight:600;">TA：</span>“'+rText+'”</div>';
  body.innerHTML=html;
  showOv('ov-ta-roast-answer');
}
// ★ 管理页
function renderTARoastManage(){
  var body=$('ta-roast-manage-body');
  if(!body)return;
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'TA'};
  var d=taRoastLoad(cid);
  var s=d.settings||{enabled:true,prob:30,aiEnabled:false,aiProb:30};
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:12px;">当前联系人：'+String(contact.name||'TA').replace(/</g,'&lt;')+'（设置相互独立）</div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><span style="font-size:13px;color:var(--txt);">TA偶尔吐槽你一句</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-roast-enable" '+(s.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taRoastSetEnable(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">固定字卡概率</span><input type="range" id="ta-roast-prob" min="1" max="100" step="1" value="'+(typeof s.prob==='number'?s.prob:30)+'" oninput="taRoastSetProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-roast-prob-val">'+(typeof s.prob==='number'?s.prob:30)+'%</span></div>';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:13px;color:var(--txt);">接入 AI 吐槽（可选）</span><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" id="ta-roast-ai-toggle" '+(s.aiEnabled?'checked':'')+' onmousedown="event.preventDefault();" onchange="taRoastSetAi(this.checked)" style="width:18px;height:18px;accent-color:var(--accent);"></label></div>';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span style="font-size:12px;color:var(--txt2);flex-shrink:0;">AI 吐槽概率</span><input type="range" id="ta-roast-ai-prob" min="0" max="100" step="5" value="'+(s.aiProb||30)+'" oninput="taRoastSetAiProb(this.value)" style="flex:1;"><span style="font-size:12px;color:var(--txt);width:40px;text-align:right;" id="ta-roast-ai-prob-val">'+(s.aiProb||30)+'%</span></div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:14px;line-height:1.6;">😏 字卡模式内置 46 句吐槽（调侃/熟悉/甜蜜为主，不是批评）。AI 只根据人设和你刚说的话多一句嘴，不接管后续聊天。</div>';
  // ★ 添加吐槽字卡表单
  var catOpts='';
  var catOrder=['light','familiar','sweet','mild','serious'];
  catOrder.forEach(function(k){catOpts+='<option value="'+k+'">'+(TA_ROAST_CAT_LABEL[k]||k)+'</option>';});
  html+='<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:14px;">';
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">➕ 添加吐槽字卡</div>';
  html+='<select id="ta-roast-new-cat" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">'+catOpts+'</select>';
  html+='<input id="ta-roast-new-text" type="text" placeholder="吐槽内容..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<input id="ta-roast-new-match" type="text" placeholder="触发关键词，用 | 分隔（可选），如：熬夜|没睡" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box;">';
  html+='<button onclick="taRoastAdd()" style="width:100%;padding:9px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">添加</button>';
  html+='</div>';
  // ★ 字卡题库（按联系人独立，可停用/删除）
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">📚 字卡题库 <span style="font-size:11px;color:var(--txt3);font-weight:400;">（按联系人独立，可停用/删除）</span></div>';
  catOrder.forEach(function(k){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+(TA_ROAST_CAT_LABEL[k]||k)+'</div>';
    var arr=d.questions.filter(function(q){return q.cat===k;});
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:4px 0;">暂无</div>';
    arr.forEach(function(q){
      var idx=d.questions.indexOf(q);
      var qTxt=String(q.text||'').replace(/</g,'&lt;');
      var qMatch='';
      if(Array.isArray(q.match)&&q.match.length){
        qMatch='<div style="font-size:11px;color:var(--txt3);margin-top:4px;">触发：'+q.match.map(function(x){return String(x||'');}).join(' / ')+'</div>';
      }
      html+='<div style="background:var(--c2);border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
        +'<div style="display:flex;align-items:flex-start;gap:8px;">'
        +'<label style="display:flex;align-items:center;flex-shrink:0;margin-top:2px;"><input type="checkbox" '+(q.enabled!==false?'checked':'')+' onmousedown="event.preventDefault();" onchange="taRoastToggle('+idx+')" style="width:15px;height:15px;accent-color:var(--accent);"></label>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:13px;color:var(--txt);word-break:break-all;'+(q.enabled===false?'opacity:0.5;':'')+'">'+qTxt+'</div>'
        +qMatch
        +'</div>'
        +'<button onclick="taRoastDel('+idx+')" style="width:26px;height:26px;border:none;background:none;color:#e05a5a;font-size:13px;cursor:pointer;flex-shrink:0;" title="删除这句">✕</button>'
        +'</div>'
        +'</div>';
    });
  });
  html+='<div style="font-size:11px;color:var(--txt3);margin:10px 0 14px;line-height:1.6;">提示：停用后 TA 吐槽时不会再抽到；带触发关键词的吐槽会在你说到相关内容时优先出现；删除后不可恢复。</div>';
  html+='<button onclick="triggerTARoastNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:10px;">😏 让TA现在吐槽一次</button>';
  html+='<button onclick="showTARoastHistory()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">📜 历史（'+d.history.length+'）</button>';
  body.innerHTML=html;
}
function taRoastSetEnable(v){
  var d=taRoastLoad(cid);
  d.settings.enabled=v;
  taRoastSave(cid,d);
  toast(v?'TA的吐槽已开启':'TA的吐槽已关闭');
}
function taRoastSetProb(v){
  var d=taRoastLoad(cid);
  d.settings.prob=parseInt(v)||30;
  taRoastSave(cid,d);
  var el=$('ta-roast-prob-val');if(el)el.textContent=v+'%';
}
function taRoastSetAi(v){
  var d=taRoastLoad(cid);
  d.settings.aiEnabled=v;
  taRoastSave(cid,d);
  toast(v?'已接入 AI 吐槽（未配置AI时自动用固定字卡）':'AI 吐槽已关闭');
}
function taRoastSetAiProb(v){
  var d=taRoastLoad(cid);
  d.settings.aiProb=parseInt(v)||30;
  taRoastSave(cid,d);
  var el=$('ta-roast-ai-prob-val');if(el)el.textContent=v+'%';
}
function showTARoastManager(){
  if(!cid){toast('请先进入聊天');return;}
  renderTARoastManage();
  showOv('ov-ta-roast-manage');
}
// ★ 字卡模式：添加自定义吐槽字卡
function taRoastAdd(){
  if(!cid)return;
  var textEl=$('ta-roast-new-text');
  var matchEl=$('ta-roast-new-match');
  var catEl=$('ta-roast-new-cat');
  var text=textEl?textEl.value.trim():'';
  var matchRaw=matchEl?matchEl.value.trim():'';
  var cat=catEl?catEl.value:'light';
  if(!text){toast('请输入吐槽内容');return;}
  var match=matchRaw.split('|').map(function(s){return s.trim();}).filter(Boolean).slice(0,4);
  var d=taRoastLoad(cid);
  d.questions.push({id:'r_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),cat:cat,text:text,match:match,enabled:true});
  taRoastSave(cid,d);
  if(textEl)textEl.value='';
  if(matchEl)matchEl.value='';
  renderTARoastManage();
  toast('已添加吐槽字卡');
}
// ★ 字卡模式：启用/停用某句
function taRoastToggle(idx){
  var d=taRoastLoad(cid);
  if(d.questions[idx])d.questions[idx].enabled=d.questions[idx].enabled===false;
  taRoastSave(cid,d);
  renderTARoastManage();
}
// ★ 字卡模式：删除某句
function taRoastDel(idx){
  var d=taRoastLoad(cid);
  d.questions.splice(idx,1);
  taRoastSave(cid,d);
  renderTARoastManage();
  toast('已删除');
}
// ★ 历史记录
function showTARoastHistory(){
  if(!cid){toast('请先进入聊天');return;}
  var body=$('ta-roast-history-body');if(!body)return;
  var d=taRoastLoad(cid);
  var html='';
  if(!d.history.length)html+='<div style="text-align:center;padding:30px;color:var(--txt3);font-size:13px;">TA还没有吐槽过你</div>';
  d.history.forEach(function(h){
    var dd=new Date(h.ts);
    var time=('0'+dd.getHours()).slice(-2)+':'+('0'+dd.getMinutes()).slice(-2)+' '+((dd.getMonth()+1)+'月'+dd.getDate()+'日');
    var catLabel=TA_ROAST_CAT_LABEL[h.cat]||'';
    var srcLabel=h.source==='ai'?' <span style="font-size:10px;color:#8a6d3b;border:1px solid #d8c6a0;border-radius:6px;padding:0 5px;">AI</span>':'';
    html+='<div style="padding:12px;background:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.7);border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">'
      +'<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:600;color:var(--txt);flex:1;">'+(catLabel?'['+catLabel+'] ':'')+String(h.roast||'').replace(/</g,'&lt;')+srcLabel+'</span><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">'+time+'</span></div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:6px;">你：'+String(h.myReply||'').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">TA：'+String(h.taReply||'').replace(/</g,'&lt;')+'</div>'
      +'</div>';
  });
  body.innerHTML=html;
  showOv('ov-ta-roast-history');
}
function clearTARoastHistory(){
  if(!cid)return;
  if(!confirm('确定清空当前联系人的【TA的吐槽】历史？'))return;
  var d=taRoastLoad(cid);
  d.history=[];
  taRoastSave(cid,d);
  showTARoastHistory();
}

// ============ TA系列五个互动功能 · 使用说明（AI分类面板）============
function showTAAiUsage(){
  var body=$('ta-ai-usage-body');
  if(!body)return;
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function intro(icon,title,desc){
    return '<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:10px;">'
      +'<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:6px;">'+icon+' '+esc(title)+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);line-height:1.8;">'+desc+'</div>'
      +'</div>';
  }
  function block(title,lines){
    var lh=lines.map(function(l){return '<div style="font-size:12px;color:var(--txt2);line-height:1.8;">'+l+'</div>';}).join('');
    return '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:600;color:var(--txt);margin-bottom:6px;">'+esc(title)+'</div>'+lh+'</div>';
  }
  var html='';
  html+='<div style="background:linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-rgb),0.04));border-radius:10px;padding:12px;margin-bottom:14px;">'
    +'<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:6px;">✨ 五个功能 · 同一个设计逻辑</div>'
    +'<div style="font-size:12px;color:var(--txt2);line-height:1.9;">'
    +'<div>在聊天过程中，TA 偶尔会突然主动说点什么。</div>'
    +'<div>「固定字卡」提供随机触发、稳定的内容；开启 AI 后，AI 可以根据 TA 的人设和你设置的概率，偶尔主动生成更符合 TA 性格的文字。</div>'
    +'<div style="margin-top:4px;">不接入 AI 也能完整使用全部核心功能——字卡才是主体，AI 只是增强。</div>'
    +'</div></div>';
  html+=intro('❓','TA的询问','TA 想知道你「现在怎么样」，日常交流。例如「今天过得怎么样？」「累不累？」——你自由回答，TA 接着聊。');
  html+=intro('💫','TA的小问题','TA 想和你「玩一下」，出个选择题。例如「如果现在能去一个地方，你选哪？」——你选一个选项，TA 根据你的选择回应。');
  html+=intro('💭','TA的好奇','TA 想了解「你是什么样的人」，开放式问题。例如「你小时候最喜欢做什么？」——有快捷回复可点，也可自己输入；TA 记住了，以后不再重复问。');
  html+=intro('💌','TA的邀请','TA 主动向你伸手。例如「过来陪我一会儿。」「一起玩点什么？」——你回应后，TA 用聊天字卡接着聊。');
  html+=intro('😏','TA的吐槽','TA 忍不住插一句嘴，熟悉情侣之间的小调侃。例如「你怎么又这样」「我就知道你会这么做」——你回应后回到正常聊天。');
  html+=block('⚙️ 共同设计逻辑（五个功能都一样）',[
    '· 入口：聊天输入栏左边 ⋮ → AI 分类，点进对应功能的管理页',
    '· 触发：进聊天后过一会儿，TA 按概率突然主动触发；一次聊天最多一次，且有冷却时间',
    '· 固定字卡：每个功能都自带内置字卡库，可在管理页新增/停用/删除自己的字卡',
    '· 状态对应：部分功能会看你刚说的话（如吐槽里的「熬夜」）优先抽对应内容',
    '· AI（可选）：在「设置 → API 接口」接入 AI 后，可在管理页开启 AI，TA 偶尔会生成更贴合人设的主动表达',
    '· 历史：每个功能都记录你们的小互动，可在管理页回看'
  ]);
  html+=block('📌 一句话区分',[
    '· TA的询问 —— TA想知道你现在怎么样（日常交流）',
    '· TA的小问题 —— TA想和你玩一下（出选项给你选）',
    '· TA的好奇 —— TA想了解你是什么样的人（开放式提问）',
    '· TA的邀请 —— TA主动向你伸手（发出邀请）',
    '· TA的吐槽 —— TA忍不住插一句嘴（熟悉之后的调侃）'
  ]);
  html+='<div style="font-size:11px;color:var(--txt3);line-height:1.7;border-top:1px solid var(--border);padding-top:10px;">提示：AI 生成的所有内容仅供参考，不代表任何事实，请理性看待。五个功能均可在各自管理页关闭、调概率或清空历史。</div>';
  body.innerHTML=html;
  showOv('ov-ta-ai-usage');
}
