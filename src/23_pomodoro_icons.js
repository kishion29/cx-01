// ---------- Pomodoro Timer (番茄钟) v2 ----------
var pomodoroState = {
  phase: 'work',
  remaining: 25 * 60,
  totalSeconds: 25 * 60,
  workDuration: 25,
  breakDuration: 5,
  isRunning: false,
  isPaused: false,
  timerId: null,
  totalTomatoes: 0,
  isComplete: false,
  messages: {},
  msgId: 0,
  isReplying: false,
  companionCid: null
};
var pomodoroRecords = [];
var pomodoroSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  toastEnabled: true,
  tickEnabled: false,
  noiseType: 'white',
  noiseVolume: 50,
  replyDelay: 5,
  cardSource: 'global',
  customCards: '',
  workDuration: 25,
  breakDuration: 5,
  chatBg: '',
  multiCardEnabled: false,
  multiCardProb: 50,
  multiCardMin: 2,
  multiCardMax: 5,
  blockDuringFocus: false,
  myMsgColor: '#6b5a4a',
  otherMsgColor: '#6b5a4a',
  myTimeColor: '#c4a882',
  otherTimeColor: '#c4a882',
  customNoise: '',
  customNoiseName: '',
  autoMsgProb: 30,
  autoMsgMinDelay: 1,
  autoMsgMaxDelay: 300,
  sendBtnBg: '#e8a87c',
  sendBtnText: '#ffffff',
  startBtnBg: '#e8a87c',
  startBtnText: '#ffffff'
};
var pomodoroNoiseCtx = null;
var pomodoroAutoMsgTimer = null;
var pomodoroRecordTab = 'list';
var pomodoroStatsView = 'day';

// 初始化
function loadPomodoroState() {
  var saved = ls('ml2_pomodoro_state_v2');
  if (saved && typeof saved === 'object') Object.assign(pomodoroState, saved);
}
function savePomodoroState() {
  ls('ml2_pomodoro_state_v2', pomodoroState);
}
function loadPomodoroRecords() {
  var saved = ls('ml2_pomodoro_records_v2');
  if (saved && Array.isArray(saved)) pomodoroRecords = saved;
}
function savePomodoroRecords() {
  ls('ml2_pomodoro_records_v2', pomodoroRecords);
}
async function loadPomodoroSettings() {
  var saved = ls('ml2_pomodoro_settings_v2');
  if (!saved || typeof saved !== 'object') {
    try {
      var direct = localStorage.getItem('ml2_pomodoro_direct');
      if (direct) saved = JSON.parse(direct);
    } catch(e) {}
  }
  if (saved && typeof saved === 'object') Object.assign(pomodoroSettings, saved);
  // 从localforage加载chatBg（大图片数据），必须await等加载完
  try {
    if (typeof localforage !== 'undefined') {
      var bg = await localforage.getItem('ml2_pomodoro_chatbg');
      if (bg) { pomodoroSettings.chatBg = bg; }
    }
  } catch(e) {}
}
function savePomodoroSettings() {
  // 将不含chatBg的设置存到localStorage（避免配额溢出）
  var settingsLight = {};
  for (var key in pomodoroSettings) {
    if (pomodoroSettings.hasOwnProperty(key) && key !== 'chatBg') {
      settingsLight[key] = pomodoroSettings[key];
    }
  }
  ls('ml2_pomodoro_settings_v2', settingsLight);
  try {
    localStorage.setItem('ml2_pomodoro_direct', JSON.stringify(settingsLight));
  } catch(e) {}
  // chatBg存到localforage（支持大文件）
  if (typeof localforage !== 'undefined') {
    if (pomodoroSettings.chatBg) {
      localforage.setItem('ml2_pomodoro_chatbg', pomodoroSettings.chatBg).catch(function(){});
    } else {
      localforage.removeItem('ml2_pomodoro_chatbg').catch(function(){});
    }
  }
}

// 格式化时间
function formatPomodoroTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
}

// 获取当前时间字符串
function getPomodoroClockStr() {
  var d = new Date();
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

// 更新时钟
function updatePomodoroClock() {
  var el = $('pomodoro-clock');
  if (el) el.textContent = getPomodoroClockStr();
}

// 调节工作时长
function adjustPomodoroDuration(delta) {
  if (pomodoroState.isRunning) return;
  var d = pomodoroState.workDuration + delta;
  d = Math.max(1, Math.min(120, d));
  pomodoroState.workDuration = d;
  pomodoroState.totalSeconds = d * 60;
  pomodoroState.remaining = d * 60;
  updatePomodoroUI();
}

// 预设时间选择
function setPomodoroPreset(minutes, el) {
  if (pomodoroState.isRunning) return;
  var d = Math.max(1, Math.min(120, minutes));
  pomodoroState.workDuration = d;
  pomodoroState.totalSeconds = d * 60;
  pomodoroState.remaining = d * 60;
  // 更新预设按钮状态
  var chips = document.querySelectorAll('.pomodoro-preset-chip');
  chips.forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  updatePomodoroUI();
}

// 从输入框设置时长
function setPomodoroDurationFromInput() {
  if (pomodoroState.isRunning) return;
  var input = $('pomodoro-duration-input');
  if (!input) return;
  var d = parseInt(input.value) || 25;
  d = Math.max(1, Math.min(120, d));
  pomodoroState.workDuration = d;
  pomodoroState.totalSeconds = d * 60;
  pomodoroState.remaining = d * 60;
  updatePomodoroUI();
}

// 调节休息时长
function adjustBreakDuration(delta) {
  if (pomodoroState.isRunning) return;
  var d = pomodoroState.breakDuration + delta;
  d = Math.max(1, Math.min(30, d));
  pomodoroState.breakDuration = d;
  pomodoroSettings.breakDuration = d;
  updatePomodoroUI();
}

function setBreakDurationFromInput() {
  if (pomodoroState.isRunning) return;
  var input = $('pomodoro-break-input');
  if (!input) return;
  var d = parseInt(input.value) || 5;
  d = Math.max(1, Math.min(30, d));
  pomodoroState.breakDuration = d;
  pomodoroSettings.breakDuration = d;
  updatePomodoroUI();
}

// 切换开始/暂停
function togglePomodoro() {
  if (pomodoroState.isRunning && !pomodoroState.isPaused) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

// 开始
function startPomodoro() {
  if (pomodoroState.isRunning && !pomodoroState.isPaused) return;
  
  if (pomodoroState.isPaused) {
    pomodoroState.isPaused = false;
  } else {
    if (pomodoroState.remaining <= 0) {
      pomodoroState.remaining = pomodoroState.totalSeconds;
    }
  }
  pomodoroState.isRunning = true;
  
  // 触发开始提醒
  if (pomodoroSettings.soundEnabled) playPomodoroBeep('start');
  if (pomodoroSettings.vibrateEnabled) haptic('light');
  if (pomodoroSettings.toastEnabled) toast('番茄钟已开始');
  
  updatePomodoroUI();
  startPomodoroTimer();
}

// 暂停
function pausePomodoro() {
  if (!pomodoroState.isRunning || pomodoroState.isPaused) return;
  pomodoroState.isPaused = true;
  clearInterval(pomodoroState.timerId);
  pomodoroState.timerId = null;
  stopPomodoroAutoMsg();
  updatePomodoroUI();
}

// 重置
function resetPomodoro() {
  clearInterval(pomodoroState.timerId);
  pomodoroState.timerId = null;
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  pomodoroState.isComplete = false;
  pomodoroState.phase = 'work';
  pomodoroState.remaining = pomodoroState.totalSeconds;
  stopPomodoroAutoMsg();
  updatePomodoroUI();
}

// 手动完成
function completePomodoroManual() {
  if (!pomodoroState.isRunning && !pomodoroState.isPaused) return;
  recordPomodoroCompletion();
  switchToBreak();
}

// 计时器
function startPomodoroTimer() {
  clearInterval(pomodoroState.timerId);
  var tickCount = 0;
  pomodoroState.timerId = setInterval(function() {
    if (pomodoroState.isPaused) return;
    
    pomodoroState.remaining--;
    tickCount++;
    
    // 每10秒滴答
    if (tickCount % 10 === 0 && pomodoroSettings.tickEnabled) {
      playPomodoroBeep('tick');
    }
    
    updatePomodoroUI();
    
    if (pomodoroState.remaining <= 0) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.timerId = null;
      pomodoroState.isRunning = false;
      pomodoroState.isComplete = true;
      
      if (pomodoroState.phase === 'work') {
        recordPomodoroCompletion();
        switchToBreak();
      } else {
        switchToWork();
      }
    }
  }, 1000);
}

// 记录完成
function recordPomodoroCompletion() {
  var duration = pomodoroState.phase === 'work' ? pomodoroState.totalSeconds / 60 : pomodoroState.breakDuration;
  var record = {
    date: new Date().toISOString().slice(0, 10),
    timestamp: Date.now(),
    duration: Math.round(duration),
    phase: pomodoroState.phase
  };
  pomodoroRecords.push(record);
  pomodoroState.totalTomatoes++;
  savePomodoroRecords();
  savePomodoroState();
  
  // 触发完成提醒
  if (pomodoroSettings.soundEnabled) playPomodoroBeep('complete');
  if (pomodoroSettings.vibrateEnabled) { haptic('light'); setTimeout(function() { haptic('light'); }, 300); }
  if (pomodoroSettings.toastEnabled) toast('🍅 番茄完成！已专注 ' + Math.round(duration) + ' 分钟');
}

// 切换到休息
function switchToBreak() {
  pomodoroState.phase = 'break';
  pomodoroState.remaining = pomodoroState.breakDuration * 60;
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  pomodoroState.isComplete = false;
  
  stopPomodoroAutoMsg();
  if (pomodoroSettings.soundEnabled) playPomodoroBeep('break');
  if (pomodoroSettings.vibrateEnabled) haptic('light');
  if (pomodoroSettings.toastEnabled) toast('休息时间~');
  
  updatePomodoroUI();
}

// 切换到工作
function switchToWork() {
  pomodoroState.phase = 'work';
  pomodoroState.remaining = pomodoroState.totalSeconds;
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  pomodoroState.isComplete = false;
  stopPomodoroAutoMsg();
  updatePomodoroUI();
}

// 手动切换工作/休息模式
function switchPomodoroMode(mode) {
  if (pomodoroState.isRunning && !pomodoroState.isPaused) {
    // 运行中切换：先停止计时器
    clearInterval(pomodoroState.timerId);
    pomodoroState.timerId = null;
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    stopPomodoroAutoMsg();
  }
  
  if (mode === 'work') {
    pomodoroState.phase = 'work';
    pomodoroState.remaining = pomodoroState.totalSeconds;
  } else {
    pomodoroState.phase = 'break';
    pomodoroState.remaining = pomodoroState.breakDuration * 60;
  }
  
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  pomodoroState.isComplete = false;
  updatePomodoroUI();
}

// 更新UI
function updatePomodoroUI() {
  // 半框模式
  var countdownEl = $('pomodoro-countdown');
  var phaseLabelEl = $('pomodoro-phase-label');
  var startBtn = $('pomodoro-start-btn');
  
  if (countdownEl) countdownEl.textContent = formatPomodoroTime(pomodoroState.remaining);
  
  if (pomodoroState.phase === 'work') {
    if (phaseLabelEl) phaseLabelEl.textContent = '工作时间';
  } else {
    if (phaseLabelEl) phaseLabelEl.textContent = '休息时间';
  }
  
  // 更新模式切换按钮
  var workBtn = $('pomodoro-mode-work');
  var breakBtn = $('pomodoro-mode-break');
  if (workBtn && breakBtn) {
    if (pomodoroState.phase === 'work') {
      workBtn.style.background = '#333';
      workBtn.style.color = '#fff';
      workBtn.style.borderColor = '#333';
      breakBtn.style.background = 'var(--c2)';
      breakBtn.style.color = 'var(--txt)';
      breakBtn.style.borderColor = 'var(--border)';
    } else {
      breakBtn.style.background = '#333';
      breakBtn.style.color = '#fff';
      breakBtn.style.borderColor = '#333';
      workBtn.style.background = 'var(--c2)';
      workBtn.style.color = 'var(--txt)';
      workBtn.style.borderColor = 'var(--border)';
    }
  }
  
  // 更新预设按钮状态
  var chips = document.querySelectorAll('.pomodoro-preset-chip');
  chips.forEach(function(c) {
    var min = parseInt(c.getAttribute('data-min'));
    if (min === pomodoroState.workDuration) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  
  // 开始/暂停按钮
  if (startBtn) {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) {
      startBtn.textContent = '暂停';
      startBtn.classList.add('paused');
    } else if (pomodoroState.isPaused) {
      startBtn.textContent = '继续';
      startBtn.classList.remove('paused');
    } else {
      startBtn.textContent = '开始';
      startBtn.classList.remove('paused');
    }
  }
  
  // 陪伴模式更新
  var ccEl = $('pomodoro-companion-countdown');
  var csBtn = $('pomodoro-companion-start-btn');
  
  if (ccEl) ccEl.textContent = formatPomodoroTime(pomodoroState.remaining);
  
  if (csBtn) {
    if (pomodoroState.isRunning && !pomodoroState.isPaused) {
      csBtn.textContent = '暂停';
      csBtn.classList.add('paused');
    } else if (pomodoroState.isPaused) {
      csBtn.textContent = '继续';
      csBtn.classList.remove('paused');
    } else {
      csBtn.textContent = '开始';
      csBtn.classList.remove('paused');
    }
  }
  
  updatePomodoroClock();
}

// 进入陪伴模式
function enterCompanionMode() {
  var halfEl = $('pomodoro-half');
  var companionEl = $('pomodoro-companion');
  if (!halfEl || !companionEl) return;
  
  halfEl.style.display = 'none';
  companionEl.style.display = 'flex';
  
  // 初始化联系人
  renderPomodoroContacts();
  if (!pomodoroState.companionCid && contacts.length > 0) {
    pomodoroState.companionCid = contacts[0].id;
  }
  updatePomodoroContactTrigger();
  renderPomodoroChat();
  applyPomodoroChatBg();
  applyPomodoroButtonColors();
  updatePomodoroUI();
  if (pomodoroState.isRunning) schedulePomodoroAutoMsg();
}

// 退出陪伴模式
function exitCompanionMode() {
  var halfEl = $('pomodoro-half');
  var companionEl = $('pomodoro-companion');
  if (!halfEl || !companionEl) return;
  
  stopPomodoroAutoMsg();
  companionEl.style.display = 'none';
  halfEl.style.display = 'block';
  updatePomodoroUI();
}

// 自动发消息定时器
function schedulePomodoroAutoMsg() {
  stopPomodoroAutoMsg();
  var companionEl = $('pomodoro-companion');
  if (!companionEl || companionEl.style.display === 'none') return;
  if (!pomodoroState.isRunning || pomodoroState.isPaused) return;
  if (pomodoroSettings.blockDuringFocus) return;
  
  var minDelay = pomodoroSettings.autoMsgMinDelay * 1000;
  var maxDelay = pomodoroSettings.autoMsgMaxDelay * 1000;
  var delay = minDelay + Math.random() * (maxDelay - minDelay);
  
  pomodoroAutoMsgTimer = setTimeout(function() {
    // 概率检查
    if (Math.random() * 100 > pomodoroSettings.autoMsgProb) {
      schedulePomodoroAutoMsg();
      return;
    }
    
    // 获取当前联系人字卡
    var cards = getPomodoroCards();
    if (cards.length === 0) {
      schedulePomodoroAutoMsg();
      return;
    }
    
    var reply = cards[Math.floor(Math.random() * cards.length)];
    var msgs = getPomodoroMsgs();
    msgs.push({
      id: pomodoroState.msgId++,
      text: reply,
      self: false,
      time: Date.now()
    });
    renderPomodoroChat();
    savePomodoroMessages();
    
    // 触发一次后继续调度
    schedulePomodoroAutoMsg();
  }, delay);
}

function stopPomodoroAutoMsg() {
  if (pomodoroAutoMsgTimer) {
    clearTimeout(pomodoroAutoMsgTimer);
    pomodoroAutoMsgTimer = null;
  }
}

// 渲染联系人下拉列表
function renderPomodoroContacts() {
  var dropdown = $('pomodoro-contact-dropdown');
  var triggerName = $('pomodoro-contact-trigger-name');
  if (!dropdown) return;
  
  var html = '';
  var hasContacts = contacts.length > 0;
  var hasGroups = groups.length > 0;
  
  if (hasContacts) {
    html += '<div class="pomodoro-contact-dropdown-divider">联系人</div>';
    contacts.forEach(function(c) {
      var active = c.id === pomodoroState.companionCid ? ' active' : '';
      html += '<div class="pomodoro-contact-dropdown-item' + active + '" onclick="switchPomodoroContact(\'' + c.id + '\')">' + c.name + '</div>';
    });
  }
  if (hasGroups) {
    html += '<div class="pomodoro-contact-dropdown-divider">群聊</div>';
    groups.forEach(function(g) {
      var active = g.id === pomodoroState.companionCid ? ' active' : '';
      html += '<div class="pomodoro-contact-dropdown-item' + active + '" onclick="switchPomodoroContact(\'' + g.id + '\')">' + g.name + '</div>';
    });
  }
  dropdown.innerHTML = html;
  
  // 更新触发器显示
  updatePomodoroContactTrigger();
}

// 更新触发器显示
function updatePomodoroContactTrigger() {
  // 只显示图标，不显示名字，保持隐蔽
}

// 切换下拉菜单
function togglePomodoroContactDropdown() {
  var el = $('pomodoro-contact-switch');
  if (!el) return;
  var isOpen = el.classList.contains('open');
  if (isOpen) {
    el.classList.remove('open');
  } else {
    renderPomodoroContacts();
    el.classList.add('open');
    // 点击外部关闭
    setTimeout(function() {
      document.addEventListener('click', closePomodoroContactDropdown);
      document.addEventListener('touchend', closePomodoroContactDropdown);
    }, 10);
  }
}

function closePomodoroContactDropdown(e) {
  var el = $('pomodoro-contact-switch');
  if (!el) return;
  if (!el.contains(e.target)) {
    el.classList.remove('open');
    document.removeEventListener('click', closePomodoroContactDropdown);
    document.removeEventListener('touchend', closePomodoroContactDropdown);
  }
}

// 切换联系人
function switchPomodoroContact(cid) {
  pomodoroState.companionCid = cid;
  updatePomodoroContactTrigger();
  renderPomodoroContacts();
  renderPomodoroChat();
  var el = $('pomodoro-contact-switch');
  if (el) el.classList.remove('open');
  document.removeEventListener('click', closePomodoroContactDropdown);
  document.removeEventListener('touchend', closePomodoroContactDropdown);
}

// 获取当前字卡（字卡库：公用字卡+专享字卡，排除贴纸/语音/拍一拍/颜文字）
function getPomodoroCards() {
  // 独立字卡库模式
  if (pomodoroSettings.cardSource === 'pomodoro' && pomodoroSettings.customCards) {
    return pomodoroSettings.customCards.split('\n').filter(function(s) { return s.trim(); });
  }
  // 字卡库模式：使用 globalCards（公用字卡 + 专享字卡），过滤逻辑与 genReply 一致
  var senderId = pomodoroState.companionCid;
  if (!senderId) return ['嗯嗯，我在呢~', '专注是最美的状态', '加油哦，每一分钟都算数', '我在陪着你~', '一起努力吧！'];
  
  var userCards = globalCards.filter(function(card) {
    if (!card) return false;
    if (!card.content) return false;
    // 排除贴纸/语音/拍一拍
    if (card.category === 'stickers' || card.category === 'voices') return false;
    if (card.category === 'touch') return false;
    // 检查分组是否禁用
    if (card.groupId) {
      var group = cardGroups.find(function(g) { return g.id === card.groupId; });
      if (group && group.disabled) return false;
      if (group && group.type === 'public' && group.disabledContacts && group.disabledContacts.indexOf(senderId) >= 0) return false;
    }
    // 公用字卡：所有人可用
    if (card.type === 'public') return true;
    // 专享字卡：仅绑定联系人可用
    if (card.type === 'private') {
      if (card.contactId === senderId) return true;
      var pc = cardPrivateContacts.find(function(p) { return p.id === card.contactId && p.bindContactId === senderId });
      if (pc) return true;
      return false;
    }
    // 无 type 标记的旧卡片视为公用
    if (!card.type) return true;
    return false;
  });
  
  // 构建可用字卡池
  var availableCards = userCards.slice();
  
  // 将默认通用字卡添加到池中（各分类独立概率已在getDefaultCommonCardsForContact中处理）
  if (defaultCommonEnabled && defaultCommonAllContacts) {
    var dcCards = getDefaultCommonCardsForContact(senderId);
    if (dcCards.length > 0) {
      dcCards.forEach(function(text) {
        availableCards.push({content:text,category:'custom',type:'default_common',groupId:null});
      });
    }
  }
  
  if (availableCards.length === 0) {
    return ['嗯嗯，我在呢~', '专注是最美的状态', '加油哦，每一分钟都算数', '我在陪着你~', '一起努力吧！'];
  }
  return availableCards.map(function(c) { return c.content; });
}

// 获取当前联系人的番茄钟聊天消息
function getPomodoroMsgs() {
  var cid = pomodoroState.companionCid;
  if (!cid) return [];
  if (!pomodoroState.messages[cid]) pomodoroState.messages[cid] = [];
  return pomodoroState.messages[cid];
}

// 发送消息
function sendPomodoroMessage() {
  var input = $('pomodoro-chat-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  
  var msgs = getPomodoroMsgs();
  msgs.push({
    id: pomodoroState.msgId++,
    text: text,
    self: true,
    time: Date.now()
  });
  input.value = '';
  renderPomodoroChat();
  savePomodoroMessages();
  
  // 自动回复
  if (!pomodoroState.isReplying) {
    pomodoroState.isReplying = true;
    var delay = pomodoroSettings.replyDelay * 1000;
    setTimeout(function() {
      var cards = getPomodoroCards();
      var reply = '';
      // 多字卡模式
      if (pomodoroSettings.multiCardEnabled && cards.length > 1 && Math.random() * 100 < pomodoroSettings.multiCardProb) {
        var min = Math.min(pomodoroSettings.multiCardMin, pomodoroSettings.multiCardMax);
        var max = Math.max(pomodoroSettings.multiCardMin, pomodoroSettings.multiCardMax);
        var count = min + Math.floor(Math.random() * (max - min + 1));
        count = Math.min(count, cards.length);
        var selected = [];
        var pool = cards.slice();
        for (var i = 0; i < count; i++) {
          var idx = Math.floor(Math.random() * pool.length);
          selected.push(pool[idx]);
          pool.splice(idx, 1);
        }
        reply = selected.join(' ');
      } else {
        reply = cards[Math.floor(Math.random() * cards.length)];
      }
      var msgs2 = getPomodoroMsgs();
      msgs2.push({
        id: pomodoroState.msgId++,
        text: reply,
        self: false,
        time: Date.now()
      });
      pomodoroState.isReplying = false;
      renderPomodoroChat();
      savePomodoroMessages();
    }, delay);
  }
}

// 格式化时间戳（精确到秒）
function formatPomodoroTimeStr(ts) {
  var d = new Date(ts);
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
}

// 渲染聊天
function renderPomodoroChat() {
  var el = $('pomodoro-chat-messages');
  if (!el) return;
  
  var msgs = getPomodoroMsgs();
  var html = '';
  if (msgs.length === 0) {
    html = '<div class="pomodoro-encourage" id="pomodoro-encourage">' + getRandomEncourage() + '</div>';
  } else {
    msgs.forEach(function(msg) {
      var cls = msg.self ? 'self' : 'other';
      var timeStr = formatPomodoroTimeStr(msg.time);
      var msgColor = msg.self ? pomodoroSettings.myMsgColor : pomodoroSettings.otherMsgColor;
      var timeColor = msg.self ? pomodoroSettings.myTimeColor : pomodoroSettings.otherTimeColor;
      html += '<div class="pomodoro-chat-msg-wrapper ' + cls + '">';
      html += '<div class="pomodoro-chat-msg ' + cls + '" style="color:' + msgColor + '">' + msg.text + '</div>';
      html += '<div class="pomodoro-chat-time" style="color:' + timeColor + '">' + timeStr + '</div>';
      html += '</div>';
    });
  }
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

// 随机鼓励语
function getRandomEncourage() {
  var list = [
    '💪 专注是一种力量，每一分钟都算数',
    '🌸 今天的努力，是明天的花开',
    '✨ 你专注的样子，真的很美',
    '🌟 每一次坚持，都在靠近更好的自己',
    '🍀 静下心来，世界都是你的',
    '🌙 慢慢来，会更快',
    '🔥 保持专注，保持热爱',
    '💫 心无旁骛，方得始终'
  ];
  return list[Math.floor(Math.random() * list.length)];
}

// 白噪音 - 重新设计更真实的音效
var pomodoroNoiseNodes = [];

function initWhiteNoise() {
  if (pomodoroNoiseCtx) return;
  try {
    pomodoroNoiseCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { console.log('Web Audio not supported'); }
}

function toggleWhiteNoise() {
  initWhiteNoise();
  if (!pomodoroNoiseCtx) return;
  
  if (pomodoroNoiseNodes.length > 0) {
    stopWhiteNoise();
  } else {
    startWhiteNoise();
  }
}

function stopWhiteNoise() {
  pomodoroNoiseNodes.forEach(function(n) {
    if (n.isAudio) {
      try { n.source.pause(); n.source.currentTime = 0; } catch(e) {}
    } else {
      try { n.source.stop(); } catch(e) {}
    }
  });
  pomodoroNoiseNodes = [];
  var btn = $('pomodoro-noise-play-btn');
  if (btn) btn.textContent = '▶ 播放';
}

function togglePomodoroNoise() {
  var btn = $('pomodoro-noise-play-btn');
  if (pomodoroNoiseNodes.length > 0) {
    // 正在播放，停止
    stopWhiteNoise();
    if (btn) btn.textContent = '▶ 播放';
  } else {
    // 未播放，开始播放
    // 从设置面板读取当前类型和音量
    if ($('pomodoro-setting-noise-type')) {
      pomodoroSettings.noiseType = $('pomodoro-setting-noise-type').value;
    }
    if ($('pomodoro-setting-noise-volume')) {
      pomodoroSettings.noiseVolume = parseInt($('pomodoro-setting-noise-volume').value);
    }
    if (!pomodoroNoiseCtx) {
      pomodoroNoiseCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    startWhiteNoise();
    if (btn) btn.textContent = '⏸ 暂停';
  }
}

function startWhiteNoise() {
  if (!pomodoroNoiseCtx) return;
  stopWhiteNoise();
  
  var ctx = pomodoroNoiseCtx;
  var type = pomodoroSettings.noiseType || 'white';
  var vol = (pomodoroSettings.noiseVolume || 50) / 100 * 0.4;
  var masterGain = ctx.createGain();
  masterGain.gain.value = vol;
  masterGain.connect(ctx.destination);
  
  if (type === 'white') {
    var bufferSize = ctx.sampleRate * 4;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;
    filter.Q.value = 0.5;
    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    pomodoroNoiseNodes.push({ source: source, gain: masterGain });
  } else if (type === 'rain') {
    for (var j = 0; j < 3; j++) {
      var bufSize = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var k = 0; k < bufSize; k++) {
        d[k] = (Math.random() * 2 - 1) * 0.6;
        if (Math.random() < 0.003) d[k] = (Math.random() * 2 - 1) * 1.5;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2000 + j * 1500;
      f.Q.value = 0.8 + j * 0.3;
      var g = ctx.createGain();
      g.gain.value = 0.25 / (j + 1);
      src.connect(f);
      f.connect(g);
      g.connect(masterGain);
      src.start();
      pomodoroNoiseNodes.push({ source: src, gain: masterGain });
    }
  } else if (type === 'ocean') {
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    var noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var ki = 0; ki < nd.length; ki++) {
      nd[ki] = Math.random() * 2 - 1;
    }
    var noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    var noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = 'lowpass';
    noiseFilt.frequency.value = 500;
    lfoGain.connect(noiseFilt.frequency);
    var noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.4;
    noiseSrc.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSrc.start();
    lfo.start();
    pomodoroNoiseNodes.push({ source: noiseSrc, gain: masterGain });
    pomodoroNoiseNodes.push({ source: lfo, gain: masterGain });
  } else if (type === 'forest') {
    var fBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    var fd = fBuf.getChannelData(0);
    for (var fi = 0; fi < fd.length; fi++) {
      fd[fi] = Math.random() * 2 - 1;
    }
    var fSrc = ctx.createBufferSource();
    fSrc.buffer = fBuf;
    fSrc.loop = true;
    var fFilt = ctx.createBiquadFilter();
    fFilt.type = 'lowpass';
    fFilt.frequency.value = 3000;
    var fGain = ctx.createGain();
    fGain.gain.value = 0.2;
    fSrc.connect(fFilt);
    fFilt.connect(fGain);
    fGain.connect(masterGain);
    fSrc.start();
    pomodoroNoiseNodes.push({ source: fSrc, gain: masterGain });
    var birdOsc = ctx.createOscillator();
    birdOsc.type = 'sine';
    birdOsc.frequency.value = 1800;
    var birdGain = ctx.createGain();
    birdGain.gain.value = 0;
    birdOsc.connect(birdGain);
    birdGain.connect(masterGain);
    birdOsc.start();
    pomodoroNoiseNodes.push({ source: birdOsc, gain: masterGain });
    function scheduleBird() {
      var now = ctx.currentTime;
      birdOsc.frequency.setValueAtTime(1200 + Math.random() * 2000, now);
      birdGain.gain.setValueAtTime(0, now);
      birdGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      birdGain.gain.linearRampToValueAtTime(0, now + 0.15);
      setTimeout(scheduleBird, 3000 + Math.random() * 8000);
    }
    setTimeout(scheduleBird, 1000 + Math.random() * 3000);
  }
  
  // 自定义白噪音
  if (type === 'custom' && pomodoroSettings.customNoise) {
    var audio = new Audio(pomodoroSettings.customNoise);
    audio.loop = true;
    audio.volume = vol;
    audio.play().catch(function() {});
    pomodoroNoiseNodes.push({ source: audio, gain: masterGain, isAudio: true });
  }
  
  var btn = $('pomodoro-white-noise-btn');
  if (btn) btn.textContent = '🔊';
}

// 声音
function playPomodoroBeep(type) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'start') {
      osc.frequency.value = 600;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'complete') {
      osc.type = 'sine';
      [600, 800, 1000].forEach(function(freq, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = 'sine';
        g.gain.value = 0.3;
        o.start(ctx.currentTime + i * 0.15);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.3);
        o.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } else if (type === 'break') {
      osc.frequency.value = 500;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'tick') {
      osc.frequency.value = 1000;
      osc.type = 'sine';
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch(e) {}
}

// 记录弹窗
function showPomodoroRecords() {
  loadPomodoroRecords();
  switchPomodoroRecordTab('list', document.querySelector('.pomodoro-record-tab'));
  showOv('ov-pomodoro-records');
}

function switchPomodoroRecordTab(tab, btn) {
  pomodoroRecordTab = tab;
  var tabs = document.querySelectorAll('.pomodoro-record-tab');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  
  $('pomodoro-record-list').style.display = tab === 'list' ? 'block' : 'none';
  $('pomodoro-record-stats').style.display = tab === 'stats' ? 'block' : 'none';
  
  if (tab === 'list') renderPomodoroRecordList();
  if (tab === 'stats') switchPomodoroStatsView(pomodoroStatsView);
}

function renderPomodoroRecordList() {
  var el = $('pomodoro-record-list');
  if (!el) return;
  
  var records = pomodoroRecords.slice().reverse();
  if (records.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--txt3);">暂无打卡记录</div>';
    return;
  }
  
  var totalTomatoes = records.length;
  var totalMinutes = records.reduce(function(s, r) { return s + r.duration; }, 0);
  
  var html = '<div style="text-align:center;padding:12px 0;font-size:14px;color:var(--txt);border-bottom:1px solid var(--border);margin-bottom:8px;">🍅 共打卡 <b style="color:#8b7355;">' + totalTomatoes + '</b> 次，专注 <b style="color:#8b7355;">' + totalMinutes + '</b> 分钟</div>';
  
  records.forEach(function(r) {
    var d = new Date(r.timestamp);
    var dateStr = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    html += '<div class="pomodoro-record-item"><span class="pomodoro-record-date">' + dateStr + '</span><span class="pomodoro-record-phase">' + (r.phase === 'work' ? '工作' : '休息') + '</span><span class="pomodoro-record-duration">' + r.duration + '分钟</span></div>';
  });
  
  el.innerHTML = html;
}

function switchPomodoroStatsView(view, btn) {
  pomodoroStatsView = view;
  var tabs = document.querySelectorAll('.pomodoro-stats-tab');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderPomodoroStats(view);
}

function renderPomodoroStats(view) {
  var summaryEl = $('pomodoro-stats-summary');
  var chartEl = $('pomodoro-stats-chart');
  if (!summaryEl || !chartEl) return;
  
  var now = new Date();
  var records = pomodoroRecords;
  var data = [];
  var labels = [];
  
  if (view === 'day') {
    for (var h = 0; h < 24; h++) {
      labels.push(h + ':00');
      var total = 0;
      records.forEach(function(r) {
        var d = new Date(r.timestamp);
        if (d.toDateString() === now.toDateString() && d.getHours() === h) {
          total += r.duration;
        }
      });
      data.push(total);
    }
  } else if (view === 'week') {
    var dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push('周' + dayNames[d.getDay()]);
      var total = 0;
      records.forEach(function(r) {
        var rd = new Date(r.timestamp);
        if (rd.toDateString() === d.toDateString()) total += r.duration;
      });
      data.push(total);
    }
  } else if (view === 'month') {
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (var i = 1; i <= daysInMonth; i++) {
      labels.push(i + '日');
      var targetDate = new Date(now.getFullYear(), now.getMonth(), i);
      var total = 0;
      records.forEach(function(r) {
        var rd = new Date(r.timestamp);
        if (rd.toDateString() === targetDate.toDateString()) total += r.duration;
      });
      data.push(total);
    }
  }
  
  var totalTomatoes = records.length;
  var totalMinutes = records.reduce(function(s, r) { return s + r.duration; }, 0);
  summaryEl.innerHTML = '🍅 ' + totalTomatoes + ' 次打卡 · 共 ' + totalMinutes + ' 分钟';
  
  var maxVal = Math.max.apply(null, data) || 1;
  var html = '';
  data.forEach(function(val, i) {
    var pct = Math.round(val / maxVal * 100);
    html += '<div class="pomodoro-stats-bar-wrap"><div class="pomodoro-stats-bar-label">' + labels[i] + '</div><div class="pomodoro-stats-bar"><div class="pomodoro-stats-bar-fill" style="width:' + pct + '%;"></div></div><div class="pomodoro-stats-bar-value">' + val + '分</div></div>';
  });
  chartEl.innerHTML = html;
}

// 设置面板
async function showPomodoro() {
  // 如果计时器正在运行，保留当前进度；否则加载保存的状态并重置
  if (!pomodoroState.isRunning || pomodoroState.isPaused) {
    loadPomodoroState();
    pomodoroState.remaining = pomodoroState.totalSeconds;
  }
  loadPomodoroMessages();
  await loadPomodoroSettings();
  loadPomodoroRecords();
  updatePomodoroUI();
  updatePomodoroClock();
  showOv('ov-pomodoro');
  
  // 预加载美化设置（此时chatBg已从localforage加载完成）
  applyPomodoroChatBg();
  applyPomodoroButtonColors();
  
  // 确保半框显示
  var halfEl = $('pomodoro-half');
  var companionEl = $('pomodoro-companion');
  if (halfEl) halfEl.style.display = 'block';
  if (companionEl) companionEl.style.display = 'none';
}

function showPomodoroSettings() {
  loadPomodoroSettings();
  $('pomodoro-setting-work-duration').value = pomodoroState.workDuration;
  $('pomodoro-setting-break-duration').value = pomodoroState.breakDuration;
  $('pomodoro-setting-sound').checked = pomodoroSettings.soundEnabled;
  $('pomodoro-setting-vibrate').checked = pomodoroSettings.vibrateEnabled;
  $('pomodoro-setting-toast').checked = pomodoroSettings.toastEnabled;
  $('pomodoro-setting-tick').checked = pomodoroSettings.tickEnabled;
  $('pomodoro-setting-noise-type').value = pomodoroSettings.noiseType;
  $('pomodoro-setting-noise-volume').value = pomodoroSettings.noiseVolume;
  $('pomodoro-setting-noise-volume-value').textContent = pomodoroSettings.noiseVolume + '%';
  $('pomodoro-setting-reply-delay').value = pomodoroSettings.replyDelay;
  $('pomodoro-setting-reply-delay-value').textContent = pomodoroSettings.replyDelay + 's';
  $('pomodoro-setting-card-source').value = pomodoroSettings.cardSource;
  $('pomodoro-setting-custom-cards').value = pomodoroSettings.customCards;
  $('pomodoro-setting-multi-card').checked = pomodoroSettings.multiCardEnabled;
  $('pomodoro-setting-multi-card-prob').value = pomodoroSettings.multiCardProb;
  $('pomodoro-setting-multi-card-prob-value').textContent = pomodoroSettings.multiCardProb + '%';
  $('pomodoro-setting-multi-card-min').value = pomodoroSettings.multiCardMin;
  $('pomodoro-setting-multi-card-max').value = pomodoroSettings.multiCardMax;
  // 聊天背景预览
  updatePomodoroChatBgPreview();
  // 自定义白噪音名称
  if (pomodoroSettings.customNoiseName) {
    $('pomodoro-setting-custom-noise-name').textContent = '已上传：' + pomodoroSettings.customNoiseName;
  } else {
    $('pomodoro-setting-custom-noise-name').textContent = '';
  }
  $('pomodoro-setting-block-during').checked = pomodoroSettings.blockDuringFocus;
  $('pomodoro-setting-my-msg-color').value = pomodoroSettings.myMsgColor;
  $('pomodoro-setting-other-msg-color').value = pomodoroSettings.otherMsgColor;
  $('pomodoro-setting-my-time-color').value = pomodoroSettings.myTimeColor;
  $('pomodoro-setting-other-time-color').value = pomodoroSettings.otherTimeColor;
  $('pomodoro-setting-auto-msg-prob').value = pomodoroSettings.autoMsgProb;
  $('pomodoro-setting-auto-msg-prob-value').textContent = pomodoroSettings.autoMsgProb + '%';
  $('pomodoro-setting-auto-msg-min').value = pomodoroSettings.autoMsgMinDelay;
  $('pomodoro-setting-auto-msg-max').value = pomodoroSettings.autoMsgMaxDelay;
  $('pomodoro-setting-send-btn-bg').value = pomodoroSettings.sendBtnBg;
  $('pomodoro-setting-send-btn-text').value = pomodoroSettings.sendBtnText;
  $('pomodoro-setting-start-btn-bg').value = pomodoroSettings.startBtnBg;
  $('pomodoro-setting-start-btn-text').value = pomodoroSettings.startBtnText;
  
  $('pomodoro-setting-noise-volume').oninput = function() {
    var v = this.value;
    $('pomodoro-setting-noise-volume-value').textContent = v + '%';
  };
  $('pomodoro-setting-reply-delay').oninput = function() {
    $('pomodoro-setting-reply-delay-value').textContent = this.value + 's';
  };
  
  $('pomodoro-setting-multi-card-prob').oninput = function() {
    $('pomodoro-setting-multi-card-prob-value').textContent = this.value + '%';
  };
  
  $('pomodoro-setting-auto-msg-prob').oninput = function() {
    $('pomodoro-setting-auto-msg-prob-value').textContent = this.value + '%';
  };
  
  showOv('ov-pomodoro-settings');
}

function showPomodoroCompanionSettings() {
  showPomodoroSettings();
}

// 切换设置标签页
function switchPomodoroSettingsTab(tab) {
  var tabs = document.querySelectorAll('.pomodoro-settings-tab');
  var panels = document.querySelectorAll('.pomodoro-settings-panel');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  panels.forEach(function(p) { p.classList.remove('active'); });
  var activeTab = document.querySelector('.pomodoro-settings-tab[data-tab="' + tab + '"]');
  var activePanel = document.getElementById('pomodoro-panel-' + tab);
  if (activeTab) activeTab.classList.add('active');
  if (activePanel) activePanel.classList.add('active');
}

// 本地上传白噪音
function handlePomodoroCustomNoiseUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    pomodoroSettings.customNoise = e.target.result;
    pomodoroSettings.customNoiseName = file.name;
    $('pomodoro-setting-custom-noise-name').textContent = '已上传：' + file.name;
    $('pomodoro-setting-noise-type').value = 'custom';
    savePomodoroSettings();
    toast('白噪音已上传');
  };
  reader.readAsDataURL(file);
}

function clearPomodoroCustomNoise() {
  pomodoroSettings.customNoise = '';
  pomodoroSettings.customNoiseName = '';
  $('pomodoro-setting-custom-noise-name').textContent = '';
  if ($('pomodoro-setting-noise-type').value === 'custom') {
    $('pomodoro-setting-noise-type').value = 'white';
  }
  savePomodoroSettings();
  toast('自定义白噪音已清除');
}

function savePomodoroSettingsUI() {
  pomodoroSettings.soundEnabled = $('pomodoro-setting-sound').checked;
  pomodoroSettings.vibrateEnabled = $('pomodoro-setting-vibrate').checked;
  pomodoroSettings.toastEnabled = $('pomodoro-setting-toast').checked;
  pomodoroSettings.tickEnabled = $('pomodoro-setting-tick').checked;
  pomodoroSettings.noiseType = $('pomodoro-setting-noise-type').value;
  pomodoroSettings.noiseVolume = parseInt($('pomodoro-setting-noise-volume').value);
  pomodoroSettings.replyDelay = parseInt($('pomodoro-setting-reply-delay').value);
  pomodoroSettings.cardSource = $('pomodoro-setting-card-source').value;
  pomodoroSettings.multiCardEnabled = $('pomodoro-setting-multi-card').checked;
  pomodoroSettings.multiCardProb = parseInt($('pomodoro-setting-multi-card-prob').value) || 50;
  pomodoroSettings.multiCardMin = parseInt($('pomodoro-setting-multi-card-min').value) || 2;
  pomodoroSettings.multiCardMax = parseInt($('pomodoro-setting-multi-card-max').value) || 5;
  pomodoroSettings.blockDuringFocus = $('pomodoro-setting-block-during').checked;
  pomodoroSettings.myMsgColor = $('pomodoro-setting-my-msg-color').value;
  pomodoroSettings.otherMsgColor = $('pomodoro-setting-other-msg-color').value;
  pomodoroSettings.myTimeColor = $('pomodoro-setting-my-time-color').value;
  pomodoroSettings.otherTimeColor = $('pomodoro-setting-other-time-color').value;
  pomodoroSettings.customCards = $('pomodoro-setting-custom-cards').value;
  pomodoroSettings.autoMsgProb = parseInt($('pomodoro-setting-auto-msg-prob').value) || 30;
  pomodoroSettings.autoMsgMinDelay = parseInt($('pomodoro-setting-auto-msg-min').value) || 1;
  pomodoroSettings.autoMsgMaxDelay = parseInt($('pomodoro-setting-auto-msg-max').value) || 300;
  pomodoroSettings.sendBtnBg = $('pomodoro-setting-send-btn-bg').value;
  pomodoroSettings.sendBtnText = $('pomodoro-setting-send-btn-text').value;
  pomodoroSettings.startBtnBg = $('pomodoro-setting-start-btn-bg').value;
  pomodoroSettings.startBtnText = $('pomodoro-setting-start-btn-text').value;
  // 时长设置
  var wd = parseInt($('pomodoro-setting-work-duration').value) || 25;
  wd = Math.max(1, Math.min(120, wd));
  pomodoroState.workDuration = wd;
  pomodoroState.totalSeconds = wd * 60;
  if (!pomodoroState.isRunning) pomodoroState.remaining = wd * 60;
  pomodoroSettings.workDuration = wd;
  var bd = parseInt($('pomodoro-setting-break-duration').value) || 5;
  bd = Math.max(1, Math.min(30, bd));
  pomodoroState.breakDuration = bd;
  pomodoroSettings.breakDuration = bd;
  savePomodoroSettings();
  
  // 更新白噪音音量
  if (pomodoroNoiseNodes.length > 0) {
    stopWhiteNoise();
    startWhiteNoise();
  }
  
  updatePomodoroUI();
  renderPomodoroChat();
  applyPomodoroChatBg();
  applyPomodoroButtonColors();
  hideOv('ov-pomodoro-settings');
  toast('设置已保存');
}

function restorePomodoroDefaults() {
  pomodoroSettings = {
    soundEnabled: true,
    vibrateEnabled: true,
    toastEnabled: true,
    tickEnabled: false,
    noiseType: 'white',
    noiseVolume: 50,
    replyDelay: 5,
    cardSource: 'global',
    customCards: '',
    workDuration: 25,
    breakDuration: 5,
    chatBg: '',
    multiCardEnabled: false,
    multiCardProb: 50,
    multiCardMin: 2,
    multiCardMax: 5,
    blockDuringFocus: false,
    myMsgColor: '#6b5a4a',
    otherMsgColor: '#6b5a4a',
    myTimeColor: '#c4a882',
    otherTimeColor: '#c4a882',
    customNoise: '',
    customNoiseName: '',
    autoMsgProb: 30,
    autoMsgMinDelay: 1,
    autoMsgMaxDelay: 300,
    sendBtnBg: '#e8a87c',
    sendBtnText: '#ffffff',
    startBtnBg: '#e8a87c',
    startBtnText: '#ffffff'
  };
  savePomodoroSettings();
  pomodoroState.workDuration = 25;
  pomodoroState.breakDuration = 5;
  pomodoroState.totalSeconds = 25 * 60;
  pomodoroState.remaining = 25 * 60;
  updatePomodoroUI();
  showPomodoroSettings();
  toast('已恢复默认设置');
}

// 聊天背景处理
function handlePomodoroChatBgUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    pomodoroSettings.chatBg = ev.target.result;
    updatePomodoroChatBgPreview();
    applyPomodoroChatBg();
    savePomodoroSettings();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function clearPomodoroChatBg() {
  pomodoroSettings.chatBg = '';
  updatePomodoroChatBgPreview();
  applyPomodoroChatBg();
  savePomodoroSettings();
}

function updatePomodoroChatBgPreview() {
  var preview = $('pomodoro-setting-chat-bg-preview');
  if (!preview) return;
  if (pomodoroSettings.chatBg) {
    preview.style.backgroundImage = 'url(' + pomodoroSettings.chatBg + ')';
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    preview.textContent = '';
  } else {
    preview.style.backgroundImage = '';
    preview.textContent = '未设置背景';
  }
}

function applyPomodoroChatBg() {
  var container = $('pomodoro-companion');
  if (!container) return;
  if (pomodoroSettings.chatBg) {
    container.style.backgroundImage = 'url(' + pomodoroSettings.chatBg + ')';
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
  } else {
    container.style.backgroundImage = '';
    container.style.backgroundSize = '';
    container.style.backgroundPosition = '';
  }
}

function applyPomodoroButtonColors() {
  var sendBtn = document.querySelector('.pomodoro-send-btn');
  var startBtnHalf = $('pomodoro-start-btn');
  var startBtnComp = $('pomodoro-companion-start-btn');
  
  if (sendBtn) {
    sendBtn.style.background = pomodoroSettings.sendBtnBg;
    sendBtn.style.color = pomodoroSettings.sendBtnText;
  }
  
  var bg = pomodoroSettings.startBtnBg;
  var text = pomodoroSettings.startBtnText;
  if (startBtnHalf) {
    startBtnHalf.style.background = bg;
    startBtnHalf.style.color = text;
  }
  if (startBtnComp) {
    startBtnComp.style.background = bg;
    startBtnComp.style.color = text;
  }
}

// 独立字卡管理
function openPomodoroCustomCards() {
  $('pomodoro-custom-cards-input').value = pomodoroSettings.customCards;
  renderPomodoroCustomCardList();
  showOv('ov-pomodoro-custom-cards');
}

function closePomodoroCustomCards() {
  // 关闭前确保保存
  pomodoroSettings.customCards = $('pomodoro-custom-cards-input').value;
  $('pomodoro-setting-custom-cards').value = pomodoroSettings.customCards;
  savePomodoroSettings();
  hideOv('ov-pomodoro-custom-cards');
}

function autoSavePomodoroCustomCards() {
  pomodoroSettings.customCards = $('pomodoro-custom-cards-input').value;
  $('pomodoro-setting-custom-cards').value = pomodoroSettings.customCards;
  savePomodoroSettings();
  renderPomodoroCustomCardList();
}

function savePomodoroCustomCardsManual() {
  pomodoroSettings.customCards = $('pomodoro-custom-cards-input').value;
  $('pomodoro-setting-custom-cards').value = pomodoroSettings.customCards;
  savePomodoroSettings();
  toast('独立字卡已保存');
  renderPomodoroCustomCardList();
}

function deletePomodoroCustomCard(idx) {
  var cards = pomodoroSettings.customCards.split('\n').filter(function(c) { return c.trim(); });
  if (idx < 0 || idx >= cards.length) return;
  cards.splice(idx, 1);
  pomodoroSettings.customCards = cards.join('\n');
  $('pomodoro-custom-cards-input').value = pomodoroSettings.customCards;
  $('pomodoro-setting-custom-cards').value = pomodoroSettings.customCards;
  savePomodoroSettings();
  renderPomodoroCustomCardList();
}

function renderPomodoroCustomCardList() {
  var cards = pomodoroSettings.customCards.split('\n').filter(function(c) { return c.trim(); });
  var listEl = $('pomodoro-custom-card-list');
  var countEl = $('pomodoro-custom-card-count');
  if (countEl) countEl.textContent = cards.length;
  if (!listEl) return;
  
  if (cards.length === 0) {
    listEl.innerHTML = '<div style="font-size:12px;color:var(--txt3);text-align:center;padding:20px;">暂无字卡</div>';
    return;
  }
  
  var html = '';
  cards.forEach(function(card, idx) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--border);font-size:13px;color:var(--txt);">';
    html += '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + card + '</span>';
    html += '<button onclick="deletePomodoroCustomCard(' + idx + ')" style="background:none;border:none;color:#ff4d4f;cursor:pointer;font-size:16px;padding:4px 8px;min-height:32px;min-width:32px;opacity:0.6;">×</button>';
    html += '</div>';
  });
  listEl.innerHTML = html;
}

// 保存番茄钟聊天消息
function savePomodoroMessages() {
  ls('ml2_pomodoro_msgs', pomodoroState.messages);
}

function loadPomodoroMessages() {
  var saved = ls('ml2_pomodoro_msgs');
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    pomodoroState.messages = saved;
    // 计算 msgId
    var maxId = 0;
    Object.keys(saved).forEach(function(k) {
      var arr = saved[k];
      if (Array.isArray(arr) && arr.length > 0) {
        var lastId = arr[arr.length - 1].id;
        if (lastId > maxId) maxId = lastId;
      }
    });
    pomodoroState.msgId = maxId + 1;
  } else if (saved && Array.isArray(saved)) {
    // 兼容旧格式：旧数据迁移到第一个联系人
    pomodoroState.messages = {};
    if (pomodoroState.companionCid) {
      pomodoroState.messages[pomodoroState.companionCid] = saved;
      pomodoroState.msgId = saved.length > 0 ? saved[saved.length - 1].id + 1 : 0;
    }
  }
}

// 初始化
(function() {
  loadPomodoroState();
  loadPomodoroSettings();
  loadPomodoroRecords();
  loadPomodoroMessages();
  if (pomodoroState.remaining <= 0) {
    pomodoroState.remaining = pomodoroState.totalSeconds;
  }
  // 修复：用 try/catch 包裹回调，避免错误持续累积
  setInterval(function(){try{updatePomodoroClock();}catch(e){console.warn('updatePomodoroClock error:',e);}}, 30000);
})();

// ---------- Custom Chatbar Settings ----------
var chatbarItems=[
  {id:'chat',name:'聊天',icon:'💬',fixed:true,category:'底部导航',isNav:true},
  {id:'moments',name:'朋友圈',icon:'📸',fixed:false,category:'更多'},
  {id:'more',name:'更多',icon:'✨',fixed:true,category:'底部导航',isNav:true},
  {id:'settings',name:'设置',icon:'⚙️',fixed:true,category:'底部导航',isNav:true},
  {id:'image',name:'发送图片',icon:'🖼️',fixed:true,category:'消息工具'},
  {id:'copy_msg',name:'复制文字消息',icon:'📋',fixed:false,category:'消息工具'},
  {id:'long_screenshot',name:'长截图',icon:'📸',fixed:false,category:'消息工具'},
  {id:'fav_msg',name:'收藏聊天消息',icon:'⭐',fixed:false,category:'消息工具'},
  {id:'my_favs',name:'我的收藏夹',icon:'📁',fixed:false,category:'消息工具'},
  {id:'cards',name:'聊天字卡库',icon:'📖',fixed:true,category:'字卡库'},
  {id:'topbar_cards',name:'顶部栏字卡库',icon:'📌',fixed:false,category:'字卡库'},
  {id:'search_chat',name:'搜索聊天记录',icon:'🔍',fixed:false,category:'消息工具'},
  {id:'date_search',name:'切换聊天日期',icon:'📅',fixed:false,category:'消息工具'},
  {id:'touch',name:'拍一拍',icon:'👋',fixed:false,category:'聊天互动'},
  {id:'redpacket',name:'红包',icon:'🧧',fixed:false,category:'聊天互动'},
  {id:'decision',name:'帮我决定',icon:'🎲',fixed:false,category:'聊天互动'},
  {id:'group_decision',name:'多人决定',icon:'👥',fixed:false,category:'聊天互动'},
  {id:'divine',name:'占卜',icon:'🔮',fixed:false,category:'聊天互动'},
  {id:'call',name:'通话',icon:'📞',fixed:false,category:'聊天互动'},
  {id:'survey',name:'调查问卷',icon:'📝',fixed:false,category:'更多'},
  {id:'star_music',name:'星音陪伴',icon:'🎵',fixed:false,category:'聊天互动'},
  {id:'giftbox',name:'礼物盒',icon:'🎁',fixed:false,category:'聊天互动'},
  {id:'letters',name:'信箱',icon:'✉️',fixed:false,category:'更多'},
  {id:'board',name:'我的留言板',icon:'📋',fixed:false,category:'更多'},
  {id:'period',name:'经期记录',icon:'🌸',category:'更多',fixed:false},
  {id:'pomodoro',name:'番茄钟',icon:'🍅',category:'更多',fixed:false},
  {id:'mood_cards_library',name:'聊天情绪系统',icon:'💭',category:'字卡库',fixed:false},
  {id:'contact-profile',name:'梦角主页',icon:'🏠',category:'梦角',fixed:false},
  {id:'favorites',name:'TA的收藏夹',icon:'⭐',fixed:false,category:'梦角'},
  {id:'ta_highlights',name:'TA想说的重点',icon:'💬',fixed:false,category:'梦角'},
  {id:'chat_stats',name:'聊天统计',icon:'📊',fixed:false,category:'消息工具'},
  {id:'star_cal',name:'星言日历',icon:'✨',fixed:false,category:'梦角'},
  {id:'diary',name:'我的日记',icon:'✍️',fixed:false,category:'更多'},
  
  {id:'add',name:'添加好友',icon:'+',fixed:false,category:'其他'},
  {id:'search',name:'搜索',icon:'🔍',fixed:false,category:'其他'},
  {id:'back',name:'返回',icon:'←',fixed:false,category:'其他'},
  {id:'emoji',name:'表情',icon:'😊',fixed:false,category:'其他'},
  {id:'send',name:'发送',icon:'📤',fixed:false,category:'其他'},
  {id:'more_action',name:'更多操作',icon:'⋯',fixed:false,category:'其他'}
];
var chatbarCategoryOrder=['消息工具','聊天互动','更多','梦角','字卡库','底部导航','其他'];
var customChatbarEnabled=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','search_chat','date_search','touch','redpacket','decision','group_decision','divine','call','survey','moments','letters','board','period','pomodoro','mood_cards_library','contact-profile','favorites','ta_highlights','chat_stats','star_music','star_cal','diary','giftbox'];

// 聊天输入栏收纳功能：根据全局设置显示/隐藏输入栏按钮
function applyInputBarVisibility(c){
  var ibh=ls('ml2_input_bar_hidden')||{};
  if($('btn-ibar-emoji'))$('btn-ibar-emoji').style.display=ibh.emoji?'none':'';
  if($('btn-ibar-image'))$('btn-ibar-image').style.display=ibh.image?'none':'';
  if($('batch-btn'))$('batch-btn').style.display=ibh.batch?'none':'';
  if($('btn-ibar-continue'))$('btn-ibar-continue').style.display=ibh.continue?'none':'';
  if($('btn-send'))$('btn-send').style.display=ibh.send?'none':'';
}

function renderChatMorePanel(){
  var list=$('chat-more-list');
  if(!list)return;
  var html='';

  var enabledItems=customChatbarEnabled;
  if(!enabledItems||!Array.isArray(enabledItems)||enabledItems.length===0){
    enabledItems=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','search_chat','date_search','touch','decision','group_decision','divine','call','survey','letters','board','period','pomodoro','mood_cards_library','contact-profile','favorites','ta_highlights','star_cal','diary'];
  }
  var displayOrder=chatbarItems.map(function(item){return item.id});
  if(cid){
    var c=contacts.find(function(x){return x.id===cid});
    if(c&&c.chatbarEnabled&&Array.isArray(c.chatbarEnabled)){
      // 合并：确保新功能也出现在联系人定制列表中
      var defaults=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','search_chat','date_search','touch','redpacket','decision','group_decision','divine','call','survey','letters','moments','period','pomodoro','contact-profile','favorites','ta_highlights','chat_stats','star_music','star_cal','diary'];
      var merged=c.chatbarEnabled.slice();
      defaults.forEach(function(d){if(merged.indexOf(d)===-1)merged.push(d);});
      enabledItems=merged;
    }
    if(c&&c.chatbarOrder&&Array.isArray(c.chatbarOrder)){
      displayOrder=c.chatbarOrder;
    }
  }

  var categories={};
  displayOrder.forEach(function(itemId){
    var item=chatbarItems.find(function(x){return x.id===itemId});
    if(!item)return;
    if(item.category==='底部导航'||item.category==='其他')return;
    var isEnabled=enabledItems.indexOf(itemId)!==-1;
    if(!isEnabled)return;
    var cat=item.category||'其他';
    if(!categories[cat])categories[cat]=[];
    categories[cat].push(item);
  });

  var catNames=[];
  chatbarCategoryOrder.forEach(function(catName){
    var items=categories[catName];
    if(!items||items.length===0)return;
    catNames.push(catName);
  });
  // 收纳按钮也归入第一个分类
  var ibh=ls('ml2_input_bar_hidden')||{};
  var hiddenBtns=[];
  if(ibh.emoji)hiddenBtns.push({id:'emoji',name:'表情包',icon:'😄'});
  if(ibh.image)hiddenBtns.push({id:'image',name:'发送图片',icon:'🖼️'});
  if(ibh.batch)hiddenBtns.push({id:'batch',name:'批量发送',icon:'☰'});
  if(ibh.continue)hiddenBtns.push({id:'continue',name:'让对方继续说',icon:'…'});
  // ★ 收纳按钮归入"消息工具"分类（放最前面，用户要求）
  if(hiddenBtns.length>0&&!categories['消息工具'])categories['消息工具']=[];
  if(hiddenBtns.length>0){
    var _drawerItems=hiddenBtns.map(function(item){
      return {id:'drawer-'+item.id,name:item.name,icon:item.icon};
    });
    // 插入到消息工具分类最前面
    categories['消息工具']=_drawerItems.concat(categories['消息工具']||[]);
  }

  // 记忆当前选中分类（默认第一个）
  if(window._chatMoreActiveCat===undefined||catNames.indexOf(window._chatMoreActiveCat)===-1){
    window._chatMoreActiveCat=catNames[0]||'';
  }
  var activeCat=window._chatMoreActiveCat;

  // 渲染分类 tab
  var tabs=$('chat-more-tabs');
  if(tabs){
    var tabsHtml='';
    catNames.forEach(function(catName){
      tabsHtml+='<div class="chat-more-tab'+(catName===activeCat?' sel':'')+'" data-cat="'+catName.replace(/"/g,'&quot;')+'">'+catName+'</div>';
    });
    // ★ 独立「设置」按钮：不属于任何分类，固定在 tab 行最右侧
    tabsHtml+='<div class="chat-more-settings-tab" data-action="settings" style="margin-left:auto;flex-shrink:0;padding:6px 12px;border-radius:16px;font-size:13px;color:var(--txt2);background:var(--c2);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;transition:all .2s;">⚙️ 设置</div>';
    tabs.innerHTML=tabsHtml;
    // 设置按钮点击
    var st=tabs.querySelector('.chat-more-settings-tab');
    if(st){
      st.addEventListener('click',function(){
        hideOv('ov-chat-more');
        showPg('pg-my');
      });
    }
  }

  // 渲染当前分类内容
  html='';
  var customIcons=getCustomIcons();
  if(activeCat){
    var items=categories[activeCat]||[];
    html+='<div class="chat-more-category">';
    html+='<div class="chat-more-cat-title">'+activeCat+'</div>';
    html+='<div class="chat-more-cat-items">';
    items.forEach(function(item){
      var iconHtml=customIcons[item.id]
        ? '<img src="'+customIcons[item.id]+'" style="width:36px;height:36px;object-fit:contain;border-radius:4px;">'
        : '<span class="chat-more-icon">'+item.icon+'</span>';
      html+='<div class="chat-more-item" data-action="'+item.id+'">';
      html+='<div class="chat-more-icon-wrap">'+iconHtml+'</div>';
      html+='<span class="chat-more-label">'+item.name+'</span>';
      html+='</div>';
    });
    html+='</div></div>';
  }
  if(html){list.innerHTML=html;}

  // tab 点击切换分类
  if(tabs){
    tabs.querySelectorAll('.chat-more-tab').forEach(function(tab){
      tab.addEventListener('click',function(){
        window._chatMoreActiveCat=tab.getAttribute('data-cat');
        renderChatMorePanel();
      });
    });
  }
}

var _emojiClicked=false;

function toggleChatEmoji(){
  if(_emojiClicked)return;
  _emojiClicked=true;
  setTimeout(function(){_emojiClicked=false},300);
  var emojiOv=$('ov-emoji');if(emojiOv&&emojiOv.classList.contains('show')){
    hideOv('ov-emoji');
    var activeTab=document.querySelector('.emoji-tab.sel');
    if(activeTab)ls('last_emoji_tab',activeTab.dataset.tab);
  }else{
    hideOv('ov-chat-more');
    var lastTab=ls('last_emoji_tab')||'public';
    renderEmojiPanel(lastTab);
  }
}

function handleChatMoreAction(action){
  hideOv('ov-chat-more');
  try{
    switch(action){
      case 'image':
        var inp=$('chat-image-input');
        if(inp)inp.click();
        break;
      case 'cards':
        openCardSettings();
        break;
      case 'topbar_cards':
        openContactTopbarSettings();
        break;
      case 'decision':
        showDecisionModal().catch(function(e){console.error(e);toast('打开失败')});
        break;
      case 'group_decision':
        showGroupDecisionModal().catch(function(e){console.error(e);toast('打开失败')});
        break;
      case 'divine':
        d2ShowDivination('half');
        break;
      case 'call':
        initiateCall();
        break;
      case 'star_music':
        starMusicReturnPage=currentPage||'pg-more';
        showPg('pg-star-music');
        renderStarMusicPage();
        break;
      case 'giftbox':
        showGiftBox(cid||'');
        break;
      case 'survey':
        openSurveyModal('half');
        break;
      case 'search':
        showSearchChatModal();
        break;
      case 'search_chat':
        showSearchChatModal();
        break;
      case 'date_search':
        showDateSearchModal();
        break;
      case 'favorites':
        showTAFavorites();
        break;
      case 'copy_msg':
        showCopyMsg();
        break;
      case 'fav_msg':
        showFavMsgModal();
        break;
      case 'my_favs':
        showMyFavs();
        break;
      case 'ta_highlights':
        showTAHighlights();
        break;
      case 'chat_stats':
        showChatStatsHalf();
        break;
      case 'long_screenshot':
        showLongScreenshot();
        break;
      case 'letters':
        showPg('pg-letters');
        switchEnvTab('partner');
        break;
      case 'board':
        showPg('pg-board');
        renderBoard();
        break;
      case 'chat_list':
        showPg('pg-list');
        break;
      case 'moments':
        if($('msg-inp'))$('msg-inp').blur();
        showPg('pg-moments');
        requestAnimationFrame(function(){renderMoments()});
        break;
      case 'period':
        showPg('pg-period');
        renderPeriod();
        break;
      case 'pomodoro':
        showPomodoro();
        break;
      case 'mood_cards_library':
        openMoodCardsSettings();
        break;
      case 'settings':
        showPg('pg-my');
        break;
      case 'touch':
        if(cid){
          if(window.currentConvType==='group'){
            showGroupTouchMemberSelect(cid);
          }else{
            showChatTouchMenu(cid);
          }
        }
        break;
      case 'redpacket':
        if(cid)showRedPacketModal(cid);
        break;
      case 'contact-profile':
        if(cid)showContactProfile(cid);
        break;
      case 'star_cal':
        showStarCal(cid);
        break;
      case 'diary':
        showPg('pg-dream');
        renderDreamList();
        break;
      // 收纳按钮：从更多功能中直接触发隐藏的输入栏按钮
      case 'drawer-emoji':
        toggleChatEmoji();
        break;
      case 'drawer-image':
        $('chat-image-input').click();
        break;
      case 'drawer-batch':
        toggleBatchMode();
        break;
      case 'drawer-continue':
        simulateReply();
        break;
      case 'drawer-send':
        sendMsg();
        break;
    }
  }catch(e){
    console.error('handleChatMoreAction error:',e);
    toast('操作失败');
  }
}

function loadChatbarSettings(){
  if(!customChatbarEnabled)customChatbarEnabled=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','settings','search_chat','date_search','touch','decision','group_decision','divine','call','survey','letters','moments','period','pomodoro','contact-profile','favorites','ta_highlights','chat_stats','star_music','star_cal','diary'];
  var saved=ls('ml2_custom_chatbar');
  if(saved&&Array.isArray(saved)&&saved.length>0){
    // 合并：把新增的默认功能添加到已保存的配置中
    var defaults=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','settings','search_chat','date_search','touch','decision','group_decision','divine','call','survey','letters','moments','period','pomodoro','contact-profile','favorites','ta_highlights','chat_stats','star_music','star_cal','diary'];
    var merged=saved.slice();
    defaults.forEach(function(d){if(merged.indexOf(d)===-1)merged.push(d);});
    customChatbarEnabled=merged;
    ls('ml2_custom_chatbar',merged);
  }
  renderChatMorePanel();
}
async function loadChatbarSettingsAsync(){
  if(window.localforage){
    try{
      var saved=await window.localforage.getItem('ml2_custom_chatbar');
      if(saved&&Array.isArray(saved)&&saved.length>0){
        var defaults=['image','copy_msg','long_screenshot','fav_msg','my_favs','cards','topbar_cards','settings','search_chat','date_search','touch','decision','group_decision','divine','call','survey','letters','moments','period','pomodoro','contact-profile','favorites','ta_highlights','chat_stats','star_music','star_cal','diary'];
        var merged=saved.slice();
        defaults.forEach(function(d){if(merged.indexOf(d)===-1)merged.push(d);});
        customChatbarEnabled=merged;
        ls('ml2_custom_chatbar',merged);
        if(window.localforage)window.localforage.setItem('ml2_custom_chatbar',merged);
        memoryCache['ml2_custom_chatbar']=merged;
      }
    }catch(e){}
  }
  renderChatMorePanel();
}
loadChatbarSettings();
checkTAHighlightsDaily();
loadStarMusicData();
setupChatMusicFloatDrag();
loadStarCalData();
loadTAFavorites();
loadTAFavoritesSettings();

// ---------- Custom Icons ----------
function getCustomIcons(){
  var saved=ls('ml2_custom_icons');
  return saved||{};
}

function saveCustomIcons(icons){
  ls('ml2_custom_icons',icons);
  // 同步到 IndexedDB 防止数据丢失
  if(window.localforage){
    window.localforage.setItem('ml2_custom_icons',icons).catch(function(e){console.warn('saveCustomIcons to localforage failed:',e)});
  }
}

function renderCustomIconsPage(){
  var list=$('custom-icons-list');
  if(!list)return;
  var customIcons=getCustomIcons();
  var html='';
  
  var grouped={};
  chatbarItems.forEach(function(item){
    if(!grouped[item.category])grouped[item.category]=[];
    grouped[item.category].push(item);
  });
  
  chatbarCategoryOrder.forEach(function(catName){
    var items=grouped[catName];
    if(!items||items.length===0)return;
    html+='<div style="margin-bottom:16px;">';
    html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;padding-left:4px;">'+catName+'</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;">';
    items.forEach(function(item){
      var hasCustom=customIcons[item.id];
      var iconHtml=hasCustom
        ? '<img src="'+customIcons[item.id]+'" style="width:48px;height:48px;border-radius:10px;object-fit:contain;background:var(--c1);">'
        : '<span style="font-size:28px;">'+item.icon+'</span>';
      html+='<div class="custom-icon-row" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--c2);border-radius:12px;">';
      html+='<div style="width:52px;height:52px;border-radius:12px;background:var(--c1);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+iconHtml+'</div>';
      html+='<div style="flex:1;"><div style="font-size:14px;font-weight:500;color:var(--txt);">'+item.name+'</div><div style="font-size:11px;color:var(--txt3);">'+item.category+'</div></div>';
      html+='<div style="display:flex;gap:6px;flex-shrink:0;">';
      html+='<label style="padding:6px 12px;border-radius:8px;background:var(--c1);border:1px solid var(--border);font-size:12px;color:var(--txt2);cursor:pointer;text-align:center;">上传<input type="file" accept="image/*" data-icon-id="'+item.id+'" onchange="handleCustomIconUpload(this)" style="display:none;"></label>';
      if(hasCustom){
        html+='<button onclick="removeCustomIcon(\''+item.id+'\')" style="padding:6px 10px;border-radius:8px;border:1px solid #ff4d4f;background:var(--c1);color:#ff4d4f;font-size:12px;cursor:pointer;">清除</button>';
      }
      html+='</div></div>';
    });
    html+='</div></div>';
  });
  list.innerHTML=html;
}

function handleCustomIconUpload(input){
  var file=input.files[0];
  if(!file)return;
  var iconId=input.getAttribute('data-icon-id');
  if(!iconId)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var dataUrl=e.target.result;
    var customIcons=getCustomIcons();
    customIcons[iconId]=dataUrl;
    saveCustomIcons(customIcons);
    renderCustomIconsPage();
    renderChatMorePanel();
    if(iconId==='chat'||iconId==='moments'||iconId==='more'||iconId==='settings'){
      tabsInitialized=false;
      initTabs();
    }
    toast('图标已更新');
  };
  reader.readAsDataURL(file);
}

function removeCustomIcon(iconId){
  var customIcons=getCustomIcons();
  delete customIcons[iconId];
  saveCustomIcons(customIcons);
  renderCustomIconsPage();
  renderChatMorePanel();
  if(iconId==='chat'||iconId==='moments'||iconId==='more'||iconId==='settings'){
    tabsInitialized=false;
    initTabs();
  }
  toast('已恢复默认图标');
}

function resetAllCustomIcons(){
  ls('ml2_custom_icons',{});
  renderCustomIconsPage();
  renderChatMorePanel();
  tabsInitialized=false;
  initTabs();
  toast('所有图标已恢复默认');
}

function exportCustomIcons(){
  var customIcons=getCustomIcons();
  var blob=new Blob([JSON.stringify(customIcons,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='custom_icons_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('图标数据已导出');
}

function importCustomIcons(file){
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(typeof data==='object'&&data!==null){
        saveCustomIcons(data);
        renderCustomIconsPage();
        renderChatMorePanel();
        toast('图标数据已导入');
      }else{
        toast('无效的图标数据文件');
      }
    }catch(ex){
      toast('解析失败，请检查文件格式');
    }
  };
  reader.readAsText(file);
}

// Bind custom icons page events
if($('custom-icons-back'))$('custom-icons-back').addEventListener('click',function(){showPg('pg-my')});
if($('custom-icons-btn'))$('custom-icons-btn').addEventListener('click',function(){showPg('pg-custom-icons');renderCustomIconsPage()});
if($('custom-icons-reset-btn'))$('custom-icons-reset-btn').addEventListener('click',resetAllCustomIcons);
if($('custom-icons-export-btn'))$('custom-icons-export-btn').addEventListener('click',exportCustomIcons);
if($('custom-icons-import-input'))$('custom-icons-import-input').addEventListener('change',function(){if(this.files[0])importCustomIcons(this.files[0]);this.value=''});

// ---------- Storage Space ----------
function formatSize(bytes){
  if(!bytes||bytes<0)bytes=0;
  if(bytes<1024)return bytes+' B';
  if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
  if(bytes<1024*1024*1024)return (bytes/(1024*1024)).toFixed(2)+' MB';
  return (bytes/(1024*1024*1024)).toFixed(2)+' GB';
}

// 存储空间分类定义
var STORAGE_CATEGORIES=[
  {id:'chat',icon:'💬',name:'聊天记录',desc:'会话消息、图片、语音、非即时消息'},
  {id:'contacts',icon:'👥',name:'联系人',desc:'联系人列表、群组、头像、个人资料、纪念日、时间轴、拍一拍隐藏昵称'},
  {id:'cards',icon:'📖',name:'字卡库',desc:'全局/会话/心意/情绪/意图字卡、拍一拍字卡、顶部栏字卡、默认通用字卡、字卡使用统计'},
  {id:'moments',icon:'📸',name:'朋友圈',desc:'动态、评论、点赞、通知'},
  {id:'letters',icon:'✉️',name:'信件',desc:'信件往来记录'},
  {id:'giftbox',icon:'🎁',name:'礼物盒',desc:'礼物记录、每日礼物状态'},
  {id:'divine',icon:'🔮',name:'占卜',desc:'占卜历史记录'},
  {id:'starcal',icon:'🗓️',name:'星言日历',desc:'日历留言数据'},
  {id:'music',icon:'🎵',name:'星音陪伴',desc:'音乐库、播放列表、播放历史、单曲数据'},
  {id:'call',icon:'📞',name:'通话',desc:'通话设置、通话历史、通话背景'},
  {id:'redpacket',icon:'🧧',name:'红包',desc:'红包钱包、红包记录、每日红包'},
  {id:'decision',icon:'🎲',name:'帮我决定',desc:'单人决定历史、多人决定历史与成员、决定设置'},
  {id:'survey',icon:'📝',name:'调查问卷',desc:'问卷记录、问卷时长、提前提交概率'},
  {id:'board',icon:'📋',name:'留言板',desc:'我的留言板消息'},
  {id:'diary',icon:'✍️',name:'记录',desc:'我的日记、经期记录'},
  {id:'pomodoro',icon:'🍅',name:'番茄钟',desc:'番茄钟状态、记录、设置、消息、背景'},
  {id:'favorites',icon:'⭐',name:'收藏与高亮',desc:'聊天收藏、我的收藏夹、TA收藏、TA高亮消息'},
  {id:'custom',icon:'🎨',name:'个性化',desc:'自定义图标、表情包、自定义回复、聊天栏布局、底部导航、联系人排序'},
  {id:'settings',icon:'⚙️',name:'设置',desc:'应用设置、导航状态、速度设置、输入栏隐藏、迁移标记、存储统计'},
  {id:'other',icon:'📦',name:'其他',desc:'未分类数据'}
];

function renderStorageBreakdown(){
  var list=$('storage-breakdown-list');
  if(!list)return;
  var html='';
  for(var i=0;i<STORAGE_CATEGORIES.length;i++){
    var c=STORAGE_CATEGORIES[i];
    html+='<div class="storage-item" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--c1);border-radius:12px;border:1px solid var(--border);">'+
      '<div style="width:40px;height:40px;border-radius:10px;background:var(--c2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">'+c.icon+'</div>'+
      '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:500;color:var(--txt);">'+c.name+'</div><div style="font-size:11px;color:var(--txt3);">'+c.desc+'</div></div>'+
      '<div id="storage-'+c.id+'-size" style="font-size:14px;font-weight:600;color:var(--txt);flex-shrink:0;">计算中...</div>'+
    '</div>';
  }
  list.innerHTML=html;
}

function categorizeStorageKey(actualKey){
  if(!actualKey)return 'other';
  var k=actualKey;
  // 聊天记录: 会话消息、消息图片/语音、非即时消息
  if(k.indexOf('ml2_m_')===0||k.indexOf('ml2_msg_')===0||
     k.indexOf('ml2_noninstant_msg_')===0||k.indexOf('ml2_messages_')===0){
    return 'chat';
  }
  // 联系人: 联系人列表、群组、头像、个人资料、时间轴、纪念日、联系人歌曲、拍一拍隐藏昵称
  if(k==='ml2_c'||k==='ml2_groups'||k==='ml2_p'||k==='ml2_p_avatar'||k==='ml2_p_cover'||
     k.indexOf('ml2_avatar_')===0||k.indexOf('ml2_myavatar_')===0||
     k.indexOf('ml2_avatar_lib_')===0||k.indexOf('ml2_avh_')===0||
     k.indexOf('ml2_timeline_')===0||k.indexOf('ml2_contact_anniversaries_')===0||
     k.indexOf('ml2_contact_songs_')===0||k.indexOf('ml2_hideTouchNames_')===0||
     k==='ml2_uids'||k.indexOf('ml2_custom_contact_order')===0){
    return 'contacts';
  }
  // 字卡库: 全局/会话字卡、心意/情绪/意图字卡、拍一拍字卡、顶部栏字卡、默认通用字卡、字卡使用统计
  if(k.indexOf('ml2_d_')===0||k.indexOf('ml2_card')===0||k==='ml2_global_cards'||
     k.indexOf('ml2_heart_card')===0||k.indexOf('ml2_mood_card')===0||
     k.indexOf('ml2_intent_cards')===0||k.indexOf('ml2_touch_cards')===0||
     k.indexOf('ml2_touch_groups')===0||k.indexOf('ml2_touch_group_cards')===0||
     k.indexOf('ml2_nav_cards')===0||k.indexOf('ml2_nav_card_groups')===0||
     k==='ml2_default_common_settings'||k.indexOf('ml2_custom_card_groups')===0||
     k.indexOf('ml2_card_usage')===0){
    return 'cards';
  }
  // 朋友圈: 动态、评论、点赞、通知
  if(k.indexOf('ml2_moments')===0||k.indexOf('ml2_like_')===0){
    return 'moments';
  }
  // 信件
  if(k.indexOf('ml2_letters')===0){
    return 'letters';
  }
  // 礼物盒
  if(k.indexOf('ml2_giftbox')===0||k.indexOf('ml2_gift_daily')===0||k.indexOf('ml2_custom_gifts')===0){
    return 'giftbox';
  }
  // 占卜
  if(k.indexOf('ml2_divine')===0){
    return 'divine';
  }
  // 星言日历
  if(k.indexOf('ml2_star_cal')===0){
    return 'starcal';
  }
  // 星音陪伴: 音乐库、播放列表、播放历史、单曲数据
  if(k.indexOf('ml2_star_music')===0){
    return 'music';
  }
  // 通话: 通话设置、通话历史、通话背景
  if(k.indexOf('ml2_call_')===0||k==='ml2_call_settings'||k==='ml2_call_history'){
    return 'call';
  }
  // 红包: 红包钱包、红包记录、每日红包
  if(k.indexOf('ml2_rp_')===0){
    return 'redpacket';
  }
  // 帮我决定: 单人决定、多人决定、决定设置
  if(k.indexOf('ml2_decision')===0||k.indexOf('ml2_group_decision')===0){
    return 'decision';
  }
  // 调查问卷: 问卷记录、问卷时长、提前提交概率
  if(k.indexOf('ml2_survey')===0){
    return 'survey';
  }
  // 留言板
  if(k.indexOf('ml2_board')===0){
    return 'board';
  }
  // 梦境日记: 梦境记录、经期记录
  if(k.indexOf('ml2_dream')===0||k.indexOf('ml2_period')===0){
    return 'diary';
  }
  // 番茄钟: 状态、记录、设置、消息、背景
  if(k.indexOf('ml2_pomodoro')===0){
    return 'pomodoro';
  }
  // 收藏与高亮: 聊天收藏、我的收藏夹、TA收藏、TA高亮消息
  if(k.indexOf('ml2_ta_favorites')===0||k.indexOf('ml2_ta_highlight')===0||
     k.indexOf('ml2_chat_favorites')===0||k.indexOf('ml2_my_favs')===0){
    return 'favorites';
  }
  // 个性化: 自定义图标、表情包、自定义回复、聊天栏布局、底部导航、联系人排序
  if(k.indexOf('ml2_custom_emoji')===0||k==='ml2_custom_replies'||
     k.indexOf('ml2_custom_chatbar')===0||k.indexOf('ml2_custom_icons')===0||
     k.indexOf('ml2_custom_bottomnav')===0||k.indexOf('ml2_emoji_pack')===0||
     k.indexOf('ml2_emoji_group')===0){
    return 'custom';
  }
  // 设置: 应用设置、导航状态、速度设置、输入栏隐藏、迁移标记、存储统计、非即时设置
  if(k==='ml2_settings'||k==='ml2_speed'||k.indexOf('ml2_nav')===0||
     k==='ml2_hide_bottom_nav'||k==='ml2_input_bar_hidden'||
     k==='ml2_storage_stats'||k.indexOf('ml2_migrated')===0||
     k==='ml2_noninstant_settings'){
    return 'settings';
  }
  return 'other';
}

var _storageStatsRunning=false;
var _storageStatsCache=null; // 缓存上一次统计结果，实现即时显示
function refreshStorageStats(){
  // 并发保护：防止多个 refreshStorageStats 同时执行导致页面卡顿
  if(_storageStatsRunning)return;
  _storageStatsRunning=true;

  // 确保明细列表已渲染
  renderStorageBreakdown();

  // 如果有缓存，先立即显示缓存结果
  if(_storageStatsCache){
    for(var ci2=0;ci2<STORAGE_CATEGORIES.length;ci2++){
      var cid2=STORAGE_CATEGORIES[ci2].id;
      var cEl2=$('storage-'+cid2+'-size');
      if(cEl2)cEl2.textContent=formatSize(_storageStatsCache.categories[cid2]);
    }
    if($('storage-total-used'))$('storage-total-used').textContent=formatSize(_storageStatsCache.total);
    if($('storage-total-quota'))$('storage-total-quota').textContent=_storageStatsCache.quota?formatSize(_storageStatsCache.quota):'(浏览器不支持配额查询)';
    if($('storage-usage-bar'))$('storage-usage-bar').style.width=Math.min(_storageStatsCache.percent,100).toFixed(1)+'%';
    if($('storage-usage-percent'))$('storage-usage-percent').textContent='已用 '+(_storageStatsCache.percent||0).toFixed(1)+'%';
  }

  var categories={};
  for(var ci=0;ci<STORAGE_CATEGORIES.length;ci++){
    categories[STORAGE_CATEGORIES[ci].id]=0;
  }
  var totalLS=0;
  var lsKeySizes={};

  // 1. 同步计算 localStorage（快）
  try{
    for(var i=0;i<localStorage.length;i++){
      var lk=localStorage.key(i);
      if(!lk)continue;
      var val=localStorage.getItem(lk);
      var size=val?val.length*2:0;
      if(size<=0)continue;
      var actualKey=lk;
      if(lk.indexOf('ml2_lf_')===0)actualKey=lk.substring(7);
      if(actualKey.indexOf('ml2_')!==0)continue;
      if(lsKeySizes.hasOwnProperty(actualKey)){
        if(size>lsKeySizes[actualKey]){
          var oldSize=lsKeySizes[actualKey];
          var oldCat=categorizeStorageKey(actualKey);
          categories[oldCat]-=oldSize;
          totalLS-=oldSize;
          lsKeySizes[actualKey]=size;
          categories[oldCat]+=size;
          totalLS+=size;
        }
      }else{
        lsKeySizes[actualKey]=size;
        var cat=categorizeStorageKey(actualKey);
        categories[cat]+=size;
        totalLS+=size;
      }
    }
  }catch(e){}

  // 2. 立即用 localStorage 数据显示明细
  for(var di=0;di<STORAGE_CATEGORIES.length;di++){
    var did=STORAGE_CATEGORIES[di].id;
    var dEl=$('storage-'+did+'-size');
    if(dEl)dEl.textContent=formatSize(categories[did]);
  }

  // 3. 用 navigator.storage.estimate() 获取真实总用量（瞬时返回）
  if(navigator.storage&&navigator.storage.estimate){
    navigator.storage.estimate().then(function(est){
      var totalUsed=totalLS;
      var quota=0;
      if(est&&est.usage){
        totalUsed=est.usage;
        quota=est.quota||0;
      }

      // 立即显示真实总用量（这是浏览器报告的准确值）
      if($('storage-total-used'))$('storage-total-used').textContent=formatSize(totalUsed);
      if($('storage-total-quota'))$('storage-total-quota').textContent=quota?formatSize(quota):'(浏览器不支持配额查询)';
      var pct=quota?(totalUsed/quota*100):0;
      if($('storage-usage-bar'))$('storage-usage-bar').style.width=Math.min(pct,100).toFixed(1)+'%';
      if($('storage-usage-percent'))$('storage-usage-percent').textContent='已用 '+pct.toFixed(1)+'%';

      // 4. 快速估算 IndexedDB 明细（仅枚举 key，不读取 value）
      fastEstimateIndexedDB(lsKeySizes,categories,totalLS,totalUsed).then(function(result){
        for(var fi=0;fi<STORAGE_CATEGORIES.length;fi++){
          var fid=STORAGE_CATEGORIES[fi].id;
          var fEl=$('storage-'+fid+'-size');
          if(fEl)fEl.textContent=formatSize(result.categories[fid]);
        }
        // 缓存结果
        _storageStatsCache={
          categories:result.categories,
          total:totalUsed,
          quota:quota,
          percent:pct
        };
        _storageStatsRunning=false;
      }).catch(function(){_storageStatsRunning=false;});
    }).catch(function(){
      if($('storage-total-used'))$('storage-total-used').textContent=formatSize(totalLS);
      _storageStatsRunning=false;
    });
  }else{
    if($('storage-total-used'))$('storage-total-used').textContent=formatSize(totalLS);
    _storageStatsRunning=false;
  }
}

// 快速估算 IndexedDB：仅枚举 key 名称进行分类计数，不读取 value，避免逐条 getItem 阻塞
async function fastEstimateIndexedDB(lsKeySizes,lsCategories,totalLS,totalUsed){
  var categories={};
  for(var ci=0;ci<STORAGE_CATEGORIES.length;ci++){
    categories[STORAGE_CATEGORIES[ci].id]=lsCategories[STORAGE_CATEGORIES[ci].id]||0;
  }

  if(!window.localforage){
    return {categories:categories,total:totalLS};
  }

  try{
    var keys=await window.localforage.keys();

    // 统计每个分类在 IndexedDB 中的 key 数量
    var idbKeyCounts={};
    var idbTotalKeys=0;

    for(var i=0;i<keys.length;i++){
      var k=keys[i];
      if(!k)continue;
      if(k.indexOf('localforage')===0||k==='_version'||k==='_length')continue;
      // 跳过已在 localStorage 统计过的 key
      if(lsKeySizes.hasOwnProperty(k))continue;

      var cat=categorizeStorageKey(k);
      if(!idbKeyCounts[cat])idbKeyCounts[cat]=0;
      idbKeyCounts[cat]++;
      idbTotalKeys++;
    }

    // IndexedDB 总大小 ≈ 浏览器报告总用量 - localStorage 总量
    var idbTotal=Math.max(0,totalUsed-totalLS);

    if(idbTotalKeys===0||idbTotal===0){
      return {categories:categories,total:totalLS};
    }

    // 按分类加权估算：不同分类的 key 平均大小差异很大
    var categoryWeights={
      chat:8,contacts:5,cards:3,moments:4,letters:2,
      giftbox:1,divine:1,starcal:2,music:6,call:3,
      redpacket:1,decision:1,survey:1,board:1,diary:2,
      pomodoro:1,favorites:2,custom:3,settings:1,other:2
    };

    var totalWeight=0;
    for(var cat in idbKeyCounts){
      var w=categoryWeights[cat]||1;
      totalWeight+=idbKeyCounts[cat]*w;
    }

    if(totalWeight>0){
      for(var cat2 in idbKeyCounts){
        var w2=categoryWeights[cat2]||1;
        var estSize=Math.round(idbTotal*(idbKeyCounts[cat2]*w2)/totalWeight);
        categories[cat2]+=estSize;
      }
    }

    return {categories:categories,total:totalUsed};
  }catch(e){
    return {categories:categories,total:totalLS};
  }
}

// Bind storage space page events
if($('storage-space-btn'))$('storage-space-btn').addEventListener('click',function(){showPg('pg-storage');refreshStorageStats()});
if($('storage-back'))$('storage-back').addEventListener('click',function(){showPg('pg-my')});
// 修复：为存储按钮添加 addEventListener 事件绑定作为双重保障，防止 inline onclick 失效
if($('storage-refresh-btn'))$('storage-refresh-btn').addEventListener('click',function(){try{refreshStorageStats();toast('✓ 统计已刷新');}catch(e){console.error('refreshStorageStats error:',e);toast('刷新失败: '+(e.message||'未知错误'));}});
if($('storage-request-quota-btn'))$('storage-request-quota-btn').addEventListener('click',function(){try{requestMoreStorage();}catch(e){console.error('requestMoreStorage error:',e);toast('操作失败: '+(e.message||'未知错误'));}});
if($('storage-release-memory-btn'))$('storage-release-memory-btn').addEventListener('click',function(){try{releaseErrorMemory();}catch(e){console.error('releaseErrorMemory error:',e);toast('清理失败: '+(e.message||'未知错误'));}});
if($('storage-clean-orphan-btn'))$('storage-clean-orphan-btn').addEventListener('click',function(){
  try{
    customConfirm('将扫描并删除聊天记录中已不存在的图片/语音数据（孤儿数据），可释放大量空间。不会删除你的聊天记录本身。确定继续？').then(function(ok){
      if(!ok)return;
      toast('正在扫描并清理...');
      cleanupOrphanMedia().then(function(res){
        var el=$('storage-release-result');
        if(el){el.style.display='block';el.textContent='已扫描 '+res.checked+' 项，删除 '+res.removed+' 个孤儿数据，释放约 '+(res.freed/1048576).toFixed(1)+' MB';}
      });
    });
  }catch(e){console.error('cleanup orphan error:',e);toast('清理失败: '+(e.message||'未知错误'));}
});

