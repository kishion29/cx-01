# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
R = []
def patch(s, old, new, label, count=1):
    n = s.count(old)
    if n == 0:
        R.append(f'[FAIL 0] {label}')
        return s
    s = s.replace(old, new, count)
    R.append(f'[OK {n}] {label}')
    return s

p = 'app/src/23_pomodoro_icons.js'
s = open(p, encoding='utf-8').read()

# R1 chatbarItems 加 ai_card_records（消息工具）
s = patch(s, "{id:'image',name:'发送图片',icon:'🖼️',fixed:true,category:'消息工具'},",
          "{id:'image',name:'发送图片',icon:'🖼️',fixed:true,category:'消息工具'},\n  {id:'ai_card_records',name:'AI解读字卡记录',icon:'📚',fixed:false,category:'消息工具'},", 'R1 chatbarItems 加记录')

# R2 记忆库改名（梦角）
s = patch(s, "{id:'ai_card_memory',name:'AI解读字卡记忆库',icon:'📚',fixed:false,category:'梦角'},",
          "{id:'ai_card_memory',name:'AI解读记忆库',icon:'🧠',fixed:false,category:'梦角'},", 'R2 记忆库改名')

# R3 默认列表补 ai_card_records（全部）
s = patch(s, "'toggle_bottom_nav','ai_diviner','ai_card_memory']",
          "'toggle_bottom_nav','ai_diviner','ai_card_memory','ai_card_records']", 'R3 默认列表补记录', count=99)

# R4 order 补新
s = patch(s, "'read_cards','read_video','toggle_bottom_nav','ai_diviner'];",
          "'read_cards','read_video','toggle_bottom_nav','ai_diviner','ai_card_records'];", 'R4 order 补新')

# R5 case 加 ai_card_records
s = patch(s, """      case 'ai_card_memory':
        if(typeof openAiCardMemory==='function')openAiCardMemory();
        break;""",
          """      case 'ai_card_memory':
        if(typeof openAiCardMemory==='function')openAiCardMemory();
        break;
      case 'ai_card_records':
        if(typeof openAiCardRecords==='function')openAiCardRecords();
        break;""", 'R5 case 加记录')

# R6 aiInterpretCard 成功回调改存自动记录
s = patch(s, """      try{
        var _memContact=contacts.find(function(c){return c.id===cid})||{};
        aiCardMemoryAdd({id:'m'+Date.now()+'_'+msgId,msgId:msgId,contactId:cid,contactName:_memContact.name||'TA',cardText:cardText,cardExtra:cardExtra||'',interpret:text,savedAt:Date.now()});
      }catch(e){}""",
          """      try{
        var _memContact=contacts.find(function(c){return c.id===cid})||{};
        aiCardRecordAdd({id:'r'+Date.now()+'_'+msgId,msgId:msgId,contactId:cid,contactName:_memContact.name||'TA',cardText:cardText,cardExtra:cardExtra||'',interpret:text,savedAt:Date.now()});
      }catch(e){}""", 'R6 改存自动记录')

# R7 解读带记忆+上下文
s = patch(s, "  var userPrompt='你（TA）发给用户一张字卡：「'+cardText+'」'+cardExtra+'。请以你（TA）的身份，解读这张字卡想对用户传达的意思。';",
"""  // ★ 结合手动记忆 + 最近对话上下文，让解读更连贯
  var _ctxInfo='';
  try{
    var _memArr=aiCardMemoryLoad();
    if(_memArr&&_memArr.length){
      _ctxInfo+='\\n【关于你们的一些记忆（解读时请结合）】\\n'+_memArr.map(function(x){return '- '+x.content;}).join('\\n');
    }
    var _allM=msgs(cid)||[];
    var _recent=[];
    for(var _i=_allM.length-1;_i>=0&&_recent.length<8;_i--){
      var _x=_allM[_i];
      if(!_x)continue;
      var _t=_x.t||_x.originalContent||(_x.img?'[图片]':_x.voice?'[语音]':null);
      if(!_t)continue;
      _recent.unshift((_x.s===SELF?'我：':'TA：')+String(_t).slice(0,60));
    }
    if(_recent.length)_ctxInfo+='\\n【最近的对话上下文】\\n'+_recent.join('\\n');
  }catch(e){}
  var userPrompt='你（TA）发给用户一张字卡：「'+cardText+'」'+cardExtra+_ctxInfo+'。请以你（TA）的身份，解读这张字卡想对用户传达的意思。';""", 'R7 解读带记忆+上下文')

# R8 替换记忆库旧块（marker → API 接口 之间）
marker = "// ================= AI 解读字卡记忆库 ================="
api_marker = "// ===== API 接口：AI 解读字卡 ====="
i0 = s.find(marker)
i1 = s.find(api_marker, i0)
if i0 < 0 or i1 < 0:
    R.append(f'[FAIL 0] R8 范围定位 i0={i0} i1={i1}')
else:
    new_block = open('scripts/_mem_block.js', encoding='utf-8').read()
    s = s[:i0] + new_block + s[i1:]
    R.append(f'[OK 1] R8 记忆库块替换 (范围 {i0}~{i1})')

open(p, 'w', encoding='utf-8', newline='').write(s)
print()
for r in R:
    print(r)
print('最终 len:', len(s))
