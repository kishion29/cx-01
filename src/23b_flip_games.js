var FLIP_KEY='ml2_star_flip';
var FLIP_THEMES={
  star:{name:'⭐ 星言主题',emojis:['⭐','🌙','☁️','💌','🌸','🎁','📖','🎵']},
  accompany:{name:'📖 陪伴主题',emojis:['📖','💡','🖥️','🍿','🎧','🎵','🎬','☕']}
};
var FLIP_CARD_GROUPS=[['start','🌟 游戏开始类'],['watch','👀 等待你翻牌类'],['your_turn','🃏 你翻牌类'],['success','✨ 你成功类'],['fail','💪 你失败类'],['ta_turn','🤔 TA回合类'],['ta_success','🎉 TA成功类'],['ta_fail','🍀 TA失败类'],['combo','🔥 连续配对类'],['leadlag','⚖️ 领先落后类'],['end','🏁 游戏结束类'],['again','🔁 再来一局类']];
// ★ 游戏内互动字卡库（混合性格表达，不绑定角色）：12 类
var FLIP_INTERACT_DB={
  start:['开始吧。','准备好了吗？','来玩一局。','看看今天谁更厉害。','我先看看你的实力。','不要紧张，慢慢玩。','这次可不会让你轻松赢。','只是陪你玩一下。','好，那就开始。','终于轮到这个了。','规则我知道了。','希望这局不会太久。','来吧，我等着。','看看谁记性更好。','感觉会很有意思。'],
  watch:['你想选哪张？','慢慢找。','我看看你的选择。','不要急。','认真想想。','你是不是已经有答案了？','感觉你快找到了。','别被表面骗了。','再观察一下。','我猜你心里已经决定了。','要不要相信自己的直觉？','这一步很关键。','我不提醒你。','自己发现才有意思。','看看你的运气。'],
  your_turn:['TA正在看你寻找卡片…','TA等待你的选择','TA觉得你快找到了','TA安静地看着你翻牌','TA盯着你的手，像在猜你会选哪张'],
  success:['找到了。','不错。','厉害。','这次判断很准。','看来你记住了。','运气站在你这边。','做得很好。','漂亮。','居然真的找到了。','我还以为你会选错。','这一下挺快。','看来不能小看你。','继续保持。','这局越来越有意思了。','这一分拿得不错。'],
  fail:['差一点。','没关系，再来。','记住这个位置。','刚刚差一点就对了。','可惜。','这张不是。','下一次会更好。','你是不是故意试错？','哈哈，猜错了。','看来还需要一点运气。','别放弃。','机会还有很多。','至少知道一个错误答案。','慢慢积累。','下一张可能就是。'],
  ta_turn:['轮到我了。','让我看看。','该我寻找了。','稍微等一下。','我想想。','不要偷看。','这两张怎么样？','让我试试。','我有一点想法。','确认一下。','感觉应该在这里。','凭感觉来一次。','让我挑战一下。','希望这次没猜错。','开始寻找。'],
  ta_success:['找到了。','看来运气不错。','刚好。','成功。','这一张是我的。','没想到这么顺利。','记忆还可以。','这一轮不错。','看来我也没有输。','这次猜中了。','小小领先一下。','还挺简单的。','碰巧而已。','继续。','下一轮。'],
  ta_fail:['看错了。','差一点。','记错位置了。','刚刚应该换一个。','失误。','没猜中。','看来不能太自信。','这次运气不好。','再试一次。','还没结束。','只是一个小错误。','下一次会找到。','被难住了。','这张牌藏得很好。','暂时失败。'],
  combo:['越来越顺了。','感觉找到规律了。','今天状态不错。','连续成功。','节奏很好。','配合不错。','这局有点顺利。','看来我们运气不错。','继续保持。','不要停下来。','感觉马上结束了。','越来越接近了。','这次发挥很好。','手感来了。','好像变简单了。'],
  leadlag:['目前优势不错。','领先一点了。','看来今天状态很好。','不要放松。','继续保持。','还没结束。','还有机会。','慢慢追回来。','不要急。','最后结果还不一定。'],
  end:['结束了。','这一局很开心。','玩得不错。','下次继续。','还想再来吗？','这次结果记住了。','下一局可能不一样。','感觉时间过得很快。','挺有意思的。','以后可以再玩。','今天先到这里。','这局结束。','还不错。','我觉得挺有趣。','下一次挑战更高难度。'],
  again:['再来一次？','还要继续吗？','下一局开始。','我已经准备好了。','这次我要赢。','再玩一局也可以。','看看下一次结果。','继续挑战。','不服的话再来。','那就重新开始。']
};
var FLIP_DEFAULT_CARDS={start:['来玩个小游戏吧～','准备好了吗？','看看我们能不能找到所有配对'],your_turn:['TA正在看你寻找卡片…','TA等待你的选择','TA觉得你快找到了'],ta_turn:['TA思考着下一张…','TA好像有点线索了','TA继续寻找着'],success:['好默契！','我们找到啦！','心有灵犀！'],fail:['没关系，再试试～','不着急，慢慢来','差一点点！'],ta_success:['TA找到啦！','TA很开心','TA继续下一轮'],ta_fail:['差一点～','没关系，继续','TA挠了挠头'],end:['一起完成啦，真棒！','今天玩得不错','下次继续！']};
var flipState=null;
function flipLoad(){
  var d=ls(FLIP_KEY)||{};
  if(!d||typeof d!=='object')d={};
  if(!d.stats||typeof d.stats!=='object')d.stats={plays:0,bestSec:0,completes:0};
  if(!d.cards||typeof d.cards!=='object')d.cards={};
  FLIP_CARD_GROUPS.forEach(function(g){if(!Array.isArray(d.cards[g[0]]))d.cards[g[0]]=[];});
  if(!d.custom||!Array.isArray(d.custom))d.custom=[];
  if(!d.images||!Array.isArray(d.images))d.images=[];
  return d;
}
function flipSave(d){
  ls(FLIP_KEY,d);
  if(window.localforage)window.localforage.setItem(FLIP_KEY,d).catch(function(){});
}
function flipPickCard(group){
  var d=flipLoad();
  var arr=d.cards[group]&&d.cards[group].length?d.cards[group]:null;
  if(!arr)arr=FLIP_INTERACT_DB[group]&&FLIP_INTERACT_DB[group].length?FLIP_INTERACT_DB[group]:FLIP_DEFAULT_CARDS[group];
  return arr[Math.floor(Math.random()*arr.length)];
}
// ★ TA 互动字卡：按概率在状态栏显示 TA 的话（旧库兼容）
function flipTaSay(group,prob){
  try{
    if(Math.random()>prob)return;
    var txt=flipPickCard(group);
    var st=$('flip-status');
    if(st)st.innerHTML='<span style="color:#5a6ea8;">TA：</span>'+String(txt).replace(/</g,'&lt;');
  }catch(e){}
}
// ★ 游戏内互动触发（统一入口）：概率 + 最低间隔（6 秒防烦）+ 游戏内小卡片
function flipInteract(group,prob){
  try{
    if(Math.random()>prob)return;
    var now=Date.now();
    if(window._lastFlipDk&&now-window._lastFlipDk<6000)return;
    window._lastFlipDk=now;
    var txt=flipPickCard(group);
    var host=$('flip-danmaku-layer');
    if(!host)return;
    var contact=contacts.find(function(c){return c.id===cid})||{name:'TA'};
    var d=document.createElement('div');
    d.className='flip-dk-card';
    d.innerHTML='<span class="flip-dk-role">'+String(contact.name).replace(/</g,'&lt;')+'</span><span class="flip-dk-text">'+String(txt).replace(/</g,'&lt;')+'</span>';
    host.appendChild(d);
    setTimeout(function(){try{host.removeChild(d);}catch(e){}},4200);
  }catch(e){}
}
// ★ 触发概率（已降低，避免"翻一张牌必说一句"）：普通翻牌 20% / 特殊牌 35% / 配对成功 45%（不再必说）
var FLIP_RARITY_PROB={normal:0.2,special:0.35,rare:0.6};
// ★ 牌面 → 互动标签 + 稀有度（翻牌只负责产生触发条件，联系人台词一律从字卡库筛选，禁止在此写死）
var FLIP_FACE_TAGS={
  '⭐':{tags:['星星','夜晚','希望','闪耀'],rarity:'normal'},
  '🌙':{tags:['夜晚','陪伴','想念','安静'],rarity:'special'},
  '☁️':{tags:['天气','安静','日常'],rarity:'normal'},
  '💌':{tags:['心意','表达','想你'],rarity:'special'},
  '🌸':{tags:['春天','美好','日常'],rarity:'normal'},
  '🎁':{tags:['礼物','惊喜','心意'],rarity:'special'},
  '📖':{tags:['阅读','安静','陪伴'],rarity:'normal'},
  '🎵':{tags:['音乐','分享','心情'],rarity:'special'},
  '💡':{tags:['灵感','想法','分享'],rarity:'normal'},
  '🖥️':{tags:['工作','日常','陪伴'],rarity:'normal'},
  '🍿':{tags:['电影','娱乐','一起'],rarity:'normal'},
  '🎧':{tags:['音乐','心情','陪伴'],rarity:'special'},
  '🎬':{tags:['电影','娱乐','一起'],rarity:'special'},
  '☕':{tags:['咖啡','日常','陪伴'],rarity:'normal'}
};
function flipFaceInfo(face){
  var info=FLIP_FACE_TAGS[face];
  if(!info)info={tags:['日常','陪伴'],rarity:'normal'}; // 自定义牌面兜底
  if(!Array.isArray(info.tags))info.tags=[];
  return info;
}
// 标签 → 关键词（用于匹配字卡内容 / 分组名）
function flipTagKeywords(tags){
  var kwMap={
    '星星':['星','亮'],'夜晚':['夜','晚','睡','梦','晚安','月亮','星星','暗'],
    '希望':['希望','想','愿','加油','期待'],'闪耀':['亮','光','闪'],
    '陪伴':['陪','一起','在','身边','伴','待'],'想念':['想','念','思','挂','梦'],
    '安静':['安静','静','悄悄','听','休息','歇'],'天气':['天气','雨','晴','风','云','雪'],
    '日常':['今天','吃饭','吃','喝','睡','上班','下班','日常','忙'],
    '心意':['心意','喜欢','爱你','想你','在乎','珍惜','心'],'表达':['告诉','说','表达','想让你','分享','聊聊'],
    '想你':['想','念','思念'],'春天':['春','花','开','暖'],
    '美好':['好','美','开心','幸福'],'礼物':['礼物','送','给','惊喜','包'],
    '惊喜':['惊喜','意外','突然','等'],'阅读':['书','读','看','页','写'],
    '音乐':['歌','音乐','听','旋律','唱'],'分享':['分享','告诉','给你','一起','聊'],
    '心情':['心情','开心','难过','累','好'],'灵感':['想法','灵感','点子','忽然'],
    '想法':['想','觉得','认为','想法'],'工作':['工作','忙','班','任务','做'],
    '电影':['电影','片','影','看'],'娱乐':['玩','游戏','乐','笑'],
    '一起':['一起','我们','共同','同'],'咖啡':['咖啡','喝','杯'],
    '靠近':['靠近','过来','身边','近','贴']
  };
  var out=[];
  (tags||[]).forEach(function(t){
    var kws=kwMap[t]||[];
    kws.forEach(function(k){if(out.indexOf(k)<0)out.push(k);});
    if(out.indexOf(t)<0)out.push(t);
  });
  if(!out.length)out=['陪','想','喜欢'];
  return out;
}
// 查分组名（globalCards 的分组 / 默认通用字卡分组）
function flipGroupName(gid){
  if(!gid)return '';
  try{
    if(typeof cardGroups!=='undefined'&&Array.isArray(cardGroups)){
      var g=cardGroups.find(function(x){return x&&x.id===gid;});
      if(g&&g.name)return g.name;
    }
  }catch(e){}
  try{
    if(typeof DEFAULT_COMMON_GROUPS!=='undefined'&&Array.isArray(DEFAULT_COMMON_GROUPS)){
      var g2=DEFAULT_COMMON_GROUPS.find(function(x){return x&&x.id===gid;});
      if(g2&&g2.name)return g2.name;
    }
  }catch(e){}
  return '';
}
// 当前联系人的可用字卡池：用户自己的（公用 + 专享绑定）+ 默认通用字卡
function flipContactCardPool(){
  var pool=[];
  var targetId=cid;
  try{
    if(typeof globalCards!=='undefined'&&Array.isArray(globalCards)){
      globalCards.forEach(function(card){
        if(!card||!card.content)return;
        if(card.category==='touch')return;
        var text=String(card.content);
        if(card.category!=='stickers'&&card.category!=='voices'&&!text.trim())return;
        if(card.type==='private'){
          var ok=card.contactId===targetId;
          if(!ok&&typeof cardPrivateContacts!=='undefined'&&Array.isArray(cardPrivateContacts)){
            var pc=cardPrivateContacts.find(function(p){return p.id===card.contactId&&p.bindContactId===targetId;});
            if(pc)ok=true;
          }
          if(!ok)return;
        }
        pool.push({text:text,cat:card.category||'custom',gid:card.groupId||null});
      });
    }
  }catch(e){}
  try{
    if(typeof getDefaultCommonCardsForContact==='function'){
      var dc=getDefaultCommonCardsForContact(targetId);
      if(dc&&dc.length)dc.forEach(function(t){pool.push({text:String(t),cat:'custom',gid:null});});
    }
  }catch(e){}
  return pool;
}
function flipCardMatchesTags(card,tags){
  if(!tags||!tags.length)return true;
  var kws=flipTagKeywords(tags);
  var text=String(card&&card.text||'');
  var gname=flipGroupName(card&&card.gid);
  for(var i=0;i<kws.length;i++){
    var k=kws[i];
    if(k&&text.indexOf(k)>=0)return true;
    if(k&&gname&&gname.indexOf(k)>=0)return true;
  }
  return false;
}
// ★ 从联系人字卡库筛选随机抽一张（优先符合标签的；无匹配则从全部字卡随机，保证"TA突然回应你"；避免最近抽过的立即重复）
function flipPickContactCard(tags){
  try{
    var pool=flipContactCardPool();
    if(!pool.length)return null;
    var matched=pool.filter(function(c){return flipCardMatchesTags(c,tags);});
    var source=matched.length?matched:pool;
    var recent=window._flipRecentCards||[];
    var candidates=source.filter(function(c){return recent.indexOf(c.text)<0;});
    if(!candidates.length)candidates=source;
    var pick=candidates[Math.floor(Math.random()*candidates.length)];
    if(!pick)return null;
    if(!window._flipRecentCards)window._flipRecentCards=[];
    window._flipRecentCards.push(pick.text);
    if(window._flipRecentCards.length>8)window._flipRecentCards.shift();
    return pick.text;
  }catch(e){return null;}
}
// 两次翻牌标签交集（同一互动主题）
function flipSharedTag(a,b){
  for(var i=0;i<(a||[]).length;i++){
    for(var j=0;j<(b||[]).length;j++){
      if(a[i]===b[j])return a[i];
    }
  }
  return null;
}
// 记录本次翻牌（连续互动判断 + 历史）
function flipRecordFlip(face,tags){
  window._flipLastFace=face;
  window._flipLastTags=tags||[];
  try{
    var d=flipLoad();
    if(!Array.isArray(d.records))d.records=[];
    d.records.push({face:face,tags:(tags||[]).slice(),cid:cid,ts:Date.now()});
    if(d.records.length>30)d.records=d.records.slice(-30);
    flipSave(d);
  }catch(e){}
}
// ★ 把字卡内容作为 TA 的【正常聊天消息】发送到聊天记录（模拟 TA 突然找你说句话）
function flipSendChatCard(txt,contact){
  try{
    var targetId=cid;
    if(!targetId)return;
    if(typeof msgs!=='function'||typeof savemsgs!=='function')return;
    var m=msgs(targetId);
    if(!Array.isArray(m))m=[];
    var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:txt,img:'',voice:'',voiceText:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,quote:null,isSticker:false,isVoice:false,senderName:contact.name,senderId:targetId,isGroup:false,read:(targetId===cid)};
    m.push(msg);
    savemsgs(targetId,m);
    if(targetId===window.currentCid&&typeof renderMsgs==='function')renderMsgs(m);
    if(typeof renderChatList==='function')renderChatList();
    if(typeof playSound==='function')playSound('recv',targetId);
  }catch(e){}
}
// ★★ 牌面触发层（统一入口）：翻牌 → 牌面 → 标签 → 概率 → 随机触发【固定字卡】或【发送正常聊天字卡】→ 记录
// opts: {match:配对成功(概率45%), ta:TA翻牌(概率再降), group:固定字卡组(success/fail/ta_turn等), force:忽略防烦}
// 固定字卡 = 游戏内预置互动词（如「找到了」「差一点」）；正常聊天字卡 = 从联系人字卡库筛选随机抽，作为 TA 的聊天消息发送
function flipFaceTrigger(face,opts){
  try{
    opts=opts||{};
    var info=flipFaceInfo(face);
    var tags=info.tags;
    var prob=FLIP_RARITY_PROB[info.rarity]!=null?FLIP_RARITY_PROB[info.rarity]:0.2;
    if(opts.match)prob=0.45;       // 配对成功：45%（不再必说，避免频率过高）
    if(opts.ta)prob=prob*0.4;      // TA 翻牌：概率再降
    // 连续翻牌互动：与上一次翻牌属于同一互动主题 → 概率 +20%（上限 100%）
    var cont=false,contTag='';
    if(window._flipLastFace&&window._flipLastFace!==face){
      contTag=flipSharedTag(tags,window._flipLastTags);
      if(contTag)cont=true;
    }
    if(cont)prob=Math.min(1,prob+0.2);
    if(Math.random()>prob)return;
    // 防烦：10 秒内只响应一次
    if(!opts.force){
      var now=Date.now();
      if(window._flipFaceDkTs&&now-window._flipFaceDkTs<10000)return;
      window._flipFaceDkTs=now;
    }
    var contact=contacts.find(function(c){return c.id===cid})||{name:'TA'};
    // ★ 来源随机：有固定字卡组时，50% 触发固定字卡；否则/剩余 50% 走联系人聊天字卡（发送到聊天记录）
    var useFixed=opts.group&&Math.random()<0.5;
    var txt=null,fixed=false;
    if(useFixed){
      txt=flipPickCard(opts.group); // 固定互动词（游戏氛围，非写死联系人台词）
      fixed=true;
    }else{
      txt=flipPickContactCard(tags); // 联系人字卡库按标签随机抽
    }
    // ★ 修复：等 renderFlipBoard 重建完棋盘 DOM 后再挂弹幕（否则会被 body.innerHTML 重建立即清掉）
    setTimeout(function(){
      var host=$('flip-danmaku-layer');
      if(!host)return;
      var d=document.createElement('div');
      if(txt==null){
        // 联系人没有字卡：显示系统提示（非联系人台词），避免"翻了没反应"
        d.className='flip-dk-tip';
        d.innerHTML='💭 给 TA 添加几句字卡，TA 翻牌时会在这里回应你';
      }else{
        d.className='flip-dk-card';
        var head='';
        if(cont&&window._flipLastFace&&contTag){
          // 连续互动引导语（系统提示，非联系人台词）：
          head='<div style="font-size:10px;color:#9aa3c0;margin-bottom:3px;white-space:nowrap;">'+String(window._flipLastFace).replace(/</g,'&lt;')+' → '+String(face).replace(/</g,'&lt;')+' · 同一片'+contTag+'</div>';
        }
        d.innerHTML=head
          +'<span class="flip-dk-role">'+String(contact.name).replace(/</g,'&lt;')+'</span>'
          +'<span class="flip-dk-text">'+String(txt).replace(/</g,'&lt;')+'</span>';
      }
      host.appendChild(d);
      setTimeout(function(){try{host.removeChild(d);}catch(e){}},4200);
    },0);
    // 正常聊天字卡：作为 TA 的聊天消息发送到聊天记录（像 TA 突然回应你）
    if(!fixed&&txt!=null)flipSendChatCard(txt,contact);
    flipRecordFlip(face,tags);
  }catch(e){}
}
function flipBack(){
  showPg(window._flipReturnPage||'pg-more');
}
function showStarFlipPage(){
  window._flipReturnPage=currentPage||'pg-more';
  showPg('pg-star-flip');
  renderFlipMenu();
}
function renderFlipMenu(){
  var body=$('star-flip-body');if(!body)return;
  var d=flipLoad();
  var html='';
  html+='<div style="text-align:center;padding:10px 0 6px;">';
  html+='<div style="font-size:24px;">🎴</div>';
  html+='<div style="font-size:18px;font-weight:700;color:#4A443C;letter-spacing:2px;margin-top:4px;">星言翻牌</div>';
  html+='<div style="font-size:12px;color:#7C7367;margin-top:6px;line-height:1.7;">翻开隐藏的星光，看看你和TA的默契。</div>';
  html+='</div>';
  // 统计
  if(d.stats.plays>0){
    html+='<div style="display:flex;gap:8px;margin:10px 0 16px;">';
    html+='<div style="flex:1;text-align:center;background:rgba(255,255,255,0.85);border-radius:12px;padding:10px;border:1px solid rgba(255,255,255,0.7);"><div style="font-size:16px;font-weight:700;color:#4A443C;">'+d.stats.plays+'</div><div style="font-size:11px;color:#7C7367;">累计游玩</div></div>';
    html+='<div style="flex:1;text-align:center;background:rgba(255,255,255,0.85);border-radius:12px;padding:10px;border:1px solid rgba(255,255,255,0.7);"><div style="font-size:16px;font-weight:700;color:#4A443C;">'+d.stats.completes+'</div><div style="font-size:11px;color:#7C7367;">完成次数</div></div>';
    html+='<div style="flex:1;text-align:center;background:rgba(255,255,255,0.85);border-radius:12px;padding:10px;border:1px solid rgba(255,255,255,0.7);"><div style="font-size:16px;font-weight:700;color:#4A443C;">'+(d.stats.bestSec?Math.floor(d.stats.bestSec/60)+':'+('0'+d.stats.bestSec%60).slice(-2):'--')+'</div><div style="font-size:11px;color:#7C7367;">最佳时间</div></div>';
    html+='</div>';
  }
  // 模式
  html+='<div style="font-size:13px;font-weight:600;color:#4A443C;margin-bottom:8px;">选择模式</div>';
  html+='<div style="display:flex;gap:10px;margin-bottom:16px;">';
  html+='<div onclick="flipSetMode(\'coop\')" id="flip-mode-coop" style="flex:1;background:rgba(255,255,255,0.9);border-radius:14px;padding:14px;text-align:center;border:2px solid var(--accent);cursor:pointer;"><div style="font-size:24px;">🌟</div><div style="font-size:14px;font-weight:600;color:#4A443C;margin-top:6px;">一起完成</div><div style="font-size:11px;color:#7C7367;margin-top:2px;">共同找齐所有配对</div></div>';
  html+='<div onclick="flipSetMode(\'vs\')" id="flip-mode-vs" style="flex:1;background:rgba(255,255,255,0.9);border-radius:14px;padding:14px;text-align:center;border:2px solid transparent;cursor:pointer;"><div style="font-size:24px;">🎮</div><div style="font-size:14px;font-weight:600;color:#4A443C;margin-top:6px;">默契挑战</div><div style="font-size:11px;color:#7C7367;margin-top:2px;">看谁找到更多</div></div>';
  html+='</div>';
  // 难度
  html+='<div style="font-size:13px;font-weight:600;color:#4A443C;margin-bottom:8px;">难度</div>';
  html+='<div style="display:flex;gap:10px;margin-bottom:16px;">';
  [['easy','简单','3×4'],['normal','普通','4×4'],['hard','困难','5×6']].forEach(function(o){
    html+='<div onclick="flipSetLevel(\''+o[0]+'\')" id="flip-level-'+o[0]+'" style="flex:1;background:rgba(255,255,255,0.9);border-radius:14px;padding:12px;text-align:center;border:2px solid '+(o[0]==='easy'?'var(--accent)':'transparent')+';cursor:pointer;"><div style="font-size:15px;font-weight:600;color:#4A443C;">'+o[1]+'</div><div style="font-size:11px;color:#7C7367;margin-top:2px;">'+o[2]+'</div></div>';
  });
  html+='</div>';
  // 主题
  html+='<div style="font-size:13px;font-weight:600;color:#4A443C;margin-bottom:8px;">主题</div>';
  html+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">';
  var themeKeys=['star','accompany'];
  if(d.custom.length)themeKeys.push('custom');
  themeKeys.forEach(function(tk){
    var t=tk==='custom'?{name:'🎨 自定义主题',emojis:d.custom}:FLIP_THEMES[tk];
    if(!t)return;
    html+='<div onclick="flipSetTheme(\''+tk+'\')" id="flip-theme-'+tk+'" style="flex:1;min-width:100px;background:rgba(255,255,255,0.9);border-radius:14px;padding:12px;text-align:center;border:2px solid '+(tk==='star'?'var(--accent)':'transparent')+';cursor:pointer;"><div style="font-size:15px;font-weight:600;color:#4A443C;">'+t.name+'</div><div style="font-size:11px;color:#7C7367;margin-top:4px;">'+t.emojis.slice(0,5).join(' ')+'</div></div>';
  });
  html+='</div>';
  html+='<button onclick="flipStartGame()" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#C9B49A,#A07955);color:#4A4038;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 3px 12px rgba(175,198,233,0.4);">开始游戏</button>';
  html+='<div onclick="flipOpenCards()" style="text-align:center;font-size:12px;color:var(--accent);margin-top:14px;cursor:pointer;">📚 管理翻牌互动字卡库</div>';
  body.innerHTML=html;
  // 状态
  if(!flipState)flipState={mode:'coop',level:'easy',theme:'star'};
}
function flipSetMode(m){flipState.mode=m;var a=$('flip-mode-coop'),b=$('flip-mode-vs');if(a)a.style.borderColor=m==='coop'?'var(--accent)':'transparent';if(b)b.style.borderColor=m==='vs'?'var(--accent)':'transparent';}
function flipSetLevel(l){flipState.level=l;['easy','normal','hard'].forEach(function(k){var el=$('flip-level-'+k);if(el)el.style.borderColor=k===l?'var(--accent)':'transparent';});}
function flipSetTheme(t){flipState.theme=t;var keys=['star','accompany','custom'];keys.forEach(function(k){var el=$('flip-theme-'+k);if(el)el.style.borderColor=k===t?'var(--accent)':'transparent';});}
function flipEmojiPool(){
  // ★ 修复：跨主题合并 + 去重，保证每个图案只出现一次。
  // 之前只取当前主题的 emoji，图案不足时循环复用同一 emoji，导致"两张一样的牌却不配对"（match 编号不同）。
  var d=flipLoad();
  var pool=[];
  if(d.custom&&d.custom.length)pool=pool.concat(d.custom);
  if(d.images&&d.images.length)pool=pool.concat(d.images);
  if(flipState.theme==='custom'){
    // 自定义主题：自定义图案优先，星言/陪伴主题补足
    pool=pool.concat(FLIP_THEMES.star.emojis).concat(FLIP_THEMES.accompany.emojis);
  }else if(flipState.theme&&FLIP_THEMES[flipState.theme]){
    // 所选主题优先，另一主题 + 自定义补足（保证困难模式 15 对也有足够唯一图案）
    var other=flipState.theme==='star'?FLIP_THEMES.accompany:FLIP_THEMES.star;
    pool=pool.concat(FLIP_THEMES[flipState.theme].emojis).concat(other.emojis);
  }else{
    pool=pool.concat(FLIP_THEMES.star.emojis).concat(FLIP_THEMES.accompany.emojis);
  }
  // 去重（保留首次出现顺序）
  var seen={},uniq=[];
  pool.forEach(function(e){
    if(e==null)return;
    if(!seen[e]){seen[e]=1;uniq.push(e);}
  });
  return uniq;
}
function flipStartGame(){
  var dims={easy:[3,4],normal:[4,4],hard:[5,6]}[flipState.level]||[4,4];
  var total=dims[0]*dims[1];
  var pairCount=total/2;
  var pool=flipEmojiPool();
  // ★ 兜底：任何主题无卡片时自动用星言主题，保证一定能玩
  if(!pool||!pool.length)pool=FLIP_THEMES.star.emojis.slice();
  // ★ 选 pairCount 个图案：图案不重复（跨主题池已保证 star+accompany+custom ≥ 16，困难 15 对足够）
  var picked=[];
  var tmp=pool.slice();
  for(var i=0;i<pairCount;i++){
    if(tmp.length){var idx=Math.floor(Math.random()*tmp.length);picked.push(tmp.splice(idx,1)[0]);}
    else{picked.push('🎴'+(i+1));} // 极端兜底：仍保证图案唯一，绝不循环复用
  }
  var cards=[];
  picked.forEach(function(em,ei){
    cards.push({id:'c'+ei+'a',emoji:em,match:ei,flipped:false,matched:false});
    cards.push({id:'c'+ei+'b',emoji:em,match:ei,flipped:false,matched:false});
  });
  // 洗牌
  for(var j=cards.length-1;j>0;j--){
    var r=Math.floor(Math.random()*(j+1));
    var t=cards[j];cards[j]=cards[r];cards[r]=t;
  }
  flipState.game={cards:cards,rows:dims[0],cols:dims[1],startTs:Date.now(),open1:null,open2:null,lock:false,myPairs:0,taPairs:0,turn:'me',flips:0,taMemory:{},myCombo:0,taCombo:0};
  setTimeout(function(){flipInteract('start',0.4);},500);
  renderFlipBoard();
}
function flipRenderCard(card,idx){
  var d=flipLoad();
  var base='width:100%;aspect-ratio:0.78;border-radius:10px;cursor:pointer;position:relative;transition:transform .25s;transform-style:preserve-3d;';
  var inner='width:100%;height:100%;position:relative;transition:transform .3s;transform-style:preserve-3d;'+(card.flipped||card.matched?'transform:rotateY(180deg);':'');
  var back='position:absolute;inset:0;backface-visibility:hidden;border-radius:10px;background:linear-gradient(135deg,#C9B49A,#A07955);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
  var front='position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;'+(card.matched?'box-shadow:0 0 14px rgba(169,196,232,0.9);':'');
  var face=(card.emoji&&String(card.emoji).indexOf('data:image')===0)?'<img src="'+card.emoji+'" style="width:100%;height:100%;object-fit:cover;">':card.emoji;
  return '<div style="'+base+'"><div style="'+inner+'"><div style="'+back+'">✨</div><div style="'+front+'">'+face+'</div></div></div>';
}
function renderFlipBoard(){
  var body=$('star-flip-body');if(!body)return;
  var g=flipState.game;if(!g)return;
  var contact=contacts.find(function(c){return c.id===cid})||{name:'TA'};
  var html='';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
  html+='<div style="font-size:12px;color:#7C7367;">找到 '+g.cards.filter(function(c){return c.matched}).length/2+' / '+g.cards.length/2+' 组</div>';
  html+='<div style="font-size:12px;color:#7C7367;">用时 '+flipTimeText(Date.now()-g.startTs)+'</div>';
  html+='</div>';
  if(flipState.mode==='vs'){
    html+='<div style="display:flex;gap:8px;margin-bottom:10px;">';
    html+='<div style="flex:1;text-align:center;background:rgba(255,255,255,0.85);border-radius:12px;padding:8px;border:1px solid rgba(255,255,255,0.7);'+(g.turn==='me'?'box-shadow:0 0 10px rgba(175,198,233,0.5);':'')+'"><div style="font-size:11px;color:#7C7367;">你</div><div style="font-size:18px;font-weight:700;color:#4A443C;">'+g.myPairs+' 组</div></div>';
    html+='<div style="flex:1;text-align:center;background:rgba(255,255,255,0.85);border-radius:12px;padding:8px;border:1px solid rgba(255,255,255,0.7);'+(g.turn==='ta'?'box-shadow:0 0 10px rgba(200,182,232,0.5);':'')+'"><div style="font-size:11px;color:#7C7367;">'+contact.name+'</div><div style="font-size:18px;font-weight:700;color:#4A443C;">'+g.taPairs+' 组</div></div>';
    html+='</div>';
  }
  html+='<div id="flip-status" style="text-align:center;font-size:13px;color:#7C7367;margin-bottom:10px;min-height:20px;">'+(g.turn==='me'?'你的回合':'<span style="color:#5a6ea8;">'+contact.name+'正在寻找...</span>')+'</div>';
  html+='<div id="flip-danmaku-layer" class="flip-danmaku-layer"></div>';
  html+='<div style="display:grid;grid-template-columns:repeat('+g.cols+',1fr);gap:8px;">';
  g.cards.forEach(function(card,idx){
    html+='<div id="flip-cell-'+idx+'" onclick="flipCardClick('+idx+')">'+flipRenderCard(card,idx)+'</div>';
  });
  html+='</div>';
  body.innerHTML=html;
  if(g.turn==='ta')setTimeout(function(){flipTaTurn();},1200);
}
function flipTimeText(ms){
  var s=Math.floor(ms/1000);
  return Math.floor(s/60)+':'+('0'+s%60).slice(-2);
}
function flipCardClick(idx){
  var g=flipState.game;if(!g||g.lock||g.turn!=='me')return;
  var card=g.cards[idx];
  if(card.flipped||card.matched)return;
  if(g.open1&&g.open2)return;
  card.flipped=true;
  g.taMemory[idx]=card.match;
  // ★ 翻牌 → 牌面 → 标签 → 联系人字卡库对话（仅第一张触发；第二张由 flipJudge 统一判定处理，避免刷屏）
  if(!g.open1)flipFaceTrigger(card.emoji,{});
  if(!g.open1){g.open1=card;g.open1Idx=idx;}
  else if(!g.open2){g.open2=card;g.open2Idx=idx;g.lock=true;}
  renderFlipBoard();
  if(g.open1&&g.open2){
    setTimeout(function(){flipJudge('me');},600);
  }
}
function flipJudge(who){
  var g=flipState.game;if(!g)return;
  var c1=g.open1,c2=g.open2;
  var matched=c1&&c2&&c1.match===c2.match;
  if(matched){
    c1.matched=true;c2.matched=true;c1.flipped=true;c2.flipped=true;
    if(who==='me'){g.myPairs++;g.myCombo++;g.taCombo=0;}else{g.taPairs++;g.taCombo++;g.myCombo=0;}
    g.taMemory[g.cards.indexOf(c1)]=c1.match;
    g.taMemory[g.cards.indexOf(c2)]=c2.match;
    var tip=who==='me'?'找到了！':'找到了。';
    flipStatus('✨ '+tip);
    // ★ 配对成功 → 随机触发【固定字卡】或【发送正常聊天字卡】（按牌面标签筛选，TA 从自己的字卡库回应你）
    flipFaceTrigger((c1&&c1.emoji)||'',{match:true,group:who==='me'?'success':'ta_success'});
    // ★ 连续配对（任一方连对 ≥2）
    if((who==='me'&&g.myCombo>=2)||(who==='ta'&&g.taCombo>=2))flipInteract('combo',0.45);
    // ★ 领先/落后（vs 模式比分差 ≥1）
    if(flipState.mode==='vs'&&Math.abs(g.myPairs-g.taPairs)>=1)flipInteract('leadlag',0.4);
    g.open1=null;g.open2=null;g.lock=false;
    if(g.cards.every(function(c){return c.matched})){
      flipFinish();
      return;
    }
    if(who==='me'){renderFlipBoard();}
    else{flipState.game.turn='me';renderFlipBoard();}
  }else{
    if(c1)c1.flipped=false;
    if(c2)c2.flipped=false;
    g.open1=null;g.open2=null;g.lock=false;
    if(who==='me'){
      g.myCombo=0;
      flipStatus('没关系，再试试。');
      flipFaceTrigger(((c2&&c2.emoji)||(c1&&c1.emoji)||''),{group:'fail'});
      g.turn='ta';
      renderFlipBoard();
    }else{
      g.taCombo=0;
      flipStatus('差一点。');
      flipFaceTrigger(((c2&&c2.emoji)||(c1&&c1.emoji)||''),{ta:true,group:'ta_fail'});
      g.turn='me';
      renderFlipBoard();
    }
  }
}
function flipTaTurn(){
  var g=flipState.game;if(!g||g.turn!=='ta')return;
  var avail=[];
  g.cards.forEach(function(c,i){if(!c.matched&&!c.flipped)avail.push(i);});
  if(avail.length<2)return;
  flipInteract('ta_turn',0.3);
  // ★ 记忆配对：40% 概率优先用记忆找一对（TA 见过玩家翻的卡和 TA 自己翻的卡）
  var memPair=null;
  if(Math.random()<0.4){
    for(var x=0;x<avail.length&&!memPair;x++){
      var ai=avail[x];
      var m=g.taMemory[ai];
      if(m==null)continue;
      for(var y=0;y<avail.length;y++){
        var bi=avail[y];
        if(bi!==ai&&g.cards[bi].match===m){memPair=[ai,bi];break;}
      }
    }
  }
  var a,b;
  flipTaSay('ta_turn',0.2);
  if(memPair){a=memPair[0];b=memPair[1];}
  else{
    // 随机：优先翻一张见过的卡，另一张随机（蒙对的概率自然产生）
    var seen=[];
    avail.forEach(function(i){if(g.taMemory[i]!=null)seen.push(i);});
    if(seen.length>0&&Math.random()<0.5){a=seen[Math.floor(Math.random()*seen.length)];}
    else{a=avail[Math.floor(Math.random()*avail.length)];}
    var avail2=avail.filter(function(x){return x!==a});
    b=avail2[Math.floor(Math.random()*avail2.length)];
  }
  g.cards[a].flipped=true;g.cards[b].flipped=true;
  g.taMemory[a]=g.cards[a].match;
  g.taMemory[b]=g.cards[b].match;
  g.open1=g.cards[a];g.open2=g.cards[b];
  // ★ TA 翻牌 → 也走牌面触发层（随机触发固定字卡 或 从 TA 自己的字卡库回应，概率再降）
  flipFaceTrigger(g.cards[a].emoji,{ta:true,group:'ta_turn'});
  renderFlipBoard();
  setTimeout(function(){flipJudge('ta');},800);
}
function flipStatus(t){
  var el=$('flip-status');
  if(el)el.innerHTML=t;
}
function flipFinish(){
  var g=flipState.game;if(!g)return;
  var sec=Math.round((Date.now()-g.startTs)/1000);
  var d=flipLoad();
  d.stats.plays++;
  d.stats.completes++;
  if(!d.stats.bestSec||sec<d.stats.bestSec)d.stats.bestSec=sec;
  flipSave(d);
  flipInteract('end',1);
  var contact=contacts.find(function(c){return c.id===cid})||{name:'TA'};
  var body=$('star-flip-body');if(!body)return;
  var html='';
  html+='<div style="text-align:center;padding:20px 0;">';
  html+='<div style="font-size:40px;">🎉</div>';
  html+='<div style="font-size:20px;font-weight:700;color:#4A443C;margin-top:8px;">星言翻牌完成</div>';
  html+='<div style="font-size:13px;color:#7C7367;margin-top:6px;">'+flipPickCard('end')+'</div>';
  html+='</div>';
  html+='<div style="background:rgba(255,255,255,0.9);border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.7);margin-bottom:14px;">';
  html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>总用时</span><span style="font-weight:600;">'+flipTimeText(sec*1000)+'</span></div>';
  if(flipState.mode==='vs'){
    var winner=g.myPairs===g.taPairs?'平局':(g.myPairs>g.taPairs?'你赢':'TA赢');
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>你找到</span><span style="font-weight:600;">'+g.myPairs+' 组</span></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>'+contact.name+'找到</span><span style="font-weight:600;">'+g.taPairs+' 组</span></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>结果</span><span style="font-weight:600;color:'+(winner==='你赢'?'#4e7a54':(winner==='TA赢'?'#5a6ea8':'#5a6ea8'))+';">'+winner+'</span></div>';
  }else{
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>共同完成</span><span style="font-weight:600;">'+g.cards.length/2+' 组</span></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>你找到</span><span style="font-weight:600;">'+g.myPairs+' 组</span></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;color:#4A443C;padding:5px 0;"><span>'+contact.name+'找到</span><span style="font-weight:600;">'+g.taPairs+' 组</span></div>';
  }
  html+='</div>';
  html+='<button onclick="flipAgain()" style="width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#C9B49A,#A07955);color:#4A4038;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;">再玩一次</button>';
  html+='<button onclick="renderFlipMenu()" style="width:100%;padding:13px;border:none;border-radius:12px;background:rgba(255,255,255,0.9);color:#4A443C;font-size:15px;cursor:pointer;margin-bottom:10px;">更换主题 / 返回菜单</button>';
  html+='<button onclick="flipBack()" style="width:100%;padding:13px;border:none;border-radius:12px;background:rgba(255,255,255,0.9);color:#7C7367;font-size:15px;cursor:pointer;">返回</button>';
  body.innerHTML=html;
  flipState.game=null;
}
// ★ 再来一局：概率触发"再来一局"字卡后重新开始
function flipAgain(){
  flipInteract('again',0.8);
  flipStartGame();
}
// ===== 翻牌互动字卡库管理 =====
function flipOpenCards(){
  renderFlipCards();
  showOv('ov-flip-cards');
}
function renderFlipCards(){
  var box=$('flip-cards-body');if(!box)return;
  var d=flipLoad();
  var html='';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:6px;line-height:1.7;">翻牌时 TA 的对话来自【当前联系人的字卡库】按牌面标签筛选随机调用（公用 + 专享 + 默认通用字卡），不在翻牌里写死。下方字卡是游戏流程旁白（开始 / 找到 / 失败等），只在 TA 没有可用字卡时兜底。</div>';
  FLIP_CARD_GROUPS.forEach(function(g){
    html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin:14px 0 8px;">'+g[1]+'</div>';
    var arr=d.cards[g[0]];
    if(!arr.length)html+='<div style="font-size:12px;color:var(--txt3);padding:6px 0;">暂无，使用默认</div>';
    arr.forEach(function(t,idx){
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="flex:1;font-size:13px;color:var(--txt);background:var(--c2);border-radius:8px;padding:8px 10px;word-break:break-all;">'+String(t).replace(/</g,'&lt;')+'</div><button onclick="flipCardDel(\''+g[0]+'\','+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
    });
    html+='<div style="display:flex;gap:8px;margin-top:6px;"><input id="flip-card-new-'+g[0]+'" type="text" placeholder="添加字卡..." style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;min-width:0;"><button onclick="flipCardAdd(\''+g[0]+'\')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;flex-shrink:0;">添加</button></div>';
  });
  // 自定义主题 emoji
  html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin:16px 0 8px;">🎨 自定义主题卡片</div>';
  html+='<div style="font-size:11px;color:var(--txt3);margin-bottom:6px;">可输入 emoji 或上传本地图片作为牌面图案</div>';
  var customPool=(d.custom||[]).concat(d.images||[]);
  if(!customPool.length)html+='<div style="font-size:12px;color:var(--txt3);padding:6px 0;">暂无自定义卡片</div>';
  (d.custom||[]).forEach(function(em,idx){
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:40px;height:40px;background:var(--c2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;">'+em+'</div><button onclick="flipCustomDel('+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
  });
  (d.images||[]).forEach(function(im,idx){
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><img src="'+im+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;background:var(--c2);"><button onclick="flipCustomImageDel('+idx+')" style="width:28px;height:28px;border:none;background:none;color:#e05a5a;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button></div>';
  });
  html+='<div style="display:flex;gap:8px;margin-top:6px;"><input id="flip-card-new-custom" type="text" placeholder="输入一个 emoji" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;outline:none;min-width:0;"><button onclick="flipCustomAdd()" style="padding:8px 14px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;flex-shrink:0;">添加</button></div>';
  html+='<div style="display:flex;gap:8px;margin-top:8px;"><input type="file" id="flip-custom-img-input" accept="image/*" style="display:none;"><button onclick="document.getElementById(\'flip-custom-img-input\').click()" style="flex:1;padding:9px;border:1px dashed var(--border);border-radius:8px;background:var(--c1);color:var(--txt2);font-size:13px;cursor:pointer;">🖼️ 上传本地图片</button></div>';
  box.innerHTML=html;
}
function flipCardAdd(group){
  var inp=$('flip-card-new-'+group);
  var v=inp?inp.value.trim():'';
  if(!v){toast('请输入内容');return;}
  var d=flipLoad();
  d.cards[group].push(v);
  flipSave(d);
  renderFlipCards();
}
function flipCardDel(group,idx){
  var d=flipLoad();
  d.cards[group].splice(idx,1);
  flipSave(d);
  renderFlipCards();
}
function flipCustomAdd(){
  var inp=$('flip-card-new-custom');
  var v=inp?inp.value.trim():'';
  if(!v){toast('请输入 emoji');return;}
  var d=flipLoad();
  if(d.custom.indexOf(v)<0)d.custom.push(v);
  flipSave(d);
  renderFlipCards();
}
function flipCustomDel(idx){
  var d=flipLoad();
  d.custom.splice(idx,1);
  flipSave(d);
  renderFlipCards();
}
function flipCustomImageDel(idx){
  var d=flipLoad();
  d.images.splice(idx,1);
  flipSave(d);
  renderFlipCards();
}
function bindFlipImageUpload(){
  var inp=document.getElementById('flip-custom-img-input');
  if(!inp||inp._flipBound)return;
  inp._flipBound=true;
  inp.addEventListener('change',function(){
    var f=this.files&&this.files[0];
    if(!f)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var d=flipLoad();
      d.images.push(ev.target.result);
      flipSave(d);
      renderFlipCards();
    };
    reader.readAsDataURL(f);
    this.value='';
  });
}
setTimeout(function(){bindFlipImageUpload();},500);
setInterval(function(){bindFlipImageUpload();},3000);
// ============ 星言旅途（梦角陪伴旅行事件模拟器）============
// 核心设计：事件系统 > 梦角互动 > 旅行记录 > 地图移动。
// 骰子只是触发移动的方式；每次移动后必弹事件卡；旅程无胜负，5 天后生成旅行手账。
var JOURNEY_KEY='ml2_star_journey';
var JOURNEY_WEATHERS=[{icon:'☀️',name:'晴天'},{icon:'🌧️',name:'雨天'},{icon:'🌙',name:'夜晚'},{icon:'☁️',name:'阴天'}];
var JOURNEY_LOCATION_NAMES={garden:'🌸 花园',cafe:'☕ 咖啡馆',bookshop:'📚 书店',beach:'🌊 海边',park:'🌳 公园',rooftop:'🌙 天台'};
var JOURNEY_THEMES=[
  {key:'spring',name:'🌸 春日旅行',places:['garden','park','cafe','bookshop','beach','rooftop']},
  {key:'night',name:'🌙 夜晚漫游',places:['rooftop','cafe','park','beach','bookshop','garden']},
  {key:'city',name:'🏙️ 城市漫游',places:['cafe','bookshop','park','rooftop','beach','garden']},
  {key:'seaside',name:'🌊 海风之旅',places:['beach','cafe','park','rooftop','bookshop','garden']}
];

// ==================== 事件数据库（Event Database）====================
// 与地图代码分离。每个事件 = 一段和梦角共同经历的小事：
// {title, condition?, scene(场景), companionAction(梦角动作), companionLine(梦角台词),
//  interactions:[{name, playerAction}], outcomes:{互动名:{result(结果), companionReply(梦角回应), memory(事件记忆), stars, souvenir}}}
// {name} 为梦角名占位符，渲染时替换。地点事件 6×4=24 + 互动 9 + 随机 8 = 41 个。
var JOURNEY_DB={
  locations:{
    garden:{events:[
      {title:'一起赏花',condition:'晴天',
        scene:'花园里开满了花，风一吹，花瓣像雪一样落下来。',
        companionAction:'{name}蹲下来，轻轻托起一朵花，转头看你。',
        companionLine:'「你看，这一朵的颜色，像傍晚的天空。」',
        interactions:[{name:'凑近看看',playerAction:'你凑近那朵花'},{name:'也蹲下来',playerAction:'你在{name}身边蹲下来'}],
        outcomes:{
          '凑近看看':{result:'花瓣蹭过你的鼻尖，你忍不住笑了。',companionReply:'{name}也笑了：「连花都在跟你打招呼。」',memory:'在花园，和{name}一起看了那朵像傍晚天空的花。',stars:2,souvenir:'🌸 干花书签'},
          '也蹲下来':{result:'你蹲下的那一刻，风刚好把一片花瓣送到你们中间。',companionReply:'{name}眨了眨眼：「好像被我们看到了什么了不得的场面。」',memory:'和{name}在花丛边蹲了很久，说了些不着边际的话。',stars:2,souvenir:''}
        }},
      {title:'花丛里的蝴蝶',
        scene:'一只蝴蝶在花间忽高忽低地飞，翅膀在光里发亮。',
        companionAction:'{name}伸出手想碰，又轻轻收了回去。',
        companionLine:'「别吓到它，让它多飞一会儿。」',
        interactions:[{name:'悄悄跟上',playerAction:'你放轻脚步，悄悄跟在蝴蝶后面'},{name:'并肩看着',playerAction:'你站到{name}身边，一起看蝴蝶'}],
        outcomes:{
          '悄悄跟上':{result:'蝴蝶停在一朵花上，扇了扇翅膀，又飞远了。',companionReply:'{name}小声说：「你看，它记住我们了。」',memory:'和{name}追着一只蝴蝶穿过花丛，谁也没说话。',stars:1,souvenir:''},
          '并肩看着':{result:'蝴蝶绕着你们飞了一圈，才不紧不慢地离开。',companionReply:'{name}说：「好像是为我们绕了一圈。」',memory:'在花丛边，和{name}并肩看着一只蝴蝶飞走。',stars:2,souvenir:''}
        }},
      {title:'长椅上的午后',
        scene:'花园角落的长椅晒着太阳，树影在脚边晃。',
        companionAction:'{name}先坐下，拍了拍身边的位置。',
        companionLine:'「要不要坐一会儿？又不赶时间。」',
        interactions:[{name:'坐下来',playerAction:'你在{name}旁边坐下来，肩膀挨得很近'},{name:'站着聊',playerAction:'你靠在长椅扶手上，低头看{name}'}],
        outcomes:{
          '坐下来':{result:'阳光暖融融的，你们有一搭没一搭地聊着，谁也没看时间。',companionReply:'{name}眯起眼睛：「这样的下午，多来几个就好了。」',memory:'一个晒着太阳的午后，和{name}在长椅上说了很多话。',stars:1,souvenir:''},
          '站着聊':{result:'你站着，{name}坐着，你们聊到树影移了一小段。',companionReply:'{name}仰头看你：「站累了就坐下嘛。」',memory:'长椅边，和{name}换了个角度聊天，阳光正好。',stars:1,souvenir:''}
        }},
      {title:'花房的花茶',
        scene:'花房的小桌上摆着刚泡好的花茶，玻璃上蒙着薄薄的水汽。',
        companionAction:'{name}捧起杯子，小心地吹了吹。',
        companionLine:'「有点烫，你尝尝看，是不是有玫瑰的味道。」',
        interactions:[{name:'尝一口',playerAction:'你端起杯子，小心地尝了一口'},{name:'先闻闻',playerAction:'你先凑近闻了闻茶香'}],
        outcomes:{
          '尝一口':{result:'茶是温的，咽下去的时候有一点点甜。',companionReply:'{name}看着你的表情，笑了：「好喝吧？」',memory:'花房的花茶，和{name}一人一杯，蒸汽在光里飘。',stars:2,souvenir:'🍵 花茶包'},
          '先闻闻':{result:'茶香里有玫瑰和一点蜂蜜的味道，你很认真地闻着。',companionReply:'{name}也学你凑近闻：「嗯，是挺香。」',memory:'和{name}对着两杯花茶，先闻了半天才喝。',stars:1,souvenir:''}
        }}
    ]},
    cafe:{events:[
      {title:'窗边的两杯热饮',
        scene:'咖啡馆靠窗的位置，两杯热饮冒着白气，街上的人慢慢走过。',
        companionAction:'{name}把其中一杯往你面前推了推。',
        companionLine:'「小心烫，先晾一晾。」',
        interactions:[{name:'碰碰杯',playerAction:'你端起杯子，轻轻碰了碰{name}的杯沿'},{name:'看窗外',playerAction:'你捧着杯子，和{name}一起看窗外的人'}],
        outcomes:{
          '碰碰杯':{result:'杯沿碰在一起，发出很轻的一声响。',companionReply:'{name}愣了一下，然后也碰了回来：「干杯。」',memory:'咖啡馆的窗边，和{name}碰了一次杯。',stars:1,souvenir:''},
          '看窗外':{result:'一个小孩追着气球跑过，你们看了很久。',companionReply:'{name}说：「好像在看一部没有声音的电影。」',memory:'和{name}在咖啡馆窗边，看了一下午的街景。',stars:2,souvenir:''}
        }},
      {title:'躲雨',condition:'雨天',
        scene:'雨点忽然打上玻璃窗，外面一下子变得模糊。',
        companionAction:'{name}盯着窗上的雨滴，看它们汇成一条线。',
        companionLine:'「雨声好好听，我们多坐一会儿好不好？」',
        interactions:[{name:'一起听雨',playerAction:'你也看向窗外，和{name}一起听雨'},{name:'讲个雨天的故事',playerAction:'你给{name}讲了一个关于雨天的故事'}],
        outcomes:{
          '一起听雨':{result:'雨声时大时小，像一首只有你们在听的曲子。',companionReply:'{name}轻轻说：「好像时间也慢下来了。」',memory:'一场雨，和{name}在咖啡馆听了一下午的雨声。',stars:2,souvenir:''},
          '讲个雨天的故事':{result:'你讲到一半，{name}笑出了声，雨声都盖不住。',companionReply:'{name}擦擦眼角：「你讲的故事怎么这么好笑。」',memory:'躲雨的时候，{name}被你的故事逗笑了。',stars:2,souvenir:''}
        }},
      {title:'一块招牌蛋糕',
        scene:'柜台里只剩最后一块招牌蛋糕，灯光把它照得发亮。',
        companionAction:'{name}指了指蛋糕，又看了看你。',
        companionLine:'「只剩一块了，一人一半？」',
        interactions:[{name:'分成两半',playerAction:'你让店员把蛋糕切成两半'},{name:'让给{name}',playerAction:'你把整块蛋糕让给了{name}'}],
        outcomes:{
          '分成两半':{result:'两半蛋糕摆在盘子里，你们各自尝了一口。',companionReply:'{name}点点头：「嗯，分着吃果然更好吃。」',memory:'和{name}分吃了一块招牌蛋糕，一人一半。',stars:2,souvenir:'🍰 甜点券'},
          '让给{name}':{result:'{name}看着你推过来的盘子，愣了一会儿。',companionReply:'{name}弯起眼睛：「那我下次请你吃别的。」',memory:'把最后一块蛋糕让给了{name}，TA记了好久。',stars:2,souvenir:''}
        }},
      {title:'墙上的手写便签',
        scene:'咖啡馆的墙上贴满了手写的便签，歪歪扭扭的字挤在一起。',
        companionAction:'{name}站在墙前，一张一张地看，忽然笑了。',
        companionLine:'「你看这张，写的是『希望明天也是晴天』。」',
        interactions:[{name:'一起读便签',playerAction:'你凑过去，和{name}一起读那些便签'},{name:'也写一张',playerAction:'你找来笔，写了一张便签贴上'}],
        outcomes:{
          '一起读便签':{result:'你们读到了很多陌生人的小心愿，有的好笑，有的让人沉默。',companionReply:'{name}说：「原来大家的愿望都差不多。」',memory:'在咖啡馆的便签墙前，和{name}读了一墙的心愿。',stars:1,souvenir:''},
          '也写一张':{result:'你在便签上写了几个字，小心地贴进人群里。',companionReply:'{name}看了看你写的字，也写了一张贴在旁边：「这样就不孤单了。」',memory:'和{name}在便签墙上各留了一张字条，贴在了一起。',stars:2,souvenir:''}
        }}
    ]},
    bookshop:{events:[
      {title:'旧书里的明信片',
        scene:'书架角落躺着一本泛黄的旧书，书页间好像夹着什么。',
        companionAction:'{name}翻开书，一张旧明信片掉了出来。',
        companionLine:'「是上一个人留下的，背面还写着字。」',
        interactions:[{name:'一起读明信片',playerAction:'你接过明信片，和{name}一起看背面的字'},{name:'放回书里',playerAction:'你看完，把明信片轻轻放回书页间'}],
        outcomes:{
          '一起读明信片':{result:'背面写着一句「希望收到的人今天开心」，没有署名。',companionReply:'{name}轻声说：「那今天要开心一点才行。」',memory:'一本旧书里，和{name}读到一张陌生人的明信片。',stars:2,souvenir:'📮 旧明信片'},
          '放回书里':{result:'你把明信片按原样放好，让这份小心意继续等着下一个人。',companionReply:'{name}点点头：「留给下一个有缘人吧。」',memory:'和{name}把一张明信片放回了旧书里，像藏了一个秘密。',stars:1,souvenir:''}
        }},
      {title:'够不到的书',
        scene:'书架很高，最上面那一层摆着一本封面很好看的书。',
        companionAction:'{name}踮起脚试了试，还是差一点。',
        companionLine:'「帮我看看，是不是那本？」',
        interactions:[{name:'帮忙拿下来',playerAction:'你伸手把书拿下来，递给{name}'},{name:'一起想办法',playerAction:'你左右看看，和{name}一起找梯子'}],
        outcomes:{
          '帮忙拿下来':{result:'书比你想象的重，封面是一幅小岛的地图。',companionReply:'{name}接过去，眼睛亮亮的：「就是这本，找了好久。」',memory:'在书店，帮{name}拿下一本找了很久的书。',stars:2,souvenir:''},
          '一起想办法':{result:'你们在角落里找到一把小梯子，像完成了一次小探险。',companionReply:'{name}扶着梯子笑：「感觉像在寻宝。」',memory:'和{name}在书店里搬梯子找书，像两个寻宝的人。',stars:2,souvenir:''}
        }},
      {title:'角落的阅读时间',
        scene:'书店深处有一个安静的小角落，地板上铺着软垫。',
        companionAction:'{name}盘腿坐下来，翻开一本书，又抬头看你。',
        companionLine:'「坐我旁边看吧，这里安静。」',
        interactions:[{name:'挨着坐下',playerAction:'你在{name}旁边坐下，翻开自己的书'},{name:'看{name}的书',playerAction:'你凑过去，和{name}看同一本书'}],
        outcomes:{
          '挨着坐下':{result:'你们各看各的书，偶尔翻页，谁也没打扰谁。',companionReply:'过了很久，{name}轻声说：「这样就很舒服。」',memory:'书店的角落里，和{name}挨着坐，各看各的书。',stars:1,souvenir:''},
          '看{name}的书':{result:'书里的插画很好看，你们一页一页慢慢翻。',companionReply:'{name}说：「和你一起看，好像更好看了。」',memory:'和{name}看了同一本书，翻书的声音都很轻。',stars:2,souvenir:''}
        }},
      {title:'扉页的留言',
        scene:'新书的扉页还是一片空白，像等着被写点什么。',
        companionAction:'{name}拿起笔，在扉页比划了一下，又放下。',
        companionLine:'「要不要写点什么？以后翻到会想起来。」',
        interactions:[{name:'写一行字',playerAction:'你在扉页写下一行字'},{name:'让{name}写',playerAction:'你把笔递给{name}，让TA来写'}],
        outcomes:{
          '写一行字':{result:'你写下当天的日期和一句话，字迹歪歪的但很认真。',companionReply:'{name}看了一眼，轻声念出来：「写得真好。」',memory:'在书里写下了一行字，和{name}的旅行记在了一起。',stars:2,souvenir:'✍️ 手抄短句'},
          '让{name}写':{result:'{name}想了想，认真写下几个字，又补了一颗小星星。',companionReply:'{name}把书合上：「以后翻到，会想起今天。」',memory:'{name}在扉页写了字，还画了一颗小星星。',stars:1,souvenir:''}
        }}
    ]},
    beach:{events:[
      {title:'追浪花',
        scene:'浪一层层涌上沙滩，又在脚边碎成白色的泡沫。',
        companionAction:'{name}脱了鞋，踩进浅浅的海水里。',
        companionLine:'「快来，浪要来了！」',
        interactions:[{name:'一起追浪',playerAction:'你追着浪跑，又笑着往回躲'},{name:'站在岸边看',playerAction:'你站在岸边，看着{name}和海浪玩'}],
        outcomes:{
          '一起追浪':{result:'浪追上你们，裤脚湿了一片，谁也不在乎。',companionReply:'{name}笑得直不起腰：「你看你，跑得比浪还快。」',memory:'海边，和{name}追着浪跑，裤脚都湿了。',stars:2,souvenir:''},
          '站在岸边看':{result:'你看着{name}和海浪玩，心里觉得这个画面很好看。',companionReply:'{name}跑回来：「你怎么不来？」说着拉了一下你的袖子。',memory:'在海边看{name}追浪，然后被TA拉着一块儿去玩水。',stars:1,souvenir:''}
        }},
      {title:'捡贝壳',
        scene:'退潮后的沙滩上，贝壳散落在湿漉漉的沙子里。',
        companionAction:'{name}蹲下来，手指在沙里拨来拨去。',
        companionLine:'「我找到一枚特别的，你看。」',
        interactions:[{name:'一起找',playerAction:'你也蹲下来，和{name}一起翻沙子'},{name:'看TA找到的',playerAction:'你凑过去，看{name}手心的贝壳'}],
        outcomes:{
          '一起找':{result:'你们找了一小把贝壳，有的完整，有的缺了一角。',companionReply:'{name}挑了最好看的那枚递给你：「给你。」',memory:'退潮的沙滩，和{name}一起捡了一把贝壳。',stars:2,souvenir:'🐚 螺旋贝壳'},
          '看TA找到的':{result:'那枚贝壳是螺旋纹的，在阳光下有点透明。',companionReply:'{name}把它放在你手心：「归你了，我再去捡。」',memory:'{name}把找到的贝壳放在了你手心里。',stars:2,souvenir:''}
        }},
      {title:'海边的落日',
        scene:'太阳往海面沉下去，整个海面都铺满了金色。',
        companionAction:'{name}在沙滩上坐下，抱着膝盖望向海。',
        companionLine:'「你看海面，全是金色的。」',
        interactions:[{name:'挨着坐下',playerAction:'你在{name}身边坐下，一起看落日'},{name:'拍一张',playerAction:'你举起手机，把落日和{name}拍进同一张照片'}],
        outcomes:{
          '挨着坐下':{result:'你们谁也没说话，一直看到太阳完全沉进海面。',companionReply:'{name}轻轻说：「想多看一会儿。」',memory:'海边的落日，和{name}并排坐着，看到天黑。',stars:2,souvenir:''},
          '拍一张':{result:'照片里是金色的海面，和{name}侧着的脸。',companionReply:'{name}凑过来看：「拍得不错，发我一张。」',memory:'落日、海面，还有照片里{name}的侧脸。',stars:2,souvenir:'📸 海边合照'}
        }},
      {title:'沙滩上的字',
        scene:'湿润的沙滩平平整整，像一张没有人写过的纸。',
        companionAction:'{name}用脚尖在沙上划了几下，又赶紧回头看潮水。',
        companionLine:'「猜猜我写了什么？」',
        interactions:[{name:'低头看字',playerAction:'你走过去，看{name}在沙上写了什么'},{name:'也写一个',playerAction:'你在旁边也写了一个字'}],
        outcomes:{
          '低头看字':{result:'沙上写着两个字，笔迹歪歪的，潮水已经开始漫上来。',companionReply:'{name}有点不好意思：「快看，要没了。」',memory:'在沙滩上，{name}用脚尖写下的字被潮水带走了。',stars:2,souvenir:''},
          '也写一个':{result:'你写的字和{name}写的字并排躺在沙上，一起等着潮水。',companionReply:'{name}看着两个并排的字，弯起眼睛笑了。',memory:'和{name}在沙滩上各写了一个字，让潮水一起带走。',stars:1,souvenir:''}
        }}
    ]},
    park:{events:[
      {title:'喂鸽子',
        scene:'草坪边聚着几只鸽子，咕咕叫着，歪头看人。',
        companionAction:'{name}蹲下来，小心地把面包屑撒在地上。',
        companionLine:'「它们胆子好大，你看，靠过来了。」',
        interactions:[{name:'一起喂',playerAction:'你也蹲下来，和{name}一起撒面包屑'},{name:'在旁边看',playerAction:'你站在旁边，看鸽子围着{name}打转'}],
        outcomes:{
          '一起喂':{result:'鸽子围了一圈，有一只还轻轻啄了啄你的手心。',companionReply:'{name}说：「它喜欢你。」',memory:'在公园喂鸽子，有一只轻轻啄了你的手心。',stars:2,souvenir:'🕊️ 鸽羽书签'},
          '在旁边看':{result:'鸽子都围着{name}，像在和TA说悄悄话。',companionReply:'{name}抬头看你，有点得意：「我是它们的朋友。」',memory:'看{name}和一群鸽子玩，TA说自己是它们的朋友。',stars:1,souvenir:''}
        }},
      {title:'喷泉边的长椅',
        scene:'喷泉哗哗地响，水花在风里飘成细碎的雾。',
        companionAction:'{name}靠在长椅背上，仰头看喷泉。',
        companionLine:'「就这样坐一会儿，就很好。」',
        interactions:[{name:'靠着坐',playerAction:'你也靠到椅背上，和{name}一起看喷泉'},{name:'伸手接水花',playerAction:'你伸出手，接飘过来的水花'}],
        outcomes:{
          '靠着坐':{result:'水声很大，你们谁也没说话，只是坐着。',companionReply:'过了一会儿，{name}说：「下次还来这儿坐。」',memory:'喷泉边，和{name}靠着椅背坐了一小会儿。',stars:1,souvenir:''},
          '伸手接水花':{result:'水珠落在手心，凉丝丝的，你甩了甩手。',companionReply:'{name}被你的动作逗笑：「你好像个小孩子。」',memory:'在喷泉边接水花，被{name}说像个小孩子。',stars:2,souvenir:''}
        }},
      {title:'双人自行车',
        scene:'租车点停着一辆双人自行车，车筐里插着一面小旗子。',
        companionAction:'{name}扶着车把，回头看你。',
        companionLine:'「上来吧，我带你，你踩稳就行。」',
        interactions:[{name:'坐上去',playerAction:'你坐上后座，抓住车座'},{name:'换我来骑',playerAction:'你说你来骑，让{name}坐后面'}],
        outcomes:{
          '坐上去':{result:'车子歪歪扭扭地出发，你们绕着公园骑了一圈。',companionReply:'{name}在前面笑：「你的重量刚好压住车。」',memory:'和{name}骑了一圈双人自行车，歪歪扭扭地笑了一路。',stars:2,souvenir:''},
          '换我来骑':{result:'你骑在前面，{name}在后面喊：「慢点慢点！」',companionReply:'下了车{name}还扶着腰：「下次换我来骑。」',memory:'你骑车带着{name}绕公园一圈，TA在后面喊慢点。',stars:2,souvenir:''}
        }},
      {title:'傍晚的跑道',
        scene:'夕阳把跑道染成橘红色，散步的人影子拉得很长。',
        companionAction:'{name}小跑了几步，又停下来回头看你。',
        companionLine:'「跟上来呀，走太慢就看不到日落了。」',
        interactions:[{name:'追上去',playerAction:'你小跑几步，追上{name}'},{name:'慢慢走',playerAction:'你不紧不慢地走，看{name}在前面跑'}],
        outcomes:{
          '追上去':{result:'你们并排小跑，影子在身后连成一片。',companionReply:'{name}边跑边说：「果然还是两个人跑有意思。」',memory:'傍晚的跑道，和{name}并排跑着，影子连在一起。',stars:1,souvenir:''},
          '慢慢走':{result:'{name}跑远又跑回来，像一只不知道累的小狗。',companionReply:'{name}在你身边停下：「你倒是一点也不着急。」',memory:'看着{name}在夕阳下的跑道上跑远又跑回来。',stars:1,souvenir:''}
        }}
    ]},
    rooftop:{events:[
      {title:'等流星',condition:'夜晚',
        scene:'天台的夜空很干净，星星像撒了一把碎钻。',
        companionAction:'{name}仰着头，手撑在栏杆上。',
        companionLine:'「今晚云不多，说不定能看到流星。」',
        interactions:[{name:'一起仰头',playerAction:'你也仰起头，和{name}一起看夜空'},{name:'先许个愿',playerAction:'你闭上眼，提前在心里许了一个愿望'}],
        outcomes:{
          '一起仰头':{result:'忽然一道光从夜空划过，快得来不及眨眼。',companionReply:'{name}一把抓住你的袖子：「看到了！快许愿！」',memory:'天台上，和{name}一起看到一颗流星划过。',stars:3,souvenir:'🌠 流星许愿卡'},
          '先许个愿':{result:'你睁开眼时，{name}正闭着眼睛，很认真地在许愿。',companionReply:'{name}睁开眼：「你许完了吗？我刚才替你也许了一个。」',memory:'在流星来临前许了愿，{name}说替你也许了一个。',stars:2,souvenir:''}
        }},
      {title:'吹晚风',
        scene:'晚风从楼顶灌过来，把白天的闷热都吹散了。',
        companionAction:'{name}张开手臂，像要接住一整阵风。',
        companionLine:'「风好舒服，你也试试。」',
        interactions:[{name:'张开手臂',playerAction:'你也张开手臂，和{name}一起接风'},{name:'站在TA身边',playerAction:'你站到{name}身边，风把你们的衣角吹到一起'}],
        outcomes:{
          '张开手臂':{result:'风从袖口灌进来，你们像两只迎风的风筝。',companionReply:'{name}笑出声：「你看我们，像不像在飞。」',memory:'天台的晚风里，和{name}张开手臂，像要飞起来。',stars:1,souvenir:''},
          '站在TA身边':{result:'风把你们的衣角吹到一起，又分开，又吹到一起。',companionReply:'{name}低头看了一眼，没说话，但嘴角弯了弯。',memory:'天台的风，把和{name}的衣角吹到了一起。',stars:2,souvenir:''}
        }},
      {title:'数远处的灯',
        scene:'天台下是万家灯火，远远近近地亮成一片。',
        companionAction:'{name}指着远处一扇亮着的窗。',
        companionLine:'「那边亮着的窗，会是谁家呢？」',
        interactions:[{name:'一起猜',playerAction:'你和{name}一起猜那扇窗里的故事'},{name:'安静看灯火',playerAction:'你什么都不说，只是和{name}一起看着那些灯'}],
        outcomes:{
          '一起猜':{result:'你们给每扇亮着的窗都编了一个小故事，编到后来自己都笑了。',companionReply:'{name}说：「下次再猜别的窗。」',memory:'天台上，和{name}给远处的每一扇窗编了故事。',stars:1,souvenir:''},
          '安静看灯火':{result:'灯火在远处安静地亮着，像一片不会熄灭的海。',companionReply:'过了很久，{name}轻声说：「这片灯火里，现在有我们一盏了。」',memory:'和{name}在天台看灯火，像看着一片海。',stars:2,souvenir:''}
        }},
      {title:'天台上的星座',condition:'夜晚',
        scene:'夜空里的星星连成了你不太认得的形状。',
        companionAction:'{name}伸出手，在星星之间比划着连线。',
        companionLine:'「你看，把这几颗连起来，像不像一把勺子？」',
        interactions:[{name:'顺着TA的手看',playerAction:'你顺着{name}手指的方向，努力辨认那个形状'},{name:'指出自己认识的星',playerAction:'你指着一颗特别亮的星，说它叫什么'}],
        outcomes:{
          '顺着TA的手看':{result:'你眯着眼看了半天，终于「啊」了一声：真的像。',companionReply:'{name}很高兴：「我就说像吧。」',memory:'在天台上，跟着{name}的手指认出了一把"勺子"。',stars:2,souvenir:''},
          '指出自己认识的星':{result:'你讲得磕磕绊绊，{name}却听得很认真。',companionReply:'{name}听完点点头：「那我记住这一颗了。」',memory:'和{name}指认了一颗星星，TA说会记住它。',stars:2,souvenir:'🌟 许愿星'}
        }}
    ]}
  },
  // 互动事件（与地点无关）：聊天 / 散步 / 分享
  interact:[
    {title:'聊天 · 今天的心情',
      scene:'路上风很轻，你们并排走，影子在脚边晃。',
      companionAction:'{name}走着走着，忽然放慢脚步。',
      companionLine:'「今天和你出来，心情好像变好了。」',
      interactions:[{name:'问为什么',playerAction:'你偏头看{name}，问为什么'},{name:'说自己也是',playerAction:'你说，其实你也是'}],
      outcomes:{
        '问为什么':{result:'{name}想了想，也答不上来，只是笑了笑。',companionReply:'「大概是因为，和你在走同一条路吧。」',memory:'{name}说，和你在同一条路上走着，心情就变好了。',stars:2,souvenir:''},
        '说自己也是':{result:'你说完，{name}的脚步好像更轻快了一点。',companionReply:'「那我们以后多出来走走。」',memory:'你们都说，一起走的路让心情变好。',stars:2,souvenir:''}
      }},
    {title:'聊天 · 小时候的事',
      scene:'你们坐在台阶上，阳光从树叶间漏下来。',
      companionAction:'{name}比划着手，讲起一件很久以前的事。',
      companionLine:'「我小时候也这样玩过，你信吗？」',
      interactions:[{name:'听TA讲完',playerAction:'你托着腮，听{name}把故事讲完'},{name:'讲一件自己的',playerAction:'你也讲了一件自己小时候的事'}],
      outcomes:{
        '听TA讲完':{result:'{name}讲到一半自己先笑了，笑得眼睛弯弯的。',companionReply:'「好久没跟人讲过这些了，谢谢你听。」',memory:'台阶上，{name}讲了一件小时候的事，讲到自己先笑了。',stars:2,souvenir:''},
        '讲一件自己的':{result:'你讲完，{name}安静了一下，说「原来你小时候是这样的」。',companionReply:'「好像更了解你一点了。」',memory:'互相讲了小时候的事，好像更了解彼此一点。',stars:2,souvenir:''}
      }},
    {title:'聊天 · 只想告诉你的话',
      scene:'路忽然安静下来，只剩下脚步声。',
      companionAction:'{name}放慢脚步，像在斟酌什么。',
      companionLine:'「有件事，我只想告诉你一个人。」',
      interactions:[{name:'认真听',playerAction:'你停下脚步，认真看着{name}'},{name:'先开个玩笑',playerAction:'你笑了笑，说「这么隆重？」'}],
      outcomes:{
        '认真听':{result:'{name}把话说完了，像是放下了一块小石头。',companionReply:'「说出来好多了，谢谢你听我说。」',memory:'{name}只告诉了你一个人的一件事，你说会记着。',stars:3,souvenir:''},
        '先开个玩笑':{result:'{name}被你逗笑了，紧张的气氛一下子散开。',companionReply:'「被你一打岔，我都不紧张了。」说着还是把话说了。',memory:'你的一句玩笑，让{name}安心地说出了心事。',stars:2,souvenir:''}
      }},
    {title:'散步 · 无目的的路',
      scene:'面前出现一条岔路，两条路看起来都很有意思。',
      companionAction:'{name}站在路口，左右看了看，选了一条。',
      companionLine:'「走这边吧，感觉会有惊喜。」',
      interactions:[{name:'跟着走',playerAction:'你跟上去，走{name}选的那条路'},{name:'走另一边',playerAction:'你笑着走向另一条，回头看{name}'}],
      outcomes:{
        '跟着走':{result:'那条路尽头是一片开花的空地，风里有淡淡的香。',companionReply:'{name}得意地看你：「我说吧，有惊喜。」',memory:'跟着{name}选的路，走到一片开花的空地。',stars:2,souvenir:'🌼 路边小花'},
        '走另一边':{result:'另一条路通向一条安静的巷子，墙上有好看的涂鸦。',companionReply:'{name}跟过来：「果然还是你的眼光好。」',memory:'你选的路通向一条有涂鸦的安静巷子。',stars:2,souvenir:''}
      }},
    {title:'散步 · 影子游戏',
      scene:'路灯把你们的影子拉得很长，重叠在一起。',
      companionAction:'{name}悄悄踮脚，踩住了你的影子。',
      companionLine:'「哈哈，我踩到你的影子啦。」',
      interactions:[{name:'追着踩回去',playerAction:'你追着{name}的影子踩回去'},{name:'举起手比影子',playerAction:'你举起手，在墙上比了一个影子形状'}],
      outcomes:{
        '追着踩回去':{result:'你们在路灯下追来追去，像回到了很小的时候。',companionReply:'{name}边跑边笑：「你耍赖，你腿长！」',memory:'路灯下，和{name}追着踩彼此的影子。',stars:1,souvenir:''},
        '举起手比影子':{result:'你在墙上比出一只小狗，{name}也学你比了一朵花。',companionReply:'「你那个是狗，我这个是花，刚好配一对。」',memory:'在路灯下比影子，{name}说你俩的影子是一对。',stars:2,souvenir:''}
      }},
    {title:'散步 · 路边的小东西',
      scene:'路边有个小东西在灯光里反着光。',
      companionAction:'{name}蹲下去捡起来，在手里看了看。',
      companionLine:'「是个旧钥匙扣，你要不要？可以当护身符。」',
      interactions:[{name:'收下',playerAction:'你接过来，握了握，钥匙扣还带着TA手心的温度'},{name:'帮TA收好',playerAction:'你说让{name}自己收着，回头再想'}],
      outcomes:{
        '收下':{result:'钥匙扣上的漆掉了一小块，但看起来莫名让人安心。',companionReply:'{name}说：「那就当它是个好兆头。」',memory:'路边捡到的小钥匙扣，{name}说可以当护身符。',stars:2,souvenir:'🔑 旧钥匙扣'},
        '帮TA收好':{result:'{name}把钥匙扣装进口袋，拍了拍：「先放着。」',companionReply:'「说不定哪天真用得上呢。」',memory:'和{name}一起捡了一个小钥匙扣，TA小心收了起来。',stars:1,souvenir:''}
      }},
    {title:'分享 · 耳机分一半',
      scene:'风把街上的声音吹得有点吵。',
      companionAction:'{name}从口袋里摸出耳机，分出一只递给你。',
      companionLine:'「这首歌，你听听看。」',
      interactions:[{name:'戴上听',playerAction:'你接过耳机戴上，和{name}听同一首歌'},{name:'问歌名',playerAction:'你问{name}这是什么歌'}],
      outcomes:{
        '戴上听':{result:'旋律在耳边响起来，你们并排走，谁也没说话。',companionReply:'歌快放完时，{name}轻声说：「好听吧？」',memory:'和{name}一人一只耳机，听完了同一首歌。',stars:2,souvenir:''},
        '问歌名':{result:'{name}翻出歌名给你看，说「下次一起听现场」。',companionReply:'「说好了，不许反悔。」',memory:'{name}说下次要和你一起去听那首歌的现场。',stars:1,souvenir:''}
      }},
    {title:'分享 · 一张旧照片',
      scene:'{name}掏出手机，翻到一张边角有点褪色的照片。',
      companionAction:'{name}把手机往你这边侧了侧。',
      companionLine:'「这是我很喜欢的一张，你看。」',
      interactions:[{name:'凑过去看',playerAction:'你凑过去，仔细看那张照片'},{name:'问照片的来历',playerAction:'你问{name}，这张照片是什么时候拍的'}],
      outcomes:{
        '凑过去看':{result:'照片里是一片很蓝的海，和一个回头的人影。',companionReply:'「那等你，下次一起去。」',memory:'{name}分享了一张喜欢的照片，说想和你一起去那里。',stars:2,souvenir:''},
        '问照片的来历':{result:'{name}讲了照片的故事，讲得很慢，像在重新看一遍。',companionReply:'「其实一直想找个人讲讲这张照片。」',memory:'听{name}讲了一张旧照片背后的故事。',stars:2,souvenir:''}
      }},
    {title:'分享 · 口袋里的糖',
      scene:'风里忽然飘来一点甜甜的气味。',
      companionAction:'{name}把手伸进口袋，摸出两颗糖，递来一颗。',
      companionLine:'「我带了糖，给你一颗。」',
      interactions:[{name:'接过来',playerAction:'你接过糖，剥开糖纸放进嘴里'},{name:'交换',playerAction:'你摸摸口袋，也掏出一颗糖递给{name}'}],
      outcomes:{
        '接过来':{result:'糖是水果味的，在嘴里慢慢化开。',companionReply:'{name}也剥了一颗放进嘴里：「甜的。」',memory:'{name}从口袋里摸出一颗糖分给了你。',stars:1,souvenir:''},
        '交换':{result:'你们交换了糖，像交换了一个很小的心意。',companionReply:'{name}看着手里的糖：「那我们扯平了，下次再换。」',memory:'和{name}交换了一颗糖，像交换了一个小秘密。',stars:2,souvenir:'🍬 两颗糖'}
      }}
  ],
  // 随机事件：下雨 / 流星 / 宝箱 / 小动物 等
  random:[
    {title:'突然下雨',condition:'雨天',
      scene:'雨点毫无预兆地落下来，打在肩头凉凉的。',
      companionAction:'{name}脱下外套，举在你们头顶。',
      companionLine:'「先躲一下，别淋湿了。」',
      interactions:[{name:'躲进TA的外套',playerAction:'你往{name}那边靠了靠，躲进那件外套下'},{name:'跑向屋檐',playerAction:'你拉起{name}的手，跑向最近的屋檐'}],
      outcomes:{
        '躲进TA的外套':{result:'外套撑在头顶，你们挨得很近，能听见彼此的呼吸。',companionReply:'{name}轻声说：「还好带了这个。」',memory:'一场突然的雨，和{name}躲在同一件外套下面。',stars:3,souvenir:''},
        '跑向屋檐':{result:'你们跑进屋檐下，头发湿了一点，笑着喘气。',companionReply:'{name}甩甩头发：「像不像在冒险？」',memory:'下雨时拉着{name}跑向屋檐，像一场小小的冒险。',stars:2,souvenir:'🌂 一把透明伞'}
      }},
    {title:'流星划过',condition:'夜晚',
      scene:'夜空忽然亮了一下，一道光飞快地划过。',
      companionAction:'{name}一把抓住你的袖子。',
      companionLine:'「快看！别眨眼，许个愿！」',
      interactions:[{name:'闭上眼许愿',playerAction:'你闭上眼，在心里许了一个愿'},{name:'喊出来',playerAction:'你指着天空喊：「看到了看到了！」'}],
      outcomes:{
        '闭上眼许愿':{result:'你睁开眼时，{name}也正闭着眼，很认真。',companionReply:'「许好了？我的愿望是——」说着又停住：「说出来就不灵了。」',memory:'和{name}同时对着流星许了愿，谁也没说出来。',stars:3,souvenir:'🌟 许愿星'},
        '喊出来':{result:'你的喊声在夜里传出去很远，{name}被你逗笑了。',companionReply:'「嘘——流星会被你吓跑的。」',memory:'流星划过时你喊了出来，{name}说你吓到了流星。',stars:2,souvenir:''}
      }},
    {title:'遇到小猫',
      scene:'墙角探出一只小猫的脑袋，警惕又好奇地看着你们。',
      companionAction:'{name}蹲下来，慢慢伸出手。',
      companionLine:'「嘘，别吓到它。」',
      interactions:[{name:'一起蹲下',playerAction:'你也蹲下来，和{name}一起等小猫靠近'},{name:'远远看着',playerAction:'你站远一点，看{name}和小猫互动'}],
      outcomes:{
        '一起蹲下':{result:'小猫犹豫了很久，终于凑过来，蹭了蹭{name}的手。',companionReply:'{name}声音轻轻的：「它蹭我了。」',memory:'和{name}蹲在墙角，等一只小猫终于愿意靠近。',stars:2,souvenir:''},
        '远远看着':{result:'小猫看了你一眼，又看看{name}，最后选择蹭了蹭{name}。',companionReply:'{name}小声说：「它好像更喜欢我。」',memory:'远远看着{name}和小猫，小猫选了TA。',stars:1,souvenir:''}
      }},
    {title:'发现旧木箱',
      scene:'路边的树丛里露出一个旧木箱的角，锁已经锈了。',
      companionAction:'{name}蹲下来，小心地掀开箱盖。',
      companionLine:'「里面是什么呀……哇，是明信片。」',
      interactions:[{name:'一起翻看',playerAction:'你凑过去，和{name}一起翻那些明信片'},{name:'合上箱子',playerAction:'你看了一会儿，轻轻把箱盖合回去'}],
      outcomes:{
        '一起翻看':{result:'明信片上的字迹已经模糊，像一封封没寄出的信。',companionReply:'{name}放回最后一张：「让它们继续待在这儿吧。」',memory:'树丛里的旧木箱，和{name}一起翻看了很多旧明信片。',stars:2,souvenir:'📦 旧木箱'},
        '合上箱子':{result:'你们把箱盖轻轻合回去，像是替它们藏好了秘密。',companionReply:'{name}站起来拍拍手：「走吧，让它们安静待着。」',memory:'发现了一个旧木箱，和{name}一起轻轻把它合上了。',stars:1,souvenir:''}
      }},
    {title:'风送来的明信片',
      scene:'一张明信片被风卷起来，落在你们脚边。',
      companionAction:'{name}捡起来，翻到背面看了看。',
      companionLine:'「背面写着『想念你』，落款已经看不清了。」',
      interactions:[{name:'一起看看',playerAction:'你凑过去，和{name}一起看那张明信片'},{name:'放回风里',playerAction:'你想了想，把明信片轻轻放回风里'}],
      outcomes:{
        '一起看看':{result:'字迹很用力，像是写信的人下了很大的决心。',companionReply:'{name}轻声说：「希望它找到了收件人。」',memory:'风送来一张写着"想念你"的明信片，和{name}一起看了。',stars:1,souvenir:'📮 旧明信片'},
        '放回风里':{result:'明信片在风里翻了个身，向着远处飘走了。',companionReply:'{name}看着它飞远：「愿它找到该去的地方。」',memory:'把风送来的明信片又放回了风里，让它继续旅行。',stars:2,souvenir:''}
      }},
    {title:'没有标记的小路',
      scene:'岔路口出现一条地图上没有标记的小路，杂草半掩着入口。',
      companionAction:'{name}站在路口，探头往里看了看。',
      companionLine:'「要不要去探险？说不定有惊喜。」',
      interactions:[{name:'走进去',playerAction:'你带头走进那条小路'},{name:'走大路',playerAction:'你拉了拉{name}，说走大路吧'}],
      outcomes:{
        '走进去':{result:'小路尽头是一片没见过的开阔空地，风把草吹得沙沙响。',companionReply:'{name}站在空地中间：「果然有惊喜。」',memory:'和{name}走进一条没标记的小路，尽头是一片空地。',stars:2,souvenir:''},
        '走大路':{result:'你们走了大路，把好奇留给了下一次。',companionReply:'{name}回头看了一眼小路：「下次再来探。」',memory:'路过一条没标记的小路，和{name}约定下次再来。',stars:1,souvenir:''}
      }},
    {title:'街角的面包香',
      scene:'街角飘来一阵刚出炉的面包香，热乎乎的。',
      companionAction:'{name}吸了吸鼻子，脚步慢了下来。',
      companionLine:'「好香啊……想吃。」',
      interactions:[{name:'买一个',playerAction:'你买了一个热面包，掰开一半递给{name}'},{name:'站住闻一闻',playerAction:'你们站在风里，让面包香飘过来'}],
      outcomes:{
        '买一个':{result:'面包还是热的，掰开的时候冒出一股香气。',companionReply:'{name}咬了一口，含糊地说：「嗯——好吃。」',memory:'街角的热面包，和{name}分着吃完了。',stars:2,souvenir:'🥐 热面包'},
        '站住闻一闻':{result:'你们站在街角，让那股香气把自己围住。',companionReply:'{name}说：「好，闻够了，可以走了。」',memory:'站在街角闻面包香，{name}说闻够了再走。',stars:1,souvenir:''}
      }},
    {title:'雨后的彩虹',condition:'雨天',
      scene:'雨刚停，天边慢慢挂出一道淡淡的彩虹。',
      companionAction:'{name}指着天空，声音都提高了。',
      companionLine:'「你看！彩虹！」',
      interactions:[{name:'一起看彩虹',playerAction:'你和{name}并排站着，一直看到彩虹变淡'},{name:'拍照留念',playerAction:'你举起手机，把彩虹拍了下来'}],
      outcomes:{
        '一起看彩虹':{result:'彩虹一点点变淡，像被天空慢慢收回去。',companionReply:'{name}说：「谢谢这场雨。」',memory:'雨后的彩虹，和{name}一直看到它消失。',stars:2,souvenir:''},
        '拍照留念':{result:'照片里的彩虹淡淡的，但{name}的笑很清楚。',companionReply:'{name}凑过来看：「这张拍得好，能发我吗？」',memory:'雨后的彩虹和{name}的笑，一起留在了照片里。',stars:2,souvenir:''}
      }}
  ]
};

// ==================== 梦角主动事件（玩家移动后，梦角主动叫住你）====================
// type:'companion'：不是玩家触发，是梦角发现了什么，想和你分享
var JOURNEY_COMPANION_EVENTS=[
  {title:'发现小路',
    scene:'风忽然安静了一下，走在前面的{name}停下脚步。',
    companionAction:'{name}回头，指了指旁边一条被树影半掩着的小路。',
    companionLine:'「等等。这条小路，好像没人走过。」',
    interactions:[{name:'走进去看看',playerAction:'你和{name}一起拐进那条小路'},{name:'记下位置',playerAction:'你看了看四周，把这条路记在心里'}],
    outcomes:{
      '走进去看看':{result:'小路尽头是一片没见过的开阔地，草在风里沙沙响。',companionReply:'{name}站在空地中间，笑了笑：「果然要听我的。」',memory:'{name}主动发现了一条没人走过的小路，你们走了进去。',stars:2,souvenir:''},
      '记下位置':{result:'你们记住这条路，打算下次专门来探。',companionReply:'{name}点头：「那说好了，下次来这里。」',memory:'{name}叫住了你，你们约定下次一起来探那条小路。',stars:1,souvenir:''}
    }},
  {title:'想告诉你的事',
    scene:'{name}走着走着，忽然停下来，像在斟酌什么。',
    companionAction:'{name}转身看着你，声音比平时轻。',
    companionLine:'「等等——有件事，其实一直想跟你说。」',
    interactions:[{name:'认真听',playerAction:'你停下来，认真看着{name}'},{name:'笑着等TA说',playerAction:'你笑了笑，等{name}开口'}],
    outcomes:{
      '认真听':{result:'{name}把话慢慢说完了，说完像是放下了一块石头。',companionReply:'「说出来好多了，谢谢你听。」',memory:'{name}主动叫住你，说了一件一直想告诉你的事。',stars:3,souvenir:''},
      '笑着等TA说':{result:'你一笑，{name}也跟着笑了，紧张的气氛一下子松下来。',companionReply:'「被你一笑，我都不紧张了。」说着还是把话说完了。',memory:'你笑着等{name}开口，TA终于说出了心里的话。',stars:2,souvenir:''}
    }},
  {title:'想带你去的店',
    scene:'{name}忽然拉了拉你的袖子，眼睛亮亮的。',
    companionAction:'{name}指向街边一家亮着暖光的小店。',
    companionLine:'「等等，这家店我听说很久了，去看看？」',
    interactions:[{name:'一起去',playerAction:'你和{name}一起推门进了那家店'},{name:'改天再来',playerAction:'你们记下这家店，打算改天再来'}],
    outcomes:{
      '一起去':{result:'店里比想象中温馨，老板笑呵呵地招呼你们。',companionReply:'{name}小声说：「是不是来对了？」',memory:'{name}主动带你进了一家亮着暖光的小店。',stars:2,souvenir:'🏷️ 小店纪念贴纸'},
      '改天再来':{result:'你们在门口看了看橱窗，把店记进了手账。',companionReply:'{name}说：「那就留个念想。」',memory:'{name}想带你去的店，你们约好改天再来。',stars:1,souvenir:''}
    }},
  {title:'今晚的星星',condition:'夜晚',
    scene:'夜路很安静，{name}忽然抬头看天，停住了。',
    companionAction:'{name}仰着头，指着夜空的一角。',
    companionLine:'「等等，你看那颗星，好像一直在跟着我们。」',
    interactions:[{name:'一起抬头看',playerAction:'你也抬起头，和{name}一起看那颗星'},{name:'开个玩笑',playerAction:'你说，说不定它认识你们'}],
    outcomes:{
      '一起抬头看':{result:'你们并排仰着头走了好一段路，直到脖子发酸。',companionReply:'{name}轻声说：「今晚的星星，都记住了。」',memory:'{name}主动叫住你，一起看了一路跟着你们的星星。',stars:2,souvenir:''},
      '开个玩笑':{result:'你一句玩笑，{name}笑得停不下来。',companionReply:'「你这个人，怎么连星星都能聊起来。」',memory:'夜路上，你的玩笑让{name}笑了一路。',stars:1,souvenir:''}
    }}
];

// ==================== 连续剧情事件（分阶段推进，不是一次结束）====================
// 进行中的链存在时，后续随机事件优先推进下一阶段；走完全程形成完整记忆。
var JOURNEY_STORIES={
  oldletter:{
    key:'oldletter',name:'旧信的秘密',
    stages:[
      {title:'捡到一封旧信',
        scene:'风把一张泛黄的信纸吹到你们脚边，边缘已经卷起。',
        companionAction:'{name}蹲下去捡起来，小心地展开。',
        companionLine:'「是一封信……好像放了很久了。」',
        interactions:[{name:'一起看信',playerAction:'你和{name}一起读那封信'},{name:'看看收信人',playerAction:'你翻到信的末尾，找收信人的名字'}],
        outcomes:{
          '一起看信':{result:'信写得很认真，字迹已经有点模糊，落款停在很多年前。',companionReply:'{name}轻声说：「写这封信的人，一定很认真。」',memory:'你们捡到了一封很多年前没寄出的旧信。',stars:2,souvenir:'📮 泛黄的信纸'},
          '看看收信人':{result:'收信人地址写得不完整，只有一个模糊的地名。',companionReply:'{name}说：「说不定，还能找到这个人。」',memory:'旧信的收信人只有一个模糊的地名，你们决定找找看。',stars:1,souvenir:''}
        }},
      {title:'打听信的主人',
        scene:'你们拿着那封旧信，沿路打听那个模糊的地名。',
        companionAction:'{name}拦住一位晒太阳的老人，认真地问了几句。',
        companionLine:'「爷爷说，这个地名在旧城区，巷子口有棵老槐树。」',
        interactions:[{name:'一起去旧城区',playerAction:'你和{name}一起走向旧城区'},{name:'先歇一歇',playerAction:'你们在树荫下歇了歇，才继续出发'}],
        outcomes:{
          '一起去旧城区':{result:'旧城区的巷子很安静，老槐树比想象中还要高。',companionReply:'{name}看了看四周：「应该就是这里了。」',memory:'你们循着旧信上的地名，找到了旧城区的那棵老槐树。',stars:2,souvenir:''},
          '先歇一歇':{result:'树荫下很凉快，你们聊着这封信可能的故事。',companionReply:'{name}说：「越想越好奇了。」',memory:'去找信主人的路上，你们在树荫下聊了这封信的故事。',stars:1,souvenir:''}
        }},
      {title:'把信送到',
        scene:'老槐树下的信箱锈迹斑斑，门牌号正好对得上。',
        companionAction:'{name}把信在手里掂了掂，然后轻轻放进信箱。',
        companionLine:'「这样，它终于可以寄出去了。」',
        interactions:[{name:'一起放进去',playerAction:'你和{name}一起把那封信放进信箱'},{name:'在信上补一行字',playerAction:'你在信的背面补了一行小字，才放进去'}],
        outcomes:{
          '一起放进去':{result:'信封进信箱的声音很轻，像一段故事终于画上了句号。',companionReply:'{name}笑了笑：「我们替它走完了最后一程。」',memory:'一封旧信，被你们亲手放进了它该去的信箱。',stars:3,souvenir:'🔑 老槐树下的钥匙扣'},
          '在信上补一行字':{result:'你在背面写下今天的日期，像给这段故事落了个款。',companionReply:'{name}看着那行字：「它不会孤单了。」',memory:'你们在旧信背面补了一行字，替它送完了最后一程。',stars:3,souvenir:''}
        }}
    ]
  },
  straycat:{
    key:'straycat',name:'迷路的小猫',
    stages:[
      {title:'发现小猫',
        scene:'墙角的纸箱里传来很轻的叫声，一只小猫探出脑袋。',
        companionAction:'{name}蹲下来，小猫犹豫了一下，凑过来蹭了蹭TA的手。',
        companionLine:'「它好像走丢了……脖子上还挂着一个小铃铛。」',
        interactions:[{name:'蹲下来看',playerAction:'你也蹲下来，小猫看了看你'},{name:'看铃铛上的字',playerAction:'你凑近看小猫脖子上的小铃铛'}],
        outcomes:{
          '蹲下来看':{result:'小猫大胆了一点，轻轻舔了舔你的指尖。',companionReply:'{name}小声说：「它好像挺喜欢你的。」',memory:'你们在墙角发现了一只走丢的小猫。',stars:2,souvenir:''},
          '看铃铛上的字':{result:'铃铛上刻着一个歪歪的名字，像是手写的。',companionReply:'{name}念出来：「原来它叫小年。」',memory:'小猫脖子上刻着名字，你们知道它叫小年。',stars:1,souvenir:''}
        }},
      {title:'帮它找家',
        scene:'你们带着小年沿路问了一圈，最后在便利店门口停下。',
        companionAction:'{name}蹲下来，把铃铛上的名字给老板看。',
        companionLine:'「老板说，隔壁楼有人在找一只叫小年的猫。」',
        interactions:[{name:'一起送它回去',playerAction:'你们抱着小年，走向隔壁楼'},{name:'先喂它一点吃的',playerAction:'你们先给小年买了点吃的，再送它回去'}],
        outcomes:{
          '一起送它回去':{result:'开门的阿姨眼睛一下红了，把小年紧紧抱进怀里。',companionReply:'{name}站在门口，弯起眼睛：「它回家了。」',memory:'你们帮走丢的小年找到了家，看它被抱进怀里。',stars:3,souvenir:'🐾 小年的爪印贴纸'},
          '先喂它一点吃的':{result:'小年吃得很快，吃完还抬头看你们，像在道谢。',companionReply:'{name}说：「吃饱了，才有力气回家呀。」',memory:'你们喂饱了小年，才送它回家。',stars:2,souvenir:''}
        }}
    ]
  }
};

// ==================== 梦角互动台词库 ====================
var JOURNEY_COMPANION_LINES={
  move:[
    '{name}沿着小路往前走，在{dest}停了下来。',
    '{name}被{dest}的风景吸引，不知不觉走了过去。',
    '{name}听说{dest}很值得一看，于是去了那里。',
    '{name}在{dest}遇到了有趣的事，笑着向你招手。',
    '{name}说想带你去{dest}看看，先一步过去了。',
    '{name}在{dest}发现了一家不错的店。'
  ],
  ending:[
    '旅途结束了，但你们的故事还在继续。',
    '这段路走到了尽头，可回忆才刚刚开始。',
    '你们把这一路的光，都收进了手账里。'
  ]
};

// ==================== 事件管理器（EventManager）====================
var JourneyEventManager={
  // 从地点事件池抽取（condition 匹配当前天气时优先）
  forLocation:function(key,weather){
    var loc=JOURNEY_DB.locations[key];
    if(!loc||!loc.events||!loc.events.length)return null;
    var pool=loc.events;
    var matched=pool.filter(function(e){return e.condition&&e.condition===weather;});
    if(matched.length&&Math.random()<0.6)return matched[Math.floor(Math.random()*matched.length)];
    return pool[Math.floor(Math.random()*pool.length)];
  },
  forInteract:function(){var p=JOURNEY_DB.interact;return p[Math.floor(Math.random()*p.length)];},
  forRandom:function(weather){
    var p=JOURNEY_DB.random;
    var matched=p.filter(function(e){return e.condition&&e.condition===weather;});
    if(matched.length&&Math.random()<0.6)return matched[Math.floor(Math.random()*matched.length)];
    return p[Math.floor(Math.random()*p.length)];
  },
  // 返回互动结果（按互动名索引）
  resolve:function(ev,interactionName){
    return (ev&&ev.outcomes&&ev.outcomes[interactionName])||{result:'你们继续往前走。',companionReply:'',memory:'',stars:0,souvenir:''};
  },
  // 把 {name} 占位符替换为指定梦角名
  render:function(text,name){
    return String(text==null?'':text).replace(/\{name\}/g,name);
  }
};

// ==================== 事件类型体系 ====================
// scene 共同经历 / observe 观察（不是选择，直接经历+回应）/ dialogue 对话 / action 互动动作 / companion 梦角主动 / story 连续剧情
// ambient 环境 / multi 多人互动 / banter 梦角插曲 / minigame 小游戏 / hidden 稀有
function journeyEventType(ev){
  if(!ev)return 'scene';
  if(ev.type)return ev.type;
  if(ev._pool==='companion')return 'companion';
  if(ev._pool==='story')return 'story';
  if(ev._pool==='hidden')return 'hidden';
  if(ev._pool==='minigame'||ev.game)return 'minigame';
  if(ev._pool==='ambient')return 'ambient';
  if(ev._pool==='multi')return 'multi';
  if(ev._pool==='banter')return 'banter';
  if(ev._pool==='interact')return (ev.title&&ev.title.indexOf('聊天')===0)?'dialogue':'action';
  if(ev._pool==='random'){
    var obs=['遇到小猫','雨后的彩虹','流星划过','突然下雨','街角的面包香'];
    return obs.indexOf(ev.title)>=0?'observe':'scene';
  }
  return 'scene';
}
// 抽取的事件做浅拷贝并标记来源池，避免污染数据库对象
function journeyCopyEvent(ev,pool){
  if(!ev)return ev;
  var c=Object.assign({},ev);
  c._pool=pool;
  return c;
}
// 构建剧情链阶段事件
function journeyStoryEvent(chain,step){
  var s=chain.stages[step];
  var ev=JSON.parse(JSON.stringify(s));
  ev._pool='story';
  ev._story={key:chain.key,name:chain.name,step:step,total:chain.stages.length};
  return ev;
}

// ==================== 持久化（新 shape：journals 历史手账）====================
var journeyState=null;
function journeyLoad(){
  var d=ls(JOURNEY_KEY)||{};
  if(!d||typeof d!=='object')d={};
  if(!Array.isArray(d.journals))d.journals=[];
  if(!d.stats||typeof d.stats!=='object')d.stats={plays:0};
  return d;
}
function journeySave(d){
  ls(JOURNEY_KEY,d);
  if(window.localforage)window.localforage.setItem(JOURNEY_KEY,d).catch(function(){});
}
function journeyBack(){
  showPg(window._journeyReturnPage||'pg-more');
}
function showStarJourneyPage(){
  window._journeyReturnPage=currentPage||'pg-more';
  showPg('pg-star-journey');
  renderJourneyCreate();
}
function journeyContactName(id){
  var c=contacts.find(function(x){return x.id===id});
  return c?c.name:'TA';
}
function journeyEsc(s){return String(s==null?'':s).replace(/</g,'&lt;');}

// ==================== 创建视图 ====================
function renderJourneyCreate(){
  var body=$('journey-body');if(!body)return;
  var d=journeyLoad();
  var html='';
  html+='<div style="text-align:center;padding:10px 0 6px;">';
  html+='<div style="font-size:24px;">🧭</div>';
  html+='<div style="font-size:18px;font-weight:700;color:#6b5a4a;letter-spacing:2px;margin-top:4px;">星言旅途</div>';
  html+='<div style="font-size:12px;color:#9a8a7a;margin-top:6px;">一场和TA们一起的陪伴旅行，没有终点，只有手账。</div>';
  html+='</div>';
  // 参与者
  html+='<div style="font-size:13px;font-weight:600;color:#6b5a4a;margin:12px 0 8px;">选择同行梦角（1~3人）</div>';
  var selected=window._journeySel||['me'];
  html+='<div style="background:rgba(255,253,248,0.95);border-radius:14px;padding:10px;border:1px solid rgba(139,115,85,0.2);">';
  html+='<div onclick="journeyToggle(\'me\')" style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;'+(selected.indexOf('me')>=0?'background:rgba(200,180,150,0.15);':'')+'"><span style="font-size:18px;">⭐</span><span style="font-size:14px;color:#6b5a4a;font-weight:500;">你</span><span style="margin-left:auto;font-size:13px;color:'+(selected.indexOf('me')>=0?'#8a6a3a':'#b0a090')+';">'+(selected.indexOf('me')>=0?'✓ 已加入':'')+'</span></div>';
  contacts.forEach(function(c){
    var on=selected.indexOf(c.id)>=0;
    html+='<div onclick="journeyToggle(\''+c.id+'\')" style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;'+(on?'background:rgba(200,180,150,0.15);':'')+'"><span style="width:24px;height:24px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:12px;overflow:hidden;">'+(c.avatar?'<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;">':'👤')+'</span><span style="font-size:14px;color:#6b5a4a;">'+journeyEsc(c.name||'TA')+'</span><span style="margin-left:auto;font-size:13px;color:'+(on?'#8a6a3a':'#b0a090')+';">'+(on?'✓ 已加入':'')+'</span></div>';
  });
  html+='</div>';
  // 主题
  html+='<div style="font-size:13px;font-weight:600;color:#6b5a4a;margin:14px 0 8px;">选择旅途主题</div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;">';
  JOURNEY_THEMES.forEach(function(t){
    var on=(window._journeyTheme||'spring')===t.key;
    html+='<div onclick="journeySetTheme(\''+t.key+'\')" style="flex:1;min-width:45%;background:rgba(255,253,248,0.95);border-radius:12px;padding:10px;text-align:center;border:2px solid '+(on?'#b58a4a':'transparent')+';cursor:pointer;"><div style="font-size:14px;font-weight:600;color:#6b5a4a;">'+t.name+'</div><div style="font-size:10px;color:#b0a090;margin-top:2px;">'+t.places.map(function(p){return JOURNEY_LOCATION_NAMES[p];}).slice(0,3).join(' · ')+'</div></div>';
  });
  html+='</div>';
  html+='<button onclick="journeyStart()" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#e8d4b8,#d8c4e8);color:#5a4a3a;font-size:16px;font-weight:600;cursor:pointer;margin-top:16px;box-shadow:0 3px 12px rgba(180,150,110,0.25);">开始旅行</button>';
  html+='<div onclick="showJourneyRecords()" style="text-align:center;font-size:12px;color:#8a6a3a;margin-top:12px;cursor:pointer;">📚 我的旅行手账</div>';
  if(d.stats.plays>0){
    html+='<div style="text-align:center;margin-top:14px;font-size:12px;color:#b0a090;">已收藏 '+d.journals.length+' 本旅行手账</div>';
  }
  body.innerHTML=html;
}
function journeyToggle(id){
  var sel=window._journeySel||['me'];
  var idx=sel.indexOf(id);
  if(idx>=0)sel.splice(idx,1);
  else sel.push(id);
  if(sel.indexOf('me')<0)sel.unshift('me');
  if(sel.length>4)sel=sel.slice(0,4);
  if(sel.length<1){toast('至少需要 1 人');sel=['me'];if(id!=='me')sel.push(id);}
  window._journeySel=sel;
  renderJourneyCreate();
}
function journeySetTheme(k){
  window._journeyTheme=k;
  renderJourneyCreate();
}

// ==================== 生成旅行状态（天气、地点、同行角色）====================
function journeyBuildMap(theme){
  var pool=theme.places.slice();
  for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=pool[i];pool[i]=pool[j];pool[j]=tmp;}
  var cells=[];
  pool.forEach(function(key){
    var r=Math.random();
    var type=r<0.7?'place':(r<0.9?'interact':'random');
    cells.push({type:type,key:key,label:JOURNEY_LOCATION_NAMES[key]});
  });
  // 第 7、8 格固定为互动与随机格
  var k1=pool[Math.floor(Math.random()*pool.length)];
  cells.push({type:'interact',key:k1,label:JOURNEY_LOCATION_NAMES[k1]});
  var k2=pool[Math.floor(Math.random()*pool.length)];
  cells.push({type:'random',key:k2,label:JOURNEY_LOCATION_NAMES[k2]});
  return cells;
}
function journeyStart(){
  var sel=window._journeySel||['me'];
  if(sel.length<2){toast('请至少选择 1 位同行梦角');return;}
  var theme=JOURNEY_THEMES.find(function(t){return t.key===(window._journeyTheme||'spring')})||JOURNEY_THEMES[0];
  var w=JOURNEY_WEATHERS[Math.floor(Math.random()*JOURNEY_WEATHERS.length)];
  var map=journeyBuildMap(theme);
  var members=sel.map(function(id){return {id:id,name:journeyContactName(id)};});
  var pos={};
  sel.forEach(function(id){pos[id]=0;});
  journeyState={
    phase:'idle',theme:theme,weather:w,map:map,members:members,pos:pos,
    day:1,maxDays:5,roundIdx:0,
    stars:0,records:[],souvenirs:[],memories:[],rareMemories:[],miniRecords:[],photos:[],visited:[],startedAt:Date.now(),finished:false,
    story:null,weatherChanged:false
  };
  journeyRecord('旅途开始于「'+theme.name+'」，天气 '+w.icon+' '+w.name+'。');
  renderJourneyTravel();
}
function journeyPickEvent(cell){
  if(cell.type==='place')return JourneyEventManager.forLocation(cell.key,journeyState.weather.name);
  if(cell.type==='interact')return JourneyEventManager.forInteract();
  return JourneyEventManager.forRandom(journeyState.weather.name);
}
function journeyRecord(text){
  journeyState.records.push(text);
  if(journeyState.records.length>40)journeyState.records=journeyState.records.slice(-40);
}
function journeyVisit(locName){
  if(journeyState.visited.indexOf(locName)<0)journeyState.visited.push(locName);
}

// ==================== 事件抽取（稀有/环境/多人/小游戏/梦角主动/连锁/常规）====================
function journeyPickEvent(cell){
  var st=journeyState;
  // 1) 进行中的连续剧情：优先推进下一阶段
  if(st.story){
    var chain=JOURNEY_STORIES[st.story.key];
    if(chain&&st.story.step<chain.stages.length){
      return journeyStoryEvent(chain,st.story.step);
    }
  }
  var nCompanion=st.members.length-1;   // 梦角人数（不含玩家）
  // 2) 稀有隐藏事件（低概率 8%，条件匹配优先）
  if(Math.random()<0.08){
    var hpool=JOURNEY_HIDDEN;
    var hmatched=hpool.filter(function(e){return e.condition===st.weather.name;});
    var he=(hmatched.length&&Math.random()<0.6)?hmatched[Math.floor(Math.random()*hmatched.length)]:hpool[Math.floor(Math.random()*hpool.length)];
    return journeyCopyEvent(he,'hidden');
  }
  // 3) 环境事件（无选择，直接经历 15%）
  if(Math.random()<0.15){
    var apool=JOURNEY_AMBIENT;
    var amatched=apool.filter(function(e){return e.condition===st.weather.name;});
    var ae=(amatched.length&&Math.random()<0.6)?amatched[Math.floor(Math.random()*amatched.length)]:apool[Math.floor(Math.random()*apool.length)];
    return journeyCopyEvent(ae,'ambient');
  }
  // 4) 多人互动（≥2 名梦角同行时 15%）
  if(nCompanion>=2&&Math.random()<0.15){
    var mp=JOURNEY_MULTI[Math.floor(Math.random()*JOURNEY_MULTI.length)];
    return journeyCopyEvent(mp,'multi');
  }
  // 5) 小游戏（12%，条件匹配优先）
  if(Math.random()<0.12){
    var gpool=JOURNEY_MINIGAME;
    var gmatched=gpool.filter(function(e){return e.condition===st.weather.name;});
    var ge=(gmatched.length&&Math.random()<0.6)?gmatched[Math.floor(Math.random()*gmatched.length)]:gpool[Math.floor(Math.random()*gpool.length)];
    return journeyCopyEvent(ge,'minigame');
  }
  // 6) 梦角主动事件（20%，由当前回合的梦角主动叫住你）
  if(cell.type!=='interact'&&Math.random()<0.2){
    var ce=JOURNEY_COMPANION_EVENTS[Math.floor(Math.random()*JOURNEY_COMPANION_EVENTS.length)];
    // condition 匹配当前天气时优先
    var matched=JOURNEY_COMPANION_EVENTS.filter(function(e){return e.condition===st.weather.name;});
    if(matched.length)ce=matched[Math.floor(Math.random()*matched.length)];
    return journeyCopyEvent(ce,'companion');
  }
  // 7) 梦角间小插曲（≥2 名梦角时 6%）
  if(nCompanion>=2&&Math.random()<0.06){
    var bp=JOURNEY_BANTER[Math.floor(Math.random()*JOURNEY_BANTER.length)];
    return journeyCopyEvent(bp,'banter');
  }
  // 8) 常规事件：随机开启新剧情链（概率 15%）
  if(st.story===null&&Math.random()<0.15){
    var keys=Object.keys(JOURNEY_STORIES);
    var key=keys[Math.floor(Math.random()*keys.length)];
    var chain=JOURNEY_STORIES[key];
    st.story={key:chain.key,name:chain.name,step:0,total:chain.stages.length};
    return journeyStoryEvent(chain,0);
  }
  // 9) 地点 / 互动 / 随机事件
  var ev=null;
  if(cell.type==='place')ev=JourneyEventManager.forLocation(cell.key,st.weather.name);
  else if(cell.type==='interact')ev=JourneyEventManager.forInteract();
  else ev=JourneyEventManager.forRandom(st.weather.name);
  return journeyCopyEvent(ev,cell.type==='interact'?'interact':'random');
}

// ==================== 旅程视图（手账风，非棋盘）====================
function renderJourneyTravel(){
  var body=$('journey-body');if(!body)return;
  var st=journeyState;
  var html='';
  // 手账封面卡
  html+='<div class="jrn-card" style="text-align:center;">';
  html+='<div style="font-size:26px;">'+st.theme.name.split(' ')[0]+'</div>';
  html+='<div style="font-size:17px;font-weight:700;color:#5a4a3a;letter-spacing:1px;margin-top:4px;">'+st.theme.name+'</div>';
  html+='<div style="font-size:11px;color:#9a8a7a;margin-top:6px;">第 '+st.day+' / '+st.maxDays+' 天 · '+st.weather.icon+' '+st.weather.name+'</div>';
  html+='</div>';
  // 同行
  html+='<div class="jrn-card">';
  html+='<div class="jrn-card-label">同行</div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">';
  st.members.forEach(function(m){
    html+='<div style="display:flex;align-items:center;gap:6px;background:#fffdf8;border:1px solid rgba(139,115,85,0.18);border-radius:20px;padding:5px 12px;"><span style="font-size:14px;">'+(m.id==='me'?'⭐':'👤')+'</span><span style="font-size:13px;color:#6b5a4a;">'+journeyEsc(m.name)+'</span></div>';
  });
  html+='</div></div>';
  // 路线（手账风格点，当前行动角色高亮）
  html+='<div class="jrn-card">';
  html+='<div class="jrn-card-label">今天的路线</div>';
  html+='<div class="jrn-route">';
  var actId=st.members[st.roundIdx].id;
  st.map.forEach(function(cell,ci){
    var act=st.pos[actId]===ci;
    html+='<div class="jrn-dot'+(act?' on':'')+'" title="'+journeyEsc(cell.label)+'">'+(cell.type==='random'?'✨':(cell.type==='interact'?'💬':cell.label.split(' ')[0]))+'</div>';
    if(ci<st.map.length-1)html+='<div class="jrn-link"></div>';
  });
  html+='</div>';
  html+='<div style="font-size:10px;color:#b0a090;margin-top:6px;text-align:center;">'+journeyEsc(st.map[st.pos[actId]].label)+'</div>';
  html+='</div>';
  // 当前行动卡（掷骰按钮仅在空闲状态渲染）
  var isMe=st.roundIdx===0;
  html+='<div class="jrn-card" style="text-align:center;">';
  if(isMe&&st.phase==='idle'){
    html+='<div style="font-size:13px;color:#6b5a4a;">你的回合 · 掷出骰子，开启今天的行程</div>';
    html+='<div id="journey-dice" style="font-size:36px;min-height:48px;margin:8px 0 4px;">🎲</div>';
    html+='<button onclick="journeyRoll()" class="jrn-btn">🎲 掷骰子</button>';
  }else if(isMe){
    html+='<div style="font-size:13px;color:#6b5a4a;">正在等待你完成上一个事件…</div>';
    html+='<div id="journey-dice" style="font-size:36px;min-height:48px;margin:8px 0 4px;">🎲</div>';
  }else{
    var cm=st.members[st.roundIdx];
    html+='<div style="font-size:13px;color:#6b5a4a;">'+journeyEsc(cm.name)+' 正在行动…</div>';
    html+='<div id="journey-dice" style="font-size:36px;min-height:48px;margin:8px 0 4px;">🎲</div>';
  }
  html+='</div>';
  // 记录区（显示全部旅途记录，不再截断最近 8 条）
  html+='<div class="jrn-card">';
  html+='<div class="jrn-card-label">旅途记录</div>';
  html+='<div class="jrn-records">'+st.records.map(function(r){return '<div class="jrn-record">'+journeyEsc(r)+'</div>';}).join('')+'</div>';
  html+='</div>';
  body.innerHTML=html;
  // ★ 梦角回合不在渲染时自动触发；由 journeyNextTurn() 在玩家确认结果后显式驱动
}

// ==================== 玩家回合：掷骰 → 移动 → 事件卡 ====================
function journeyRoll(){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='idle'||st.roundIdx!==0)return;   // 状态机守卫：仅空闲且轮到玩家时可掷骰
  var dice=1+Math.floor(Math.random()*6);
  var diceEl=$('journey-dice');
  if(diceEl){
    var c=0;
    var iv=setInterval(function(){
      c++;
      diceEl.textContent='🎲 '+(1+Math.floor(Math.random()*6));
      if(c>=8){
        clearInterval(iv);
        diceEl.textContent='🎲 '+dice+' 点';
        setTimeout(function(){journeyMove(dice);},450);
      }
    },80);
  }else{
    journeyMove(dice);
  }
}
function journeyMove(dice){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='idle')return;
  var meId=st.members[0].id;
  st.pos[meId]=(st.pos[meId]+dice)%st.map.length;
  var cell=st.map[st.pos[meId]];
  var ev=journeyPickEvent(cell);
  journeyVisit(cell.label);
  journeyRecord('你掷出 '+dice+' 点，来到了 '+cell.label+'。');
  window._journeyEvent=ev;
  window._journeyCell=cell;
  window._journeyHero=st.members.length>1?st.members[1].name:'TA';
  // 阶段一事件卡：类型标签 → 标题 → 场景 → 梦角动作 → 梦角台词 → 玩家互动
  var title='';
  if(ev._story)title=journeyStoryTitle(ev);
  else if(ev._pool==='companion')title=journeyEventType(ev)==='companion'?'💬 '+window._journeyHero+' 叫住了你':'💬 '+window._journeyHero+' 的发现';
  else if(ev._pool==='multi')title='👥 '+ev.title;
  else if(ev._pool==='banter')title='💬 '+ev.title;
  else title=ev.title||'旅行事件';
  if(journeyIsRare(ev)&&title.indexOf('✨')<0)title='✨ '+title;
  // 环境事件：无选择，CTA 直接"继续"
  if(journeyEventType(ev)==='ambient'){
    journeyShowEvent(cell.label+' · 旅行事件',
      journeyEventCardHtml(ev,window._journeyHero,title),
      '<button class="btn jrn-choice" onclick="journeyAmbientConfirm()" style="background:var(--accent);">继续</button>',
      'me');
    return;
  }
  journeyShowEvent(cell.label+' · 旅行事件',
    journeyEventCardHtml(ev,window._journeyHero,title),
    journeyInteractionButtons(ev,'me'),
    'me');
}
// 玩家互动：应用结果 → 事件记忆 → 展示结果卡（等待确认继续）
function journeyPick(interactionName){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='event')return;                    // 仅事件卡等待互动时有效
  var ev=window._journeyEvent;
  if(!ev)return;
  // 小游戏事件：走真实小游戏分派（有动画/判定），完成后展示结果卡
  if(journeyEventType(ev)==='minigame'){
    journeyMiniPlay(ev,interactionName,st,function(out,extra){
      if(out.stars)st.stars+=out.stars;
      if(out.souvenir)st.souvenirs.push(out.souvenir);
      if(out.memory){
        if(extra&&extra.rare)st.rareMemories.push(out.memory);
        else st.memories.push(out.memory);
      }
      if(extra&&extra.record)journeyRecord(extra.record);
      if(extra&&extra.photo)journeyPhoto(extra.photo.loc,extra.photo.caption);
      window._journeyEvent=null;
      window._journeyCell=null;
      journeyShowResult(journeyMiniResultHtml(ev,out,extra),'me');
    });
    return;
  }
  var out=JourneyEventManager.resolve(ev,interactionName);
  var cname=window._journeyHero||'TA';
  if(out.stars)st.stars+=out.stars;
  if(out.souvenir)st.souvenirs.push(out.souvenir);
  var it=null;
  (ev.interactions||[]).forEach(function(x){if(x.name===interactionName)it=x;});
  var pAction=it&&it.playerAction?JourneyEventManager.render(it.playerAction,cname):'你'+interactionName;
  var result=JourneyEventManager.render(out.result||'',cname);
  var memory=JourneyEventManager.render(out.memory||'',cname);
  if(memory){
    if(journeyIsRare(ev))st.rareMemories.push(memory);
    else st.memories.push(memory);
  }
  // 互动动作事件：拍照 → 生成旅行照片（不是奖励，是一段记录）
  var photo=null;
  if(interactionName.indexOf('拍')>=0)photo=journeyPhoto(st.map[st.pos[st.members[0].id]]&&st.map[st.pos[st.members[0].id]].label,ev.title+'的一刻');
  // 连续剧情：推进阶段
  if(ev._story)journeyStoryAdvance(ev);
  journeyRecord('你'+interactionName+'：'+pAction+'，'+result+(photo?' 📷 收进旅行照片':(out.souvenir?' 🎁 '+out.souvenir:''))+(out.stars?' ⭐ +'+out.stars:''));
  // 多阶段事件：第一阶段结束后进入第二阶段事件卡（事件不一次结束）
  var ph2=journeyStageNext(ev);
  if(ph2&&ph2.interactions){
    var p2=journeyCopyEvent(ph2,'phases');
    p2.title=ev.title+' · '+journeyStageInfo(ph2,2,2);
    window._journeyEvent=p2;
    journeyShowEvent(ev.title+' · '+journeyStageInfo(ph2,2,2),
      journeyEventCardHtml(p2,cname,p2.title),
      journeyInteractionButtons(p2,'me'),
      'me',journeyStageInfo(ph2,2,2));
    return;
  }
  window._journeyEvent=null;
  window._journeyCell=null;
  // 阶段二结果卡：玩家动作 → 结果 → 梦角回应 → 事件记忆（+ 旅行照片 / 剧情进度）
  journeyShowResult(journeyResultHtml(pAction,result,out,cname,ev),
    'me');
}
// 环境事件：无选择，直接记录氛围 + 今日回忆后继续
function journeyAmbientConfirm(){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='event')return;
  var ev=window._journeyEvent;
  var cname=window._journeyHero||'TA';
  if(ev){
    journeyAmbientLog(ev);
    if(ev.memory)st.memories.push(JourneyEventManager.render(ev.memory,cname));
    if(ev.stars)st.stars+=ev.stars;
    if(ev.souvenir)st.souvenirs.push(ev.souvenir);
    journeyRecord('你们经历了一段环境小事：'+ev.title+(ev.stars?' ⭐ +'+ev.stars:''));
  }
  window._journeyEvent=null;
  window._journeyCell=null;
  journeyShowResult(journeyResultHtml('你们安静地走过了这一段',ev&&ev.memory?JourneyEventManager.render(ev.memory,cname):'这段路被记进了手账',{},cname,ev),'me');
}
// ==================== 事件卡构建（类型标签 / 标题 / 互动区文案）====================
var JOURNEY_TYPE_META={
  observe:{label:'观察',icon:'👀'},
  dialogue:{label:'对话',icon:'💬'},
  action:{label:'互动',icon:'🤝'},
  companion:{label:'梦角主动',icon:'💫'},
  story:{label:'连续剧情',icon:'📖'},
  scene:{label:'经历',icon:'✨'},
  ambient:{label:'环境',icon:'🌿'},
  multi:{label:'多人同行',icon:'👥'},
  banter:{label:'梦角之间',icon:'💬'},
  minigame:{label:'小游戏',icon:'🎮'},
  hidden:{label:'稀有事件',icon:'🌟'}
};
function journeyTypeMeta(ev){
  var t=journeyEventType(ev);
  return JOURNEY_TYPE_META[t]||JOURNEY_TYPE_META.scene;
}
// 稀有事件标记（金色展示）
function journeyIsRare(ev){
  return !!ev&&(ev._pool==='hidden'||ev.rare);
}
function journeyStoryTitle(ev){
  if(!ev._story)return ev.title||'旅行事件';
  return ev._story.name+' · 第 '+ev._story.step+'/'+ev._story.total+' 段';
}
// 氛围记录：环境事件写入手账"旅途氛围"区
function journeyAmbientLog(ev){
  if(!ev||!ev.title)return;
  journeyState.ambientRecords=journeyState.ambientRecords||[];
  var line=ev.title+(ev.memory?' · '+ev.memory:'');
  if(journeyState.ambientRecords.indexOf(line)<0)journeyState.ambientRecords.push(line);
}
// 多阶段事件：第一阶段结束 → 返回第二阶段事件对象（phases[1]），否则 null
function journeyStageNext(ev){
  if(ev&&ev.phases&&ev.phases.length>1)return ev.phases[1];
  return null;
}
function journeyStageInfo(ev,cur,total){
  return '第 '+cur+' / '+total+' 段';
}
// 多人互动 / 梦角插曲：按同行梦角顺序替换 {m0}/{m1} 并渲染对话气泡
function journeyMultiNames(ev){
  var st=journeyState;
  var names=(st.members||[]).filter(function(m){return m.id!=='me';}).map(function(m){return m.name;});
  return {m0:names[0]||'TA',m1:names[1]||names[0]||'TA'};
}
function journeyRenderMulti(text,ev){
  var ns=journeyMultiNames(ev);
  return String(text==null?'':text)
    .replace(/\{m0\}/g,ns.m0).replace(/\{m1\}/g,ns.m1)
    .replace(/\{name\}/g,ns.m0);
}
// 事件卡正文：类型标签 + 标题 + 场景 → 梦角动作 → 梦角台词 → 玩家互动
// 多人/插曲：先渲染成员对话气泡（m0 → m1 → 共景）
function journeyEventCardHtml(ev,cname,title){
  var meta=journeyTypeMeta(ev);
  var html='';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
  html+='<span class="jrn-ev-tag'+(journeyIsRare(ev)?' rare':'')+'">'+meta.icon+' '+meta.label+'</span>';
  html+='<span style="font-size:14px;font-weight:700;color:#5a4a3a;">'+journeyEsc(title||ev.title||'旅行事件')+'</span>';
  html+='</div>';
  if(journeyIsRare(ev))html+='<div class="jrn-ev-rare">✨ 很少遇到的一刻</div>';
  if(ev._pool==='multi'||ev._pool==='banter'){
    html+=journeyMultiBubblesHtml(ev);
    // 多人事件的共同动作/台词走共景渲染
    var act=journeyRenderMulti(ev.companionAction||'',ev);
    var line=journeyRenderMulti(ev.companionLine||'',ev);
    html+='<div class="jrn-ev-action">'+journeyEsc(act)+'</div>';
    if(line)html+='<div class="jrn-ev-line"><span class="jrn-who">🤝</span><span class="jrn-quote">'+journeyEsc(line)+'</span></div>';
  }else{
    html+=journeyEventSceneHtml(ev,cname);
  }
  // 玩家互动区文案（选择只是互动入口；环境事件无选择）
  var t=journeyEventType(ev);
  var itLabel=t==='observe'?'你可以回应：':t==='dialogue'?'想聊些什么？':t==='action'?'你可以：':t==='multi'?'你会怎么做？':t==='banter'?'你会怎么做？':t==='ambient'?'':'你可以：';
  if(itLabel)html+='<div class="jrn-ev-interact">'+itLabel+'</div>';
  return html;
}
// 多人对话气泡（m0 → m1）
function journeyMultiBubblesHtml(ev){
  var html='';
  (ev.members||[]).forEach(function(mm,idx){
    var name=(idx===0)?journeyMultiNames(ev).m0:journeyMultiNames(ev).m1;
    var act=journeyRenderMulti(mm.action,ev);
    var line=journeyRenderMulti(mm.line,ev);
    html+='<div class="jrn-ev-action" style="margin-top:8px;">'+journeyEsc(act)+'</div>';
    html+='<div class="jrn-ev-line"><span class="jrn-who">'+journeyEsc(name)+'</span><span class="jrn-quote">'+journeyEsc(line)+'</span></div>';
  });
  return html;
}
// 互动按钮
function journeyInteractionButtons(ev,who){
  var fn=who==='companion'?'journeyCompanionReply':'journeyPick';
  return ev.interactions.map(function(it){
    return '<button class="btn jrn-choice" onclick="'+fn+'(\''+String(it.name).replace(/'/g,"\\'")+'\')" style="background:var(--accent);">'+journeyEsc(it.name)+'</button>';
  }).join('');
}
// 事件卡正文：场景 + 梦角动作 + 梦角台词
// 环境事件：scene → 梦角反应 → 梦角台词 → 今日回忆（无选择）
function journeyEventSceneHtml(ev,cname){
  if(journeyEventType(ev)==='ambient'){
    var esc=JourneyEventManager.render(ev.scene||'',cname);
    var a=JourneyEventManager.render(ev.companionAction||'',cname);
    var l=JourneyEventManager.render(ev.companionLine||'',cname);
    var m=JourneyEventManager.render(ev.memory||'',cname);
    var html='';
    if(esc)html+='<div class="jrn-ev-scene">'+journeyEsc(esc)+'</div>';
    if(a)html+='<div class="jrn-ev-action">'+journeyEsc(a)+'</div>';
    if(l)html+='<div class="jrn-ev-line"><span class="jrn-who">'+journeyEsc(cname)+'</span><span class="jrn-quote">'+journeyEsc(l)+'</span></div>';
    if(m)html+='<div class="jrn-ev-memory">🌿 <span>'+journeyEsc(m)+'</span></div>';
    return html;
  }
  var scene=JourneyEventManager.render(ev.scene||'',cname);   // ★ 修复：scene 含 {name} 占位符（梦角主动/剧情链），需替换
  var action=JourneyEventManager.render(ev.companionAction||'',cname);
  var line=JourneyEventManager.render(ev.companionLine||'',cname);
  var html='';
  if(scene)html+='<div class="jrn-ev-scene">'+journeyEsc(scene)+'</div>';
  if(action)html+='<div class="jrn-ev-action">'+journeyEsc(action)+'</div>';
  if(line)html+='<div class="jrn-ev-line"><span class="jrn-who">'+journeyEsc(cname)+'</span><span class="jrn-quote">'+journeyEsc(line)+'</span></div>';
  return html;
}
// 结果卡正文：玩家动作 → 结果 → 梦角回应 → 事件记忆（+ 可选旅行照片 / 剧情进度）
function journeyResultHtml(pAction,result,out,cname,ev){
  var reply=JourneyEventManager.render(out.companionReply||'',cname);
  var memory=JourneyEventManager.render(out.memory||'',cname);
  if(ev&&(ev._pool==='multi'||ev._pool==='banter')){
    pAction=journeyRenderMulti(pAction,ev);
    result=journeyRenderMulti(result,ev);
    reply=journeyRenderMulti(reply,ev);
    memory=journeyRenderMulti(memory,ev);
  }
  var html='';
  html+='<div class="jrn-ev-scene">'+journeyEsc(pAction)+'，'+journeyEsc(result)+'</div>';
  if(reply)html+='<div class="jrn-ev-line"><span class="jrn-who">'+journeyEsc(cname)+'</span><span class="jrn-quote">'+journeyEsc(reply)+'</span></div>';
  if(memory)html+='<div class="jrn-ev-memory">'+(journeyIsRare(ev)?'🌟':'💭')+' <span>'+journeyEsc(memory)+'</span><div style="font-size:11px;color:#b0a090;margin-top:3px;">这段经历，被记进了手账。</div></div>';
  if(ev&&ev._story)html+='<div class="jrn-ev-gain">📖 剧情进度：'+(ev._story.step+1)+' / '+ev._story.total+'</div>';
  // 互动动作事件：拍照 → 生成旅行照片（不是奖励）
  if(ev&&window._journeyTakePhoto){
    var ph=window._journeyTakePhoto;
    html+='<div class="jrn-photo">'+ph.emoji+'<div class="jrn-photo-cap">旅行照片 · '+journeyEsc(ph.caption)+'</div></div>';
    window._journeyTakePhoto=null;
  }
  return html;
}
// 旅行照片生成
function journeyPhoto(locLabel,caption){
  var st=journeyState;
  var photo={emoji:'📷',caption:caption||'在'+locLabel+'的一刻',loc:locLabel};
  st.photos.push(photo);
  window._journeyTakePhoto=photo;
  return photo;
}
// ==================== 小游戏引擎（真实可玩，纯 CSS/JS）====================
// 第一层选项点击后：guess/coin 播放动画后判定；match/find 进入第二层操作界面；photo/price/rps/star 即时判定
var _journeyMiniGame=null;   // 第二层交互状态 {ev,cb,kind,cards,flips,open,tries,hidden}
// 小游戏选项按钮（替代互动按钮，全部走 journeyPick）
function journeyMiniButtons(ev,who){
  var fn=who==='companion'?'journeyCompanionReply':'journeyPick';
  return (ev.choiceText||[]).map(function(t){
    return '<button class="btn jrn-choice" onclick="'+fn+'(\''+String(t).replace(/'/g,"\\'")+'\')" style="background:var(--accent);">'+journeyEsc(t)+'</button>';
  }).join('');
}
// 小游戏主入口：选项 → 动画/第二层 → 判定 → 回调结果
function journeyMiniPlay(ev,choice,st,cb){
  var cname=window._journeyHero||'TA';
  var pAction=ev.actions&&ev.actions[choice]?ev.actions[choice]:('你选了'+choice);
  var done=function(win,extra){
    var out={
      result:(extra&&extra.resultText)||(win?'成功了':'没成功'),
      companionReply:ev[win?'winReply':'loseReply']||'',
      memory:ev[win?'winMemory':'loseMemory']||'',
      stars:(ev[win?'winStars':'loseStars'])||0,
      souvenir:(ev[win?'winSouvenir':'loseSouvenir'])||''
    };
    var rec='🎮 小游戏「'+ev.title+'」：'+pAction+(win?'，成功啦':'，这次差一点');
    if(extra&&extra.photo)rec+=' 📷 收进旅行照片';
    cb(out,{pAction:pAction,record:rec,rare:false,photo:(extra&&extra.photo)||null});
  };
  if(ev.game==='match'||ev.game==='find'){journeyMiniBuildScene(ev,cname,done);return;}
  if(ev.game==='guess'){
    journeyMiniGuess(ev,cname,done);
    return;
  }
  if(ev.game==='coin'){
    journeyMiniCoin(ev,cname,choice,done);
    return;
  }
  if(ev.game==='photo'){
    var cap='在旅途中的一刻';
    if(choice==='拍风景')cap='金色的风景';
    else if(choice==='拍'+cname)cap=cname+'的侧脸';
    else if(choice==='一起合照')cap='和'+cname+'的合照';
    done(true,{photo:{emoji:'📷',caption:cap,loc:'旅途中'}});
    return;
  }
  if(ev.game==='price'){
    var real=[20,35,50][Math.floor(Math.random()*3)];
    done(choice==String(real),{resultText:'摊主报价：'+real+' 元'});
    return;
  }
  if(ev.game==='rps'){
    var ta=['石头','剪刀','布'][Math.floor(Math.random()*3)];
    var w=choice===ta?'平':( (choice==='石头'&&ta==='剪刀')||(choice==='剪刀'&&ta==='布')||(choice==='布'&&ta==='石头') );
    if(w==='平')done(Math.random()<0.5,{resultText:cname+'也出了'+ta+'，平手再来一次'});
    else done(w==='真',{resultText:cname+'出了'+ta});
    return;
  }
  if(ev.game==='star'){
    var ok=(choice==='数到十'?0.7:(choice==='数到二十'?0.5:0.5));
    done(Math.random()<ok,{});
    return;
  }
  done(Math.random()<0.5,{});
}
// 猜左右手：两只手按钮，点击后判定
function journeyMiniGuess(ev,cname,done){
  var hand=Math.random()<0.5?'左手':'右手';
  var html='<div class="mini-g">';
  html+='<div style="font-size:40px;text-align:center;margin:6px 0;">✊ ✊</div>';
  html+='<div style="font-size:12px;color:#8a6a3a;text-align:center;margin-bottom:10px;">'+cname+'把两只手藏在背后，又伸了出来——猜猜哪只手里有东西？</div>';
  ['左手','右手'].forEach(function(h){
    html+='<button class="btn jrn-choice" onclick="journeyMiniGuessPick(\''+h+'\',\''+hand+'\')" style="background:var(--accent);margin:4px;">'+h+'</button>';
  });
  fillJourneyOverlay('🎮 '+ev.title,html,'');
  window._miniGuessDone=done;window._miniGuessEv=ev;
}
function journeyMiniGuessPick(chosen,hand){
  var win=chosen===hand;
  var ev=window._miniGuessEv;
  var done=window._miniGuessDone;
  var cname=window._journeyHero||'TA';
  var pAction=ev.actions&&ev.actions[chosen]?ev.actions[chosen]:('你指了指'+chosen);
  // 摊手动画
  fillJourneyOverlay('🎮 '+ev.title,
    '<div class="mini-g" style="text-align:center;">'+
    '<div style="font-size:46px;margin:8px 0;">'+(win?'👏 ✋':'🤷 🤚')+'</div>'+
    '<div style="font-size:14px;color:#5a4a3a;">'+cname+'摊开'+hand+'——'+(win?'里面有东西！':'是空的。')+'</div>'+
    '</div>','');
  setTimeout(function(){done(win,{resultText:(win?'你猜中了'+hand:'猜的是'+chosen+'，实际在'+hand)});},1100);
}
// 抛硬币：翻转动画后判定
function journeyMiniCoin(ev,cname,choice,done){
  var face=Math.random()<0.5?'正面':'反面';
  var win=choice===face;
  fillJourneyOverlay('🎮 '+ev.title,
    '<div class="mini-g" style="text-align:center;">'+
    '<div class="mini-coin">🪙</div>'+
    '<div style="font-size:13px;color:#8a6a3a;margin-top:12px;">硬币在空中转了几圈……</div>'+
    '</div>','');
  setTimeout(function(){
    fillJourneyOverlay('🎮 '+ev.title,
      '<div class="mini-g" style="text-align:center;">'+
      '<div class="mini-coin mini-coin-face">'+face+'</div>'+
      '<div style="font-size:14px;color:#5a4a3a;margin-top:10px;">落下来了：'+face+'</div>'+
      '</div>','');
    setTimeout(function(){done(win,{resultText:'硬币落地：'+face});},900);
  },1300);
}
// 翻牌配对（第二层）：6 张卡，3 对图案
function journeyMiniBuildScene(ev,cname,done){
  _journeyMiniGame={ev:ev,cb:done,kind:ev.game,flips:0,open:[],tries:0};
  if(ev.game==='match'){
    var pats=['🌸','🌙','⭐'];
    var deck=pats.concat(pats);
    for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=deck[i];deck[i]=deck[j];deck[j]=t;}
    _journeyMiniGame.cards=deck.map(function(p){return {p:p,flip:false};});
    journeyMiniMatchRender(false);
  }else{
    _journeyMiniGame.hidden=Math.floor(Math.random()*6);
    journeyMiniFindRender(false);
  }
}
// 翻牌界面
function journeyMiniMatchRender(doneMsg){
  var g=_journeyMiniGame;if(!g)return;
  var ev=g.ev;var cname=window._journeyHero||'TA';
  var html='<div style="font-size:13px;color:#8a6a3a;margin-bottom:8px;">'+cname+'说：翻两张，翻到一样的就算你们赢。你已经翻了 '+g.flips+' 张。</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  g.cards.forEach(function(cd,idx){
    var inner=cd.flip?('<div style="width:100%;height:64px;border-radius:10px;background:#fffdf8;border:1px solid rgba(181,138,74,0.4);display:flex;align-items:center;justify-content:center;font-size:26px;transform:rotateY(0deg);transition:transform .3s;">'+cd.p+'</div>')
      :'<div style="width:100%;height:64px;border-radius:10px;background:linear-gradient(135deg,#e8d4b8,#d8c4e8);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;" onclick="journeyMiniMatchFlip('+idx+')">✨</div>';
    html+='<div style="perspective:400px;">'+inner+'</div>';
  });
  html+='</div>';
  if(doneMsg)html+='<div style="font-size:13px;color:#5a4a3a;margin-top:8px;text-align:center;">'+doneMsg+'</div>';
  fillJourneyOverlay('🎮 '+ev.title,html,'<button class="btn jrn-choice" onclick="journeyMiniMatchCheck()" style="background:var(--accent);">确认配对</button>');
}
function journeyMiniMatchFlip(idx){
  var g=_journeyMiniGame;if(!g||g.kind!=='match')return;
  if(g.cards[idx].flip||g.open.length>=2)return;
  g.cards[idx].flip=true;g.open.push(idx);g.flips++;
  journeyMiniMatchRender(false);
}
function journeyMiniMatchCheck(){
  var g=_journeyMiniGame;if(!g||g.kind!=='match'||g.open.length<2)return;
  var a=g.cards[g.open[0]],b=g.cards[g.open[1]];
  var win=a.p===b.p;
  var ev=g.ev;var cb=g.cb;
  var msg=win?'配对了！两张都是 '+a.p:'没配上……'+cname+'安慰你：「没事，再来一次。」';
  journeyMiniMatchRender(msg);
  g.cards.forEach(function(cd){cd.flip=true;});
  setTimeout(function(){
    var winFinal=win;
    g.cb(winFinal,{resultText:msg});
    _journeyMiniGame=null;
  },1200);
}
// 找东西界面（6 格藏 1 物，2 次机会）
function journeyMiniFindRender(doneMsg){
  var g=_journeyMiniGame;if(!g||g.kind!=='find')return;
  var ev=g.ev;var cname=window._journeyHero||'TA';
  var html='<div style="font-size:13px;color:#8a6a3a;margin-bottom:8px;">'+cname+'说：这个场景里藏着一枚蓝色贝壳，你有 2 次机会（已用 '+g.tries+' 次）。</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
  for(var i=0;i<6;i++){
    var is=g.reveal===i;
    var found=g.found===i;
    var content=found?'🐚':(is?'✨':'');
    html+='<div onclick="journeyMiniFindPick('+i+')" style="height:56px;border-radius:10px;background:'+(found||is?'#fffdf8':'#f5efe4')+';border:1px solid rgba(181,138,74,0.35);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;">'+content+'</div>';
  }
  html+='</div>';
  if(doneMsg)html+='<div style="font-size:13px;color:#5a4a3a;margin-top:8px;text-align:center;">'+doneMsg+'</div>';
  fillJourneyOverlay('🎮 '+ev.title,html,'');
}
function journeyMiniFindPick(idx){
  var g=_journeyMiniGame;if(!g||g.kind!=='find'||g.found!=null)return;
  var ev=g.ev;var cname=window._journeyHero||'TA';
  if(idx===g.hidden){g.found=idx;g.reveal=null;journeyMiniFindRender('你找到了！'+cname+'：「居然真的被你找到了。」');setTimeout(function(){g.cb(true,{resultText:'找到了隐藏的贝壳'});_journeyMiniGame=null;},1100);return;}
  g.tries++;g.reveal=idx;
  if(g.tries>=2){
    g.reveal=g.hidden;
    journeyMiniFindRender('没找到……'+cname+'指了指：「在那儿呢。」');
    setTimeout(function(){g.cb(false,{resultText:'两次机会用完，贝壳藏在另一格'});_journeyMiniGame=null;},1200);
    return;
  }
  journeyMiniFindRender('这里没有，还剩 1 次机会');
}
// 小游戏结果卡
function journeyMiniResultHtml(ev,out,extra){
  var cname=window._journeyHero||'TA';
  var html='';
  html+='<div class="jrn-ev-scene">'+journeyEsc(extra.pAction||'你完成了小游戏')+'，'+journeyEsc(out.result)+'</div>';
  if(out.companionReply)html+='<div class="jrn-ev-line"><span class="jrn-who">'+journeyEsc(cname)+'</span><span class="jrn-quote">'+journeyEsc(out.companionReply)+'</span></div>';
  if(out.memory)html+='<div class="jrn-ev-memory">🎮 <span>'+journeyEsc(out.memory)+'</span><div style="font-size:11px;color:#b0a090;margin-top:3px;">这段经历，被记进了手账。</div></div>';
  if(extra&&extra.photo){
    html+='<div class="jrn-photo">'+extra.photo.emoji+'<div class="jrn-photo-cap">旅行照片 · '+journeyEsc(extra.photo.caption)+'</div></div>';
  }
  return html;
}
// 剧情推进：完成/继续当前链
function journeyStoryAdvance(ev){
  var st=journeyState;
  if(!st.story)return;
  st.story.step++;
  if(st.story.step>=st.story.total){
    var chain=JOURNEY_STORIES[st.story.key];
    journeyRecord('一段故事落下了句点：「'+st.story.name+'」完整地记进了手账。');
    st.story=null;
  }
}
// 回合推进（仅在玩家确认结果后调用）：玩家 → 各梦角 → 下一天
function journeyNextTurn(){
  var st=journeyState;if(!st)return;
  if(st.phase!=='idle')return;                     // 状态机守卫：确认后回到 idle 才能推进
  st.roundIdx++;
  if(st.roundIdx>=st.members.length){
    st.roundIdx=0;
    st.day++;
    // 第 4 天可能变天
    if(st.day===4&&!st.weatherChanged&&Math.random()<0.5){
      var nw=JOURNEY_WEATHERS[Math.floor(Math.random()*JOURNEY_WEATHERS.length)];
      journeyRecord('天气变了：'+st.weather.icon+' '+st.weather.name+' → '+nw.icon+' '+nw.name+'。');
      st.weather=nw;st.weatherChanged=true;
    }
    if(st.day>st.maxDays){
      st.day=st.maxDays;
      st.finished=true;
      journeyFinish();
      return;
    }
    journeyRecord('—— 第 '+st.day+' 天 ——');
  }
  renderJourneyTravel();
  // ★ 梦角行动：仅在确认结果后由这里显式驱动；journeyCompanionTurn 自带 phase 守卫，防重入
  if(!st.finished&&st.roundIdx!==0){
    setTimeout(function(){journeyCompanionTurn();},900);
  }
}

// ==================== 梦角回合：骰子动画 → 行动 + 共同经历 + 玩家互动 ====================
function journeyCompanionTurn(){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='idle'||st.roundIdx===0)return;   // 状态机守卫：仅空闲且轮到梦角时行动
  var cm=st.members[st.roundIdx];
  var dice=1+Math.floor(Math.random()*6);
  // ★ 修复：梦角投骰子动画（8 帧滚动，同玩家），动画结束后用同一点数移动
  var diceEl=$('journey-dice');
  if(diceEl){
    var c=0;
    var iv=setInterval(function(){
      c++;
      diceEl.textContent='🎲 '+(1+Math.floor(Math.random()*6));
      if(c>=8){
        clearInterval(iv);
        diceEl.textContent='🎲 '+cm.name+' 掷出 '+dice+' 点';
        setTimeout(function(){journeyCompanionMove(dice);},400);
      }
    },90);
  }else{
    journeyCompanionMove(dice);
  }
}
function journeyCompanionMove(dice){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='idle'||st.roundIdx===0)return;
  var cm=st.members[st.roundIdx];
  st.pos[cm.id]=(st.pos[cm.id]+dice)%st.map.length;
  var cell=st.map[st.pos[cm.id]];
  var ev=journeyPickEvent(cell);
  journeyVisit(cell.label);
  journeyRecord(cm.name+'掷出 '+dice+' 点，移动到了 '+cell.label+'。');
  var moveLine=JOURNEY_COMPANION_LINES.move[Math.floor(Math.random()*JOURNEY_COMPANION_LINES.move.length)]
    .replace('{name}',cm.name).replace('{dest}',cell.label);
  window._journeyCompanion={cid:cm.id,name:cm.name,ev:ev,cell:cell,moveLine:moveLine};
  // 阶段一事件卡：梦角行动 → 类型标签/标题 → 场景 → 梦角动作 → 梦角台词 → 玩家互动
  var title='';
  if(ev._story)title=journeyStoryTitle(ev);
  else if(ev._pool==='companion')title=cm.name+' 叫住了你';
  else if(ev._pool==='multi')title='👥 '+ev.title;
  else if(ev._pool==='banter')title='💬 '+ev.title;
  else title=ev.title||'TA 的发现';
  if(journeyIsRare(ev)&&title.indexOf('✨')<0)title='✨ '+title;
  // 小游戏/环境事件：无论谁移动，实际互动方都是玩家 → who='me'
  var gameWho=(journeyEventType(ev)==='minigame'||journeyEventType(ev)==='ambient')?'me':'companion';
  // 环境事件：无选择，CTA 直接"继续"
  if(journeyEventType(ev)==='ambient'){
    journeyShowEvent('💬 '+cm.name+' 的发现',
      '<div class="jrn-ev-move">'+journeyEsc(moveLine)+'</div>'+
      journeyEventCardHtml(ev,cm.name,title),
      '<button class="btn jrn-choice" onclick="journeyAmbientConfirm()" style="background:var(--accent);">继续</button>',
      'me');
    return;
  }
  journeyShowEvent('💬 '+cm.name+' 的发现',
    '<div class="jrn-ev-move">'+journeyEsc(moveLine)+'</div>'+
    journeyEventCardHtml(ev,cm.name,title),
    journeyInteractionButtons(ev,gameWho),
    gameWho);
}
// 玩家选择参与方式：共同经历结果 → 事件记忆 → 展示结果卡（等待确认继续）
function journeyCompanionReply(interactionName){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='event')return;                    // 仅事件卡等待互动时有效
  var cc=window._journeyCompanion;
  if(!cc)return;
  var ev=cc.ev;
  var out=JourneyEventManager.resolve(ev,interactionName);
  // 多人/插曲：回应的主角用第一位同行梦角
  var cname=(ev._pool==='multi'||ev._pool==='banter')?journeyMultiNames(ev).m0:cc.name;
  if(out.stars)st.stars+=out.stars;
  if(out.souvenir)st.souvenirs.push(out.souvenir);
  var it=null;
  (ev.interactions||[]).forEach(function(x){if(x.name===interactionName)it=x;});
  var pAction=it&&it.playerAction?JourneyEventManager.render(it.playerAction,cname):'你'+interactionName;
  var result=JourneyEventManager.render(out.result||'',cname);
  var memory=JourneyEventManager.render(out.memory||'',cname);
  if(memory){
    if(journeyIsRare(ev))st.rareMemories.push(memory);
    else st.memories.push(memory);
  }
  // 互动动作事件：拍照 → 生成旅行照片（不是奖励，是一段记录）
  var photo=null;
  if(interactionName.indexOf('拍')>=0)photo=journeyPhoto(cc.cell&&cc.cell.label,ev.title+'的一刻');
  // 连续剧情：推进阶段
  if(ev._story)journeyStoryAdvance(ev);
  journeyRecord('你和'+cname+'一起经历：'+pAction+'，'+result+(photo?' 📷 收进旅行照片':(out.souvenir?' 🎁 '+out.souvenir:''))+(out.stars?' ⭐ +'+out.stars:''));
  window._journeyCompanion=null;
  // 多阶段事件：第一阶段结束后进入第二阶段事件卡（who='me'，第二阶段由玩家主导）
  var ph2=journeyStageNext(ev);
  if(ph2&&ph2.interactions){
    var p2=journeyCopyEvent(ph2,'phases');
    p2.title=ev.title+' · '+journeyStageInfo(ph2,2,2);
    window._journeyEvent=p2;
    journeyShowEvent(ev.title+' · '+journeyStageInfo(ph2,2,2),
      journeyEventCardHtml(p2,cname,p2.title),
      journeyInteractionButtons(p2,'me'),
      'me',journeyStageInfo(ph2,2,2));
    return;
  }
  // 阶段二结果卡：玩家动作 → 结果 → 梦角回应 → 事件记忆（+ 旅行照片 / 剧情进度）
  journeyShowResult(journeyResultHtml(pAction,result,out,cname,ev),
    'companion');
}

// ==================== 事件卡（统一生命周期：出现→选择→结果→确认→下一回合）====================
// 阶段一：事件卡出现（phase: idle→event，等待玩家选择）
// 多阶段事件：第一阶段选择后不直接结束，进入 phases 第二阶段事件卡（事件标题后加进度）
function journeyShowEvent(title,bodyHtml,ctaHtml,who,phaseBar){
  var st=journeyState;if(!st)return;
  if(st.phase!=='idle')return;                     // 非空闲禁止弹新事件卡
  st.phase='event';                                // 锁定：事件显示期间禁止一切自动逻辑
  window._journeyPendingWho=who||'me';
  if(phaseBar)bodyHtml='<div class="jrn-phase-bar">'+phaseBar+'</div>'+bodyHtml;
  fillJourneyOverlay(title,bodyHtml,ctaHtml);
  showOv('ov-journey-event');
}
// 阶段二：结果卡展示（phase: event→result，等待玩家确认继续）
function journeyShowResult(bodyHtml,who){
  var st=journeyState;if(!st)return;
  if(st.phase!=='event')return;                    // 必须先经历事件卡
  st.phase='result';
  window._journeyPendingWho=who||'me';
  fillJourneyOverlay('✨ 旅途记录',
    bodyHtml,
    '<button class="btn jrn-choice" onclick="journeyConfirm()" style="background:var(--accent);">继续</button>');
}
function fillJourneyOverlay(title,bodyHtml,ctaHtml){
  var ov=$('ov-journey-event');
  if(!ov)return;
  var t=$('journey-event-title');if(t)t.textContent=title;
  var b=$('journey-event-body');
  if(b)b.innerHTML='<div style="background:linear-gradient(160deg,rgba(232,212,184,0.15),rgba(255,253,248,0.8));border-radius:14px;padding:14px;margin-bottom:10px;font-size:14px;color:#5a4a3a;line-height:1.9;border:1px solid rgba(139,115,85,0.2);">'+bodyHtml+'</div>';
  var c=$('journey-event-cta');
  if(c)c.innerHTML='<div style="display:flex;gap:8px;width:100%;">'+ctaHtml+'</div>';
}
// 阶段三：玩家确认继续（phase: result→idle，随后推进到下一回合）
function journeyConfirm(){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase!=='result')return;                   // 仅结果卡等待确认时有效
  hideOv('ov-journey-event');
  st.phase='idle';
  journeyNextTurn();
}
// 事件卡右上角 ✕：不卡住流程，按当前阶段代玩家操作
function journeySkipEvent(){
  var st=journeyState;if(!st||st.finished)return;
  if(st.phase==='event'){
    // 小游戏第二层（翻牌/找东西）：代玩家完成判定
    if(_journeyMiniGame){
      var gm=_journeyMiniGame;
      if(gm.kind==='match'){
        var idxs=[];
        gm.cards.forEach(function(cd,i){if(!cd.flip&&idxs.length<2)idxs.push(i);});
        idxs.forEach(function(i){journeyMiniMatchFlip(i);});
        setTimeout(function(){journeyMiniMatchCheck();},400);
      }else if(gm.kind==='find'){
        journeyMiniFindPick(gm.hidden);
      }
      return;
    }
    var ev=window._journeyEvent||(window._journeyCompanion&&window._journeyCompanion.ev);
    if(ev&&journeyEventType(ev)==='ambient'){journeyAmbientConfirm();return;}
    if(ev&&ev.interactions&&ev.interactions.length){
      var it=ev.interactions[Math.floor(Math.random()*ev.interactions.length)];
      if(window._journeyEvent)journeyPick(it.name);
      else journeyCompanionReply(it.name);
    }else if(ev&&ev.choiceText&&ev.choiceText.length){
      var ct=ev.choiceText[Math.floor(Math.random()*ev.choiceText.length)];
      if(window._journeyEvent)journeyPick(ct);
      else journeyCompanionReply(ct);
    }
  }else if(st.phase==='result'){
    journeyConfirm();
  }
}

// ==================== 旅行手账（结束视图，无胜负）====================
function journeyFinish(){
  var st=journeyState;
  var d=journeyLoad();
  d.stats.plays++;
  var now=new Date();
  var journal={
    date:(now.getFullYear())+'.'+(now.getMonth()+1)+'.'+now.getDate(),
    themeName:st.theme.name,
    weatherName:st.weather.icon+' '+st.weather.name,
    members:st.members.map(function(m){return m.name;}),
    days:st.maxDays,
    stars:st.stars,
    souvenirs:st.souvenirs.slice(),
    memories:st.memories.slice(),
    rareMemories:st.rareMemories.slice(),
    ambientRecords:st.ambientRecords.slice(),
    miniRecords:st.miniRecords.slice(),
    photos:st.photos.slice(),
    visited:st.visited.slice(),
    records:st.records.slice(),
    ending:JOURNEY_COMPANION_LINES.ending[Math.floor(Math.random()*JOURNEY_COMPANION_LINES.ending.length)]
  };
  d.journals.unshift(journal);
  journeySave(d);
  renderJourneyJournal(journal);
}
function renderJourneyJournal(j){
  var body=$('journey-body');if(!body)return;
  var html='';
  html+='<div class="jrn-card" style="text-align:center;border-top:4px solid #e8d4b8;">';
  html+='<div style="font-size:30px;">📖</div>';
  html+='<div style="font-size:19px;font-weight:700;color:#5a4a3a;letter-spacing:2px;margin-top:4px;">旅行手账</div>';
  html+='<div style="font-size:11px;color:#9a8a7a;margin-top:4px;">'+j.date+' · '+j.themeName+'</div>';
  html+='<div style="font-size:12px;color:#8a6a3a;margin-top:10px;line-height:1.8;">'+journeyEsc(j.ending)+'</div>';
  html+='</div>';
  html+='<div class="jrn-card">';
  html+='<div class="jrn-card-label">同行</div>';
  html+='<div style="font-size:13px;color:#6b5a4a;margin-top:6px;">'+j.members.map(function(m){return journeyEsc(m);}).join('、')+'</div>';
  html+='<div class="jrn-divider"></div>';
  html+='<div class="jrn-card-label">天气</div>';
  html+='<div style="font-size:13px;color:#6b5a4a;margin-top:6px;">'+journeyEsc(j.weatherName)+'</div>';
  html+='<div class="jrn-divider"></div>';
  html+='<div class="jrn-card-label">经过的地点</div>';
  html+='<div style="font-size:13px;color:#6b5a4a;margin-top:6px;">'+(j.visited&&j.visited.length?j.visited.map(function(v){return journeyEsc(v);}).join(' → '):'—')+'</div>';
  html+='<div class="jrn-divider"></div>';
  html+='<div class="jrn-card-label">沿途的小物件</div>';
  html+='<div style="font-size:13px;color:#6b5a4a;margin-top:6px;">'+(j.souvenirs&&j.souvenirs.length?j.souvenirs.map(function(s){return journeyEsc(s);}).join(' · '):'这一路，没留下什么实物，但都留在了心里。')+'</div>';
  html+='<div class="jrn-divider"></div>';
  html+='<div style="text-align:center;font-size:13px;color:#8a6a3a;">✨ 这一路的星光：'+j.stars+'</div>';
  html+='</div>';
  // 旅行照片区
  if(j.photos&&j.photos.length){
    html+='<div class="jrn-card">';
    html+='<div class="jrn-card-label">旅行照片</div>';
    html+='<div class="jrn-photos">'+j.photos.map(function(p){return '<div class="jrn-photo-item">'+p.emoji+'<div class="jrn-photo-cap">'+journeyEsc(p.caption)+'</div></div>';}).join('')+'</div>';
    html+='</div>';
  }
  // 稀有经历区（金色）
  if(j.rareMemories&&j.rareMemories.length){
    html+='<div class="jrn-card jrn-rare-card">';
    html+='<div class="jrn-card-label" style="color:#a67c2e;">✨ 很少遇到的一刻</div>';
    html+='<div class="jrn-records" style="margin-top:8px;">'+j.rareMemories.map(function(m){return '<div class="jrn-record jrn-record-rare">🌟 '+journeyEsc(m)+'</div>';}).join('')+'</div>';
    html+='</div>';
  }
  // 小游戏区
  if(j.miniRecords&&j.miniRecords.length){
    html+='<div class="jrn-card">';
    html+='<div class="jrn-card-label">🎮 一起玩过的小游戏</div>';
    html+='<div class="jrn-records" style="margin-top:8px;">'+j.miniRecords.map(function(m){return '<div class="jrn-record">🎮 '+journeyEsc(m)+'</div>';}).join('')+'</div>';
    html+='</div>';
  }
  // 旅途氛围区（环境小事）
  if(j.ambientRecords&&j.ambientRecords.length){
    html+='<div class="jrn-card">';
    html+='<div class="jrn-card-label">🌿 路过的风景</div>';
    html+='<div class="jrn-records" style="margin-top:8px;">'+j.ambientRecords.map(function(m){return '<div class="jrn-record" style="border-left-color:#7fb069;">🌿 '+journeyEsc(m)+'</div>';}).join('')+'</div>';
    html+='</div>';
  }
  // 事件记忆区
  if(j.memories&&j.memories.length){
    html+='<div class="jrn-card">';
    html+='<div class="jrn-card-label">一起经历的事</div>';
    html+='<div class="jrn-records" style="margin-top:8px;">'+j.memories.map(function(m){return '<div class="jrn-record" style="border-left-color:#b58a4a;">💭 '+journeyEsc(m)+'</div>';}).join('')+'</div>';
    html+='</div>';
  }
  html+='<div class="jrn-card">';
  html+='<div class="jrn-card-label">旅途记录</div>';
  html+='<div class="jrn-records">'+j.records.map(function(r){return '<div class="jrn-record">'+journeyEsc(r)+'</div>';}).join('')+'</div>';
  html+='</div>';
  html+='<button onclick="renderJourneyCreate()" class="jrn-btn" style="margin-bottom:10px;">再走一段旅途</button>';
  html+='<button onclick="showJourneyRecords()" class="jrn-btn jrn-btn-ghost">📚 查看我的旅行手账</button>';
  body.innerHTML=html;
}

// ==================== 历史旅行手账 ====================
function showJourneyRecords(){
  renderJourneyRecords();
  showOv('ov-journey-records');
}
function renderJourneyRecords(){
  var box=$('journey-records-body');if(!box)return;
  var d=journeyLoad();
  var html='';
  if(!d.journals.length){
    html+='<div style="text-align:center;padding:30px 0;color:#b0a090;font-size:13px;">还没有旅行手账<br><span style="font-size:11px;">去走一段旅途，把回忆收进这里。</span></div>';
  }
  d.journals.forEach(function(j,idx){
    html+='<div class="jrn-rec-item" onclick="journeyViewJournal('+idx+')">';
    html+='<div style="font-size:15px;font-weight:600;color:#5a4a3a;">📖 '+journeyEsc(j.themeName)+'</div>';
    html+='<div style="font-size:11px;color:#9a8a7a;margin-top:4px;">'+journeyEsc(j.date)+' · '+journeyEsc(j.weatherName)+'</div>';
    html+='<div style="font-size:12px;color:#8a6a3a;margin-top:6px;">同行：'+j.members.map(function(m){return journeyEsc(m);}).join('、')+' · ⭐ '+j.stars+'</div>';
    html+='</div>';
  });
  box.innerHTML=html;
}
function journeyViewJournal(idx){
  hideOv('ov-journey-records');
  var d=journeyLoad();
  var j=d.journals[idx];
  if(j)renderJourneyJournal(j);
}
