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
    if(Math.random()>0.2)return;
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
        else pushAsk(customQ||taAskDefault(),'custom');
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
// ============ 星言翻牌（小游戏分类）============
