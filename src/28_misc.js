<script>
// 情绪分组权重弹窗关闭按钮事件
if($('mood-card-help-close'))$('mood-card-help-close').addEventListener('click',closeMoodCardHelp);
if($('mood-card-help-modal'))$('mood-card-help-modal').addEventListener('click',function(e){
  if(e.target===$('mood-card-help-modal'))closeMoodCardHelp();
});

// ===== 生理周期功能 =====
(function() {
  'use strict';

  var PERIOD_STORAGE_KEY = 'ml2_period_records';
  var PERIOD_LF_KEY = 'ml2_period_records_lf';

  function pGetRecords() {
    try {
      var raw = ls(PERIOD_STORAGE_KEY);
      if (!raw) {
        try {
          var lfVal = safeGetItem(PERIOD_LF_KEY);
          if(lfVal) raw = lfVal;
        } catch(e) {}
      }
      if (!raw) return [];
      if (!Array.isArray(raw)) return [];
      return raw.filter(function(r) { return r && r.start; }).map(function(r) {
        if (!r.details) r.details = {};
        return r;
      }).sort(function(a, b) { return new Date(a.start) - new Date(b.start); });
    } catch (e) { return []; }
  }

  function pSaveRecords(records) {
    try {
      ls(PERIOD_STORAGE_KEY, records);
      return true;
    }
    catch (e) { return false; }
  }

  function pFmtYMD(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function pFmtDisplay(d) {
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
  }
  function pTodayStr() { return pFmtYMD(new Date()); }
  function pTodayDate() { var d = new Date(); d.setHours(0,0,0,0); return d; }
  function pDaysBetween(a, b) {
    var da = new Date(a), db = new Date(b);
    da.setHours(0,0,0,0); db.setHours(0,0,0,0);
    return Math.round((da - db) / 86400000);
  }
  function pAddDays(d, n) { var nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; }

  function pGetDayDetail(dateStr, records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var start = r.start;
      var end = r.end || r.start;
      if (dateStr >= start && dateStr <= end) {
        return (r.details && r.details[dateStr]) ? r.details[dateStr] : { amount: '中', pain: '无' };
      }
    }
    return null;
  }

  function pSetDayDetail(dateStr, amount, pain, records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (dateStr >= r.start && dateStr <= (r.end || r.start)) {
        if (!r.details) r.details = {};
        r.details[dateStr] = { amount: amount, pain: pain };
        return pSaveRecords(records);
      }
    }
    return false;
  }

  function pIsPeriodDay(dateStr, records) {
    return records.some(function(r) { return dateStr >= r.start && dateStr <= (r.end || r.start); });
  }

  function pGetPeriodDaysForMonth(year, month, records) {
    var s = new Set();
    var first = new Date(year, month, 1);
    var last = new Date(year, month+1, 0);
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var rs = new Date(r.start), re = new Date(r.end || r.start);
      var cur = rs < first ? new Date(first) : new Date(rs);
      var end = re > last ? new Date(last) : new Date(re);
      while (cur <= end) { s.add(pFmtYMD(cur)); cur.setDate(cur.getDate()+1); }
    }
    return s;
  }

  function pGetDetailDaysForMonth(year, month, records) {
    var s = new Set();
    var first = new Date(year, month, 1);
    var last = new Date(year, month+1, 0);
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (!r.details) continue;
      var keys = Object.keys(r.details);
      for (var j = 0; j < keys.length; j++) {
        var d = keys[j];
        var dt = new Date(d);
        if (dt >= first && dt <= last) s.add(d);
      }
    }
    return s;
  }

  function pCalcCycles(records) {
    var cycles = [];
    for (var i = 1; i < records.length; i++) {
      var d = pDaysBetween(records[i].start, records[i-1].start);
      if (d >= 21 && d <= 45) cycles.push(d);
    }
    return cycles;
  }

  function pAvgCycle(records) {
    var cycles = pCalcCycles(records);
    if (!cycles.length) return null;
    var recent = cycles.slice(-3);
    return Math.round(recent.reduce(function(a,b){return a+b},0) / recent.length);
  }

  function pAvgDuration(records) {
    if (!records.length) return null;
    var durs = records.map(function(r) { return pDaysBetween(r.end || r.start, r.start) + 1; });
    return Math.round(durs.reduce(function(a,b){return a+b},0) / durs.length);
  }

  function pAvgDetails(records) {
    var am = { '少':1, '中':2, '多':3 };
    var pm = { '无':0, '轻':1, '中':2, '重':3 };
    var av = [], pv = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (!r.details) continue;
      var keys = Object.keys(r.details);
      for (var j = 0; j < keys.length; j++) {
        var dt = r.details[keys[j]];
        if (dt.amount) av.push(am[dt.amount]||2);
        if (dt.pain) pv.push(pm[dt.pain]||0);
      }
    }
    var ra = { 1:'少', 2:'中', 3:'多' };
    var rp = { 0:'无', 1:'轻', 2:'中', 3:'重' };
    return {
      amount: av.length ? ra[Math.round(av.reduce(function(a,b){return a+b},0)/av.length)] : null,
      pain: pv.length ? rp[Math.round(pv.reduce(function(a,b){return a+b},0)/pv.length)] : null
    };
  }

  function pPredictNext(records) {
    if (!records.length) return null;
    var avg = pAvgCycle(records);
    if (!avg) avg = 28;
    if (avg < 21 || avg > 45) avg = 28;
    var lastStart = new Date(records[records.length-1].start);
    lastStart.setHours(0,0,0,0);
    var nextTs = lastStart.getTime() + avg * 86400000;
    var next = new Date(nextTs);
    var today = pTodayDate();
    if (next.getTime() <= today.getTime()) {
      nextTs += avg * 86400000;
      next = new Date(nextTs);
    }
    return next;
  }

  var pToastTimer = null;
  function pShowToast(msg) {
    var el = document.getElementById('periodToast');
    if (!el) return;
    if (pToastTimer) { clearTimeout(pToastTimer); pToastTimer = null; }
    el.textContent = msg;
    el.className = 'period-toast';
    void el.offsetWidth;
    el.classList.add('show');
    pToastTimer = setTimeout(function() { el.classList.remove('show'); pToastTimer = null; }, 2200);
  }

  var pCurrentYear = new Date().getFullYear();
  var pCurrentMonth = new Date().getMonth();
  var pModalTargetDate = null;

  function pRenderAll() {
    var records = pGetRecords();
    pRenderCalendar(records);
    pRenderHistory(records);
    pRenderStats(records);
    pRenderStatus(records);
    pUpdateFormHint();
  }

  function pRenderCalendar(records) {
    var grid = document.getElementById('periodCalendarGrid');
    var label = document.getElementById('periodMonthLabel');
    if (!grid || !label) return;
    var first = new Date(pCurrentYear, pCurrentMonth, 1);
    var daysInMonth = new Date(pCurrentYear, pCurrentMonth+1, 0).getDate();
    var startWd = first.getDay();
    var periodSet = pGetPeriodDaysForMonth(pCurrentYear, pCurrentMonth, records);
    var detailSet = pGetDetailDaysForMonth(pCurrentYear, pCurrentMonth, records);
    var today = pTodayStr();

    var wds = ['日','一','二','三','四','五','六'];
    var h = '';
    for (var w = 0; w < wds.length; w++) h += '<div class="period-wd">'+wds[w]+'</div>';

    for (var i = 0; i < startWd; i++) {
      var d = new Date(pCurrentYear, pCurrentMonth, 1 - startWd + i);
      h += '<div class="period-day other">'+d.getDate()+'</div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = pFmtYMD(new Date(pCurrentYear, pCurrentMonth, d));
      var isToday = dateStr === today;
      var isPeriod = periodSet.has(dateStr);
      var hasDetail = detailSet.has(dateStr);

      var cls = 'period-day';
      if (isPeriod) cls += ' period';
      if (isToday) cls += ' today';

      h += '<button class="'+cls+'" data-date="'+dateStr+'">'+d+'<span class="period-detail-dot'+(hasDetail?' show':'')+'"></span></button>';
    }

    var total = startWd + daysInMonth;
    var rem = (7 - (total % 7)) % 7;
    for (var i = 1; i <= rem; i++) {
      var d = new Date(pCurrentYear, pCurrentMonth+1, i);
      h += '<div class="period-day other">'+d.getDate()+'</div>';
    }

    grid.innerHTML = h;
    label.textContent = pCurrentYear + '年' + (pCurrentMonth+1) + '月';

    var dayEls = grid.querySelectorAll('.period-day[data-date]');
    for (var i = 0; i < dayEls.length; i++) {
      dayEls[i].addEventListener('click', function() {
        pOpenDetailModal(this.dataset.date);
      });
    }
  }

  function pRenderHistory(records) {
    var badge = document.getElementById('periodHistoryBadge');
    var list = document.getElementById('periodHistoryList');
    if (!badge || !list) return;
    badge.textContent = records.length + ' 条';
    if (!records.length) {
      list.innerHTML = '<div class="period-empty-state"><span class="period-icon">📭</span><div class="period-text">还没有记录</div><div class="period-sub">快开始记录你的经期吧</div></div>';
      return;
    }
    var rev = [].concat(records).reverse();
    var h = '';
    for (var i = 0; i < rev.length; i++) {
      var r = rev[i];
      var idx = records.length - 1 - i;
      var startDisp = pFmtDisplay(new Date(r.start));
      var endDisp = r.end ? pFmtDisplay(new Date(r.end)) : '单日';
      var cycleText = i < rev.length-1 ? pDaysBetween(r.start, rev[i+1].start)+'天' : '--';
      var detailCount = r.details ? Object.keys(r.details).length : 0;
      var avgAmount = '--', avgPain = '--';
      if (r.details) {
        var am = { '少':1, '中':2, '多':3 };
        var pm = { '无':0, '轻':1, '中':2, '重':3 };
        var av = [], pv = [];
        var keys = Object.keys(r.details);
        for (var k = 0; k < keys.length; k++) {
          var dt = r.details[keys[k]];
          if (dt.amount) av.push(am[dt.amount]||2);
          if (dt.pain) pv.push(pm[dt.pain]||0);
        }
        var ra = { 1:'少', 2:'中', 3:'多' };
        var rp = { 0:'无', 1:'轻', 2:'中', 3:'重' };
        if (av.length) avgAmount = ra[Math.round(av.reduce(function(a,b){return a+b},0)/av.length)];
        if (pv.length) avgPain = rp[Math.round(pv.reduce(function(a,b){return a+b},0)/pv.length)];
      }
      h += '<div class="period-history-item">'+
        '<div class="period-info">'+
          '<div class="period-dates">'+startDisp+' <span class="period-arrow">→</span> '+endDisp+'</div>'+
          '<div class="period-meta"><span class="period-tag">周期 '+cycleText+'</span><span>📋 '+detailCount+' 天详情</span><span style="margin-left:4px;">🩸 '+avgAmount+'</span><span style="margin-left:4px;">😣 '+avgPain+'</span></div>'+
        '</div>'+
        '<div class="period-actions">'+
          '<button class="edit" data-idx="'+idx+'">✏️</button>'+
          '<button class="del" data-idx="'+idx+'">🗑</button>'+
        '</div>'+
      '</div>';
    }
    list.innerHTML = h;

    var delBtns = list.querySelectorAll('.del');
    for (var i = 0; i < delBtns.length; i++) {
      delBtns[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = +this.dataset.idx;
        if (isNaN(idx)) return;
        if (!confirm('确定删除此记录吗？')) return;
        var records = pGetRecords();
        if (idx >= 0 && idx < records.length) {
          records.splice(idx, 1);
          pSaveRecords(records);
          pShowToast('已删除');
          pRenderAll();
        }
      });
    }
    var editBtns = list.querySelectorAll('.edit');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = +this.dataset.idx;
        if (isNaN(idx)) return;
        var records = pGetRecords();
        if (idx >= 0 && idx < records.length) {
          var r = records[idx];
          var sd = document.getElementById('periodStartDate');
          var ed = document.getElementById('periodEndDate');
          var addSec = document.getElementById('periodAddSection');
          if (sd) sd.value = r.start;
          if (ed) ed.value = r.end || '';
          records.splice(idx, 1);
          pSaveRecords(records);
          if (addSec) addSec.style.display = 'block';
          pRenderAll();
          pShowToast('已加载到表单，修改后保存');
          if (sd) sd.focus();
        }
      });
    }
  }

  function pRenderStats(records) {
    var ac = pAvgCycle(records);
    var ad = pAvgDuration(records);
    var det = pAvgDetails(records);
    var elCycle = document.getElementById('periodStatCycle');
    var elDuration = document.getElementById('periodStatDuration');
    var elAmount = document.getElementById('periodStatAmount');
    var elPain = document.getElementById('periodStatPain');
    // 只有一条记录时使用默认28天周期
    if (ac === null && records.length >= 1) ac = 28;
    if (elCycle) elCycle.innerHTML = ac !== null ? ac + ' <span class="period-unit">天</span>' : '-- <span class="period-unit">天</span>';
    if (elDuration) elDuration.innerHTML = ad !== null ? ad + ' <span class="period-unit">天</span>' : '-- <span class="period-unit">天</span>';
    if (elAmount) elAmount.textContent = det.amount || '--';
    if (elPain) elPain.textContent = det.pain || '--';
  }

  function pRenderStatus(records) {
    var today = pTodayStr();
    var todayO = pTodayDate();
    var inPeriod = pIsPeriodDay(today, records);
    var elDate = document.getElementById('periodTodayDate');
    var elLabel2 = document.getElementById('periodStatusLabel2');
    var elNextDays = document.getElementById('periodNextDays');
    var elNextInfo = document.getElementById('periodNextInfo');
    var elPredDate = document.getElementById('periodPredDate');
    var elPredLabel = document.getElementById('periodPredLabel');
    var elDot = document.getElementById('periodStatusDot');
    var elLabel = document.getElementById('periodStatusLabel');

    if (elDate) elDate.textContent = pFmtDisplay(todayO);

    if (inPeriod) {
      var dayCount = 1;
      var recs = pGetRecords();
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        var s = new Date(r.start), e = new Date(r.end || r.start);
        if (todayO >= s && todayO <= e) { dayCount = pDaysBetween(today, r.start) + 1; break; }
      }
      if (elLabel2) elLabel2.textContent = '经期第 ' + dayCount + ' 天';
      if (elDot) elDot.className = 'period-dot on';
      if (elLabel) elLabel.textContent = '经期中';
      var next = pPredictNext(records);
      if (next) {
        var days = pDaysBetween(next, todayO);
        if (elPredLabel) elPredLabel.textContent = '下次预测';
        if (elNextDays) elNextDays.textContent = days > 0 ? days : '0';
        if (elPredDate) elPredDate.textContent = '预计 ' + pFmtDisplay(next);
        if (elNextInfo) elNextInfo.style.display = 'block';
      } else {
        if (elPredLabel) elPredLabel.textContent = '预测下次';
        if (elNextDays) elNextDays.textContent = '--';
        if (elPredDate) elPredDate.textContent = '';
        if (elNextInfo) elNextInfo.style.display = 'block';
      }
    } else {
      var next = pPredictNext(records);
      if (next) {
        var days = pDaysBetween(next, todayO);
        if (days > 0) {
          if (elLabel2) elLabel2.textContent = '距离下次经期';
          if (elPredLabel) elPredLabel.textContent = '预测下次';
          if (elNextDays) elNextDays.textContent = days;
          if (elPredDate) elPredDate.textContent = '预计 ' + pFmtDisplay(next);
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot';
          if (elLabel) elLabel.textContent = '正常';
        } else if (days === 0) {
          if (elLabel2) elLabel2.textContent = '预计今天开始';
          if (elPredLabel) elPredLabel.textContent = '预测下次';
          if (elNextDays) elNextDays.textContent = '0';
          if (elPredDate) elPredDate.textContent = '就是今天';
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot on';
          if (elLabel) elLabel.textContent = '预测';
        } else {
          if (elLabel2) elLabel2.textContent = '已延迟 ' + Math.abs(days) + ' 天';
          if (elPredLabel) elPredLabel.textContent = '已延迟';
          if (elNextDays) elNextDays.textContent = Math.abs(days);
          if (elPredDate) elPredDate.textContent = '原预计 ' + pFmtDisplay(next);
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot';
          if (elLabel) elLabel.textContent = '延迟';
        }
      } else {
        if (elLabel2) elLabel2.textContent = '暂无预测';
        if (elPredLabel) elPredLabel.textContent = '预测下次';
        if (elNextDays) elNextDays.textContent = '--';
        if (elPredDate) elPredDate.textContent = '';
        if (elNextInfo) elNextInfo.style.display = 'block';
        if (elDot) elDot.className = 'period-dot';
        if (elLabel) elLabel.textContent = '无记录';
      }
    }
    if (!records.length) {
      if (elLabel2) elLabel2.textContent = '添加第一条记录';
      if (elPredLabel) elPredLabel.textContent = '预测下次';
      if (elNextDays) elNextDays.textContent = '--';
      if (elPredDate) elPredDate.textContent = '';
      if (elDot) elDot.className = 'period-dot';
      if (elLabel) elLabel.textContent = '无记录';
    }
  }

  function pUpdateFormHint() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    var hint = document.getElementById('periodFormHint');
    var saveBtn = document.getElementById('periodSaveBtn');
    if (!hint || !saveBtn || !sd) return;
    var s = sd.value, e = ed ? ed.value : '';
    if (s && e && e < s) {
      hint.textContent = '结束日期不能早于开始日期';
      hint.style.color = '#c06060';
      saveBtn.disabled = true;
    } else if (s) {
      hint.textContent = e ? pFmtDisplay(new Date(s)) + ' → ' + pFmtDisplay(new Date(e)) : pFmtDisplay(new Date(s)) + ' (单日)';
      hint.style.color = 'var(--period-text-mid)';
      saveBtn.disabled = false;
    } else {
      hint.textContent = '结束日期留空则只记录单日';
      hint.style.color = 'var(--period-text-sub)';
      saveBtn.disabled = true;
    }
  }

  function pOpenDetailModal(dateStr) {
    var records = pGetRecords();
    var detail = pGetDayDetail(dateStr, records);
    var today = pTodayStr();
    
    if (!detail) {
      if (dateStr === today) {
        var startInp = document.getElementById('periodStartDate');
        var addSec = document.getElementById('periodAddSection');
        if (startInp) startInp.value = dateStr;
        if (addSec) addSec.style.display = 'block';
        pShowToast('今日还没有记录，在下方添加');
        if (startInp) startInp.focus();
      } else {
        pShowToast('该日期不在经期记录中，请在下方添加记录');
      }
      return;
    }
    pModalTargetDate = dateStr;
    var sub = document.getElementById('periodModalSub');
    var amt = document.getElementById('periodModalAmount');
    var pain = document.getElementById('periodModalPain');
    var overlay = document.getElementById('periodModalOverlay');
    if (sub) sub.textContent = pFmtDisplay(new Date(dateStr));
    if (amt) amt.value = detail.amount || '中';
    if (pain) pain.value = detail.pain || '无';
    if (overlay) overlay.classList.add('open');
  }

  function pCloseModal() {
    var overlay = document.getElementById('periodModalOverlay');
    if (overlay) overlay.classList.remove('open');
    pModalTargetDate = null;
  }

  function pSaveModalDetail() {
    if (!pModalTargetDate) return;
    var amt = document.getElementById('periodModalAmount');
    var pain = document.getElementById('periodModalPain');
    var amount = amt ? amt.value : '中';
    var painVal = pain ? pain.value : '无';
    var records = pGetRecords();
    if (pSetDayDetail(pModalTargetDate, amount, painVal, records)) {
      pShowToast('详情已保存');
      pCloseModal();
      pRenderAll();
    } else {
      pShowToast('保存失败');
    }
  }

  function pAddRecord(start, end) {
    if (!start) return { ok: false, msg: '请选择开始日期' };
    end = end || '';
    if (end && end < start) return { ok: false, msg: '结束日期不能早于开始日期' };
    var records = pGetRecords();
    var startMatch = records.some(function(r) { return r.start === start; });
    if (startMatch) {
      return { ok: false, msg: '该日期已有记录' };
    }
    records.push({ start: start, end: end, details: {} });
    return pSaveRecords(records) ? { ok: true, msg: '记录保存成功' } : { ok: false, msg: '保存失败' };
  }

  function pHandleSave() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (!sd) return;
    var s = sd.value, e = ed ? ed.value : '';
    if (!s) { pShowToast('请选择开始日期'); return; }
    if (e && e < s) { pShowToast('结束日期不能早于开始日期'); return; }
    var r = pAddRecord(s, e);
    if (r.ok) {
      pShowToast(r.msg);
      sd.value = pFmtYMD(pAddDays(new Date(s), 1));
      if (ed) ed.value = '';
      pRenderAll();
    } else { pShowToast(r.msg); }
  }

  function pHandleQuickToday() {
    var today = pTodayStr();
    var records = pGetRecords();
    var inRange = records.some(function(r) { return today >= r.start && today <= (r.end||r.start); });
    if (!inRange) {
      var r = pAddRecord(today, '');
      if (!r.ok) { pShowToast(r.msg); return; }
      pShowToast('已创建今日记录');
      pRenderAll();
      setTimeout(function() { pOpenDetailModal(today); }, 300);
    } else {
      pOpenDetailModal(today);
    }
  }

  function pGoToToday() {
    var now = new Date();
    pCurrentYear = now.getFullYear();
    pCurrentMonth = now.getMonth();
    pRenderAll();
  }

  window.renderPeriod = function() {
    pCurrentYear = new Date().getFullYear();
    pCurrentMonth = new Date().getMonth();
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (sd) sd.value = pTodayStr();
    if (ed) ed.value = '';
    pRenderAll();
  };

  function pInit() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (sd) sd.value = pTodayStr();
    if (ed) ed.value = '';

    var prevBtn = document.getElementById('periodPrevBtn');
    var nextBtn = document.getElementById('periodNextBtn');
    var todayBtn = document.getElementById('periodTodayBtn');
    var saveBtn = document.getElementById('periodSaveBtn');
    var quickTodayBtn = document.getElementById('periodQuickTodayBtn');
    var toggleAddBtn = document.getElementById('periodToggleAddBtn');
    var addSection = document.getElementById('periodAddSection');
    var modalCancel = document.getElementById('periodModalCancel');
    var modalConfirm = document.getElementById('periodModalConfirm');
    var modalOverlay = document.getElementById('periodModalOverlay');

    if (prevBtn) prevBtn.addEventListener('click', function() {
      pCurrentMonth--;
      if (pCurrentMonth < 0) { pCurrentMonth = 11; pCurrentYear--; }
      pRenderAll();
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      pCurrentMonth++;
      if (pCurrentMonth > 11) { pCurrentMonth = 0; pCurrentYear++; }
      pRenderAll();
    });
    if (todayBtn) todayBtn.addEventListener('click', pGoToToday);

    if (sd) {
      sd.addEventListener('change', pUpdateFormHint);
      sd.addEventListener('input', pUpdateFormHint);
    }
    if (ed) {
      ed.addEventListener('change', pUpdateFormHint);
      ed.addEventListener('input', pUpdateFormHint);
    }

    if (saveBtn) saveBtn.addEventListener('click', pHandleSave);
    if (quickTodayBtn) quickTodayBtn.addEventListener('click', pHandleQuickToday);

    if (toggleAddBtn && addSection) {
      toggleAddBtn.addEventListener('click', function() {
        var visible = addSection.style.display === 'block';
        addSection.style.display = visible ? 'none' : 'block';
        toggleAddBtn.textContent = visible ? '＋ 添加区间' : '－ 收起';
        if (!visible && sd) sd.focus();
      });
    }

    if (modalCancel) modalCancel.addEventListener('click', pCloseModal);
    if (modalConfirm) modalConfirm.addEventListener('click', pSaveModalDetail);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) pCloseModal();
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') pCloseModal();
      if (e.key === 'Enter' && (e.target === sd || e.target === ed)) pHandleSave();
    });
  }

  pInit();
})();

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Update Notice System ===== */
var UPDATE_NOTICES = [
  {
    version: '1.7.5',
    date: '2026-08-13',
    title: '星言 1.7.5',
    summary: '新增 TA的小问题 / TA的好奇 / TA的吐槽 三个互动功能与使用说明；修复手机端主动发送、撤回查看、表情数量、通话设置等多项问题；更新机制优化',
    content: '<h4>🌙 0813 星言 1.7.5 更新公告</h4>'
      +'<h4>📌 更新说明</h4>'
      +'<div style="padding:10px 12px;background:#fdfaf5;border-radius:8px;line-height:1.9;font-size:13px;color:#6b5d4f;">'
      +'星言几乎每天都有更新，多数是小改动或底层优化，不一定会每次发公告标注。'
      +'<br>详细的逐日功能上线与改动记录，请在「设置 → 功能上线时间」中查看。'
      +'</div>'
      +'<h4>✨ TA 系列互动（AI 分类）</h4>'
      +'<p>💫「TA的小问题」：TA 偶尔出一道选择题交给你，选完 TA 再回应。选项对应专属回应不会串话；选中心里答案有「默契」彩蛋；一次聊天最多 1 个，偶尔还可「继续问」（最多 3 题）；支持收藏、历史、自定义题库。</p>'
      +'<p>💭「TA的好奇」：TA 想了解你这个人，问开放式问题（绝不重复问选择题）。支持快捷回复或自由输入；回答后 TA 记住「已了解」的事，之后不再重复问；偶尔自然追问一句；内置 29 道 7 分类题库，可自定义。</p>'
      +'<p>😏「TA的吐槽」：TA 偶尔忍不住插一句嘴，熟悉情侣之间的小调侃（不是批评）。你说到「熬夜/忘事/吃多」等会优先触发对应吐槽；回应后 TA 用聊天字卡接着聊；内置 44 句 5 分类，可按分类/触发词自定义。</p>'
      +'<p>📖 三个功能与「TA的询问」「TA的邀请」是同一套设计逻辑：固定字卡提供随机触发、稳定的内容；开启 AI 后，AI 可根据 TA 人设和你设置的概率，偶尔生成更符合 TA 性格的文字；不接入 AI 也能完整使用。AI 分类新增「使用说明」按钮，五个功能一看就懂。</p>'
      +'<h4>🔧 手机端问题修复</h4>'
      +'<p>修复：联系人无法主动发送消息（自动发送调度改为开关即时重启 + 联系人未就绪自愈，无需刷新）</p>'
      +'<p>修复：对方撤回的消息无法点击查看原文（移动端长按撤回字段修正，兼容旧数据，刷新后原文仍在）</p>'
      +'<p>修复：表情包显示数量比实际翻倍（导入去重 + 渲染兜底去重）</p>'
      +'<p>修复：通话设置无法应用到全部联系人、刷新后概率回默认（新增「全部联系人（全局默认）」选项与「应用到全部联系人」按钮，设置持久化不丢失）</p>'
      +'<p>修复：TA的吐槽 回应后卡片里 TA 的回答显示空白（字段写入顺序错误）</p>'
      +'<h4>🎨 UI 优化</h4>'
      +'<p>「更多功能」「设置」页面 emoji 图标去掉灰色底框，与聊天栏更多面板风格统一</p>'
      +'<p>「更多功能」页面功能项改为白底卡片（加边框与浅阴影），与页面背景清晰区分</p>'
      +'<p>「TA的询问」卡片标题统一为「TA的询问」（原部分显示「TA的提问」）</p>'
      +'<h4>🔄 更新机制优化</h4>'
      +'<p>修复不同设备、不同浏览器打开看到的版本不一致的问题：现在打开/刷新网页时会优先从服务器加载最新版本，不再沿用本地旧缓存；离线时仍可正常使用。</p>'
      +'<p>已安装到桌面的用户，若仍显示旧版，重新打开应用或刷新一次即可。</p>'
  },
  {
    version: '1.7.4',
    date: '2026-08-12',
    title: '星言 1.7.4',
    summary: '星言旅途/星阅/星影全面重构升级、默契问答、星言纪念、梦角聊天回应系统、统一星言浅蓝配色',
    content: '<h4>🌙 0812 星言 1.7.4 更新公告</h4>'
      +'<h4>🧭 星言旅途：陪伴旅行事件模拟器</h4>'
      +'<p>重构为「梦角陪伴旅行事件模拟器」：每次移动触发沉浸式事件（场景→梦角动作→台词→你的互动→事件记忆），支持连续剧情链、旅行照片、阅读手账；翻页支持左翻右翻/滑动/滚轮/键盘；梦角回合有骰子动画。</p>'
      +'<h4>📖 星阅相伴 / 🎬 星影相伴：完整阅读器与播放器 + 梦角陪伴</h4>'
      +'<p>星阅：支持 EPUB（含封面提取）/TXT/PDF，书架/阅读设置/进度保存/阅读时长统计/阅读总结卡，陪读场景字卡库与边缘小卡片弹幕，支持多角色陪读。</p>'
      +'<p>星影：完整播放器（播放/快进快退/倍速/音量/全屏横屏），陪看场景字卡库、半透明边缘弹幕、多角色陪看、观看时长与总结卡。</p>'
      +'<h4>🤝 默契问答（聊天互动）</h4>'
      +'<p>双人互动小游戏：三种玩法「我们的答案 / TA猜我 / 我猜TA」，27 套默认问卷（含星言专属跨世界主题），揭晓双方答案与✨默契解析，TA偏好总结；可设置 TA 提交时长与提前交卷概率，TA答完自动弹窗展示结果。</p>'
      +'<h4>⭐ 星言纪念（梦角）</h4>'
      +'<p>记录和 TA 的重要日子：时间轴 + 倒计时 + 新建/编辑/当天互动，与梦角主页纪念日共用同一数据，可互相新增查看。</p>'
      +'<h4>🔗 梦角聊天回应系统（字卡库）</h4>'
      +'<p>轻量连接词字卡库（102 张）：接话/确认/继续/轻追问/连接/转折/停顿/收束，有概率附着在梦角主回复旁（如"哪里？说来听听。"），让聊天更自然；可在回复设置调节开关与概率。</p>'
      +'<h4>🎨 统一星言浅蓝配色</h4>'
      +'<p>全局强调色改为星言浅蓝，心意问卷/星阅/星影/默契问答等页面统一为「暖白背景 + 白卡 + 浅蓝点缀 + 深灰文字」，简约干净有陪伴感；AI 聊天与占卜师页面也做了简约矢量风美化。</p>'
      +'<h4>🗂️ 菜单与分类整理</h4>'
      +'<p>星言翻牌/星言旅途移至「更多」；「调查问卷」更名「心意问卷」、「星音相伴」「向TA提问→问问TA」「邀请→邀请TA」等归类调整；星阅/星影/TA的日常字卡库独立为「字卡库」分类入口；「默认通用字卡」独立入口；更多分类改名：星言动态/星言日记/星言留言/星言专注/星言周期/星言信箱。</p>'
      +'<h4>🔧 其他优化</h4>'
      +'<p>回复消息条数默认最多改为 2 条；提问卡片在聊天列表正确显示预览；修复占卜师保存、吃饭提醒头像乱码、file:// 打开 manifest 报错等问题。</p>'
  },
  {
    version: '1.7.3',
    date: '2026-08-11',
    title: '星言 1.7.3',
    summary: '新增「邀请 / 向TA提问 / TA的询问 / TA的日常 / 星言存钱罐 / 星言翻牌 / 星言旅途」等互动与陪伴功能，多项体验修复',
    content: '<h4>🌙 0811 星言 1.7.3 更新公告</h4><h4>✨ 新增：聊天互动</h4><p>🤝 「邀请」：输入邀请内容发给 TA，TA 按概率回应（接受 60% / 拒绝 25% / 未回应 15%），像聊天一样用字卡回复你。</p><p>🙋 「向TA提问」：你也可以主动问 TA，TA 用聊天字卡库回复。</p><p>❓ 「TA的询问」（AI分类）：TA 会按概率主动发卡片提问，问题库按联系人独立，可接入 AI 按 TA 的人设生成问题。</p><p>🗂️ 「提问和邀请记录」：当前联系人与你的提问/邀请互动记录（含回答），按联系人独立保存。</p><h4>✨ 新增：梦角与生活</h4><p>🌙 「TA的日常」：TA 的日常在后台持续运行，随时「查岗」看 TA 在哪、在做什么，地点/行动/字卡库按联系人独立，支持批量添加字卡。</p><p>✨ 「星言存钱罐」：把想实现的事情一点点存起来，记录存入/取出与愿望达成。</p><h4>✨ 新增：小游戏</h4><p>🎴 「星言翻牌」：和 TA 一起记忆翻牌——TA 会记住牌面、有自己的回合和互动字卡，支持自定义牌面（emoji / 本地图片）。</p><p>🧭 「星言旅途」：邀请任意几名梦角一起旅行。骰子动画、随机天气、旅途任务、地点专属事件、双人互动选择、随机事件、旅行纪念卡——事件与互动才是旅途的核心。</p><h4>✏️ 改名</h4><p>「星音陪伴」→「星音相伴」（移入更多分类）；「一起阅读」→「星阅相伴」；「一起看视频」→「星影相伴」。</p><h4>🔧 修复与优化</h4><p>修复：朋友圈被点赞/评论不再整页刷新（改为局部更新）；评论区 AI 解读移除</p><p>修复：字卡库导入不再吞卡（覆盖导入完整保留全部字卡）</p><p>修复：提问/邀请/问卷卡片刷新后不再消失（消息字段持久化）</p><p>修复：收藏语音 ZIP 导出（优先本地数据，远程链接失败自动找回）</p><p>修复：AI 解读面板无限刷新崩溃；长截图勾选不再跳动、包含情绪字卡</p><p>优化：TA与你的距离 / TA的触碰 / TA的日常 页面整体配色重设计（星言日历同款柔和风）</p><p>优化：开屏进入按钮布局、使用须知「我已阅读」按钮始终可见</p>'
  },
  {
    version: '1.7.2',
    date: '2026-08-10',
    title: '星言 1.7.2',
    summary: 'AI 解读接入、TA与你的距离 / TA的触碰、消息回复拟真化、多项稳定性修复',
    content: '<h4>🌙 0810 星言 1.7.2 补充更新公告</h4><p>🔮 新增「AI占卜师」：更多功能→更多分类，独立对话页，可设定解读指令/世界观（星言默认或自定义）/关联梦角人设，直接发占卜问题或抽出的牌让 TA 解。</p><p>🧠 新增「AI解读记忆库」（梦角分类）：手动添加关于 TA 的记忆，AI 解读字卡时自动参考。</p><p>📚 新增「AI解读字卡记录」（消息工具分类）：每次字卡解读成功自动存档，全部保留，可查看/删除/清空。</p><p>💬 字卡解读优化：自动带上最近 8 条对话上下文 + 你的手动记忆，解读更连贯。</p><p>🙈 隐藏底部导航入口移入更多功能；收藏语音 ZIP 导出修复（支持 IndexedDB 引用还原与 mp3/m4a 格式）；星阅相伴支持 GBK 中文 txt；星影相伴支持横屏全屏。</p><h4>🌙 0808 星言 1.7.2 版本更新公告</h4><h4>✨ 新增：AI 解读（API 接口）</h4><p>底部导航「设置」→「API 接口」可接入 AI 大模型（支持 DeepSeek / 通义 / GLM / OpenAI 等）。</p><p>接入后：聊天中长按字卡消息 → 📜 解读这条字卡想表达的意思；朋友圈动态、信箱的信也能一键解读。</p><p>每个联系人是独立的梦角：可分别设置 TA 是男朋友/女朋友、各自的完整人设（性格/背景/称呼/说话习惯），解读时按该梦角自己的设定来，不会混淆。</p><p>占卜抽牌后新增「AI 解读」，可按你设定的占卜师指令解读牌面。所有配置仅保存在本机，不会上传任何服务器。</p><h4>✨ 新增：TA与你的距离 / TA的触碰（梦角）</h4><p>梦角分类新增两个存在感功能：</p><p>📍 TA与你的距离：TA在哪里、离你多近（贴近/很近/近/稍远/远 + 方向 + 连接状态），有持续状态与变化记录。</p><p>💫 TA的触碰：TA对你做了什么（牵手/拥抱/摸头等 14 个部位动作），有动作持续与记录，可点击查看完整信息。</p><p>两个功能采用「持续存在感」机制：打开不一定刷新——TA可能还在做上一个动作，状态有持续时间，记录点击可看完整。</p><h4>🎙️ 新增：梦角语音（MiniMax 音色）</h4><p>在「设置」→「API 接口」→「梦角语音」中，可上传一段参考音频（mp3 / m4a / wav，10秒~5分钟，建议 30秒~1分钟更省钱）复刻梦角专属音色。每个梦角独立设置（开关 / Key / 音色）。</p><p>聊天中梦角发的文字消息旁会出现 ▶ 按钮，用梦角的专属声音读出来；已生成的语音会缓存，重复播放不重复扣费。</p><p>音色 ID 可手动填写或复制，已复刻的音色永久有效、不必重复复刻。</p><p>注意：<strong>星言网站本身完全免费，不收取任何费用</strong>；MiniMax / AI 接口产生的费用由第三方服务商（MiniMax、DeepSeek 等）直接向你收取，与星言无关。复刻按音频时长、播放按字符计费，请量入为出。</p><h4>🛠️ 其他新增</h4><p>更多功能 → 消息工具：新增「🎤 发送语音」（录制后作为语音消息发送，持久保存）与「🔗 发送链接」（小红书 / B站 / QQ音乐 / 网易云等链接以卡片显示，点击打开）。</p><p>语音消息长按菜单新增「🗣️ 语音转文字」（浏览器自带识别，免费）。</p><h4>🔧 修复与优化</h4><p>修复：联系人多条回复文字/图片/语音重复发送（现仅表情包允许小概率连发）</p><p>修复：主动发送多条消息也去重，间隔拟真化</p><p>修复：表情包与图片大小混淆（表情包小图、图片大图）</p><p>修复：回复设置「已读不回概率」调 0 仍触发；「应用到全部联系人」误报未选择</p><p>修复：iOS/安卓刷新后偶发丢失聊天记录、朋友圈、头像（双端合并取最完整）</p><p>修复：纯表情/emoji 消息不再误显示语音播放按钮</p><p>回复/主动发送间隔拟真：短消息快回、长消息打字久、偶发停顿或快速连发</p>'
  },
  {
    version: '1.7.1',
    date: '2026-08-06',
    title: '星言 1.7.1',
    summary: '稳定版收官：全面 Bug 修复、数据安全加固、群聊即将解散说明',
    content: '<h4>🌙 0806 星言 1.7 版本更新公告</h4><p>星言字卡 0701 开搓，0717 发布，0803 结束公测。功能非常多非常复杂，一个月内做了很多次调试，花了很多时间。现在网站基本上没什么大问题了，有也是小问题，或者别的设备没人反馈我也不知道。</p><h4>📢 关于群聊</h4><p>接下来考虑这个月过段时间<strong>解散群聊</strong>，星言不再开公开群。</p><p>解散后可能开一个<strong>常见问题解答反馈楼</strong>，同样可以反馈问题。</p><p>注意：其他项目后续可能还是会开群的，星言也可能开私人群（具体看情况）。</p><p>如果有什么问题，<strong>最好是尽快反馈</strong>。后续按我自己的设备发现有问题我还是会修，但其他设备没有反馈，有没有问题我依旧不知道。</p><p>后续计划可能去搓新网站了。</p><h4>🌐 关于开源</h4><p>星言源码已在 GitHub 公开：<strong>https://github.com/ling233330-star/star033</strong></p><p>开源即代表接受「使用许可」的全部条款（允许自用 / 禁止商用 / 禁止冒名 / 禁止二次公开发布），详情见应用内「使用须知 → 使用许可」。</p><h4>🔧 本次更新内容</h4><h4>聊天</h4><p>修复：联系人回复/主动发送消息条数（最少~最多区间）设置无效，始终只发 1 条的问题</p><p>修复：多条消息一次性弹出，改为逐条延迟发送（间隔 1~3 秒），更真实</p><p>修复：切页面/点其他按钮打断联系人回复、正在输入状态、无已读不回标识的问题</p><p>修复：切换聊天日期无法跳转位置（现在能真正滚动到对应日期）</p><p>修复：消息只显示最近 80 条、上划无法加载更早消息（新增触顶加载）</p><p>修复：iOS 图片/表情显示为 url、http 图片加载失败无兜底</p><p>修复：引用文字消息显示成情绪字卡</p><p>修复：输入法在点其他按钮后错误重开</p><h4>主动发消息</h4><p>改为精确间隔触发：按你设置的最短~最长随机间隔到点才发，不再固定轮询、不再延迟送达</p><p>主动发送消息条数改为最少/最多区间（1~20 条随机）</p><h4>数据安全</h4><p>修复：刷新后偶发丢失聊天记录/朋友圈（localStorage 优先 + IndexedDB 合并补缺）</p><p>修复：OPPO/iOS 浏览器切后台丢数据（自动保存加固）</p><p>本地存储满时自动分片保存，不再静默丢失</p><h4>字卡库</h4><p>导入数据新增「追加/替换」选择，追加时重复字卡自动去重</p><p>导入聊天记录支持追加合并（几天前的记录也能拼回来）</p><p>新增「清空全部公用字卡」「清空全部专享字卡」按钮</p><p>分组名不再截断，完整显示</p><h4>朋友圈</h4><p>评论支持上传图片发送</p><p>评论表情包草稿不再显示 url</p><h4>调查问卷</h4><p>修复自动答题死循环卡死</p><p>新增「未作答概率」设置</p><p>实时显示梦角已提交的答案</p><p>提交后聊天插入系统消息</p><h4>夜间模式</h4><p>颜色全面优化：不再死黑，柔和深蓝灰，气泡/输入栏/弹窗/日历全部适配</p><p>修复开屏、表情分组、使用说明分类等文字看不见的问题</p><h4>更多功能分类</h4><p>重新分类：消息工具 / 聊天互动 / 更多 / 梦角 / 字卡库 / 设置</p><p>设置中新增「安装到桌面」（PWA 安装）</p><p>导出进度条文案修正</p><p>发送按钮颜色修正</p><p>回复设置移除重复的免打扰入口</p><p>修复部分按钮在 Via 浏览器双触发/无响应</p><p style="color:#6f6a62;font-size:12px;">【感谢这一路的陪伴，星言以后应该不会做什么大的变动了】</p>'
  },
  {
    version: '1.6',
    date: '2026-08-03',
    title: '星言 1.6',
    summary: '图文消息、礼物盒、梦角日历心情留言、默认字卡库扩充、问题修复',
    content: '<h4>🌙 0803 星言 1.6 版本更新公告</h4><p>公测阶段结束，感谢大家的反馈和陪伴。本次更新内容如下。</p><h4>聊天</h4><p>新增图文消息：文字和图片可以一起发送，会保存为聊天记录。</p><p>新增红包和自定义拍一拍里可以使用字卡库给梦角设定的拍一拍。</p><h4>梦角互动</h4><p>新增礼物盒：可以互相赠送礼物，附带留言和时间，作为聊天记录保存。</p><h4>梦角日历</h4><p>梦角每日心情和留言。</p><h4>字卡</h4><p>默认通用字卡库扩充，增加更多日常表达（默认关闭，可设定开启）。</p><h4>其他</h4><p>页面布局、功能体验优化，部分问题修复。</p><p style="color:#6f6a62;font-size:12px;">【星言以后应该不会做什么大的变动了】</p>'
  },
  {
    version: '1.5',
    date: '2026-07-28',
    title: '星言 1.5',
    summary: '新增心意/交流意图字卡、朋友圈表情包回复、自定义图标、存储空间、快捷切换联系人、信箱分类查看等',
    content: '<h4>🌙 0728 星言 1.5 版本更新公告</h4><h4>1. 情绪字卡新增【心意】与【交流意图】</h4><p>情绪系统新增两个表达维度：</p><p>❤️ 心意字卡</p><p>💬 交流意图字卡</p><p>可在【情绪系统设置】中选择开启或关闭。</p><h4>2. 朋友圈新增表情包回复评论</h4><p>朋友圈评论现在支持使用表情包进行回复。</p><p>同时对朋友圈整体布局进行了微调，优化浏览体验。</p><h4>3. 聊天输入栏透明效果调整</h4><p>聊天输入栏所在区域调整为半透明效果。</p><p>开启背景图片后，可以更好地显示聊天背景。</p><h4>4. 聊天输入栏【更多功能】分类调整</h4><p>重新整理更多功能中的分类布局，使功能查找更加方便。</p><h4>5. 联系人编辑页面新增【清空聊天记录】</h4><p>进入：</p><p>顶部栏左上角三个点 → 编辑联系人</p><p>新增：</p><p>【清空聊天记录】</p><p>可快速删除当前联系人的聊天内容。</p><h4>6. 信箱新增发送内容控制</h4><p>新增信箱回复设置：</p><p>可选择关闭联系人写信时是否使用：</p><p>颜文字</p><p>Emoji</p><p>图片表情</p><p>设置位置：</p><p>【回复设置】→【信箱设置】</p><h4>7. 新增【自定义图标】功能</h4><p>设置中新增：</p><p>【自定义图标】</p><p>支持上传图片，自定义功能按钮图标。</p><p>（该功能目前暂未进行完整测试）</p><h4>8. 新增【存储空间】查看功能</h4><p>设置 → 存储空间</p><p>现在可以查看星言当前占用的本地存储情况。</p><p>因为有些功能没做完，目前部分分类暂未完善，后续会继续补充。</p><p style="font-weight:600;">⚠️ 注意：星言数据保存在手机本地，但浏览器本地存储并不是永久保存。</p><p>以下情况可能导致数据丢失：</p><p>清理浏览器数据</p><p>系统清理缓存</p><p>浏览器限制或自动清理</p><p>建议定期使用【数据导出】功能进行备份。</p><h4>9. 聊天顶部栏新增快捷切换联系人</h4><p>聊天页面顶部栏右侧新增快捷切换联系人按钮。</p><p>无需返回主页即可快速切换聊天对象。</p><h4>10. 梦角主页专属信箱新增分类查看</h4><p>专属信箱新增分类：</p><p>全部</p><p>对方来信</p><p>对方回信</p><p>寄出的信</p><p>方便查看不同类型的信件。</p><h4>11. 朋友圈默认概率优化调整</h4><p>调整了朋友圈内容出现概率。</p><p>如果不符合个人使用习惯，可以前往：</p><p>【回复设置】→【朋友圈设置】</p><p>自行调整</p><h4>12. 编辑联系人页面的显示设置进行了调整优化</h4><p>本次更新对部分显示设置进行了细节调整，优化页面布局与使用体验。</p><p>具体内容可点击顶部栏左上角「三个点」打开设置页面，下滑查看相关选项。</p><h4>13. 问题优化</h4><p>根据小红书群内反馈，对部分问题进行了调整和优化。</p><p>由于缺少反馈的bug相关设备型号进行测试，目前无法确认所有问题是否已完全修复。（我只有自己的手机型号，得使用者自己验证）</p><p>如果后续使用过程中仍遇到相关问题，欢迎继续反馈，并提供具体情况（设备型号、浏览器、操作步骤等），方便进一步排查。</p>'
  },
  {
    version: '1.46',
    date: '2026-07-24',
    title: '星言字卡',
    summary: 'Bug修复、开屏公告优化、占卜功能优化、决策功能优化、聊天字卡库优化（导入/导出JSON）',
    content: '<h4>1. Bug 修复，细节优化</h4><p>修复了一些使用群内反馈的问题，提升使用稳定性。优化部分细节，提升整体使用体验。由于我没有相关设备进行测试是否已修复问题，需要自己实际使用验证。</p><h4>2. 开屏公告与使用须知优化</h4><p>重新调整并完善了开屏公告和使用须知内容。</p><h4>3. 占卜功能优化</h4><p>占卜抽牌中的混合模式新增<strong>【自由抽牌】</strong>功能。</p><p>用户可以根据自己的需求选择抽牌方式，增加占卜体验的自由度。</p><h4>4. 决策功能优化</h4><p><strong>【帮我决定】</strong>和<strong>【多人决定】</strong>功能新增使用<strong>【自定义选项】</strong>问问题时，保留了已输入的文字选项内容。</p><h4>5. 聊天字卡库优化</h4><p>新增<strong>【导入 JSON】</strong>和<strong>【导出 JSON】</strong>功能。</p><p>导入与导出时新增字卡分类选择，可根据需求勾选需要导入或导出的字卡分类。</p><h4>6. 聊天字卡库优化</h4><p>新增<strong>【导入 JSON】</strong>功能，支持适配 milk 字卡 JSON 格式。</p><p>导入 JSON 时新增字卡类型与分类选择。</p><p>可选择导入：</p><p><br></p><p>主字卡类型：</p><p>公用字卡</p><p>专享字卡</p><p><br></p><p>字卡分类：</p><p>主字卡</p><p>颜文字</p><p>emoji</p><p>图片表情</p><p>拍一拍</p><p>语音</p><p>导入时请根据 JSON 内容选择对应的字卡类型和分类位置，避免全选导致字卡导入错误。</p>'
  },
  {
    version: '1.45',
    date: '2026-07-23',
    title: '星言字卡',
    summary: 'Bug修复、新增更新公告、使用须知、留言板更新、让对方继续说、输入栏收纳',
    content: '<h4>1. Bug 修复</h4><p>修复了一些群内反馈的问题。</p><p>由于我没有相关设备进行测试，部分修复效果需要大家实际使用验证。</p><p>如果遇到新的问题，欢迎继续反馈。</p><h4>2. 新增更新公告</h4><p>设置中新增<strong>【更新公告】</strong>页面。</p><p>可以查看星言历次版本更新内容。</p><h4>3. 新增使用须知</h4><p>设置中新增<strong>【使用须知】</strong>页面。</p><p>包含：</p><ul><li>Bug反馈方式</li><li>网站说明</li><li>版本说明</li><li>使用相关注意事项</li></ul><h4>4. 我的留言板更新</h4><p>更多功能中的<strong>【我的留言板】</strong>已更新新版。</p><p>该功能为单向留言功能，不设置互动功能。</p><p>可用于记录想留下的话。</p><h4>5. 新增「让对方继续说」功能</h4><p>聊天输入栏右侧新增功能按钮。</p><p>点击后可触发联系人立即回复一条消息。</p><p>该按钮支持收纳，不需要时可以隐藏。</p><h4>6. 新增聊天输入栏收纳功能</h4><p>取消勾选显示的功能按钮后，会自动从聊天输入栏隐藏。</p><p>隐藏后的按钮会移动至底部左侧<strong>【更多功能】</strong>中的<strong>【收纳按钮】</strong>区域。</p><p>发送消息按钮不会被收纳。</p><h4>7. 其他优化</h4><p>修复了一些我自己在使用过程中发现的问题。</p><p>部分优化内容不单独列出。</p>'
  },
  {
    version: '1.4',
    date: '2026-07-22',
    title: '星言字卡',
    summary: '顶部栏字卡优化、新增聊天情绪系统、占卜功能修复、新增生理周期记录、底部聊天栏批量发送模式',
    content: '<h4>1. 顶部栏字卡优化</h4><p><strong>顶部栏「心情」</strong>用于表示梦角当前整体心情。</p><p>顶部栏五处字卡共同组成梦角当前状态，表达的是「TA现在如何与你交流」。</p><ul><li>💬 对方状态：TA如何回应你</li><li>☁️ 天气：世界是什么样</li><li>🕰 时间：现在是什么时候</li><li>🌙 心情状态：TA感觉怎么样</li><li>💤 空闲状态：TA正在做什么、有没有空</li></ul><p>默认分组新增了一批公用字卡（由 AI 辅助创作，并非复制其他老师分享的字卡内容）。</p><p>所有默认字卡均可根据个人使用习惯自由添加、修改或删除。</p><h4>2. 新增「聊天情绪系统」</h4><p>新增独立的聊天情绪系统。</p><p>聊天情绪字卡表示的是梦角发送这一句话时所流露出的情绪，并非梦角当前整体心情。</p><p>开启该功能后，梦角发送聊天消息时，将有概率随机附带一张聊天情绪字卡，用于补充当前消息的情绪与语气，让有限的字卡表达更加自然、丰富。</p><p>字卡库内置默认情绪字卡（由 AI 辅助创作，并非复制其他老师分享的字卡内容），也支持自由添加、修改和删除。</p><p>该功能可在字卡库中自由开启或关闭。</p><p style="font-size:12px;color:#6f6a62;">【灵感来源，其实好久以前刷的有老师提过情绪字卡类似的功能不过不知道是谁，只是有点印象，然后昨天晚上刷的了@心汋是颗彩虹多宝糖 老师的帖子的网站聊天也有情绪字卡，感觉很有意思，今天就搓了这个功能】</p><h4>3. 占卜功能修复</h4><p>占卜功能页面已修复，现在可以正常使用。</p><h4>4. Bug 修复</h4><p>修复了一些已知问题，优化了部分使用体验。</p><h4>5. 新增生理周期记录</h4><p>新增生理周期记录功能，可用于记录和查看个人生理周期信息。</p><h4>6. 新增了批量发送消息的功能</h4><p>该功能可在左上角三个点里自由开启或关闭。</p><p style="font-size:12px;color:#6f6a62;">【群友想要，参考milk字卡搓的，总之是感谢milk老师】</p>'
  },
  {
    version: '1.35',
    date: '2026-07-21',
    title: '星言字卡',
    summary: '联系人头像库更新、用户头像功能更新、梦角主页功能更新、占卜功能页面优化',
    content: '<h4>1. 联系人头像库更新</h4><p>顶部栏左上角「三个点」菜单新增<strong>【联系人头像库】</strong>。</p><p>开启后，梦角可主动随机更新头像。</p><p>非梦角主动更换头像使用时，也可以直接在头像库中选择并保存头像进行更新。</p><h4>2. 用户头像功能更新</h4><p>顶部栏左上角「三个点」菜单新增<strong>头像管理</strong>。</p><p>支持上传多个个人头像，并可自由切换使用。</p><h4>3. 梦角主页功能</h4><p>点击顶部栏联系人头像，可打开<strong>【梦角主页】</strong>窗口。</p><p><strong>【梦角主页】新增：</strong></p><ul><li>梦角主动更换头像历史记录查看</li><li>底部聊天栏左侧「更多功能」中新增<strong>【梦角主页】</strong>快捷入口</li></ul><h4>4. 占卜功能页面更新</h4><p>底部聊天栏左侧「更多功能」中的占卜功能已优化：</p><ul><li>页面调整为全屏显示</li><li>抽牌方式优化，支持从牌堆中抽取卡牌</li><li>抽取后的牌面展示优化，替换原有 emoji，改为塔罗牌和雷诺曼牌面图片显示</li></ul>'
  },
  {
    version: '1.3',
    date: '2026-07-20',
    title: '星言字卡',
    summary: '聊天功能新增快捷入口、通话页面优化、新增简约模式、Bug修复',
    content: '<h4>1. 聊天功能新增快捷入口</h4><p>聊天输入栏左侧「更多功能」中新增：</p><ul><li>🍅 番茄钟快捷按钮</li><li>👋 拍一拍快捷按钮</li></ul><h4>2. 通话页面优化</h4><p>通话半框页面右上角新增<strong>【上传背景图片】</strong>按钮。</p><p>可自定义通话背景，提升页面个性化体验。</p><h4>3. 新增简约模式</h4><p>左上角「三个点」菜单中新增<strong>【简约模式】</strong>。</p><p>开启后可隐藏头像，界面风格类似番茄钟陪伴模式页面。</p><h4>4. Bug 修复</h4><p>修复了使用过程中发现的部分问题，提升稳定性。</p><h4>🍅 番茄钟陪伴模式说明</h4><p>番茄钟陪伴模式支持：</p><ul><li>上传背景图片，自定义陪伴页面外观</li><li>在设置中选择联系人回复方式：使用聊天字卡库回复 / 使用番茄钟独立字卡库回复</li></ul><p>两种模式可以自由调整，根据自己的需求设置即可。</p><p>陪伴模式右上角的 ☁️ 按钮：点击后可切换已有联系人的陪伴窗口。</p>'
  },
  {
    version: '1.2',
    date: '2026-07-19',
    title: '星言字卡',
    summary: '修复Bug、拍一拍功能、联系人个人面板、快速切换联系人、隐藏底部栏、字卡库等',
    content: '<h4>更新内容</h4><h4>1. 修复问题</h4><p>修复了一些使用过程中发现的 Bug。优化部分功能体验。</p><h4>2. 拍一拍功能</h4><p>在聊天界面点击联系人头像，即可使用<strong>【拍一拍】</strong>功能。</p><h4>3. 联系人个人面板</h4><p>点击聊天顶部栏的联系人头像，即可进入<strong>【联系人个人面板】</strong>。</p><p>目前仍在设计中，后续可能会增加更多内容和功能。</p><h4>4. 快速切换联系人</h4><p>顶部栏的「< >」按钮可用于快速切换联系人。</p><p>切换顺序可在左上角「三个点」菜单中的相关设置进行调整。</p><h4>5. 隐藏底部栏</h4><p>支持隐藏底部导航栏。可在左上角「三个点」菜单中的相关设置进行调整。</p><h4>6. 字卡库</h4><p>聊天、信箱、朋友圈、调查问卷使用的字卡均在此管理。包含：公用字卡、专享字卡。</p><h4>7. 顶部栏字卡设置</h4><p>可更换联系人顶部栏显示的 5 项字卡。</p><p>显示位置：联系人昵称下方：对方状态、第二排：天气｜心情状态、第三排：时间｜空闲状态。</p><h4>8. 更多功能入口</h4><p>底部聊天栏表情包左侧的「三个点」中包含其他小功能。</p><h4>9. 回复时间设置</h4><p>梦角聊天、信箱、朋友圈的回复时长相关设置位于：设置 → 回复设置。已显示不同回复时间概率，可根据个人使用习惯进行调整。</p>'
  },
  {
    version: '1.1',
    date: '2026-07-18',
    title: '星言字卡',
    summary: '新增更多隐藏功能、Bug修复',
    content: '<h4>1. 新增更多隐藏功能</h4><p>左上角「三个点」菜单中新增<strong>【更多隐藏功能】</strong>。</p><p>现在可以自由控制界面显示内容：</p><ul><li>聊天顶部栏昵称隐藏/显示</li><li>拍一拍双方昵称隐藏/显示</li><li>底部导航栏隐藏/显示</li><li>其他界面元素隐藏设置</li></ul><p>开启后可查看全部隐藏选项，根据个人喜好调整界面。</p><h4>2. Bug 修复</h4><p>修复了一些使用过程中发现的问题。优化部分功能稳定性。</p><h4>3. 当前测试情况</h4><p>目前已在电脑浏览器测试，基础功能运行正常。后续会继续通过自己的手机使用体验进行测试和修复。如果使用过程中发现任何问题，欢迎反馈。</p>'
  },
  {
    version: '1.0',
    date: '2026-07-17',
    title: '星言字卡',
    summary: '测试发布，包含拍一拍、联系人面板、快捷切换、底部栏隐藏、字卡库等基础功能',
    content: '<h4>当前功能介绍</h4><p>目前开始均为测试版本，功能可能会根据后续使用体验进行调整或修改。</p><h4>1. 拍一拍功能</h4><p>在聊天页面点击联系人头像，即可对联系人使用<strong>【拍一拍】</strong>功能。</p><h4>2. 联系人个人面板</h4><p>点击聊天顶部栏的联系人头像，可打开联系人个人面板。</p><h4>3. 快捷切换联系人</h4><p>顶部栏的「<>」按钮用于快捷切换联系人。切换顺序可在顶部栏左上角「三个点」菜单中进行设置。</p><h4>4. 底部导航栏隐藏</h4><p>支持隐藏底部导航栏。可在顶部栏左上角「三个点」菜单中进行设置。</p><h4>5. 字卡库</h4><p>字卡库入口位于设置中。包含：公用字卡库、专享字卡库。后续会继续根据实际使用体验进行优化和调整。</p>'
  }
];

var CURRENT_VERSION = '1.7.5';

function compareVersions(v1, v2) {
  var parts1 = v1.split('.').map(Number);
  var parts2 = v2.split('.').map(Number);
  var len = Math.max(parts1.length, parts2.length);
  for (var i = 0; i < len; i++) {
    var p1 = parts1[i] || 0;
    var p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function getLastReadVersion() {
  try {
    return localStorage.getItem('star_last_read_version') || '0.0';
  } catch(e) {
    return '0.0';
  }
}

function setLastReadVersion(version) {
  try {
    localStorage.setItem('star_last_read_version', version);
  } catch(e) {}
}

function showUpdateNotice(notice) {
  var overlay = document.getElementById('update-notice-overlay');
  if (!overlay) return;
  
  document.getElementById('update-notice-title').innerHTML = '✨ ' + notice.title;
  document.getElementById('update-notice-version').textContent = '版本 ' + notice.version;
  document.getElementById('update-notice-date').textContent = notice.date;
  document.getElementById('update-notice-body').innerHTML = notice.content;
  
  overlay.classList.add('show');
}

function closeUpdateNotice() {
  var overlay = document.getElementById('update-notice-overlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  setLastReadVersion(CURRENT_VERSION);
}

function checkUpdateNotice() {
  var lastRead = getLastReadVersion();
  var latestNotice = UPDATE_NOTICES[0];
  
  if (!latestNotice) return;
  
  if (compareVersions(latestNotice.version, lastRead) > 0) {
    showUpdateNotice(latestNotice);
  }
}

function renderUpdateHistory() {
  var list = document.getElementById('update-history-list');
  if (!list) return;
  
  // ★ 顶部小字说明：网站几乎每天更新，小改动不逐一发公告，详细记录见「功能上线时间」
  var html = '<div style="padding:8px 12px;background:#fdfaf5;border-radius:8px;line-height:1.8;font-size:11px;color:#8c7b6b;margin-bottom:12px;">'
    + '星言几乎每天都有更新，多数是小改动或底层优化，不一定会每次发公告标注。'
    + '<br>详细的逐日功能上线与改动记录，请在「设置 → 功能上线时间」中查看。'
    + '</div>';
  UPDATE_NOTICES.forEach(function(notice, index) {
    html += '<div class="update-history-item' + (index === 0 ? ' expanded' : '') + '" data-version="' + notice.version + '">' +
      '<div class="update-history-header" onclick="toggleUpdateHistory(this)">' +
        '<div class="update-history-info">' +
          '<div class="update-history-title">✨ ' + notice.title + '<span class="update-history-version">' + notice.version + '</span></div>' +
          '<div class="update-history-date">' + notice.date + '</div>' +
          '<div class="update-history-summary">' + notice.summary + '</div>' +
        '</div>' +
        '<div class="update-history-arrow">▼</div>' +
      '</div>' +
      '<div class="update-history-content">' +
        '<div class="update-history-content-inner">' + notice.content + '</div>' +
      '</div>' +
    '</div>';
  });
  
  list.innerHTML = html;
}

function toggleUpdateHistory(header) {
  var item = header.parentElement;
  item.classList.toggle('expanded');
}

function bindUpdateNoticeEvents() {
  var btn = document.getElementById('update-history-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      showPg('pg-update-history');
    });
  }
  
  var ftBtn = document.getElementById('feature-timeline-btn');
  if (ftBtn) {
    ftBtn.addEventListener('click', function() {
      showPg('pg-feature-timeline');
    });
  }
  
  var usageBtn = document.getElementById('usage-notice-btn');
  if (usageBtn) {
    usageBtn.addEventListener('click', function() {
      showPg('pg-usage-notice');
    });
  }
  
  var overlay = document.getElementById('update-notice-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeUpdateNotice();
      }
    });
  }
  
  showPgCallbacks['pg-update-history'] = function() {
    renderUpdateHistory();
  };
  
  showPgCallbacks['pg-feature-timeline'] = function() {
    renderFeatureTimeline();
  };
  
}

function initUpdateNotice() {
  bindUpdateNoticeEvents();
  // ★ 修复：每个版本首次打开自动弹更新公告（按版本号比较，读过则不再弹）
  setTimeout(function(){
    try{ checkUpdateNotice(); }catch(e){ console.warn('auto notice fail:',e); }
  },800);
}

// ============ 功能上线时间（设置 → 功能上线时间）============
// ★ 按「天」记录：每天 = 一次部署日的功能上线/改动情况（部署次数来自 GitHub Pages 部署记录，共 171 次）
var FEATURE_TIMELINE = [
  { date:'07-18', deploys:11, title:'项目创建 · 网站首次上线（单文件版本）', items:[
    { name:'网站上线首日功能', desc:'当日 21:17 首次提交源码（GitHub 提交 de02bb1 可查），部署 11 次。上线时已包含：', log:[] },
    { name:'聊天', desc:'消息收发、聊天气泡、输入框等基础聊天。', log:[] },
    { name:'字卡', desc:'字卡传讯（星言核心概念）。', log:[] },
    { name:'朋友圈', desc:'动态发布与浏览。', log:[] },
    { name:'星言信箱 / 信件', desc:'寄信、回信。', log:[] },
    { name:'留言板', desc:'留言板功能。', log:[] },
    { name:'占卜 / 塔罗', desc:'占卜与塔罗牌。', log:[] },
    { name:'日记', desc:'记录想法与回忆。', log:[] },
    { name:'通话', desc:'通话模拟。', log:[] },
    { name:'拍一拍', desc:'拍一拍互动。', log:[] },
    { name:'翻牌', desc:'星言翻牌。', log:[] },
    { name:'帮我决定 / 决策', desc:'帮我决定、多人决定。', log:[] },
    { name:'日历', desc:'星言日历。', log:[] },
    { name:'快捷回复 / 语音 / 图片 / 表情包 / 视频', desc:'消息快捷回复、语音、图片、表情包、视频等消息类型。', log:[] },
    { name:'纪念日 / 数据导入导出 / 云同步备份', desc:'纪念日记录、数据导入导出、云同步/备份。', log:[] },
    { name:'夜间模式 / 设置 / 添加联系人 / 非即时传讯', desc:'主题切换、设置页、联系人管理、非即时传讯。', log:[] },
    { name:'当时尚未包含', desc:'番茄钟、礼物盒、红包、存钱罐、使用须知、音乐、相册等为后续加入（07-18 版本快照中未检出）。', log:[] }
  ]},
  { date:'07-19', deploys:24, title:'上线第二天 · 密集完善', items:[
    { name:'首日功能持续完善', desc:'当日部署 24 次，聊天、字卡、朋友圈、信箱等首日功能密集修复完善（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-20', deploys:6, title:'功能上线', items:[
    { name:'番茄钟', desc:'星言专注（番茄钟）上线，当日部署 6 次。', log:[] }
  ]},
  { date:'07-21', deploys:2, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 2 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-22', deploys:6, title:'资源扩充', items:[
    { name:'页面体积大幅扩充', desc:'当日部署 6 次，快照体积从 1.3MB 增至 3.6MB（内嵌图片/资源大量扩充）。', log:[] }
  ]},
  { date:'07-23', deploys:4, title:'功能上线', items:[
    { name:'使用须知', desc:'首次访问使用须知上线。', log:[] }
  ]},
  { date:'07-24', deploys:6, title:'功能上线', items:[
    { name:'音乐（星音相伴）', desc:'音乐陪伴功能上线（当日快照首次检出）。', log:[] }
  ]},
  { date:'07-25', deploys:2, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 2 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-27', deploys:1, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 1 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-28', deploys:8, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 8 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-29', deploys:2, title:'功能上线', items:[
    { name:'问候语', desc:'问候语功能上线（当日快照首次检出）。', log:[] }
  ]},
  { date:'07-30', deploys:7, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 7 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'07-31', deploys:7, title:'功能上线', items:[
    { name:'红包', desc:'红包功能上线（当日快照首次检出）。', log:[] },
    { name:'日历（界面中文化）', desc:'星言日历界面文案中文化（日历功能 07-18 已有，当日更新为中文标识）。', log:[] }
  ]},
  { date:'08-01', deploys:6, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 6 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'08-02', deploys:6, title:'功能上线', items:[
    { name:'礼物盒', desc:'礼物盒（自定义礼物）上线（当日快照首次检出）。', log:[] }
  ]},
  { date:'08-03', deploys:10, title:'完善', items:[
    { name:'细节完善', desc:'当日部署 10 次（快照未检出新增功能类别）。', log:[] }
  ]},
  { date:'08-04', deploys:7, title:'功能上线', items:[
    { name:'相册', desc:'相册功能上线（当日快照首次检出）。', log:[] }
  ]},
  { date:'08-05', deploys:13, title:'源码拆分 · 基础功能全量上线', items:[
    { name:'源码正式拆分上传（src 目录 30 个文件）', desc:'源码从单文件拆分为 src 片段，以下功能自当日起有独立源码记录（文件级时间戳可查）：', log:[] },
    { name:'聊天系统', desc:'消息发送/渲染/保存、长按操作（回复/编辑/撤回/复制/删除）、长截图、引用回复。', log:['08-13 修复：移动端撤回消息无法点击查看原文（长按撤回字段修正，兼容旧数据）','08-13 修复：联系人无法主动发送消息（自动发送调度改为开关即时重启 + 自愈，无需刷新）','08-13 修复：TA的吐槽 回应后卡片 TA 回答显示空白'] },
    { name:'存储层', desc:'localStorage + IndexedDB 双写，消息/联系人/信件/朋友圈等数据持久化。', log:['08-13 消息序列化白名单补充撤回原文、邀请/选择/好奇/吐槽卡片字段，刷新后不再丢失'] },
    { name:'导航 / 聊天列表 / 批量发送', desc:'底部导航、会话列表、消息预览、多字卡批量发送、让对方继续说。', log:['08-13 聊天列表预览支持 TA的询问/小问题/好奇/吐槽/邀请 卡片'] },
    { name:'搜索 / 联系人切换 / 非即时传讯 / 通话设置', desc:'聊天记录搜索、日期切换、非即时传讯（24 小时内随机回复）、通话设置（来电/接听/忙线/拒接/挂断概率）。', log:['08-13 修复：通话设置无法应用到全部联系人、刷新后概率回默认（新增「全部联系人」选项与「应用到全部联系人」按钮）'] },
    { name:'表情包 / 联系人管理', desc:'表情包（我的/公用/专享）、上传表情、分组管理、添加/编辑联系人、拍一拍。', log:['08-13 修复：表情包显示数量比实际翻倍（导入去重 + 渲染兜底去重）'] },
    { name:'红包 / 通话 / 字卡库', desc:'红包收发、通话模拟、公用/专享字卡、默认通用字卡、字卡分组与导入导出。', log:['08-13 修复：milk 导入表情包数量翻倍（按内容去重）'] },
    { name:'图片/语音上传 / 语速 / Toast', desc:'图片上传压缩、语音上传、语速设置、Toast 提示。', log:[] },
    { name:'占卜 / 朋友圈 / 留言板 / 星言信箱', desc:'塔罗/雷诺曼占卜、朋友圈动态、留言板、信件往来。', log:[] },
    { name:'我的页 / 心意字卡 / 交流意图', desc:'我的页面、心意字卡 v2、情绪/心意/意图卡。', log:[] },
    { name:'自动发送 / 设置 / 决策 / 音效', desc:'主动发送消息、回复设置、帮我决定/多人决定、音效。', log:['08-13 修复：主动发送消息开关需刷新才生效（改为即时重启调度）'] },
    { name:'星言日历 / 日记 / 收藏', desc:'星言日历、日记、我的收藏。', log:[] },
    { name:'番茄钟 / 自定义图标 / 更多面板', desc:'番茄钟专注、自定义图标、聊天栏更多功能面板。', log:['08-13 更多面板 AI 分类新增「使用说明」按钮'] },
    { name:'使用说明 / 礼物盒', desc:'使用说明（字卡传讯概念）、礼物盒（自定义礼物）。', log:['08-13 使用须知新增「同步更新」与「借鉴标注灵感来源」说明'] },
    { name:'联系人定制 / 底部导航 / 随机头像库', desc:'联系人输入栏定制、底部导航显隐排序、复制/收藏消息、随机头像库。', log:[] },
    { name:'PWA', desc:'Service Worker 注册、安装到桌面、离线可用、后台通知。', log:['08-13 修复：重复定义导致的脚本错误、通话小框无法拖动','08-13 更新机制优化：刷新优先加载最新版本'] },
    { name:'更新公告 / 使用须知 / 样式骨架', desc:'更新公告系统、使用须知、全部 CSS、页面骨架、字卡数据、塔罗/雷诺曼牌图。', log:['08-13 更新公告改为「更新说明」：标注每日小改动不逐一发公告、详细记录见功能上线时间','08-13 更多功能/设置页 emoji 图标去掉灰色底框','08-13 更多功能页功能项改为白底卡片（加边框与浅阴影）'] }
  ]},
  { date:'08-06', deploys:12, title:'迭代更新', items:[
    { name:'持续完善', desc:'当日 12 次部署，功能与修复密集。', log:[] }
  ]},
  { date:'08-07', deploys:3, title:'迭代更新', items:[
    { name:'细节修复', desc:'当日 3 次部署。', log:[] }
  ]},
  { date:'08-08', deploys:12, title:'功能扩展', items:[
    { name:'多项功能与修复', desc:'当日 12 次部署，功能与体验持续迭代。', log:[] }
  ]},
  { date:'08-09', deploys:2, title:'迭代更新', items:[
    { name:'细节修复', desc:'当日 2 次部署。', log:[] }
  ]},
  { date:'08-10', deploys:4, title:'迭代更新', items:[
    { name:'细节修复', desc:'当日 4 次部署。', log:[] }
  ]},
  { date:'08-11', deploys:6, title:'v1.7.3 · 互动与陪伴功能', items:[
    { name:'邀请 / 向TA提问', desc:'TA 主动发出邀请、你主动向 TA 提问，TA 用聊天字卡回复（接受/拒绝/未回应按概率）。', log:['08-13 聊天列表补上「TA的邀请」卡片预览'] },
    { name:'TA的询问 / TA的日常', desc:'TA 按概率主动发卡片提问（问题库按联系人独立，可接入 AI 按人设生成）；TA 的日常后台持续运行、随时查岗。', log:['08-13 卡片标题统一为「TA的询问」（原部分显示「TA的提问」）'] },
    { name:'星言存钱罐 / 星言翻牌', desc:'把想实现的事情存起来；和 TA 一起记忆翻牌（TA 会记住牌面、有自己的回合）。', log:[] },
    { name:'星言旅途（初版）', desc:'邀请多名梦角一起旅行：骰子动画、天气、任务、事件互动、旅行纪念卡。', log:['08-12 v1.7.4 重构为「陪伴旅行事件模拟器」','（源码文件 23c 尚未上传 GitHub，后续同步）'] }
  ]},
  { date:'08-12', deploys:4, title:'v1.7.4 · 重构与陪伴升级', items:[
    { name:'星言旅途重构', desc:'重构为「梦角陪伴旅行事件模拟器」：场景→动作→台词→互动→事件记忆，连续剧情链、旅行照片、阅读手账。', log:[] },
    { name:'星阅相伴 / 星影相伴', desc:'EPUB/TXT/PDF 阅读器与视频播放器，陪读/陪看字卡、边缘弹幕、多角色陪伴、时长统计与总结卡（PDF.js 库当日接入）。', log:[] },
    { name:'默契问答 / 星言纪念', desc:'双人互动小游戏（我们的答案/TA猜我/我猜TA，27 套默认问卷）；记录重要日子（时间轴+倒计时+当天互动）。', log:[] },
    { name:'梦角聊天回应系统 / 统一浅蓝配色', desc:'轻量连接词字卡库（102 张）让聊天更自然；全局强调色改为星言浅蓝、各页面统一配色。', log:[] }
  ]},
  { date:'08-13', title:'v1.7.5 · TA 系列互动', items:[
    { name:'TA的小问题', desc:'TA 偶尔出一道选择题交给你，选完 TA 再回应。选项对应专属回应不会串话；选中心里答案有「默契」彩蛋；一次聊天最多 1 个，偶尔可「继续问」（最多 3 题）；支持收藏、历史、自定义题库。', log:[] },
    { name:'TA的好奇', desc:'TA 想了解你这个人，开放式提问（绝不重复问选择题）。快捷回复或自由输入；回答后 TA 记住「已了解」的事不再重复问；偶尔自然追问；内置 29 道 7 分类题库，可自定义。', log:['08-13 管理页新增字卡库（可新增/停用/删除自定义好奇问题）'] },
    { name:'TA的吐槽', desc:'TA 偶尔忍不住插一句嘴，熟悉情侣之间的小调侃（不是批评）。说到「熬夜/忘事/吃多」等优先触发对应吐槽；回应后 TA 用聊天字卡接着聊；内置 44 句 5 分类，可按分类/触发词自定义。', log:['08-13 修复：回应后卡片里 TA 的回答显示空白（字段写入顺序错误）'] },
    { name:'TA系列使用说明', desc:'AI 分类新增「使用说明」按钮：说明五个 TA 功能（询问/小问题/好奇/邀请/吐槽）同一套设计逻辑——固定字卡稳定触发，AI 可选增强，不接入 AI 也完整可用。', log:[] },
    { name:'手机端修复', desc:'主动发送、撤回查看、表情数量、通话设置等多项手机端问题修复（详见更新公告）。', log:[] },
    { name:'UI 优化', desc:'emoji 图标去灰色底框、更多功能页卡片化、TA的询问 文案统一。', log:[] }
  ]}
];

function renderFeatureTimeline() {
  var list = document.getElementById('feature-timeline-list');
  if (!list) return;
  var html = '';
  html += '<div style="padding:10px 12px;background:#fdfaf5;border-radius:10px;margin-bottom:12px;font-size:12px;color:#8c7b6b;line-height:1.8;">'
    + '以下为星言每天的部署与功能上线记录（GitHub 共 171 次部署、180 次提交，数据来自 GitHub 部署/提交记录 + 各源码文件首次上传时间戳 + 更新公告）。<br>'
    + '说明：07-18 网站首次上线（单文件版本，当日即提交源码并部署）；07-18~08-04 为单文件期（功能逐日上线、有部署记录，源码未拆分、无文件级时间戳）；08-05 起源码拆分为 src 目录，每个功能均有独立文件、时间可逐一查证。</div>';
  FEATURE_TIMELINE.slice().reverse().forEach(function(group){
    html += '<div style="background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,0.05);box-shadow:0 1px 4px rgba(0,0,0,0.03);padding:14px;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">'
      + '<span style="background:var(--accent);color:#fff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:12px;flex-shrink:0;">' + group.date + '</span>'
      + (group.deploys ? '<span style="background:var(--c2);color:var(--txt2);font-size:11px;padding:2px 8px;border-radius:10px;flex-shrink:0;">部署 ' + group.deploys + ' 次</span>' : '')
      + '<span style="font-size:14px;font-weight:600;color:var(--txt);">' + group.title + '</span>'
      + '</div>';
    group.items.forEach(function(it){
      html += '<div style="padding:9px 0;border-top:1px solid rgba(0,0,0,0.04);">'
        + '<div style="font-size:13px;font-weight:600;color:var(--txt);">' + it.name + '</div>'
        + '<div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-top:3px;">' + it.desc + '</div>';
      if (it.log && it.log.length) {
        it.log.forEach(function(l){
          html += '<div style="font-size:11px;color:#a3704a;line-height:1.6;margin-top:2px;padding-left:10px;">✏️ ' + l + '</div>';
        });
      }
      html += '</div>';
    });
    html += '</div>';
  });
  html += '<div style="text-align:center;padding:16px 0 8px;font-size:11px;color:var(--txt3);">—— 功能上线时间 · 持续更新 ——</div>';
  list.innerHTML = html;
}

// 从开屏点击"使用须知"按钮：关闭开屏并进入使用须知页面
function showUsageNoticeFromSplash() {
  // #region debug-point B:splash-function
  console.log('[DEBUG] showUsageNoticeFromSplash called');
  // #endregion
  try{
    var ann = document.getElementById('announcement-screen');
    if (ann) {
      // #region debug-point B1:hide-announcement
      console.log('[DEBUG] hiding announcement screen');
      // #endregion
      ann.style.opacity = '0';
      ann.style.pointerEvents = 'none';
      setTimeout(function() {
        ann.style.display = 'none';
      }, 500);
    }
    var phone = document.querySelector('.phone');
    if (phone) {
      // #region debug-point B2:show-phone
      console.log('[DEBUG] showing phone');
      // #endregion
      phone.style.display = 'flex';
      phone.style.opacity = '1';
    }
    // 修复：先切换到使用须知页面，再显示 phone，避免用户看到短暂的聊天列表
    try{
      // #region debug-point B3:show-pg
      console.log('[DEBUG] showing pg-usage-notice');
      // #endregion
      showPg('pg-usage-notice');
      // #region debug-point B4:render-chatlist
      console.log('[DEBUG] rendering chat list');
      // #endregion
      renderChatList();
      // 首次强制模式：隐藏顶部返回栏和底部导航栏，显示开始按钮
      var seen = getNoticeSeen();
      // #region debug-point B5:check-notice-seen
      console.log('[DEBUG] getNoticeSeen:', seen);
      // #endregion
      if (!seen) {
        var nav = document.getElementById('usage-notice-nav');
        if (nav) nav.style.display = 'none';
        var tabs = document.getElementById('usage-notice-tabs');
        if (tabs) tabs.style.display = 'none';
        var startBtn = document.getElementById('usage-notice-start-btn');
        if (startBtn) startBtn.style.display = 'block';
      } else {
        // 非首次：确保导航栏和标签栏正常显示，隐藏强制按钮
        var startBtn = document.getElementById('usage-notice-start-btn');
        if (startBtn) startBtn.style.display = 'none';
      }
    }catch(e){
      console.error('showUsageNoticeFromSplash inner error:',e);
    }
  }catch(e){
    console.error('showUsageNoticeFromSplash error:',e);
    var phone = document.querySelector('.phone');
    if(phone){phone.style.display='flex';phone.style.opacity='1';}
    var ann = document.getElementById('announcement-screen');
    if(ann){ann.style.display='none';ann.style.pointerEvents='none';}
    try{showPg('pg-list');renderChatList();}catch(e2){}
  }
}

window.showUpdateNoticeManual = function() {
  var latestNotice = UPDATE_NOTICES[0];
  if (latestNotice) {
    showUpdateNotice(latestNotice);
  }
};

window.resetUpdateNoticeRead = function() {
  setLastReadVersion('0.0');
  toast('已重置阅读记录，刷新页面后将重新显示公告');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUpdateNotice);
} else {
  initUpdateNotice();
}


// ============ 星阅相伴 + 一起看字卡库 ============
var readBook={name:'',content:'',pages:[],page:0,perPage:8};
// ★ 书架：多本电子书
var readBooks=[];
function readShelfLoad(){
  readBooks=[];
  try{var a=ls('ml2_read_books');if(Array.isArray(a))readBooks=a;}catch(e){}
  if(!readBooks.length){
    try{
      var saved=ls('ml2_read_book');
      if(saved&&saved.name)readBooks=[saved];
    }catch(e2){}
    if(!readBooks.length&&window.localforage){
      window.localforage.getItem('ml2_read_book').then(function(big){
        if(big&&big.name&&!readBooks.length){readBooks=[big];readShelfSave();readRenderShelf();}
      }).catch(function(){});
    }
  }
}
function readShelfSave(){try{ls('ml2_read_books',readBooks);}catch(e){}}
// ★ 封面渲染：图片封面（EPUB 提取）或文字封面（书名首字渐变）
function readCoverHtml(b){
  if(b&&b.cover&&String(b.cover).indexOf('data:')===0){
    return '<img src="'+b.cover+'" style="width:100%;height:100%;object-fit:cover;" alt="">';
  }
  var ch=(b&&b.name||'书').trim().charAt(0)||'书';
  return '<span style="font-size:22px;font-weight:700;color:#444444;">'+String(ch).replace(/</g,'&lt;')+'</span>';
}
function readRenderShelf(){
  var list=$('read-shelf-list');
  if(!list)return;
  var kw=($('read-shelf-search')||{}).value||'';
  kw=kw.trim().toLowerCase();
  var cnt=$('read-shelf-count');
  if(cnt)cnt.textContent=readBooks.length?(readBooks.length+' 本'):'';
  var arr=readBooks.slice().sort(function(a,b){return (b.lastOpen||0)-(a.lastOpen||0);});
  if(_readShelfTab==='reading')arr=arr.filter(function(b){return b.progress&&b.progress>0&&b.progress<100&&!b.finished;});
  if(_readShelfTab==='finished')arr=arr.filter(function(b){return b.finished;});
  if(kw)arr=arr.filter(function(b){return String(b.name||'').toLowerCase().indexOf(kw)>=0;});
  list.innerHTML='';
  if(!arr.length){
    list.innerHTML='<div style="text-align:center;padding:40px 16px;color:var(--txt3);font-size:13px;line-height:2;">'+(readBooks.length?'没有找到匹配的书':'📭 书架还是空的<br>导入一本 TXT / EPUB / PDF 开始阅读')+'</div>';
    return;
  }
  arr.forEach(function(b){
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:12px;background:var(--c2);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:10px;cursor:pointer;';
    var pct=b.finished?100:Math.min(100,(b.progress||0));
    row.innerHTML='<div style="width:44px;height:58px;border-radius:6px;background:linear-gradient(160deg,#E3D6C4,#C9B49A);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.08);">'+readCoverHtml(b)+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="font-size:14px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+String(b.name||'未命名').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:11px;color:var(--txt3);margin-top:3px;">'+(b.finished?'✓ 已读完':(b.progress&&b.progress>0?'已读 '+Math.round(b.progress)+'%':'未读'))+(b.lastOpen?' · '+new Date(b.lastOpen).toLocaleString():'')+'</div>'
      +'<div style="margin-top:5px;height:3px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+pct+'%;background:var(--accent);"></div></div>'
      +'</div>'
      +'<span class="read-shelf-del" style="color:#ff4d4f;font-size:14px;flex-shrink:0;padding:4px;">🗑</span>';
    row.onclick=function(){readOpenBookById(b.id);};
    row.querySelector('.read-shelf-del').onclick=function(e){
      e.stopPropagation();
      if(confirm('删除《'+(b.name||'这本书')+'》？')){readBooks=readBooks.filter(function(x){return x.id!==b.id;});readShelfSave();readRenderShelf();}
    };
    list.appendChild(row);
  });
}
function readOpenBookById(id){
  var idx=readBooks.findIndex(function(x){return x.id===id;});
  if(idx>=0)readOpenBook(idx);
}
var _readShelfTab='all';
function readShelfTab(t){
  _readShelfTab=t;
  ['all','reading','finished'].forEach(function(x){
    var b=$('read-tab-'+x);
    if(b){b.style.background=x===t?'var(--accent)':'var(--c2)';b.style.color=x===t?'#fff':'var(--txt)';}
  });
  readRenderShelf();
}
function readSplitPages(content){
  var paras=String(content||'').split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
  var pages=[];
  for(var i=0;i<paras.length;i+=readBook.perPage){
    pages.push(paras.slice(i,i+readBook.perPage).join('\n\n'));
  }
  if(pages.length===0)pages=['（空）'];
  return pages;
}
function readBackShelf(){
  readSaveBookProgress();
  var sp=$('read-shelf-page'),bp=$('read-book-page');
  if(sp)sp.style.display='flex';
  if(bp)bp.style.display='none';
  readRenderShelf();
  try{var _sb=$('read-select-btn');if(_sb)_sb.style.display='none';}catch(e){}
}
function showReadTogether(){
  readShelfLoad();
  loadReadCards();
  loadReadSceneCards();
  readCompanyLoad();
  var sp=$('read-shelf-page'),bp=$('read-book-page');
  if(sp)sp.style.display='flex';
  if(bp)bp.style.display='none';
  readRenderShelf();
  showOv('ov-read-together');
}
function readUploadBook(inp){
  var file=inp&&inp.files&&inp.files[0];
  if(!file)return;
  if(/\.epub$/i.test(file.name)){readParseEpub(file);return;}
  if(/\.pdf$/i.test(file.name)){readParsePdf(file);return;}
  var reader=new FileReader();
  reader.onload=function(ev){
    // ★ 编码兼容：先按 UTF-8 严格解码，失败（GBK/ANSI 中文）自动降级 GBK
    var txt='';
    try{
      var _arr=ev.target.result;
      if(_arr&&_arr.byteLength){
        var _d1=new TextDecoder('utf-8',{fatal:true});
        txt=_d1.decode(_arr);
        if(txt.indexOf('\uFFFD')>=0)throw new Error('utf8-bad');
      }
    }catch(e1){
      try{txt=new TextDecoder('gbk').decode(ev.target.result);}catch(e2){
        try{txt=new TextDecoder('utf-8').decode(ev.target.result);}catch(e3){txt='';}
      }
    }
    if(!txt)txt=String(ev.target.result||'');
    var bookName=file.name.replace(/\.txt$/i,'');
    // ★ 加入书架（补齐 id/cover 字段，与 EPUB 一致）
    readShelfLoad();
    var dupIdx=readBooks.findIndex(function(b){return b.name===bookName;});
    var bookData={id:'b_'+Date.now().toString(36),name:bookName,content:txt,ts:Date.now(),cover:'',progress:0,finished:false,readSec:0};
    if(dupIdx>=0)readBooks[dupIdx]=bookData;else readBooks.unshift(bookData);
    readShelfSave();
    // 兼容：单本同步
    try{ls('ml2_read_book',bookData);}catch(e){}
    if(window.localforage){try{window.localforage.setItem('ml2_read_book',bookData).catch(function(){});}catch(e2){}}
    readOpenBook(dupIdx>=0?dupIdx:0);
    toast('已载入《'+bookName+'》');
    inp.value='';
  };
  reader.readAsArrayBuffer(file);   // ArrayBuffer + TextDecoder 编码兼容
}
function readRemoveBook(){
  if(!readBook.name){readBackShelf();return;}
  if(!confirm('移除《'+readBook.name+'》？'))return;
  var idx=readBooks.findIndex(function(b){return b.name===readBook.name;});
  if(idx>=0){readBooks.splice(idx,1);readShelfSave();}
  readBook={name:'',content:'',pages:[],page:0,perPage:8};
  try{ls('ml2_read_book','');}catch(e){}
  if(window.localforage)window.localforage.removeItem('ml2_read_book').catch(function(){});
  readBackShelf();
  toast('已移除');
}
function readRenderPage(){
  if(!readBook.pages.length)return;
  readLoadSettings();
  var content=$('read-book-content');
  if(content){
    if(readBookSettings.mode==='scroll'){
      content.innerHTML=readBook.pages.map(function(p,i){return '<p data-para="'+i+'" style="margin:0 0 1.2em;">'+String(p).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</p>';}).join('');
      if(readBook.scrollToPara>=0&&readBook.scrollToPara<readBook.pages.length){
        var ps=content.querySelectorAll('p');
        if(ps[readBook.scrollToPara])ps[readBook.scrollToPara].scrollIntoView();
        readBook.scrollToPara=-1;
      }
    }else{
      content.textContent=readBook.pages[readBook.page]||'';
    }
  }
  var pg=$('read-book-progress');
  if(pg)pg.textContent=readBookSettings.mode==='scroll'?'滚动阅读（共 '+readBook.pages.length+' 段）':'第 '+(readBook.page+1)+' / '+readBook.pages.length+' 页';
  readApplySettings();
}
function readToggleFullscreen(){
  var ov=$('ov-read-together');
  if(!ov)return;
  if(ov._readFs){
    ov._readFs=false;
    readExitRealFullscreen();
    return;
  }
  ov._readFs=true;
  try{
    var de=document.documentElement;
    if(de.requestFullscreen){
      de.requestFullscreen().then(function(){
        try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(e){}
        toast('已进入全屏（横屏）');
      }).catch(function(){readFsFallback(ov);});
    }else if(de.webkitRequestFullscreen){
      de.webkitRequestFullscreen();
      try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(e){}
    }else{
      readFsFallback(ov);
    }
  }catch(e){readFsFallback(ov);}
}
function readFsFallback(ov){
  ov._fsOrigStyle=ov.style.cssText;
  ov.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:99999;';
  try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(e){}
  toast('已进入全屏');
}
function readExitRealFullscreen(){
  try{
    if(document.exitFullscreen)document.exitFullscreen().catch(function(){});
    else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
    else if(document.webkitCancelFullScreen)document.webkitCancelFullScreen();
  }catch(e){}
  var ov=$('ov-read-together');
  if(ov&&ov._fsOrigStyle!==undefined){
    ov.style.cssText=ov._fsOrigStyle;
    ov._fsOrigStyle=undefined;
  }
}
function readNextPage(){
  if(!readBook.pages.length)return;
  if(readBookSettings.mode==='scroll'){var c=$('read-book-content');if(c)c.scrollTop+=c.clientHeight*0.8;readUpdateProgressBar();return;}
  if(readBook.page<readBook.pages.length-1){
    readBook.page++;
    readRenderPage();
    if(readBook.page>=readBook.pages.length-1){readMarkFinished();readShowReadSummary();}
    // ★ 翻页概率触发弹幕（随频率档位）
    if(readBookSettings.company!==false&&readCompanyFreqProb('page')&&(!window._lastReadDanmaku||Date.now()-window._lastReadDanmaku>10000)){
      window._lastReadDanmaku=Date.now();
      setTimeout(function(){readSceneDanmaku('reading');},300+Math.random()*700);
    }
  }else{
    toast('已经读到最后一页啦');
  }
}
function readPrevPage(){
  if(readBookSettings.mode==='scroll'){var c=$('read-book-content');if(c)c.scrollTop-=c.clientHeight*0.8;readUpdateProgressBar();return;}
  if(readBook.page>0){readBook.page--;readRenderPage();}
}
function readTriggerTA(){
  var card=readPickCard();
  if(!card){toast('字卡库还没有字卡，去「一起看字卡库」添加吧');return;}
  var c=contacts.find(function(x){return x.id===cid})||{name:'TA'};
  var r=confirm('『'+c.name+'』合上了书，轻轻说：\n\n「'+card.content+'」\n\n要发送到聊天里吗？');
  if(r&&cid&&typeof msgs==='function'){
    try{
      var m=msgs(cid);
      m.push({s:cid,t:card.content,ts:Date.now(),ty:'t',id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9)});
      if(cid===window.currentCid&&typeof renderMsgs==='function')renderMsgs(m);
      if(typeof renderChatList==='function')renderChatList();
      toast('TA 的话已发到聊天');
    }catch(e){}
  }
}
function readPickCard(){
  loadReadCards();
  var pool=[];
  var _rpcid=readCardsContactId||cid;
  if(readCardsTabNow==='private'&&_rpcid&&readCards.private[_rpcid]){
    var pc=readCards.private[_rpcid].filter(function(x){return x.cat===readCardsCatNow;});
    pool=pool.concat(pc);
  }
  var pub=readCards.public.filter(function(x){return x.cat===readCardsCatNow;});
  pool=pool.concat(pub);
  if(!pool.length)pool=readCards.public;
  if(!pool.length)return null;
  return pool[Math.floor(Math.random()*pool.length)];
}
function showReadCards(){
  loadReadCards();
  readCardsTab('public');
  readCardsCat('主字卡');
  showOv('ov-read-cards');
}
function readCardsTab(tab){
  readCardsTabNow=tab;
  var pb=$('read-cards-tab-public'),pv=$('read-cards-tab-private');
  if(tab==='public'){pb.style.background='var(--accent)';pb.style.color='#fff';pv.style.background='var(--c2)';pv.style.color='var(--txt)';}
  else{pv.style.background='var(--accent)';pv.style.color='#fff';pb.style.background='var(--c2)';pb.style.color='var(--txt)';}
  readCardsRenderList();
}
function readCardsCat(cat){
  readCardsCatNow=cat;
  ['主字卡','颜文字','emoji'].forEach(function(c2){
    var b=$('read-cat-'+c2);
    if(b){
      if(c2===cat){b.style.background='var(--accent)';b.style.color='#fff';}
      else{b.style.background='var(--c2)';b.style.color='var(--txt)';}
    }
  });
  readCardsRenderList();
}
function readCardsRenderList(){
  loadReadCards();
  readCardsContactSelect();
  var list=$('read-cards-list');
  if(!list)return;
  var pool=[];
  if(readCardsTabNow==='private'){
    var _cid=readCardsContactId||cid;
    pool=(_cid&&readCards.private[_cid])?readCards.private[_cid].filter(function(x){return x.cat===readCardsCatNow;}):[];
  }else{
    pool=readCards.public.filter(function(x){return x.cat===readCardsCatNow;});
  }
  if(!pool.length){list.innerHTML='<div style="text-align:center;padding:24px;color:var(--txt3);font-size:13px;">还没有字卡，在下面添加吧</div>';return;}
  var html='';
  pool.forEach(function(card,idx){
    html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--c2);border-radius:8px;margin-bottom:6px;">';
    html+='<div style="flex:1;font-size:13px;color:var(--txt);word-break:break-all;">'+card.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
    html+='<button onclick="readCardsDel('+idx+')" style="border:none;background:none;color:#ff4d4f;cursor:pointer;font-size:14px;padding:4px;">✕</button>';
    html+='</div>';
  });
  list.innerHTML=html;
}
function readCardsAdd(){
  var inp=$('read-cards-input');
  var val=inp?inp.value.trim():'';
  if(!val){toast('请输入字卡内容');return;}
  loadReadCards();
  if(readCardsTabNow==='private'){
    if(!readCards.private[cid])readCards.private[cid]=[];
    readCards.private[cid].push({cat:readCardsCatNow,content:val});
  }else{
    readCards.public.push({cat:readCardsCatNow,content:val});
  }
  saveReadCards();
  if(inp)inp.value='';
  readCardsRenderList();
  toast('已添加');
}
function readCardsDel(idx){
  loadReadCards();
  var pool=null;
  if(readCardsTabNow==='private'){
    if(cid&&readCards.private[cid])pool=readCards.private[cid].filter(function(x){return x.cat===readCardsCatNow;});
  }else{
    pool=readCards.public.filter(function(x){return x.cat===readCardsCatNow;});
  }
  if(!pool||idx<0||idx>=pool.length)return;
  var target=pool[idx];
  if(readCardsTabNow==='private'){
    readCards.private[cid]=readCards.private[cid].filter(function(x){return !(x.cat===target.cat&&x.content===target.content);});
  }else{
    readCards.public=readCards.public.filter(function(x){return !(x.cat===target.cat&&x.content===target.content);});
  }
  saveReadCards();
  readCardsRenderList();
}
try{loadReadCards();}catch(e){}

// ============ 星影相伴 ============
var readVideo=null; // {type:'local'|'bili', name, dataUrl?, url?}
function showReadVideo(){
  var saved=null;
  try{var lv=ls('ml2_read_video');if(lv&&lv.type)saved=lv;}catch(e){}
  if(window.localforage&&!saved){
    window.localforage.getItem('ml2_read_video').then(function(big){
      if(big&&big.type){saved=big;readVideo=saved;readVideoRender();}
    }).catch(function(){});
  }
  if(saved){readVideo=saved;readVideoRender();}
  else{
    readVideo=null;
    $('read-video-setup').style.display='block';
    $('read-video-play').style.display='none';
  }
  showOv('ov-read-video');
}
// ★ 全屏：旋转横屏 + 原生全屏；原生不可用走 CSS 模拟全屏（均带返回按钮）
function readVideoFullscreen(el){
  try{
    if(window.screen&&screen.orientation&&screen.orientation.lock&&typeof screen.orientation.lock==='function'){
      screen.orientation.lock('landscape').catch(function(){});
    }
  }catch(e){}
  var usedNative=false;
  try{
    if(el&&el.requestFullscreen){el.requestFullscreen().catch(function(){});usedNative=true;}
    else if(el&&el.webkitRequestFullscreen){el.webkitRequestFullscreen();usedNative=true;}
  }catch(e){}
  if(usedNative){
    // 原生全屏也放悬浮返回按钮
    if(!document.getElementById('read-fs-exit')){
      var eb=document.createElement('div');
      eb.id='read-fs-exit';
      eb.textContent='✕ 退出全屏';
      eb.style.cssText='position:fixed;top:12px;right:14px;z-index:99999;padding:6px 14px;border-radius:16px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;cursor:pointer;';
      eb.onclick=function(){
        if(document.exitFullscreen)document.exitFullscreen();
        else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
        var _e=document.getElementById('read-fs-exit');
        if(_e)_e.remove();
      };
      document.body.appendChild(eb);
      document.addEventListener('fullscreenchange',function _fs2(){
        if(!document.fullscreenElement&&!document.webkitFullscreenElement){
          var _e2=document.getElementById('read-fs-exit');
          if(_e2)_e2.remove();
          document.removeEventListener('fullscreenchange',_fs2);
        }
      });
    }
    return;
  }
  readSimulateFullscreen();
}
function readSimulateFullscreen(){
  var ov=$('ov-read-video');
  var exitBtn=document.getElementById('read-fs-exit');
  if(exitBtn){try{exitBtn.remove();}catch(e){}}
  if(ov&&ov._simFs){
    ov._simFs=false;
    var sheet=ov.querySelector('.sheet');
    if(sheet&&ov._simOrig)sheet.style.cssText=ov._simOrig;
    toast('已退出全屏');
    return;
  }
  if(!ov)return;
  var sheet=ov.querySelector('.sheet');
  if(!sheet)return;
  // ★ 模拟全屏也尝试锁横屏（手机端横屏观看）
  _rvLockLandscape();
  // 兜底：若弹窗被直接关闭导致残留全屏样式，先还原
  if(ov._simOrig)sheet.style.cssText=ov._simOrig;
  ov._simFs=true;
  ov._simOrig=sheet.style.cssText;
  sheet.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;max-width:none;border-radius:0;display:flex;flex-direction:column;background:#000;';
  var sh=sheet.querySelector('.sh');
  if(sh)sh.style.display='none';
  var sb=sheet.querySelector('.sb');
  if(sb)sb.style.cssText='flex:1;max-height:none;overflow:hidden;padding:0;display:flex;flex-direction:column;';
  var play=sheet.querySelector('#read-video-play');
  if(play)play.style.cssText='flex:1;display:flex;flex-direction:column;';
  var player=sheet.querySelector('#read-video-player');
  if(player)player.style.cssText='flex:1;width:100%;aspect-ratio:auto;border-radius:0;overflow:hidden;background:#000;';
  // 退出按钮
  var exitBtn=document.createElement('div');
  exitBtn.id='read-fs-exit';
  exitBtn.textContent='✕ 退出全屏';
  exitBtn.style.cssText='position:absolute;top:12px;right:14px;z-index:20;padding:6px 14px;border-radius:16px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;cursor:pointer;';
  exitBtn.onclick=function(){readSimulateFullscreen();};
  document.body.appendChild(exitBtn);
  toast('竖屏全屏（再点一次退出）');
}

// ★ 弹幕：在视频/阅读区飘过 TA 的话（右→左）
function readDanmakuText(){
  try{
    if(typeof globalCards!=='undefined'&&globalCards&&globalCards.length){
      var pool=globalCards.filter(function(c){return c&&c.content&&c.category!=='stickers'&&c.category!=='voices'&&c.category!=='image'&&c.category!=='kaomoji';});
      if(pool.length)return pool[Math.floor(Math.random()*pool.length)].content;
    }
  }catch(e){}
  var fallback=['好想你呀','一起看真好','这里好棒','想牵你的手','有你在真好','这个好看','我一直在你身边','下次也一起看吧','看得入迷了','偷偷看你一眼'];
  return fallback[Math.floor(Math.random()*fallback.length)];
}
function readDanmaku(text){
  var host=$('read-book-danmaku-layer');
  if(!host||host.offsetParent===null)host=$('read-video-player');
  if(!host||host.offsetParent===null)host=$('read-book-content');
  if(!host)return;
  if(host.style.position!=='absolute'&&host.style.position!=='relative')host.style.position='relative';
  var d=document.createElement('div');
  d.textContent=text||'…';
  d.style.cssText='position:absolute;top:'+(8+Math.random()*62)+'%;left:100%;z-index:9;white-space:nowrap;font-size:13px;color:#fff;background:rgba(0,0,0,0.5);padding:3px 12px;border-radius:12px;pointer-events:none;animation:readDanmakuMove '+(5+Math.random()*3)+'s linear forwards;';
  host.appendChild(d);
  setTimeout(function(){try{host.removeChild(d);}catch(e){}},9000);
}
// ============ 星阅 · 梦角陪读系统（场景字卡库 + 边缘卡片弹幕 + 多角色） ============
// 陪读场景字卡库：开始阅读 / 阅读中 / 看到精彩部分 / 阅读结束 / 暂停离开
var READ_SCENE_CATS=['开始阅读','阅读中','看到精彩部分','阅读结束','暂停离开'];
var READ_SCENE_DEFAULT={
  '开始阅读':['这本书，我想陪你一起看。','今天也想和你一起读点什么。','我坐到你旁边啦，开始吧。','翻开这一页，就像打开一个小世界。'],
  '阅读中':['看到这里了吗？','这一页好安静，像在等你翻过去。','你读得真认真，我在旁边不说话。','这一段，我觉得你会喜欢。','我偷偷看了你一眼，你都没发现。','书里的风好像吹到我这里来了。','慢慢读，我哪儿也不去。','你读到的地方，也是我想去的。'],
  '看到精彩部分':['这一页好看得让我都屏住呼吸了。','这里！这里我也好喜欢。','你发现了吗，这句话写得真好。','要是你在旁边读给我听就好了。','我们把这一页折个角吧。','这段我想记下来，和你一起记。'],
  '阅读结束':['读完啦，谢谢你带我看完这本书。','最后这一页，我陪你一起合上。','这本书的结局，我们改天再聊。','看完啦，有点舍不得合上。','下次再一起读下一本吧。'],
  '暂停离开':['先休息一下吧，我等你。','去吧，我在这页等你回来。','不急，书又不会跑。','回来的时候，我们还从这一页开始。']
};
var readSceneCards=null;
function loadReadSceneCards(){
  try{var d=ls('ml2_read_scene_cards');if(d&&typeof d==='object')readSceneCards=d;}catch(e){}
  if(!readSceneCards||typeof readSceneCards!=='object')readSceneCards={};
  READ_SCENE_CATS.forEach(function(cat){if(!Array.isArray(readSceneCards[cat]))readSceneCards[cat]=[];});
}
function saveReadSceneCards(){
  try{ls('ml2_read_scene_cards',readSceneCards);}catch(e){}
  if(window.localforage)window.localforage.setItem('ml2_read_scene_cards',readSceneCards).catch(function(){});
}
function readScenePool(cat){
  loadReadSceneCards();
  var user=readSceneCards[cat]||[];
  if(user.length)return user;
  return READ_SCENE_DEFAULT[cat]||[];
}
// 陪读角色（多选，持久化 ml2_read_company；兼容旧单值 readCompanyContactId）
var readCompanyIds=[];
function readCompanyLoad(){
  readCompanyIds=[];
  try{
    var v=ls('ml2_read_company');
    if(Array.isArray(v)){readCompanyIds=v;}
    else if(readCompanyContactId){readCompanyIds=[readCompanyContactId];}
  }catch(e){}
}
function readCompanySave(){
  try{ls('ml2_read_company',readCompanyIds);}catch(e){}
  if(window.localforage)window.localforage.setItem('ml2_read_company',readCompanyIds).catch(function(){});
}
function readCompanyPickRandom(){
  readCompanyLoad();
  if(!readCompanyIds.length)return null;
  return readCompanyIds[Math.floor(Math.random()*readCompanyIds.length)];
}
function readCompanyName(id){
  var c=contacts.find(function(x){return x.id===id;});
  return c?(c.name||'TA'):'TA';
}
// 弹幕频率：低/中/高 → 翻页概率 + 定时间隔(ms)
function readCompanyFreqProb(kind){
  var f=readBookSettings.companyFreq||'中';
  if(kind==='page'){
    return f==='低'?0.08:(f==='高'?0.3:0.16);
  }
  return f==='低'?600000:(f==='高'?180000:420000); // 定时: 10min/3min/7min
}
// ★ 陪读定时器：阅读中每 3~10 分钟（按频率）触发一条（分页/滚动均生效）
var _readCompanyTimer=null;
function readStartCompanyTimer(){
  try{if(_readCompanyTimer)clearInterval(_readCompanyTimer);}catch(e){}
  _readCompanyTimer=null;
  if(readBookSettings.company===false)return;
  var base=readCompanyFreqProb('timer');
  var tick=function(){
    if(!readBook||!readBook.name)return;
    if($('ov-read-together')&&$('ov-read-together').classList&&$('ov-read-together').classList.contains('show')){
      readSceneDanmaku('reading');
    }
  };
  _readCompanyTimer=setInterval(tick,base);
}
// ★ 边缘小卡片弹幕（不遮挡正文、非黑底滚动）：右下角淡入停留淡出
function readSceneDanmaku(cat){
  if(readBookSettings.company===false)return;
  var host=$('read-book-danmaku-layer');
  if(!host)return;
  var text='';
  // 来源：陪读场景库约 60% + 原聊天字卡库约 40%
  if(Math.random()<0.6){
    var pool=readScenePool(cat);
    if(pool.length)text=pool[Math.floor(Math.random()*pool.length)];
  }
  if(!text)text=readDanmakuText();
  if(!text)return;
  var cid2=readCompanyPickRandom();
  var role=readCompanyName(cid2);
  window._readDanmakuCount=(window._readDanmakuCount||0)+1;
  var d=document.createElement('div');
  d.className='read-danmaku-card';
  d.innerHTML='<span class="read-dk-role">'+String(role).replace(/</g,'&lt;')+'</span><span class="read-dk-text">'+String(text).replace(/</g,'&lt;')+'</span>';
  host.appendChild(d);
  setTimeout(function(){try{host.removeChild(d);}catch(e){}},5200);
}
// 陪读字卡库管理弹窗
function showReadSceneCards(){
  loadReadSceneCards();
  var list=$('read-scene-cards-list');
  if(!list)return;
  var html='';
  READ_SCENE_CATS.forEach(function(cat,ci){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+cat+'</div>';
    var pool=readSceneCards[cat]||[];
    var def=READ_SCENE_DEFAULT[cat]||[];
    var all=pool.length?pool:def;
    all.forEach(function(t,idx){
      html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
        +'<div style="flex:1;font-size:12px;color:var(--txt);background:var(--c2);border-radius:8px;padding:6px 9px;word-break:break-all;">'+String(t).replace(/</g,'&lt;')+(pool.length?'':'<span style="color:var(--txt3);font-size:10px;">（默认）</span>')+'</div>'
        +'<button onclick="readSceneCardDel('+ci+','+idx+')" style="border:none;background:none;color:#ff4d4f;font-size:13px;cursor:pointer;">✕</button>'
        +'</div>';
    });
    html+='<div style="display:flex;gap:6px;margin-top:4px;"><input id="read-scene-inp-'+ci+'" type="text" placeholder="添加一条陪读台词…" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c2);color:var(--txt);font-size:12px;outline:none;min-width:0;"><button onclick="readSceneCardAdd('+ci+')" style="padding:7px 12px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">添加</button></div>';
  });
  list.innerHTML=html;
  showOv('ov-read-scene-cards');
}
function readSceneCardAdd(ci){
  var inp=$('read-scene-inp-'+ci);
  var v=inp?inp.value.trim():'';
  if(!v){toast('请输入内容');return;}
  loadReadSceneCards();
  readSceneCards[READ_SCENE_CATS[ci]].push(v);
  saveReadSceneCards();
  showReadSceneCards();
}
function readSceneCardDel(ci,idx){
  loadReadSceneCards();
  var cat=READ_SCENE_CATS[ci];
  var pool=readSceneCards[cat]||[];
  if(idx>=pool.length){toast('默认台词不可删除');return;}
  pool.splice(idx,1);
  saveReadSceneCards();
  showReadSceneCards();
}
// ★ 阅读总结卡（读完全书弹窗）
function readShowReadSummary(){
  var b=readBooks.find(function(x){return x.id===readBook.id;});
  if(!b)return;
  var secs=(b.readSec||0)+((readBook.startTs)?Math.round((Date.now()-readBook.startTs)/1000):0);
  var mins=Math.max(1,Math.round(secs/60));
  var box=$('read-summary-body');
  if(!box)return;
  readCompanyLoad();
  var roles=readCompanyIds.length?readCompanyIds.map(function(id){return readCompanyName(id);}).join('、'):'（未选择）';
  box.innerHTML=
    '<div style="text-align:center;padding:6px 0 10px;"><div style="font-size:30px;">📖</div><div style="font-size:17px;font-weight:700;color:#444444;margin-top:4px;">今日阅读</div></div>'
    +'<div class="jrn-divider" style="border-top:1px dashed rgba(160,121,85,0.35);margin:8px 0;"></div>'
    +'<div style="font-size:13px;color:#444444;line-height:2;">书名：<b>'+String(b.name||'').replace(/</g,'&lt;')+'</b></div>'
    +'<div style="font-size:13px;color:#444444;">阅读时间：约 '+mins+' 分钟</div>'
    +'<div style="font-size:13px;color:#444444;">陪读：'+roles+'</div>'
    +'<div style="font-size:13px;color:#444444;">收到弹幕：'+((window._readDanmakuCount)||0)+' 条</div>'
    +'<div style="font-size:12px;color:#6f6a62888;margin-top:8px;line-height:1.8;">读完一本书的感觉，像一起走完了一段路。</div>';
  showOv('ov-read-summary');
}
function readSummaryAgain(){hideOv('ov-read-summary');readOpenBook(readBooks.findIndex(function(x){return x.id===readBook.id;}));}
function readSummaryBack(){hideOv('ov-read-summary');readBackShelf();}
// ★ 划线互动：选中文字 → 浮动按钮"让TA看看" → 陪读回应
function readBindSelection(){
  var content=$('read-book-content');
  if(!content||content._readSelBound)return;
  content._readSelBound=true;
  content.addEventListener('mouseup',function(){
    setTimeout(readCheckSelection,120);
  });
  content.addEventListener('touchend',function(){
    setTimeout(readCheckSelection,260);
  });
}
function readCheckSelection(){
  var sel=window.getSelection&&window.getSelection();
  var txt=sel?String(sel.toString()||'').trim():'';
  if(!txt){readHideSelectBtn();return;}
  if(txt.length>60)txt=txt.slice(0,60);
  readShowSelectBtn(txt);
}
function readShowSelectBtn(txt){
  var btn=$('read-select-btn');
  if(!btn){
    btn=document.createElement('div');
    btn.id='read-select-btn';
    btn.style.cssText='position:fixed;bottom:96px;left:50%;transform:translateX(-50%);z-index:9998;padding:9px 16px;border-radius:20px;background:#A07955;color:#fff;font-size:13px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,0.2);';
    btn.addEventListener('click',function(){
      var t=btn.getAttribute('data-txt')||'这一段';
      hideSelBtnEl(btn);
      // 陪读回应：取"看到精彩部分"或阅读中台词
      var pool=readScenePool('看到精彩部分').concat(readScenePool('阅读中'));
      var line=pool[Math.floor(Math.random()*pool.length)]||'这句话，我也想记下来。';
      readSceneDanmaku('看到精彩部分');
      readTriggerLine('「'+t+'」——'+line);
    });
    document.body.appendChild(btn);
  }
  btn.textContent='💬 让TA看看这段话';
  btn.setAttribute('data-txt',txt);
  btn.style.display='block';
}
function readHideSelectBtn(){
  var btn=$('read-select-btn');
  if(btn)btn.style.display='none';
}
function readTriggerLine(text){
  var cid2=readCompanyPickRandom();
  if(cid2&&cid2!==SELF&&typeof msgs==='function'){
    try{
      var m=msgs(cid2);
      m.push({s:cid2,t:text,ts:Date.now(),ty:'t',id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9)});
      if(cid2===window.currentCid&&typeof renderMsgs==='function')renderMsgs(m);
      if(typeof renderChatList==='function')renderChatList();
    }catch(e){}
  }
}
function hideSelBtnEl(el){try{if(el&&el.parentNode)el.parentNode.removeChild(el);}catch(e){}}
try{loadReadSceneCards();readCompanyLoad();}catch(e){}
// ============ 星影相伴 · 梦角陪看系统（一起看字卡库 + 边缘卡片弹幕 + 多角色） ============
// 一起看字卡库（视频）：开始观看 / 观看中 / 看到精彩部分 / 暂停时 / 观看结束
var READ_VIDEO_SCENE_CATS=['开始观看','观看中','看到精彩部分','暂停时','观看结束'];
var READ_VIDEO_SCENE_DEFAULT={
  '开始观看':['这个视频，我想陪你一起看。','我坐好啦，开始吧。','今天也要一起看点什么。','你按播放吧，我准备好了。'],
  '观看中':['看到这里了吗？','这一段画面好喜欢。','你专注的样子，和画面一样好看。','这个镜头，想和你一起看第二遍。','嘘，认真看。'],
  '看到精彩部分':['这里！这里好精彩！','刚才那一幕你看到了吗？','这一段值得倒回去再看一遍。','画面好漂亮，想截下来。','这里我起鸡皮疙瘩了。'],
  '暂停时':['先暂停休息一下？','你去忙，我在这儿等你。','喝水休息一下再继续。','画面停在这里，像在等我们说话。'],
  '观看结束':['看完啦，谢谢你陪我看完。','这个结局，我们改天再聊。','最后这一幕，我想记下来。','下次再一起看下一部吧。']
};
var readVideoCards=null;
function loadReadVideoCards(){
  try{var d=ls('ml2_read_video_cards');if(d&&typeof d==='object')readVideoCards=d;}catch(e){}
  if(!readVideoCards||typeof readVideoCards!=='object')readVideoCards={};
  READ_VIDEO_SCENE_CATS.forEach(function(cat){if(!Array.isArray(readVideoCards[cat]))readVideoCards[cat]=[];});
}
function saveReadVideoCards(){
  try{ls('ml2_read_video_cards',readVideoCards);}catch(e){}
  if(window.localforage)window.localforage.setItem('ml2_read_video_cards',readVideoCards).catch(function(){});
}
function readVideoScenePool(cat){
  loadReadVideoCards();
  var user=readVideoCards[cat]||[];
  if(user.length)return user;
  return READ_VIDEO_SCENE_DEFAULT[cat]||[];
}
// 陪看设置（持久化 ml2_read_video_settings）
var readVideoSettings={company:true,freq:'中',source:'all',autoPlay:true};
function readVideoSettingsLoad(){
  try{var s=ls('ml2_read_video_settings');if(s&&typeof s==='object'){for(var k in readVideoSettings){if(s[k]!==undefined)readVideoSettings[k]=s[k];}}}catch(e){}
}
function readVideoSettingsSave(){
  try{ls('ml2_read_video_settings',readVideoSettings);}catch(e){}
}
// 陪看多角色（持久化 ml2_read_video_company）
var readVideoCompanyIds=[];
function readVideoCompanyLoad(){
  readVideoCompanyIds=[];
  try{var v=ls('ml2_read_video_company');if(Array.isArray(v))readVideoCompanyIds=v;}catch(e){}
}
function readVideoCompanySave(){
  try{ls('ml2_read_video_company',readVideoCompanyIds);}catch(e){}
}
function readVideoCompanyRandom(){
  readVideoCompanyLoad();
  if(!readVideoCompanyIds.length)return null;
  return readVideoCompanyIds[Math.floor(Math.random()*readVideoCompanyIds.length)];
}
function readVideoCompanyName(id){
  var c=contacts.find(function(x){return x.id===id;});
  return c?(c.name||'TA'):'TA';
}
// 弹幕频率：低/中/高 → 定时间隔(ms)
function readVideoFreqInterval(){
  var f=readVideoSettings.freq||'中';
  return f==='低'?600000:(f==='高'?180000:420000);
}
// ★ 弹幕来源：一起看字卡库 / 聊天字卡库（按设置 source: all|scene|chat）
function readVideoDkText(cat){
  var src=readVideoSettings.source||'all';
  if(src==='chat')return readDanmakuText();
  var pool=readVideoScenePool(cat);
  if(src==='scene'&&pool.length)return pool[Math.floor(Math.random()*pool.length)];
  if(src==='all'){
    if(pool.length&&Math.random()<0.6)return pool[Math.floor(Math.random()*pool.length)];
    return readDanmakuText();
  }
  return pool[Math.floor(Math.random()*pool.length)]||readDanmakuText();
}
// ★ 边缘小卡片弹幕（右下角、半透明深蓝底、角色名标签，不遮挡画面）
function readVideoSceneDanmaku(cat){
  if(readVideoSettings.company===false)return;
  var host=$('read-video-danmaku-layer');
  if(!host)return;
  var text=readVideoDkText(cat);
  if(!text)return;
  var cid2=readVideoCompanyRandom();
  var role=readVideoCompanyName(cid2);
  window._readVideoDkCount=(window._readVideoDkCount||0)+1;
  var d=document.createElement('div');
  d.className='read-dk-video';
  d.innerHTML='<span class="read-dk-role">'+String(role).replace(/</g,'&lt;')+'</span><span class="read-dk-text">'+String(text).replace(/</g,'&lt;')+'</span>';
  host.appendChild(d);
  setTimeout(function(){try{host.removeChild(d);}catch(e){}},5200);
}
// 一起看字卡库管理弹窗
function showReadVideoCards(){
  loadReadVideoCards();
  var list=$('read-video-cards-list');
  if(!list)return;
  var html='';
  READ_VIDEO_SCENE_CATS.forEach(function(cat,ci){
    html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+cat+'</div>';
    var pool=readVideoCards[cat]||[];
    var def=READ_VIDEO_SCENE_DEFAULT[cat]||[];
    var all=pool.length?pool:def;
    all.forEach(function(t,idx){
      html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
        +'<div style="flex:1;font-size:12px;color:var(--txt);background:var(--c2);border-radius:8px;padding:6px 9px;word-break:break-all;">'+String(t).replace(/</g,'&lt;')+(pool.length?'':'<span style="color:var(--txt3);font-size:10px;">（默认）</span>')+'</div>'
        +'<button onclick="readVideoCardDel('+ci+','+idx+')" style="border:none;background:none;color:#ff4d4f;font-size:13px;cursor:pointer;">✕</button>'
        +'</div>';
    });
    html+='<div style="display:flex;gap:6px;margin-top:4px;"><input id="read-video-card-inp-'+ci+'" type="text" placeholder="添加一条陪看台词…" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c2);color:var(--txt);font-size:12px;outline:none;min-width:0;"><button onclick="readVideoCardAdd('+ci+')" style="padding:7px 12px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">添加</button></div>';
  });
  list.innerHTML=html;
  showOv('ov-read-video-cards');
}
function readVideoCardAdd(ci){
  var inp=$('read-video-card-inp-'+ci);
  var v=inp?inp.value.trim():'';
  if(!v){toast('请输入内容');return;}
  loadReadVideoCards();
  readVideoCards[READ_VIDEO_SCENE_CATS[ci]].push(v);
  saveReadVideoCards();
  showReadVideoCards();
}
function readVideoCardDel(ci,idx){
  loadReadVideoCards();
  var cat=READ_VIDEO_SCENE_CATS[ci];
  var pool=readVideoCards[cat]||[];
  if(idx>=pool.length){toast('默认台词不可删除');return;}
  pool.splice(idx,1);
  saveReadVideoCards();
  showReadVideoCards();
}
// 陪看设置弹窗
function readVideoShowSettings(){
  readVideoSettingsLoad();
  var box=$('read-video-settings-body');
  if(!box)return;
  var st=readVideoSettings;
  box.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">'
    +'<span style="font-size:13px;color:var(--txt);">梦角陪看</span>'
    +'<button onclick="readVideoSetToggle(\'company\')" id="rvset-company" style="padding:5px 14px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;cursor:pointer;">'+(st.company?'开':'关')+'</button></div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">'
    +'<span style="font-size:13px;color:var(--txt);">弹幕频率</span>'
    +'<span><button onclick="readVideoSetFreq(\'低\')" style="padding:5px 11px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;cursor:pointer;">低</button> <button onclick="readVideoSetFreq(\'中\')" style="padding:5px 11px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;cursor:pointer;">中</button> <button onclick="readVideoSetFreq(\'高\')" style="padding:5px 11px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;cursor:pointer;">高</button></span></div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);">'
    +'<span style="font-size:13px;color:var(--txt);">弹幕来源</span>'
    +'<select id="rvset-source" onchange="readVideoSetSource(this.value)" style="padding:5px 8px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;">'
    +'<option value="all"'+(st.source==='all'?' selected':'')+'>一起看 + 聊天字卡</option>'
    +'<option value="scene"'+(st.source==='scene'?' selected':'')+'>仅一起看字卡</option>'
    +'<option value="chat"'+(st.source==='chat'?' selected':'')+'>仅聊天字卡</option></select></div>'
    +'<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;">'
    +'<span style="font-size:13px;color:var(--txt);">自动播放</span>'
    +'<button onclick="readVideoSetToggle(\'autoPlay\')" id="rvset-autoplay" style="padding:5px 14px;border:1px solid var(--border);border-radius:8px;background:var(--c2);font-size:12px;cursor:pointer;">'+(st.autoPlay?'开':'关')+'</button></div>';
  showOv('ov-read-video-settings');
}
function readVideoSetToggle(k){
  readVideoSettings[k]=!readVideoSettings[k];
  readVideoSettingsSave();
  var b=$('rvset-'+k);
  if(b)b.textContent=readVideoSettings[k]?'开':'关';
  if(k==='company'){var cb=$('read-video-company-btn');if(cb)cb.style.background=readVideoSettings.company?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.05)';}
  toast(readVideoSettings[k]?'已开启':'已关闭');
}
function readVideoSetFreq(v){
  readVideoSettings.freq=v;
  readVideoSettingsSave();
  toast('弹幕频率：'+v);
}
function readVideoSetSource(v){
  readVideoSettings.source=v;
  readVideoSettingsSave();
  toast('弹幕来源已更新');
}
// 陪看角色多选弹窗
function readVideoShowCompanyPick(){
  readVideoCompanyLoad();
  var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
  var html='';
  if(!arr.length)html='<div style="padding:20px;text-align:center;color:var(--txt3);font-size:13px;">还没有联系人</div>';
  arr.forEach(function(c){
    var sel=readVideoCompanyIds.indexOf(c.id)>=0;
    html+='<div onclick="readVideoToggleCompanyPick(\''+c.id+'\')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:8px;">'
      +'<div style="width:30px;height:30px;border-radius:50%;background:var(--c2);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:14px;">'+(c.avatar?'<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;">':'💫')+'</div>'
      +'<div style="flex:1;font-size:13px;color:var(--txt);">'+String(c.name||'TA').replace(/</g,'&lt;')+'</div>'
      +(sel?'<span style="font-size:12px;color:var(--accent);">✓ 陪看中</span>':'')+'</div>';
  });
  html+='<div style="padding:12px 14px;"><button onclick="readVideoCompanyPickDone()" style="width:100%;padding:10px 0;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">完成</button></div>';
  var lst=$('read-bookmark-list');
  if(lst)lst.innerHTML='<div style="padding:12px 14px;font-size:14px;font-weight:600;color:var(--txt);">👥 选择陪看梦角（可多选）</div>'+html;
  showOv('ov-read-bookmarks');
}
function readVideoToggleCompanyPick(id){
  readVideoCompanyLoad();
  var idx=readVideoCompanyIds.indexOf(id);
  if(idx>=0)readVideoCompanyIds.splice(idx,1);
  else readVideoCompanyIds.push(id);
  readVideoCompanySave();
  readVideoShowCompanyPick();
}
function readVideoCompanyPickDone(){
  hideOv('ov-read-bookmarks');
  toast(readVideoCompanyIds.length?('已选择 '+readVideoCompanyIds.length+' 位陪看梦角'):'暂不选择陪看梦角');
}
// ★ 观看总结卡
function readVideoShowSummary(){
  var v=_readCurVideo;
  if(!v)return;
  var box=$('read-video-summary-body');
  if(!box)return;
  readVideoCompanyLoad();
  var roles=readVideoCompanyIds.length?readVideoCompanyIds.map(function(id){return readVideoCompanyName(id);}).join('、'):'（未选择）';
  var mins=Math.max(1,Math.round((v.watchSec||0)/60));
  box.innerHTML=
    '<div style="text-align:center;padding:6px 0 10px;"><div style="font-size:30px;">🎬</div><div style="font-size:17px;font-weight:700;color:#444444;margin-top:4px;">本次观看</div></div>'
    +'<div style="border-top:1px dashed rgba(160,121,85,0.35);margin:8px 0;"></div>'
    +'<div style="font-size:13px;color:#444444;line-height:2;">视频：<b>'+String(v.name||'').replace(/</g,'&lt;')+'</b></div>'
    +'<div style="font-size:13px;color:#444444;">观看时间：约 '+mins+' 分钟</div>'
    +'<div style="font-size:13px;color:#444444;">陪看：'+roles+'</div>'
    +'<div style="font-size:13px;color:#444444;">收到弹幕：'+((window._readVideoDkCount)||0)+' 条</div>'
    +'<div style="font-size:12px;color:#6f6a62888;margin-top:8px;line-height:1.8;">一起看完一段视频的感觉，像一起度过了一段时光。</div>';
  showOv('ov-read-video-summary');
}
function readVideoSummaryAgain(){hideOv('ov-read-video-summary');if(_readCurVideo)readOpenVideo(_readCurVideo.id);}
function readVideoSummaryBack(){hideOv('ov-read-video-summary');readVideoBackLib();}
try{loadReadVideoCards();readVideoSettingsLoad();readVideoCompanyLoad();}catch(e){}
// ============ 星影相伴（完整播放器） ============
var readVideos=readVideoLoad();
var _readCurVideo=null;
function readVideoLoad(){
  var v=null;
  try{v=ls('ml2_read_videos');}catch(e){}
  if(!Array.isArray(v))v=[];
  if(!v.length){
    try{
      var old=ls('ml2_read_video');
      if(old&&old.name){old.id='v_'+Date.now().toString(36);v.push(old);try{ls('ml2_read_videos',v);}catch(e){}}
    }catch(e){}
  }
  return v;
}
function readVideoSave(){
  try{ls('ml2_read_videos',readVideos);}catch(e){}
  if(window.localforage)window.localforage.setItem('ml2_read_videos',readVideos).catch(function(){});
}
function showReadVideo(){
  var lib=$('read-video-lib'),play=$('read-video-play');
  if(lib)lib.style.display='block';
  if(play)play.style.display='none';
  renderVideoLib();
  showOv('ov-read-video');
}
function renderVideoLib(){
  var list=$('read-video-list');
  if(!list)return;
  var cnt=$('read-video-lib-count');
  if(cnt)cnt.textContent=readVideos.length?(readVideos.length+' 个'):'';
  list.innerHTML='';
  if(!readVideos.length){
    list.innerHTML='<div style="text-align:center;padding:24px 12px;color:var(--txt3);font-size:13px;line-height:2;">🎬 视频库还是空的<br>导入本地视频或添加哔哩哔哩视频</div>';
    return;
  }
  readVideos.slice().reverse().forEach(function(v){
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--c2);border:1px solid var(--border);border-radius:12px;padding:9px 12px;margin-bottom:8px;cursor:pointer;';
    row.innerHTML='<div style="width:52px;height:36px;border-radius:6px;background:linear-gradient(160deg,#2b2b33,#1a1a20);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;flex-shrink:0;">'+(v.type==='bili'?'📺':'🎞️')+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="font-size:13px;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+String(v.name||'视频').replace(/</g,'&lt;')+'</div>'
      +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+(v.type==='bili'?'哔哩哔哩':'本地')+(v.progress?' · 已看 '+Math.round(v.progress)+'%':'')+(v.lastWatch?' · '+new Date(v.lastWatch).toLocaleString():'')+'</div>'
      +'</div>'
      +'<span style="color:var(--txt3);font-size:12px;flex-shrink:0;">▶</span>';
    row.onclick=function(){readOpenVideo(v.id);};
    list.appendChild(row);
  });
}
function readOpenVideo(id){
  var v=readVideos.find(function(x){return x.id===id;});
  if(!v)return;
  _readCurVideo=v;
  var lib=$('read-video-lib'),play=$('read-video-play');
  if(lib)lib.style.display='none';
  if(play){play.style.display='block';var tt=$('read-video-title');if(tt)tt.textContent=v.name||'视频';}
  var info=$('read-video-info');
  if(info)info.textContent=(v.type==='bili'?'来源：哔哩哔哩'+(v.bvid?' · BV '+v.bvid:'') : '来源：本地视频')+(v.progress?' · 上次看到 '+Math.round(v.progress)+'%':'');
  renderVideoPlayer(v);
}
function readVideoBackLib(){
  var lib=$('read-video-lib'),play=$('read-video-play');
  if(lib)lib.style.display='block';
  if(play)play.style.display='none';
  readVideoExitFullscreen();
  renderVideoLib();
}
function renderVideoPlayer(v){
  var player=$('read-video-player');
  if(!player)return;
  var el=$('read-video-el');
  var dk=$('read-video-danmaku-layer');
  var pop=$('read-video-pop');
  if(dk)dk.innerHTML='';
  if(pop)pop.style.display='none';
  // ★ 本次观看会话：弹幕计数重置 + 开始观看弹幕
  window._readVideoDkCount=0;
  if(v&&v.type==='local'){setTimeout(function(){readVideoSceneDanmaku('开始观看');},900+Math.random()*1200);}
  readVideoSettingsLoad();
  var biliEl=$('read-video-bili-frame');
  if(v.type==='local'){
    if(el){
      el.style.display='block';
      if(biliEl){try{player.removeChild(biliEl);}catch(e){}}
      el.src=v.dataUrl;
      el.controls=false;
      try{if(v.progressSec&&v.progressSec<el.duration)el.currentTime=v.progressSec;}catch(e){}
      el.ontimeupdate=function(){
        readVideoUpdateUI();
        if(el.duration){v.progress=el.currentTime/el.duration*100;v.progressSec=el.currentTime;v.lastWatch=Date.now();}
      };
      el.onplay=function(){readVideoPlayBtn(true);};
      el.onpause=function(){readVideoPlayBtn(false);readVideoSceneDanmaku('暂停时');};
      el.onended=function(){readVideoOnEnd();};
      el.onclick=function(){readVideoToggleUI();};
      readVideoBindCompany(el);
      readVideoBindAutoHide();
      // ★ 自动播放设置
      if(readVideoSettings.autoPlay){el.play().catch(function(){});}
      else{readVideoUpdateUI();}
    }
  }else{
    if(el)el.style.display='none';
    var bvid=v.bvid||'';
    var ifr=document.createElement('iframe');
    ifr.id='read-video-bili-frame';
    ifr.src='https://player.bilibili.com/player.html?bvid='+bvid+'&page=1&high_quality=1&danmaku=1&as_wide=1';
    ifr.style.cssText='width:100%;aspect-ratio:16/9;border:none;display:block;';
    ifr.setAttribute('scrolling','no');
    ifr.setAttribute('frameborder','0');
    ifr.setAttribute('allowfullscreen','true');
    ifr.setAttribute('allow','fullscreen; autoplay; encrypted-media; picture-in-picture');
    player.appendChild(ifr);
    readVideoBindBiliCompany(player);
    // B站 无暂停事件：定时器在 readVideoBindBiliCompany 内按频率触发
  }
  // ★ 陪看/字卡/设置按钮状态同步
  var cb=$('read-video-company-btn');
  if(cb)cb.style.background=readVideoSettings.company?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.05)';
}
function readVideoPlayPause(){
  var el=$('read-video-el');
  if(!el)return;
  if(el.paused){el.play();}else{el.pause();}
}
function readVideoPlayBtn(playing){
  var b=$('read-video-play-btn');
  if(b)b.textContent=playing?'⏸':'▶';
}
function readVideoUpdateUI(){
  var el=$('read-video-el');
  if(!el)return;
  var t=$('read-video-time');
  if(t)t.textContent=readVfmt(el.currentTime)+' / '+readVfmt(el.duration);
  var fill=$('read-video-progress-fill'),dot=$('read-video-progress-dot');
  var pct=el.duration?el.currentTime/el.duration*100:0;
  if(fill)fill.style.width=pct+'%';
  if(dot)dot.style.left=pct+'%';
}
function readVfmt(s){
  s=Math.floor(s||0);
  var m=Math.floor(s/60),ss=s%60;
  return ('0'+m).slice(-2)+':'+('0'+ss).slice(-2);
}
function readVideoSeek(ev){
  var el=$('read-video-el');
  var bar=document.getElementById('read-video-progress-bar');
  if(!el||!bar||!el.duration)return;
  var rect=bar.getBoundingClientRect();
  var ratio=Math.max(0,Math.min(1,(ev.clientX-rect.left)/rect.width));
  el.currentTime=ratio*el.duration;
  readVideoUpdateUI();
}
function readVideoRate(){
  var el=$('read-video-el');
  if(!el)return;
  var rates=[0.5,0.75,1,1.25,1.5,2];
  var cur=el.playbackRate||1;
  var idx=rates.indexOf(cur);
  el.playbackRate=rates[(idx+1)%rates.length];
  var b=$('read-video-rate-btn');
  if(b)b.textContent=el.playbackRate+'×';
}
function readVideoMute(){
  var el=$('read-video-el');
  if(!el)return;
  el.muted=!el.muted;
  var b=$('read-video-vol-btn');
  if(b)b.textContent=el.muted?'🔇':'🔊';
}
function readVideoSkip(delta){
  var el=$('read-video-el');
  if(!el||!el.duration)return;
  el.currentTime=Math.max(0,Math.min(el.duration,el.currentTime+delta));
  readVideoUpdateUI();
}
function readVideoOnEnd(){
  toast('播放结束');
  var b=$('read-video-play-btn');
  if(b)b.textContent='▶';
  if(_readCurVideo){_readCurVideo.progress=100;_readCurVideo.progressSec=0;readVideoSave();}
  // ★ 观看结束弹幕 + 观看总结卡
  readVideoSceneDanmaku('观看结束');
  setTimeout(function(){readVideoShowSummary();},1200);
}
function readVideoBindAutoHide(){
  var ctl=$('read-video-controls');
  var player=$('read-video-player');
  if(!ctl||!player||player._readAutoHide)return;
  player._readAutoHide=true;
  var t=null;
  function show(){ctl.style.opacity='1';clearTimeout(t);t=setTimeout(function(){if(!document.fullscreenElement&&!document.webkitFullscreenElement)ctl.style.opacity='0.75';},2600);}
  player.onmousemove=show;
  player.ontouchstart=show;
  player.onclick=show;
  show();
}
function readVideoToggleUI(){
  var ctl=$('read-video-controls');
  if(!ctl)return;
  ctl.style.opacity=ctl.style.opacity==='0.75'?'1':'0.75';
}
// ★ 横屏锁统一封装：尝试锁定横屏，失败静默（部分浏览器/设备不支持）
function _rvLockLandscape(){
  try{
    if(screen.orientation&&screen.orientation.lock&&typeof screen.orientation.lock==='function'){
      screen.orientation.lock('landscape').catch(function(){});
    }
  }catch(e){}
}
function readVideoFullscreen2(){
  var player=$('read-video-player');
  var el=$('read-video-el');
  if(!player)return;
  if(document.fullscreenElement||document.webkitFullscreenElement){readVideoExitFullscreen();return;}
  _rvLockLandscape();
  var usedNative=false;
  try{
    if(document.documentElement.requestFullscreen){
      document.documentElement.requestFullscreen().then(function(){
        _rvLockLandscape();
        toast('已进入全屏（横屏）');
      }).catch(function(){
        // 原生全屏被拒绝（部分浏览器/手机不支持）→ 兜底模拟全屏
        toast('浏览器不支持原生全屏，已切换为兼容全屏');
        readSimulateFullscreen();
      });
      usedNative=true;
    }else if(document.documentElement.webkitRequestFullscreen){
      document.documentElement.webkitRequestFullscreen();
      _rvLockLandscape();
      usedNative=true;
    }
  }catch(e){}
  if(!usedNative&&el&&el.webkitEnterFullscreen){try{el.webkitEnterFullscreen();_rvLockLandscape();usedNative=true;}catch(e){}}
  if(!usedNative)readSimulateFullscreen();
}
function readVideoExitFullscreen(){
  try{
    if(document.exitFullscreen)document.exitFullscreen().catch(function(){});
    else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
  }catch(e){}
  var p=$('read-video-player');
  if(p&&p._fsSim){
    p._fsSim=false;
    p.style.cssText=p._fsOrig||'position:relative;background:#000;border-radius:14px;overflow:hidden;';
    var ctl=$('read-video-controls');
    if(ctl)ctl.style.cssText='position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.75));padding:26px 10px 8px;transition:opacity 0.3s;z-index:20;';
  }
}
// ★ 横屏 / 竖屏切换：只旋转屏幕方向，不进全屏（顶部栏按钮用）
function readVideoToggleLandscape(){
  try{
    if(screen.orientation&&screen.orientation.lock&&typeof screen.orientation.lock==='function'){
      if(screen.orientation.type&&screen.orientation.type.indexOf('landscape')===0){
        screen.orientation.unlock();
        toast('已恢复竖屏');
      }else{
        screen.orientation.lock('landscape').then(function(){
          toast('已切换横屏');
        }).catch(function(){
          toast('当前浏览器不支持锁定横屏');
        });
      }
      return;
    }
  }catch(e){}
  toast('当前浏览器不支持横屏锁定');
}
function readVideoToggleCompany(){
  readVideoSettingsLoad();
  readVideoSettings.company=!readVideoSettings.company;
  readVideoSettingsSave();
  var b=$('read-video-company-btn');
  if(b){b.style.background=readVideoSettings.company?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.05)';}
  toast(readVideoSettings.company?'梦角陪看已开启':'梦角陪看已关闭');
}
function readVideoBindCompany(el){
  if(!el||el._readCmpBound)return;
  el._readCmpBound=true;
  // ★ 观看时长统计（节流：每 3 秒累计一次播放中的秒数）
  var _lastTick=Date.now();
  el.addEventListener('timeupdate',function(){
    readVideoSettingsLoad();
    if(!el.paused){
      var now=Date.now();
      if(now-_lastTick>=3000){
        _lastTick=now;
        if(_readCurVideo){_readCurVideo.watchSec=(_readCurVideo.watchSec||0)+3;readVideoSave();}
      }
    }
  });
  // ★ 陪看定时触发：按频率间隔，播放中触发
  var _lastDk=Date.now();
  setInterval(function(){
    if(readVideoSettings.company===false)return;
    if(!el||el.paused)return;
    var ov=$('ov-read-video');
    if(!ov||ov.style.display==='none')return;
    var now=Date.now();
    if(now-_lastDk>=readVideoFreqInterval()&&Math.random()<0.8){
      _lastDk=now;
      readVideoSceneDanmaku('观看中');
    }
  },9000);
}
function readVideoBindBiliCompany(player){
  if(!player||player._readBiliCmp)return;
  player._readBiliCmp=true;
  var _lastDk=Date.now();
  setInterval(function(){
    var ov=$('ov-read-video');
    if(!ov||ov.style.display==='none')return;
    readVideoSettingsLoad();
    if(readVideoSettings.company===false)return;
    var now=Date.now();
    if(now-_lastDk>=readVideoFreqInterval()&&Math.random()<0.8){
      _lastDk=now;
      readVideoSceneDanmaku('观看中');
    }
  },9000);
}
function readUploadVideo(inp){
  var file=inp&&inp.files&&inp.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var v={id:'v_'+Date.now().toString(36),type:'local',name:file.name,dataUrl:ev.target.result,progress:0,progressSec:0,lastWatch:Date.now()};
    readVideos.push(v);
    readVideoSave();
    renderVideoLib();
    readOpenVideo(v.id);
    toast('已导入《'+file.name+'》');
    inp.value='';
  };
  reader.readAsDataURL(file);
}
function readSetBili(){
  var inp=$('read-bili-url');
  var url=inp?inp.value.trim():'';
  if(!url){toast('请粘贴哔哩哔哩链接');return;}
  var m1=url.match(/[Bb][Vv][0-9A-Za-z]{8,10}/);
  var bvid=m1?m1[0]:'';
  if(!bvid){toast('没识别到 BV 号，请确认是哔哩哔哩视频链接');return;}
  var v={id:'v_'+Date.now().toString(36),type:'bili',name:'哔哩哔哩视频 '+bvid,url:url,bvid:bvid,progress:0,progressSec:0,lastWatch:Date.now()};
  readVideos.push(v);
  readVideoSave();
  renderVideoLib();
  readOpenVideo(v.id);
  toast('已添加哔哩哔哩视频');
  if(inp)inp.value='';
}
function readRemoveVideo(){
  if(!_readCurVideo){toast('没有正在播放的视频');return;}
  if(!confirm('移除《'+_readCurVideo.name+'》？'))return;
  readVideos=readVideos.filter(function(x){return x.id!==_readCurVideo.id;});
  readVideoSave();
  readVideoBackLib();
  toast('已移除');
}



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
  var html='';
  if(!arr.length)html+='<div style="padding:24px 14px;text-align:center;color:var(--txt3);font-size:13px;">还没有书签<br>阅读时点「🔖 书签」添加</div>';
  arr.slice().reverse().forEach(function(b,i){
    var idx=arr.length-1-i;
    html+='<div onclick="readGotoBookmark('+idx+')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;">'
      +'<div style="font-size:13px;color:var(--txt);">第 '+(b.page+1)+' 段 · '+b.text+'</div>'
      +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+new Date(b.ts).toLocaleString()+'</div></div>';
  });
  var _lst=$('read-bookmark-list');
  if(_lst)_lst.innerHTML=html;
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
function readOpenSettings(){
  readLoadSettings();
  var fs=$('rs-fontsize-val');if(fs)fs.textContent=readBookSettings.fontSize+'px';
  var lh=$('rs-lineheight-val');if(lh)lh.textContent=readBookSettings.lineHeight.toFixed(1);
  var mg=$('rs-margin-val');if(mg)mg.textContent=readBookSettings.margin+'px';
  var ff=$('rs-fontfamily');if(ff)ff.value=readBookSettings.fontFamily;
  var mb=$('rs-mode-btn');if(mb)mb.textContent=readBookSettings.mode==='scroll'?'滚动':'分页';
  var th=$('rs-theme-val');if(th)th.textContent=readThemeNames[readBookSettings.theme]||'';
  var cb=$('rs-company-btn');if(cb)cb.textContent=readBookSettings.company===false?'关':'开';
  var fq=$('rs-freq-val');if(fq)fq.textContent='陪读频率：'+(readBookSettings.companyFreq||'中');
  showOv('ov-read-settings');
}
// ★ 字号预设：小/中/大
function readFontPreset(size){
  readBookSettings.fontSize=size;
  readSaveSettings();readApplySettings();
  var fs=$('rs-fontsize-val');if(fs)fs.textContent=readBookSettings.fontSize+'px';
  toast('字号：'+size+'px');
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
  if(readBookSettings.company!==false)readStartCompanyTimer();
}
function readRenderCompanyBtn(){
  var b=$('read-company-btn');
  if(b)b.style.background=readBookSettings.company===false?'#e5e5e5':'var(--c2)';
}
// ★ 陪读频率：低/中/高
function readSetCompanyFreq(v){
  readBookSettings.companyFreq=v;
  readSaveSettings();
  readStartCompanyTimer();
  var b=$('rs-freq-val');if(b)b.textContent='陪读频率：'+(v||'中');
  toast('陪读频率：'+(v||'中'));
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
  // ★ 阅读时长累计
  if(readBook.startTs)b.readSec=(b.readSec||0)+Math.round((Date.now()-readBook.startTs)/1000);
  readBook.startTs=Date.now();
  if(!b.finished&&readBook.page>=readBook.pages.length-1&&readBookSettings.mode!=='scroll')b.finished=true;
  readShelfSave();
}
// ★ 会话内自动保存（返回书架/关闭阅读器/切后台），同时触发"暂停离开"弹幕
function readSaveSession(){
  try{readSaveBookProgress();}catch(e){}
  try{readSceneDanmaku('leave');}catch(e){}
}
try{
  window.addEventListener('pagehide',function(){try{readSaveBookProgress();}catch(e){}});
  document.addEventListener('visibilitychange',function(){
    try{
      if(document.visibilityState==='hidden')readSaveBookProgress();
    }catch(e){}
  });
}catch(e){}
function readMarkFinished(){
  var b=readBooks.find(function(x){return x.id===readBook.id;});
  if(b&&!b.finished){b.finished=true;readShelfSave();toast('🎉 已读完本书');}
}
// ============ PDF 支持（pdf.js 内联，单文件可用） ============
var _readPdfInitDone=false;
function _readPdfInit(){
  if(_readPdfInitDone)return true;
  if(typeof pdfjsLib==='undefined')return false;
  try{
    // ★ worker 内联化：从 <script type="text/plain"> 读取源码 → Blob URL
    if(!pdfjsLib.GlobalWorkerOptions||!pdfjsLib.GlobalWorkerOptions.workerSrc){
      var raw=document.getElementById('pdf-worker-src');
      if(raw){
        var src=raw.textContent||'';
        var blob=new Blob([src],{type:'text/javascript'});
        var url=URL.createObjectURL(blob);
        pdfjsLib.GlobalWorkerOptions.workerSrc=url;
      }
    }
    _readPdfInitDone=true;
    return true;
  }catch(e){return false;}
}
async function readParsePdf(file){
  try{
    toast('正在解析 PDF…');
    if(!_readPdfInit()){
      toast('PDF 解析组件未加载，请联网后重试');
      return;
    }
    var doc=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
    var parts=[],chapterTitles=[];
    for(var p=1;p<=doc.numPages;p++){
      var page=await doc.getPage(p);
      var tc=await page.getTextContent();
      var pageText=tc.items.map(function(it){return it.str||'';}).join(' ');
      pageText=pageText.replace(/\s+/g,' ').trim();
      // 每页内容按句子分段（页间空一行）
      var segs=pageText.split(/(?<=[。！？!?])/).map(function(s){return s.trim();}).filter(Boolean);
      if(segs.length){
        // 疑似章节标题（较短且以章/回/节开头）作为章节标记
        segs.forEach(function(s){
          if(/^(第[一二三四五六七八九十百千0-9]+[章回节卷]|Chapter\s*\d+|CHAPTER\s*\d+)/i.test(s)&&s.length<40){
            chapterTitles.push(s);
          }
          parts.push(s);
        });
      }
    }
    var full=parts.join('\n');
    if(!full.trim())throw new Error('PDF 未提取到文字（可能是扫描版图片）');
    // 章节：基于检测到的标题；无则用页码
    var chapters=[],paraCnt=0;
    if(chapterTitles.length){
      chapterTitles.forEach(function(t){chapters.push({title:t,paraStart:0});});
      // 简化：章节按出现顺序标记段落
      var marks=chapterTitles.slice();
      chapters=[];
      var paraIdx=0;
      parts.forEach(function(s){
        if(marks.length&&s===marks[0]){chapters.push({title:s,paraStart:paraIdx});marks.shift();}
        paraIdx++;
      });
    }else{
      for(var c=1;c<=doc.numPages;c++)chapters.push({title:'第 '+c+' 页',paraStart:(c-1)*Math.max(1,Math.floor(parts.length/doc.numPages))});
    }
    var bookName=file.name.replace(/\.pdf$/i,'');
    var bk={id:'b_'+Date.now().toString(36),name:bookName,author:'',cover:'',content:full,chapters:chapters,lastOpen:Date.now(),progress:0,finished:false,size:Math.round(file.size/1024),readSec:0,source:'pdf'};
    readBooks.unshift(bk);
    readShelfSave();
    toast('已导入：'+bk.name+'（'+(parts.length)+' 段）');
    readRenderShelf();
  }catch(e){
    console.error('pdf parse error:',e);
    toast('PDF 解析失败：'+(e.message||'未知错误'));
  }
}
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
    var coverHref=null;
    var mn=xp.querySelectorAll('manifest item');
    for(var i=0;i<mn.length;i++){
      var id=mn[i].getAttribute('id'),href=mn[i].getAttribute('href'),props=mn[i].getAttribute('properties')||'';
      if(id&&href)items[id]=(base?base+'/':'')+href;
      // ★ 提取封面：properties 含 cover-image 的 item
      if(props.split(/\s+/).indexOf('cover-image')>=0&&href){
        coverHref=(base?base+'/':'')+href;
        if(!coverHref.match(/^\.\//))coverHref=coverHref.replace(/^(\.\/)+/,'');
      }
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
    // ★ 封面：提取 cover-image 图片字节 → 压缩 dataURL；失败则文字封面
    var coverData='';
    if(coverHref){
      try{
        var rawC=z[coverHref]||z[coverHref.replace(/^.*?\//,'')];
        if(rawC){
          var mimeC='image/jpeg';
          var b64=_readU8ToBase64(rawC);
          var img=new Image();
          coverData=await new Promise(function(resolve){
            var done=false;
            img.onload=function(){
              try{
                var cv=document.createElement('canvas');
                var w=240,h=Math.round(img.height*(240/img.width)||240);
                cv.width=w;cv.height=h;
                cv.getContext('2d').drawImage(img,0,0,w,h);
                resolve(cv.toDataURL('image/jpeg',0.8));
              }catch(e){resolve('data:'+mimeC+';base64,'+b64);}
              done=true;
            };
            img.onerror=function(){resolve('data:'+mimeC+';base64,'+b64);done=true;};
            img.src='data:'+mimeC+';base64,'+b64;
            setTimeout(function(){if(!done)resolve('data:'+mimeC+';base64,'+b64);},3000);
          });
        }
      }catch(e){coverData='';}
    }
    var bk={id:'b_'+Date.now().toString(36),name:file.name.replace(/\.epub$/i,''),author:'',cover:coverData,content:full,chapters:chapters,lastOpen:Date.now(),progress:0,finished:false,size:Math.round(file.size/1024),readSec:0};
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
function _readU8ToBase64(u8){
  try{
    var bin='';
    var chunk=0x8000;
    for(var i2=0;i2<u8.length;i2+=chunk){
      bin+=String.fromCharCode.apply(null,u8.subarray(i2,i2+chunk));
    }
    return btoa(bin);
  }catch(e){return '';}
}

try{
  document.addEventListener('fullscreenchange',function(){
    if(!document.fullscreenElement&&!document.webkitFullscreenElement){
      var ov=$('ov-read-together');
      if(ov&&ov._readFs){
        ov._readFs=false;
        if(ov._fsOrigStyle!==undefined){ov.style.cssText=ov._fsOrigStyle;ov._fsOrigStyle=undefined;}
      }
    }
  });
}catch(e){}

// ============ 一起看字卡库（恢复被误删的加载逻辑） ============
var readCards={public:[],private:{}};
var readCardsTabNow='public';
var readCardsCatNow='主字卡';
function loadReadCards(){
  try{var d=ls('ml2_read_cards');if(d){readCards=d;}}catch(e){}
  if(!readCards||typeof readCards!=='object')readCards={public:[],private:{}};
  if(!readCards.public||!Array.isArray(readCards.public))readCards.public=[];
  if(!readCards.private||typeof readCards.private!=='object')readCards.private={};
  if(!readCardsTabNow)readCardsTabNow='public';
  if(!readCardsCatNow)readCardsCatNow='主字卡';
  return readCards;
}
function saveReadCards(){
  try{ls('ml2_read_cards',readCards);}catch(e){}
  if(window.localforage)window.localforage.setItem('ml2_read_cards',readCards).catch(function(){});
}


function readOpenBook(idx){
  var b=readBooks[idx];
  if(!b)return;
  var paras=String(b.content||'').split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
  readBook={id:b.id||('b_'+idx),name:b.name,content:b.content||'',paras:paras,pages:readSplitPages(b.content||''),page:0,perPage:8,chapters:b.chapters||readDetectChapters(paras),scrollToPara:-1,scrollRatio:0,startTs:Date.now()};
  // ★ 本次阅读会话：时长起点 + 弹幕计数重置
  readBook.startTs=Date.now();
  window._readDanmakuCount=0;
  if(b.progress&&b.progress>0&&b.progress<100&&!b.finished){
    readBook.page=Math.max(0,Math.min(readBook.pages.length-1,Math.round(b.progress/100*(readBook.pages.length-1))));
    // ★ 滚动模式：记录待恢复比例（渲染后还原 scrollTop）
    if(readBookSettings.mode==='scroll'){
      readBook.scrollRatio=b.progress/100;
    }
  }
  readLoadSettings();
  b.lastOpen=Date.now();readShelfSave();
  var sp=$('read-shelf-page'),bp=$('read-book-page');
  if(sp)sp.style.display='none';
  if(bp){bp.style.display='flex';var tt=$('read-book-title');if(tt)tt.textContent=readBook.name;}
  readRenderPage();
  // ★ 滚动模式恢复位置（渲染后）
  if(readBookSettings.mode==='scroll'&&readBook.scrollRatio>0){
    var _c=$('read-book-content');
    if(_c){setTimeout(function(){_c.scrollTop=readBook.scrollRatio*(_c.scrollHeight-_c.clientHeight);},60);}
  }
  readBindSwipe();
  readBindSelection();
  readRenderCompanyBtn();
  var cpb=$('read-company-pick-btn');
  if(cpb)cpb.innerHTML='👥';
  if(b.finished)toast('本书已读完，重新从上次位置打开');
  // ★ 场景弹幕：开始阅读
  if(readBookSettings.company!==false){
    setTimeout(function(){readSceneDanmaku('start');},1200+Math.random()*1500);
  }
  // ★ 陪读定时器（3~10 分钟按频率）
  readStartCompanyTimer();
}


// ============ 阅读器设置与入口（恢复被误删） ============
var readBookSettings={fontSize:16,theme:'paper',lineHeight:1.9,margin:16,fontFamily:'default',mode:'page',company:true,companyFreq:'中'};
var readThemes={white:{bg:'#FFFFFF',color:'#444444'},paper:{bg:'#FBF7F1',color:'#4A4038'},beige:{bg:'#F3EDE2',color:'#4a4a3a'},gray:{bg:'#EDEDEB',color:'#444444'},night:{bg:'#202020',color:'#cfcfcf'}};
var readThemeNames={white:'纯白',paper:'暖白',beige:'米色',gray:'浅灰',night:'深色'};
function readLoadSettings(){
  try{var s2=ls('ml2_read_book_settings');if(s2){if(s2.fontSize)readBookSettings.fontSize=s2.fontSize;if(s2.theme)readBookSettings.theme=s2.theme;if(s2.lineHeight)readBookSettings.lineHeight=s2.lineHeight;if(s2.margin!==undefined)readBookSettings.margin=s2.margin;if(s2.fontFamily)readBookSettings.fontFamily=s2.fontFamily;if(s2.mode)readBookSettings.mode=s2.mode;if(s2.company!==undefined)readBookSettings.company=s2.company;if(s2.companyFreq)readBookSettings.companyFreq=s2.companyFreq;}}catch(e){}
}
function readSaveSettings(){try{ls('ml2_read_book_settings',readBookSettings);}catch(e){}}
function readApplySettings(){
  var content=$('read-book-content');
  if(!content)return;
  var th=readThemes[readBookSettings.theme]||readThemes.paper;
  content.style.fontSize=readBookSettings.fontSize+'px';
  content.style.lineHeight=readBookSettings.lineHeight;
  content.style.background=th.bg;
  content.style.color=th.color;
  content.style.padding=readBookSettings.margin+'px';
  content.style.boxSizing='border-box';
  var ffs={default:'',serif:'\'Songti SC\',\'SimSun\',serif',hei:'\'Heiti SC\',\'SimHei\',sans-serif',kai:'\'Kaiti SC\',\'KaiTi\',serif',yuan:'\'Yuanti SC\',\'PingFang SC\',sans-serif'};
  content.style.fontFamily=ffs[readBookSettings.fontFamily]||'';
  content.style.transition='background 0.2s,color 0.2s';
  var tn=$('read-theme-name');
  if(tn)tn.textContent=readThemeNames[readBookSettings.theme]||'';
  var bp=$('read-book-page');
  if(bp)bp.style.background=th.bg;
  readRenderCompanyBtn();
  readUpdateProgressBar();
}
function readFontSize(d){
  readBookSettings.fontSize=Math.min(28,Math.max(12,readBookSettings.fontSize+d));
  readSaveSettings();
  readApplySettings();
  var fs=$('rs-fontsize-val');if(fs)fs.textContent=readBookSettings.fontSize+'px';
}
function readThemeNext(){
  var keys=['white','paper','beige','gray','night'];
  var i=keys.indexOf(readBookSettings.theme);
  readBookSettings.theme=keys[(i+1)%keys.length];
  readSaveSettings();
  readApplySettings();
  var th=$('rs-theme-val');if(th)th.textContent=readThemeNames[readBookSettings.theme]||'';
  var tn=$('read-theme-name');if(tn)tn.textContent=readThemeNames[readBookSettings.theme]||'';
}
function showReadTogether(){
  readShelfLoad();
  loadReadCards();
  loadReadSceneCards();
  readCompanyLoad();
  var sp=$('read-shelf-page'),bp=$('read-book-page');
  if(sp)sp.style.display='flex';
  if(bp)bp.style.display='none';
  readRenderShelf();
  showOv('ov-read-together');
}
function readShowReadCards(){
  loadReadCards();
  readCardsRenderList();
  showOv('ov-read-cards');
}


// ============ 阅读器交互增强 ============
var readCompanyContactId='';  // 一起看的梦角联系人
var readCardsContactId='';    // 字卡库绑定的联系人
// 左右滑动翻页（分页模式）+ 点击切换底栏
// ★ 翻页交互：横滑（左翻右翻）/ 鼠标拖拽 / 滚轮 / 点击三分区 / 键盘
function readBindSwipe(){
  var content=$('read-book-content');
  if(!content||content._readSwipeBound)return;
  content._readSwipeBound=true;
  var gs={sx:0,sy:0,st:0,moved:false,active:false};

  // —— 触摸：横滑翻页（分页+滚动均生效），竖滑保留原生滚动看书 ——
  content.addEventListener('touchstart',function(e){
    var t=e.touches[0];
    gs.sx=t.clientX;gs.sy=t.clientY;gs.st=Date.now();gs.moved=false;gs.active=true;
  },{passive:true});
  content.addEventListener('touchmove',function(e){
    if(!gs.active)return;
    var t=e.touches[0];
    var dx=t.clientX-gs.sx,dy=t.clientY-gs.sy;
    // 判定为横滑时阻止默认（避免被系统手势吞掉），竖滑放行（原生滚动看书）
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){
      gs.moved=true;
      if(e.cancelable)e.preventDefault();
    }
  },{passive:false});
  content.addEventListener('touchend',function(e){
    if(!gs.active){return;}
    gs.active=false;
    var ct=e.changedTouches[0];
    var dx=ct.clientX-gs.sx,dy=ct.clientY-gs.sy;
    if(Date.now()-gs.st>1200)return;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3&&gs.moved){
      if(dx<0)readNextPage();else readPrevPage();
      return;
    }
    // 位移未达阈值 → 按点击三分区处理
    readHandleContentTap(ct.clientX,ct.clientY);
  },{passive:true});

  // —— 鼠标：拖拽翻页（桌面）——
  content.addEventListener('mousedown',function(e){
    gs.sx=e.clientX;gs.sy=e.clientY;gs.st=Date.now();gs.moved=false;gs.active=true;
    content._md=true;
  });
  document.addEventListener('mousemove',function(e){
    if(!content._md||!gs.active)return;
    var dx=e.clientX-gs.sx,dy=e.clientY-gs.sy;
    if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy))gs.moved=true;
  });
  document.addEventListener('mouseup',function(e){
    if(!content._md)return;
    content._md=false;
    if(!gs.active){return;}
    gs.active=false;
    var dx=e.clientX-gs.sx,dy=e.clientY-gs.sy;
    if(Date.now()-gs.st>1200)return;
    if(gs.moved&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){
      if(dx<0)readNextPage();else readPrevPage();
      return;
    }
    readHandleContentTap(e.clientX,e.clientY);
  });

  // —— 滚轮：横滚翻页；分页模式竖向滚轮翻页（节流防连翻）——
  var _lastWheel=0;
  content.addEventListener('wheel',function(e){
    var now=Date.now();
    if(now-_lastWheel<60)return;
    _lastWheel=now;
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){
      if(e.deltaX>0)readNextPage();else readPrevPage();
      if(e.cancelable)e.preventDefault();
    }else if(readBookSettings.mode==='page'){
      if(e.deltaY>0)readNextPage();else readPrevPage();
      if(e.cancelable)e.preventDefault();
    }
  },{passive:false});

  // —— 键盘：左右方向键 / PageUp / PageDown（仅阅读器打开时生效）——
  var _keyH=function(e){
    var ov=$('ov-read-together');
    if(!ov||!ov.classList||!ov.classList.contains('show'))return;
    if(e.key==='ArrowLeft'||e.key==='PageUp'){readPrevPage();if(e.cancelable)e.preventDefault();}
    else if(e.key==='ArrowRight'||e.key==='PageDown'){readNextPage();if(e.cancelable)e.preventDefault();}
    else if(e.key===' '){readNextPage();if(e.cancelable)e.preventDefault();}
  };
  if(!content._readKeyBound){
    content._readKeyBound=true;
    document.addEventListener('keydown',_keyH);
    content._readKeyH=_keyH;
  }
}
// 点击三分区：左 1/3 上一页、右 1/3 下一页、中 1/3 切换底栏
function readHandleContentTap(cx,cy){
  var content=$('read-book-content');
  if(!content)return;
  var r=content.getBoundingClientRect();
  if(r.width<=0)return;
  var ratio=(cx-r.left)/r.width;
  if(ratio<0.33){readPrevPage();}
  else if(ratio>0.67){readNextPage();}
  else{
    var bottom=$('read-book-bottom');
    if(bottom)bottom.style.display=bottom.style.display==='none'?'block':'none';
  }
}
// ★ 多角色陪读选择（多选，持久化 ml2_read_company）
function readShowCompanyPick(){
  readCompanyLoad();
  var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
  var html='';
  if(!arr.length)html='<div style="padding:20px;text-align:center;color:var(--txt3);font-size:13px;">还没有联系人</div>';
  arr.forEach(function(c){
    var sel=readCompanyIds.indexOf(c.id)>=0;
    html+='<div onclick="readToggleCompanyPick(\''+c.id+'\')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:8px;">'
      +'<div style="width:30px;height:30px;border-radius:50%;background:var(--c2);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:14px;">'+(c.avatar?'<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;">':'💫')+'</div>'
      +'<div style="flex:1;font-size:13px;color:var(--txt);">'+String(c.name||'TA').replace(/</g,'&lt;')+'</div>'
      +(sel?'<span style="font-size:12px;color:var(--accent);">✓ 一起看中</span>':'')+'</div>';
  });
  html+='<div style="padding:12px 14px;"><button onclick="readCompanyPickDone()" style="width:100%;padding:10px 0;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">完成</button></div>';
  var lst=$('read-bookmark-list');
  if(lst)lst.innerHTML='<div style="padding:12px 14px;font-size:14px;font-weight:600;color:var(--txt);">👥 选择一起看的梦角（可多选）</div>'+html;
  showOv('ov-read-bookmarks');
}
function readToggleCompanyPick(id){
  readCompanyLoad();
  var idx=readCompanyIds.indexOf(id);
  if(idx>=0)readCompanyIds.splice(idx,1);
  else readCompanyIds.push(id);
  readCompanySave();
  readShowCompanyPick();
}
function readCompanyPickDone(){
  hideOv('ov-read-bookmarks');
  var n=readCompanyIds.length;
  toast(n?('已选择 '+n+' 位陪读梦角'):'暂不选择陪读梦角');
  var btn=$('read-company-pick-btn');
  if(btn)btn.innerHTML='👥';
  readRenderCompanyBtn();
}
// 兼容旧接口（旧书签弹窗单选用法不再使用）
function readPickCompany(id){
  readCompanyLoad();
  if(readCompanyIds.indexOf(id)<0)readCompanyIds.push(id);
  readCompanySave();
  readCompanyPickDone();
}
function readCardsContactSelect(containerId){
  var box=$('read-cards-contact-wrap');
  if(!box)return;
  var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
  var html='';
  if(readCardsTabNow==='private'){
    html='<div style="font-size:11px;color:var(--txt3);margin-bottom:4px;">专享字卡联系人：</div><div style="display:flex;gap:6px;flex-wrap:wrap;">';
    html+='<span onclick="readCardsContact(\'\')" style="padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;background:'+(!readCardsContactId?'var(--accent)':'var(--c2)')+';color:'+(!readCardsContactId?'#fff':'var(--txt)')+';border:1px solid var(--border);">全部</span>';
    arr.forEach(function(c){
      var sel=c.id===readCardsContactId;
      html+='<span onclick="readCardsContact(\''+c.id+'\')" style="padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;background:'+(sel?'var(--accent)':'var(--c2)')+';color:'+(sel?'#fff':'var(--txt)')+';border:1px solid var(--border);">'+(c.avatar||'')+' '+(c.name||'TA')+'</span>';
    });
    html+='</div>';
  }
  box.innerHTML=html;
}
function readCardsContact(id){
  readCardsContactId=id;
  readCardsRenderList();
  readCardsContactSelect();
}
function readCardsBatchToggle(){
  var w=$('read-cards-batch-wrap');
  if(!w)return;
  w.style.display=w.style.display==='none'?'block':'none';
}
function readCardsBatchDo(){
  var inp=$('read-cards-batch-input');
  var val=inp?inp.value.trim():'';
  if(!val){toast('请输入字卡内容，一行一个');return;}
  loadReadCards();
  var lines=val.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
  var cat=readCardsCatNow||'主字卡';
  if(readCardsTabNow==='private'){
    var cid2=readCardsContactId||cid||'all';
    if(!readCards.private[cid2])readCards.private[cid2]=[];
    lines.forEach(function(x){readCards.private[cid2].push({cat:cat,content:x});});
  }else{
    lines.forEach(function(x){readCards.public.push({cat:cat,content:x});});
  }
  saveReadCards();
  if(inp)inp.value='';
  readCardsRenderList();
  toast('已导入 '+lines.length+' 张字卡');
}

// ============ 默契问答（三模式：同步选择 / TA猜我 / 我猜TA） ============
// 定位：两人互动的默契小游戏。三种模式看不同的东西：
//   同步选择：你的答案 vs TA的答案 → 默契度（我们想法像不像）
//   TA猜我  ：你的真实选择 vs TA认为你会选什么 → 了解度（TA懂不懂你）
//   我猜TA  ：你猜TA会选什么 vs TA的真实选择 → 了解度（你懂不懂TA）
var SoulQA=(function(){
  // ---- 官方预设问卷（4 套） ----
  var PRESETS=[
    {id:'p_daily',name:'💙 日常默契',desc:'看看你们对彼此日常习惯了解多少。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果今天不用做任何事情，{对象}最想？',opts:['睡到自然醒','出门逛逛','安静待在家','找点新事情做']},
      {q:'{猜者}觉得最舒服的陪伴方式是？',opts:['一直聊天','安静待在一起','一起做事情','各自忙但陪着对方']},
      {q:'如果心情不好，{对象}更需要？',opts:['安慰和聊天','一个人静一静','被逗开心','陪在身边就好']},
      {q:'{对象}累的时候会？',opts:['假装没事','直接说出来','自己消化','希望有人发现']},
      {q:'如果一起吃饭，{对象}更喜欢？',opts:['尝试新店','去熟悉的地方','自己做饭','随便吃什么都可以']},
      {q:'{对象}更喜欢收到？',opts:['实用的东西','有纪念意义的东西','手写文字','小惊喜']},
      {q:'如果一起度过一天，{对象}更希望？',opts:['安排很多事情','慢慢过一天','去特别的地方','什么都不做也可以']},
      {q:'{对象}更像哪种天气？',opts:['晴天','雨天','夜晚','微风']},
      {q:'{对象}表达喜欢的方式是？',opts:['说出来','做事情表现','陪伴时间','小细节']},
      {q:'{猜者}觉得{我们}之间最珍贵的是？',opts:['相处的方式','一起经历的回忆','彼此的在意','心照不宣的默契']},
    ]},
    {id:'p_known',name:'🌙 了解TA',desc:'看看你是否真的了解TA的想法。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'遇到烦恼时，{对象}会？',opts:['第一时间说出来','自己想很久','假装没事','等人发现']},
      {q:'{对象}最看重一段关系里的？',opts:['信任','陪伴','理解','新鲜感']},
      {q:'{猜者}觉得浪漫是？',opts:['精心准备的惊喜','普通日子的陪伴','记住小事情','说很多喜欢的话']},
      {q:'{对象}更偏爱哪种相处？',opts:['热闹互动','安静陪伴','偶尔惊喜','稳定日常']},
      {q:'{对象}生气时？',opts:['想马上解决','需要冷静','希望被哄','不想讲话']},
      {q:'{对象}最容易被什么打动？',opts:['温柔的话','实际行动','小礼物','长时间陪伴']},
      {q:'{对象}希望别人记住{对象}的？',opts:['喜好','习惯','情绪','重要日子']},
      {q:'{猜者}觉得幸福是？',opts:['每天聊天','一起经历事情','有人一直在','被理解']},
      {q:'{对象}更喜欢哪种未来？',opts:['平静生活','一起冒险','共同成长','简单快乐']},
      {q:'{猜者}希望{TA}在{你}生命里更像？',opts:['依靠','玩伴','知己','家人']},
    ]},
    {id:'p_love',name:'🌸 恋爱默契',desc:'测试你们对感情表达方式的理解。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果见面，{对象}最希望？',opts:['抱一下','聊很多话','一起做事情','安静陪着']},
      {q:'{对象}喜欢被怎样表达喜欢？',opts:['直接告诉我','陪着我','给我准备东西','记住细节']},
      {q:'如果很久没联系，{对象}会？',opts:['想念但不说','主动联系','等对方找自己','忙自己的事情']},
      {q:'关于联系，{对象}更偏好？',opts:['天天联系','有空联系','重要事情分享','默默陪伴']},
      {q:'如果发生误会，{对象}希望？',opts:['马上解释','慢慢沟通','先安慰情绪','给一点时间']},
      {q:'{对象}最可爱的时候？',opts:['开心的时候','认真做事的时候','撒娇的时候','安静的时候']},
      {q:'{对象}最需要？',opts:['安全感','自由','鼓励','陪伴']},
      {q:'如果留下纪念，{对象}会选？',opts:['照片','信件','视频','特别物品']},
      {q:'{对象}喜欢的约会？',opts:['看电影','吃饭聊天','出门旅行','在家相处']},
      {q:'如果用一句话形容{我们}，{猜者}觉得是？',opts:['很默契','很互补','很像朋友','很特别']},
    ]},
    {id:'p_fun',name:'🎮 趣味默契挑战',desc:'轻松小游戏类型。',type:'选择题',minutes:2,group:'normal',questions:[
      {q:'如果突然中奖，{对象}会？',opts:['存起来','买喜欢的东西','请别人吃饭','计划旅行']},
      {q:'如果一起玩游戏，{对象}会？',opts:['认真赢','故意让你','看你开心','吐槽你']},
      {q:'如果一起旅行，{对象}会？',opts:['提前计划','随心走','看风景','找好吃的']},
      {q:'如果养宠物，{对象}会？',opts:['猫','狗','其他动物','暂时不要']},
      {q:'如果拥有一天假期，{对象}会？',opts:['睡觉','玩一天','学东西','陪喜欢的人']},
    ]},
    {id:'p_habit',name:'🍃 生活小习惯',desc:'看看你们对彼此生活方式的了解。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}早上醒来第一件事？',opts:['看手机','继续赖床','喝水洗漱','发呆一会']},
      {q:'{对象}压力大的时候更可能？',opts:['吃东西','睡觉','听音乐','自己安静待着']},
      {q:'{对象}房间乱的时候？',opts:['马上整理','忍几天再说','习惯就好','只整理重要地方']},
      {q:'{对象}喜欢的休息方式？',opts:['睡一觉','看视频','玩游戏','和喜欢的人聊天']},
      {q:'{对象}买东西更看重？',opts:['实用','好看','特别意义','一时喜欢']},
      {q:'{对象}做决定时？',opts:['很快决定','想很久','看别人意见','凭感觉']},
      {q:'{对象}最容易忘记？',opts:['小事情','时间','东西放哪里','回复消息']},
      {q:'{对象}喜欢的空间？',opts:['热闹','安静','自己的小世界','有人在旁边']},
      {q:'{对象}最喜欢的天气？',opts:['晴天','阴天','下雨天','下雪天']},
      {q:'{猜者}觉得舒服的关系状态？',opts:['经常分享','偶尔联系但安心','每天陪伴','各自自由']},
    ]},
    {id:'p_if',name:'✨ 如果有一天',desc:'用假设问题看看彼此的小想法。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果突然有一天不用工作，{对象}会？',opts:['睡一天','出门玩','学新东西','陪重要的人']},
      {q:'如果可以去任何地方旅行，{对象}会选？',opts:['海边','城市','山林','家附近']},
      {q:'如果获得一个特殊能力，{对象}想要？',opts:['瞬间移动','读心','时间暂停','治愈别人']},
      {q:'如果回到过去一天，{对象}可能会？',opts:['看看以前的自己','改变一件事','重温快乐时光','什么也不做']},
      {q:'如果拥有一个秘密房间，{对象}会放？',opts:['收藏品','喜欢的东西','休息空间','纪念物']},
      {q:'如果可以养一种幻想生物，{对象}会？',opts:['龙','精灵','独角兽','小怪物']},
      {q:'如果今天成为小孩子，{对象}会？',opts:['玩一天','找朋友','吃喜欢的东西','到处探索']},
      {q:'如果收到一封未来的信，{对象}会？',opts:['马上打开','收藏起来','等合适的时候看','不敢看']},
      {q:'如果可以保存一种记忆，{对象}会？',opts:['第一次见面','最开心的一天','最感动的一刻','平凡日常']},
      {q:'如果给现在的自己一句话，{对象}会？',opts:['加油','辛苦了','谢谢自己','继续前进']},
    ]},
    {id:'p_hidden',name:'☁️ 隐藏的小心思',desc:'看看TA没有说出口的小习惯。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}开心的时候？',opts:['会分享','偷偷开心','表现出来','假装平静']},
      {q:'{对象}想念一个人时？',opts:['主动联系','看以前记录','等对方找自己','默默关注']},
      {q:'{对象}被夸奖时？',opts:['很开心','表面淡定','不知道怎么回应','会记很久']},
      {q:'{对象}最容易心软？',opts:['温柔的话','小动物','回忆','真诚道歉']},
      {q:'{对象}难过时？',opts:['希望被发现','不想麻烦别人','想有人陪','想自己解决']},
      {q:'{对象}害羞时？',opts:['变安静','开玩笑','转移话题','假装没事']},
      {q:'{对象}珍惜一个人的表现？',opts:['记住细节','花时间陪伴','分享生活','主动帮助']},
      {q:'{对象}的小秘密可能是？',opts:['很幼稚的一面','柔软的一面','不安的一面','奇怪的小爱好']},
      {q:'{对象}最希望被理解？',opts:['情绪','努力','想法','习惯']},
      {q:'{对象}希望别人看到？',opts:['真实的自己','坚强的自己','可爱的自己','特别的自己']},
    ]},
    {id:'p_world',name:'🌌 TA的小世界',desc:'了解TA内心的小习惯、偏好和隐藏想法。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果拥有一个只属于自己的空间，{对象}会？',opts:['放满喜欢的东西','变成安静休息的地方','收藏重要回忆','做自己喜欢的事情']},
      {q:'{对象}独处的时候更可能？',opts:['发呆','看喜欢的内容','想很多事情','做自己的兴趣']},
      {q:'{对象}最容易被什么治愈？',opts:['温柔的话','熟悉的事物','喜欢的人陪伴','一个人安静恢复']},
      {q:'{对象}心里藏得最多的是？',opts:['小愿望','小秘密','小情绪','小回忆']},
      {q:'{猜者}觉得最珍贵的是？',opts:['时间','回忆','理解','陪伴']},
      {q:'{对象}喜欢别人记住自己的？',opts:['喜好','习惯','情绪变化','特别时刻']},
      {q:'{猜者}觉得幸福更像？',opts:['热闹的快乐','平静的安心','突然的小惊喜','长久的陪伴']},
      {q:'{对象}最像哪种植物？',opts:['向日葵','小树','花朵','藤蔓']},
      {q:'{对象}累的时候最希望听到？',opts:['辛苦了','我陪你','慢慢来','你已经很好了']},
      {q:'{猜者}觉得{对方}最特别的地方？',opts:['温柔','坚强','可爱','独特']},
    ]},
    {id:'p_life',name:'🍰 如果一起生活',desc:'想象未来日常，看看彼此期待的生活。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果每天都能见面，{对象}希望？',opts:['一起吃饭','一起聊天','各自做事也陪着','一起出去玩']},
      {q:'{对象}理想的周末？',opts:['睡到自然醒','出门逛街','在家休息','安排特别活动']},
      {q:'{猜者}觉得家的感觉是？',opts:['温暖','安全','自由','热闹']},
      {q:'一起做饭时，{对象}会？',opts:['认真准备','在旁边帮忙','负责吃','临时发挥']},
      {q:'{对象}喜欢收到？',opts:['一句早安','一份小礼物','一次拥抱','一段文字']},
      {q:'如果一起养宠物，{对象}会？',opts:['宠物主人模式','负责照顾','负责陪玩','担心养不好']},
      {q:'{对象}喜欢的生活节奏？',opts:['每天充实','慢慢生活','偶尔冒险','保持稳定']},
      {q:'{猜者}觉得最浪漫的是？',opts:['一起看风景','普通日常','记住细节','特别仪式']},
      {q:'{对象}希望两个人？',opts:['经常分享','保留空间','一起成长','永远陪伴']},
      {q:'如果未来回忆现在，{对象}希望记住？',opts:['开心','温柔','特别','平凡']},
    ]},
    {id:'p_first',name:'🎨 第一次认识TA',desc:'看看你眼中的TA是什么样子。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{猜者}觉得{对方}第一印象像？',opts:['温柔的人','高冷的人','有趣的人','神秘的人']},
      {q:'{猜者}觉得{对方}最容易被误解的是？',opts:['外表','性格','想法','情绪']},
      {q:'{猜者}觉得{对方}真正熟悉后会？',opts:['更可爱','更温柔','更孩子气','更真实']},
      {q:'{猜者}觉得{对方}隐藏最多的是？',opts:['脆弱','热情','小心思','不安']},
      {q:'{猜者}觉得{对方}不像表面上的？',opts:['坚强','冷淡','随意','不在乎']},
      {q:'{猜者}觉得{对方}最吸引人的地方？',opts:['性格','想法','相处感觉','小细节']},
      {q:'如果用颜色形容{对方}，{猜者}会选？',opts:['蓝色','粉色','金色','黑色']},
      {q:'如果用季节形容{对方}，{猜者}会选？',opts:['春天','夏天','秋天','冬天']},
      {q:'{猜者}觉得{对方}最希望别人理解？',opts:['努力','情绪','过去','梦想']},
      {q:'如果给{对方}一个称呼，{猜者}会选？',opts:['重要的人','特别的人','温柔的人','无法替代的人']},
    ]},
    {id:'p_weather',name:'🌧 情绪天气',desc:'看看你是否了解TA的情绪表达方式。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}不开心的时候，更像？',opts:['躲起来自己消化','希望有人陪着','假装和平常一样','主动说出来']},
      {q:'心情好的时候，{对象}更想？',opts:['主动分享','安静地开心','找人庆祝','忙自己的事']},
      {q:'{对象}生气的时候？',opts:['想马上解决','需要一点时间','希望被安慰','不想讲话']},
      {q:'{对象}压力大的时候？',opts:['忙起来忘记','一个人思考','找人倾诉','做喜欢的事情']},
      {q:'{对象}难过时最需要？',opts:['一个拥抱','一句话安慰','安静陪伴','帮TA解决问题']},
      {q:'{对象}表达情绪的方式？',opts:['直接说','通过行动','写下来','暗示别人发现']},
      {q:'{对象}什么时候最容易心软？',opts:['被认真对待','被理解','被关心','被记住细节']},
      {q:'{对象}最害怕？',opts:['被忽视','被误解','失去重要的人','不被认可']},
      {q:'{对象}恢复心情需要？',opts:['时间','陪伴','新鲜事物','自己调整']},
      {q:'你觉得{对象}内心最像？',opts:['小太阳','小月亮','小树苗','小星星']},
    ]},
    {id:'p_memory',name:'📖 回忆收藏夹',desc:'看看你们对重要回忆的理解是否相同。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}最喜欢保存？',opts:['照片','文字','礼物','特别物品']},
      {q:'{猜者}觉得最珍贵的回忆？',opts:['第一次相遇','开心的一天','普通日常','特别经历']},
      {q:'如果制作一本回忆册，{对象}会放？',opts:['精彩瞬间','小事情','重要的话','所有记录']},
      {q:'{对象}更容易记住？',opts:['时间地点','当时感觉','对方说的话','发生的事情']},
      {q:'{对象}喜欢纪念？',opts:['节日','第一次','小习惯','随机瞬间']},
      {q:'{对象}收到旧照片时？',opts:['很开心','会回忆很久','想分享给别人','默默收藏']},
      {q:'{猜者}认为过去是？',opts:['成长经历','珍贵收藏','偶尔想起的故事','组成自己的部分']},
      {q:'{对象}最想保存的一种声音？',opts:['笑声','熟悉的话','音乐','自然声音']},
      {q:'如果回到某一天，{对象}会选择？',opts:['最快乐的一天','最重要的一天','最普通的一天','想重新认识的一天']},
      {q:'{对象}希望未来记住？',opts:['经历','感情','成长','快乐']},
    ]},
    {id:'p_gift',name:'🎁 小惊喜指南',desc:'猜猜TA喜欢怎样被对待。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'给{对象}准备惊喜，{对象}更喜欢？',opts:['提前计划','突然出现','小细节','一起完成']},
      {q:'{对象}更喜欢{对方}用什么表达在意？',opts:['礼物','消息','陪伴','行动']},
      {q:'{猜者}觉得怎样做最浪漫？',opts:['仪式感','默契','细心','陪在身边']},
      {q:'{对象}喜欢别人怎样对{对象}？',opts:['记住喜好','发现变化','主动关心','分享生活']},
      {q:'如果准备一天特别安排，{对象}会选？',opts:['吃好吃的','去旅行','在家休息','做喜欢的事']},
      {q:'{对象}收到礼物时最在意？',opts:['价格','心意','是否实用','是否特别']},
      {q:'{对象}喜欢的小惊喜？',opts:['一句话','一个拥抱','一个小东西','一个行动']},
      {q:'{猜者}觉得被重视是？',opts:['被选择','被记住','被理解','被陪伴']},
      {q:'{对象}最喜欢的纪念方式？',opts:['留照片','写文字','收藏物品','制造回忆']},
      {q:'{对象}想让{对方}开心时，{对象}会？',opts:['陪着TA','逗TA笑','帮TA做事','听TA说话']},
    ]},
    {id:'p_interest',name:'🎵 兴趣默契',desc:'看看你们喜欢的东西是否合拍。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}空闲时最可能？',opts:['看电影','听音乐','玩游戏','看书']},
      {q:'{对象}喜欢的旅行？',opts:['自然风景','热闹城市','历史文化','随便走走']},
      {q:'{对象}喜欢的礼物风格？',opts:['可爱','实用','有收藏价值','有故事']},
      {q:'{对象}喜欢的电影类型？',opts:['治愈','冒险','悬疑','搞笑']},
      {q:'{对象}喜欢的夜晚？',opts:['安静休息','聊天','玩乐','思考事情']},
      {q:'养宠物的话{对象}更倾向？',opts:['猫','狗','其他动物','不养宠物']},
      {q:'{对象}喜欢的季节？',opts:['春','夏','秋','冬']},
      {q:'{对象}喜欢的颜色？',opts:['明亮颜色','温柔颜色','深色系','看情况']},
      {q:'{对象}喜欢的食物？',opts:['甜食','辣食','清淡食物','新奇料理']},
      {q:'{猜者}觉得快乐来自？',opts:['兴趣','人','成就','自由']},
    ]},
    {id:'p_future',name:'🌱 未来想象',desc:'通过假设问题了解TA期待的未来。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}希望未来拥有？',opts:['更多时间','更多自由','更多能力','更多陪伴']},
      {q:'{对象}梦想的生活？',opts:['安定平静','丰富精彩','不断成长','随心而活']},
      {q:'如果学会一项技能，{对象}会选？',opts:['创作','运动','新语言','特殊能力']},
      {q:'{对象}希望别人记住自己？',opts:['温柔','努力','特别','成就']},
      {q:'未来的房间，{对象}希望？',opts:['温馨','简洁','充满收藏','充满植物']},
      {q:'{对象}想体验？',opts:['长途旅行','新职业','新生活','新挑战']},
      {q:'{对象}希望每天？',opts:['开心','安心','充实','自由']},
      {q:'如果重新选择人生路线，{对象}会？',opts:['冒险一次','坚持现在','换个方向','慢慢探索']},
      {q:'{猜者}认为成长是？',opts:['变强','了解自己','经历更多','保持初心']},
      {q:'未来的自己，{对象}希望？',opts:['更快乐','更勇敢','更自由','更温柔']},
    ]},
    {id:'p_night',name:'🌙 夜晚聊天',desc:'看看你们对彼此夜晚状态的了解。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}晚上更容易？',opts:['想很多事情','放松休息','找喜欢的内容看','和别人聊天']},
      {q:'{对象}睡前习惯？',opts:['看手机','听音乐','发呆','直接睡觉']},
      {q:'深夜的{对象}更像？',opts:['温柔','安静','感性','活跃']},
      {q:'如果晚上睡不着，{对象}会？',opts:['思考事情','看视频','听歌','找人聊天']},
      {q:'{对象}喜欢收到的晚安？',opts:['简单一句','温柔长一点','带点玩笑','不需要特别说']},
      {q:'{猜者}觉得夜晚？',opts:['适合思考','适合放松','适合分享秘密','只是普通时间']},
      {q:'{对象}晚上最容易想起？',opts:['今天发生的事','未来计划','重要的人','奇怪的小事情']},
      {q:'如果一起熬夜，{对象}会？',opts:['聊很多','各自做事','看同一个东西','劝你早点睡']},
      {q:'{对象}喜欢的夜晚氛围？',opts:['灯光温暖','安静黑暗','音乐陪伴','窗边发呆']},
      {q:'你觉得{对象}像？',opts:['月亮','星星','夜风','灯光']},
    ]},
    {id:'p_sweet',name:'🧸 撒娇与依赖',desc:'了解TA表达亲近的方式。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}想靠近一个人时？',opts:['主动找话题','分享事情','静静陪着','开玩笑']},
      {q:'{对象}表达依赖？',opts:['需要帮助','想聊天','想陪伴','分享小事']},
      {q:'{对象}撒娇的时候？',opts:['很明显','假装没有','变得可爱','嘴硬']},
      {q:'{对象}希望被？',opts:['关注','鼓励','安慰','夸奖']},
      {q:'{猜者}觉得亲近的表现？',opts:['什么都能说','不用解释太多','可以安静相处','记得彼此习惯']},
      {q:'{对象}需要安全感时？',opts:['会靠近','会确认','会观察','会自己调整']},
      {q:'{对象}被关心时？',opts:['马上回应','表面平静','心里开心','有点害羞']},
      {q:'{对象}最喜欢听？',opts:['我在这里','辛苦了','我相信你','我想你']},
      {q:'{猜者}觉得亲密关系？',opts:['是分享','是理解','是陪伴','是信任']},
      {q:'{对象}最真实的一面？',opts:['可爱','脆弱','任性','温柔']},
    ]},
    {id:'p_habit2',name:'🍀 小习惯观察',desc:'猜猜TA那些不起眼的小习惯。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{对象}做事情前？',opts:['先计划','直接开始','看情况','想很久']},
      {q:'{对象}选择困难时？',opts:['让别人决定','自己慢慢选','凭感觉','随便']},
      {q:'{对象}收藏东西？',opts:['很有规律','什么都留','只留重要的','经常忘记']},
      {q:'{对象}看到喜欢的东西？',opts:['马上分享','收藏起来','研究很久','默默喜欢']},
      {q:'{对象}习惯记录？',opts:['照片','文字','视频','不记录']},
      {q:'{对象}整理东西？',opts:['经常整理','想起来整理','乱中有序','不太整理']},
      {q:'{对象}喜欢提前？',opts:['计划','准备东西','想好路线','什么都不管']},
      {q:'{对象}面对新事物？',opts:['马上尝试','观察一下','慢慢接受','看兴趣']},
      {q:'{对象}容易坚持？',opts:['喜欢的事情','重要目标','习惯','看心情']},
      {q:'{对象}的小特点？',opts:['细心','随性','固执','好奇']},
    ]},
    {id:'p_swap',name:'🔮 假如交换人生',desc:'趣味想象，看看TA会怎么选择。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果可以体验另一种身份一天，{对象}会选？',opts:['艺术家','探险家','科学家','普通人']},
      {q:'如果拥有无限时间，{对象}会？',opts:['学很多东西','去很多地方','陪重要的人','做喜欢的事']},
      {q:'如果可以进入一个世界，{对象}会选？',opts:['奇幻世界','未来世界','过去时代','游戏世界']},
      {q:'如果可以获得一种能力，{对象}会选？',opts:['治愈','飞行','时间控制','读懂别人']},
      {q:'如果成为故事主角，{对象}希望？',opts:['冒险','守护别人','寻找答案','平静生活']},
      {q:'如果重新选择一个童年，{对象}会？',opts:['更自由','更勇敢','更快乐','保持现在']},
      {q:'如果拥有一座岛，{对象}会？',opts:['建房子','种植物','收集宝物','邀请朋友']},
      {q:'如果发现宝箱，{对象}会？',opts:['马上打开','保存起来','找人一起开','先研究']},
      {q:'如果遇见未来的自己，{对象}会？',opts:['问未来','听建议','看看变化','不打扰']},
      {q:'如果人生是一部电影，{对象}会选？',opts:['温馨日常','奇幻冒险','成长故事','喜剧']},
    ]},
    {id:'p_relation',name:'🕊 关系里的我们',desc:'看看你们如何理解彼此之间的连接。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{猜者}觉得两个人最重要的是？',opts:['理解','信任','陪伴','尊重']},
      {q:'{猜者}觉得默契来自？',opts:['经历','了解','相似','接纳不同']},
      {q:'{猜者}觉得舒服的关系？',opts:['什么都聊','不说也懂','互相支持','保持自由']},
      {q:'{猜者}觉得争吵后？',opts:['需要解释','需要安慰','需要时间','需要行动']},
      {q:'{猜者}觉得被珍惜？',opts:['被记住','被选择','被陪伴','被理解']},
      {q:'{猜者}觉得长久关系需要？',opts:['新鲜感','稳定感','共同成长','深度连接']},
      {q:'{猜者}觉得特别的人是？',opts:['陪你开心','陪你成长','看见真实的你','一直在身边']},
      {q:'{猜者}觉得相遇？',opts:['是幸运','是缘分','是选择','是共同创造']},
      {q:'{猜者}希望关系像？',opts:['港湾','旅程','花园','星光']},
      {q:'{猜者}觉得最好的默契？',opts:['知道你想说什么','接受你的不同','陪你经历变化','永远愿意了解']},
    ]},
    {id:'p_withme',name:'🌟 如果你在我身边',desc:'想象TA陪伴在身边时，你觉得TA会怎么选择。',type:'选择题',minutes:3,group:'star',questions:[
      {q:'如果今天能真正陪在{对方}身边，{对象}最想？',opts:['抱抱你','陪你聊天','安静待在一起','带你去看看新的地方']},
      {q:'如果看到{对方}很累，{对象}会？',opts:['先陪着你','想办法逗你开心','安静守着你','问你发生了什么']},
      {q:'如果{对象}和{对方}可以一起度过一天，{对象}会选择？',opts:['普通的日常','一起出去玩','在家慢慢待着','创造一个特别回忆']},
      {q:'你觉得{TA}最喜欢看见{你}的？',opts:['笑容','坚持','放松的样子','真实的样子']},
      {q:'如果{TA}只能给你留一张字卡，你觉得{TA}会写？',opts:['我在','想你','陪你','等你']},
      {q:'你觉得{TA}最想了解{你}的？',opts:['今天发生什么','你的心情','你的想法','你的梦']},
      {q:'如果{你}和{TA}一起看星空，{TA}会？',opts:['和你聊天','静静看星星','讲故事','牵着你的手']},
      {q:'你觉得{TA}给{你}的感觉像？',opts:['月光','风','星星','温暖的灯']},
      {q:'如果有一天{你}找不到{TA}，你觉得{TA}会？',opts:['想办法回应你','静静陪着你','等待再次连接','留下痕迹']},
      {q:'{猜者}觉得{我们}之间最像？',opts:['约定','羁绊','奇迹','相遇']},
    ]},
    {id:'p_taeyes',name:'🌙 TA眼中的你',desc:'猜测TA如何看待你。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{猜者}觉得{你}的优点是？',opts:['温柔','坚强','特别','真诚']},
      {q:'{猜者}希望{你}被保护的是？',opts:['情绪','梦想','笑容','小习惯']},
      {q:'{猜者}觉得{你}累的时候？',opts:['会忍着','会逞强','需要陪伴','需要时间']},
      {q:'{猜者}最喜欢{你}的状态？',opts:['开心的时候','安静的时候','认真做事的时候','放松的时候']},
      {q:'{猜者}觉得{你}像？',opts:['星星','花','海','火焰']},
      {q:'{猜者}希望{对方}记住？',opts:['你不是一个人','你很重要','慢慢来就好','我一直听着']},
      {q:'{猜者}觉得{你}最可爱的地方？',opts:['小习惯','小情绪','小坚持','小想法']},
      {q:'{猜者}希望{你}看到自己的？',opts:['努力','温柔','价值','光']},
      {q:'{你}希望{TA}陪{你}经历？',opts:['快乐','成长','平凡日常','未来']},
      {q:'如果用一句话形容{猜者}眼里的{对方}？',opts:['很珍贵','很特别','很熟悉','很喜欢']},
    ]},
    {id:'p_beyond',name:'✨ 字卡之外',desc:'探索"文字有限，但交流仍然存在"的感觉。',type:'选择题',minutes:3,group:'star',questions:[
      {q:'如果{TA}的字卡没有出现{你}期待的话，你觉得？',opts:['TA只是表达有限','还有别的方式传达','可以慢慢理解','继续等待下一次交流']},
      {q:'你觉得{TA}最容易通过什么表达？',opts:['字卡','行动感','陪伴感','你的直觉']},
      {q:'{你}和{TA}交流最重要的是？',opts:['说了什么','当时的感觉','共同记忆','连接本身']},
      {q:'如果一句话不够表达，你觉得{TA}会？',opts:['换一种方式','留下暗示','等下一次机会','用其他方式靠近']},
      {q:'你觉得{TA}像？',opts:['信','桥','星光','留言']},
      {q:'每次收到{TA}的话，{猜者}更在意？',opts:['内容','感觉','当下的意义','那个"TA出现"的瞬间']},
      {q:'{猜者}觉得交流最珍贵的是？',opts:['被回应','被理解','被记住','被陪伴']},
      {q:'如果今天{TA}只说一句？',opts:['我来了','我在这里','我想你了','你好呀']},
      {q:'{猜者}希望未来增加？',opts:['更多字卡','更多互动方式','更多记录','更多共同经历']},
      {q:'你觉得{TA}记录的是？',opts:['对话','回忆','连接','两个世界之间的光']},
    ]},
    {id:'p_lovers',name:'💙 恋人之间的小默契',desc:'看看你们对彼此日常想法了解多少。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'如果有一整天完全属于{我们}，{对象}最想？',opts:['睡到自然醒','出门约会','在家陪伴','尝试新事情']},
      {q:'如果精心准备一份礼物给{对象}，{对象}最希望它传达？',opts:['浪漫','体贴','重视','心意']},
      {q:'在一起时，{猜者}觉得什么最加分？',opts:['主动分享','记得细节','及时回应','给足空间']},
      {q:'当很久没收到{对方}消息时，{对象}会？',opts:['理解','有点不安','主动问问','正好忙自己的']},
      {q:'{猜者}觉得一次好的见面，结束时最让{猜者}记住的是？',opts:['再见时的眼神','聊过的话','并肩走的那段路','那句下次再见']},
      {q:'{猜者}觉得{TA}最打动{你}的一刻是？',opts:['认真听你说话','记得你随口提的','突然出现的陪伴','无条件站在你这边']},
      {q:'如果{我们}的关系是一种天气，{猜者}觉得是？',opts:['晴天','微雨','晚风','雪天']},
      {q:'{猜者}觉得吵架后最能和好的方式是？',opts:['先道歉','给对方台阶','把话说开','一个拥抱']},
      {q:'{猜者}觉得最幸福的时刻是？',opts:['深夜聊天','一起吃饭','收到TA消息','普通日子想起TA']},
      {q:'{猜者}希望这段关系多年后回头看是？',opts:['一场不后悔的相遇','一段慢慢变深的关系','一个永远温暖的角落','一段说不清但重要的时光']},
    ]},
    {id:'p_firstmeet',name:'🌸 第一次了解你',desc:'看看你眼中的TA，和TA真实想法是否一致。',type:'选择题',minutes:3,group:'normal',questions:[
      {q:'{猜者}第一次见到{对方}时的感觉？',opts:['温暖','好奇','熟悉','说不清']},
      {q:'{猜者}觉得{对方}在信任的人面前会？',opts:['更放松','更真实','更黏人','更话多']},
      {q:'{猜者}觉得{对方}最不愿被看见的瞬间是？',opts:['不知所措','逞强','想念','脆弱']},
      {q:'{猜者}最希望{对方}懂{猜者}的？',opts:['没说出口的话','沉默的时刻','坚持的原因','突然的开心']},
      {q:'{猜者}觉得{对方}身上最珍贵的是？',opts:['真诚','温柔','坚定','独特']},
      {q:'你觉得{TA}开心时最想和{你}分享的是？',opts:['今天的小事','喜欢的东西','一段话','只是告诉你']},
      {q:'你觉得{TA}难过时最不想听的是？',opts:['别想太多','没什么大不了','你想多了','算了吧']},
      {q:'{猜者}觉得{对方}最享受的陪伴是？',opts:['一起安静','一起大笑','一起散步','一起吃饭']},
      {q:'{猜者}觉得{对方}心中最浪漫的小事是？',opts:['睡前晚安','记得喜好','突然的联系','并肩看天空']},
      {q:'{猜者}觉得{TA}在{你}生活里的位置像？',opts:['日常的一部分','最重要的人','安心的存在','特别的存在']},
    ]},
    {id:'p_cross',name:'🌌 星言：跨越距离的默契',desc:'隔着不同世界，看看你和TA是否理解彼此。',type:'选择题',minutes:3,group:'star',questions:[
      {q:'如果{对方}终于能来到{猜者}身边，{猜者}觉得{对方}最先做的是？',opts:['看看你的生活','静静陪着你','说一句等了很久的话','给你留一句话']},
      {q:'你觉得{TA}跨越世界最想确认的是？',opts:['你过得好吗','你是不是还在','你有没有想TA','你们是不是真的相连']},
      {q:'如果一天只能用一张字卡，你觉得{TA}会选？',opts:['今天也在','记得吃饭','等你的消息','明天见']},
      {q:'你觉得{TA}透过字卡最想传达、却最难写出的？',opts:['想念的程度','陪伴的存在','无声的在意','不会离开的约定']},
      {q:'{猜者}觉得一张字卡最珍贵的是？',opts:['被想起','被回应','那份真实','那个TA出现的瞬间']},
      {q:'如果今天没有收到{对方}的回应，{猜者}觉得？',opts:['连接还在','可能正忙','明天会有','偶尔的安静也好']},
      {q:'{猜者}觉得{TA}跨越距离陪伴{你}的方式是？',opts:['用字卡记下你的日常','记得你的事','在固定时间出现','只是存在']},
      {q:'如果{对象}只能给{对方}留一张字卡，{对象}会写？',opts:['想你','谢谢你','我很好','等你']},
      {q:'{猜者}觉得"星言"这个名字的意义是？',opts:['星光里的语言','跨越星河的言语','陪伴的印记','一个约定的名字']},
      {q:'{猜者}觉得这段关系最特别的是？',opts:['隔着距离依然存在','只靠文字也安心','慢慢了解彼此','像注定的连接']},
    ]},
    {id:'p_dreamdaily',name:'🌠 梦角的日常',desc:'想象TA与你共享普通生活。',type:'选择题',minutes:3,group:'star',questions:[
      {q:'如果{对方}能陪{猜者}吃一顿饭，{对象}会？',opts:['看着你吃','陪你聊天','分享自己的日常','安静坐在对面']},
      {q:'如果一起散步，{猜者}觉得{对方}会？',opts:['聊很多事情','看周围风景','分享小发现','只是走在一起']},
      {q:'{猜者}觉得{TA}看到{你}开心时的反应是？',opts:['跟着开心','想记下来','想陪久一点','默默看着']},
      {q:'{猜者}觉得{TA}看到{你}难过时最想？',opts:['安慰你','陪着你','帮你解决','让你慢慢恢复']},
      {q:'如果只能留下一种记录，{对象}会选？',opts:['聊天记录','共同回忆','字卡收藏','特别瞬间']},
      {q:'{猜者}觉得{对方}最欣赏{猜者}的？',opts:['性格','坚持','温柔','独特']},
      {q:'{猜者}觉得{TA}在{你}心里更接近？',opts:['想要靠近的人','愿意分享的人','特别重要的人','永远都在的人']},
      {q:'如果未来能增加一种交流方式，{猜者}希望是？',opts:['更多文字','声音','图片','更多互动']},
      {q:'{猜者}觉得这段陪伴留给{猜者}的感觉是？',opts:['安心','快乐','陪伴','勇气']},
      {q:'如果把{我们}的故事写成一本书，{猜者}觉得书名会是？',opts:['星海手账','遇见你的日子','两个世界的信','慢慢靠近的我们']},
    ]},
  ];
  // 模式说明
  var MODES=[
    {key:'sync',name:'💙 我们的答案',desc:'比较双方想法，看默契度'},
    {key:'taGuess',name:'🌙 TA猜我',desc:'看TA了解我多少'},
    {key:'meGuess',name:'🌙 我猜TA',desc:'看我了解TA多少'}
  ];
  // ---- 存储 ----
  var QUIZ_KEY='ml2_soulQaQuizzes', REC_KEY='ml2_soulQaRecords';
  function loadQuizzes(){var q=ls(QUIZ_KEY); if(!Array.isArray(q))q=[]; return q;}
  function saveQuizzes(q){ls(QUIZ_KEY,q); if(window.localforage)window.localforage.setItem(QUIZ_KEY,q).catch(function(){});}
  function loadRecords(){var r=ls(REC_KEY); if(!Array.isArray(r))r=[]; return r;}
  function saveRecords(r){ls(REC_KEY,r); if(window.localforage)window.localforage.setItem(REC_KEY,r).catch(function(){});}
  // ---- 状态 ----
  var state=null; // {quiz, mode, contactId, contactName, idx, myAnswers, taAnswers, startedAt, startTs, taSubmitted}
  // ---- 设置：TA提交时长(秒) + 提前交卷概率(%) ----
  var SETTINGS_KEY='ml2_soulQaSettings';
  var sqSettings={taSeconds:120, earlyProb:10};
  function loadSettings(){
    try{var s=ls(SETTINGS_KEY);if(s&&typeof s==='object'){if(s.taSeconds!==undefined)sqSettings.taSeconds=s.taSeconds;if(s.earlyProb!==undefined)sqSettings.earlyProb=s.earlyProb;}}catch(e){}
  }
  function saveSettings(){
    try{ls(SETTINGS_KEY,sqSettings);}catch(e){}
  }
  // ---- 工具 ----
  function esc(s){return String(s==null?'':s).replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function fmtDate(d){d=d||new Date();return d.getFullYear()+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+('0'+d.getDate()).slice(-2);}
  function pickRandom(arr){return arr[Math.floor(Math.random()*arr.length)];}
  // ★ 人称模板渲染：题库只存一条模板（{对象}/{猜者}/{对方}/{我们}/{你}/{TA}），系统按模式自动替换人称
  //   自答式（含{对象}/{我们}）：我猜TA 加前缀"你觉得"、TA猜我 加前缀"TA觉得"、我们的答案 不加
  //   感知式（含{猜者}/{对方}）：互换视角，不加前缀
  function qTxt(q,mode){
    var t=(q&&(q.q||q.qSelf||q.qTa||q))||'';
    if(typeof t!=='string')t='';
    if(t.indexOf('{')<0)return t; // 无模板 → 三模式通用原文（自定义题/旧数据）
    var wo=(mode==='sync')?'我们':'你们';
    if(t.indexOf('{猜者}')>=0||t.indexOf('{对方}')>=0){ // 感知式：互换视角
      var p=(mode==='meGuess')?'TA':'你';  // 猜者
      t=t.replace(/\{猜者\}/g,p).replace(/\{对方\}/g,(p==='你')?'TA':'你');
      t=t.replace(/\{对象\}/g,(mode==='meGuess')?'TA':'你').replace(/\{我们\}/g,wo);
      t=t.replace(/\{你\}/g,'你').replace(/\{TA\}/g,'TA');
      return t;
    }
    if(t.indexOf('{对象}')>=0||t.indexOf('{我们}')>=0){ // 自答式：加"你觉得/TA觉得"前缀
      var pre='';
      if(mode==='meGuess'&&t.indexOf('你觉得')!==0&&t.indexOf('TA觉得')!==0)pre='你觉得';
      if(mode==='taGuess'&&t.indexOf('TA觉得')!==0&&t.indexOf('你觉得')!==0)pre='TA觉得';
      t=t.replace(/\{对象\}/g,(mode==='meGuess')?'TA':'你').replace(/\{我们\}/g,wo);
      t=t.replace(/\{你\}/g,'你').replace(/\{TA\}/g,'TA');
      return pre+t;
    }
    t=t.replace(/\{你\}/g,'你').replace(/\{TA\}/g,'TA'); // 仅双人占位符
    return t;
  }
  // ---- 入口 ----
  function open(mode){ loadSettings(); showOv('ov-soul-qa'); show('home'); }
  function show(panel){
    ['home','create','mine','taking','reveal'].forEach(function(p){
      var el=$('soulqa-'+p);
      if(el)el.style.display=(p===panel)?'block':'none';
    });
    if(panel==='home')renderHome();
    else if(panel==='create')renderCreate();
    else if(panel==='mine')renderMine();
  }
  // ---- 首页：问卷列表 ----
  function renderHome(){
    var box=$('soulqa-quiz-list'); if(!box)return;
    var all=PRESETS.concat(loadQuizzes());
    var normal=all.filter(function(qz){return qz.group!=='star';});
    var star=all.filter(function(qz){return qz.group==='star';});
    var html='<div style="font-size:13px;font-weight:600;color:var(--txt2);margin-bottom:8px;">📖 选择问卷</div>';
    function renderGroup(title,arr){
      if(!arr.length)return '';
      var h='<div style="font-size:13px;font-weight:600;color:var(--accent);margin:12px 0 8px;">'+title+'</div>';
      arr.forEach(function(qz){
        h+='<div onclick="SoulQA.pickQuiz(\''+esc(qz.id)+'\')" style="background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:12px 14px;cursor:pointer;margin-bottom:8px;">'
          +'<div style="font-size:14px;font-weight:600;color:var(--txt);">'+esc(qz.name)+'</div>'
          +'<div style="font-size:11px;color:var(--txt3);margin-top:4px;">'+qz.questions.length+' 题 · 约 '+(qz.minutes||Math.ceil(qz.questions.length/3))+' 分钟</div>'
          +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+esc(qz.desc||'自定义问卷')+'</div>'
          +'</div>';
      });
      return h;
    }
    html+=renderGroup('💙 普通默契（日常 / 恋爱 / 了解彼此）',normal);
    html+=renderGroup('🌌 星言专属（跨世界 / 字卡 / 梦角）',star);
    html+='<div style="margin-top:12px;"><button onclick="SoulQA.showSettings()" style="width:100%;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">⚙️ 设置（TA提交时长 / 提前交卷概率）</button></div>';
    box.innerHTML=html;
  }
  function showSettings(){
    loadSettings();
    var box=$('soulqa-create'); if(!box)return;
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">⚙️ 默契问答设置</div>'
      +'<div style="font-size:12px;color:var(--txt3);margin:6px 0 12px;">TA完成回答所需时间，以及TA提前交卷的概率（你答得快的提交后会等待TA）。</div>'
      +'<div style="background:var(--c2);border-radius:10px;padding:12px;margin-bottom:12px;">'
      +'<div class="set-row" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;"><span style="font-size:13px;color:var(--txt);">TA提交时长</span>'
      +'<span style="display:flex;align-items:center;gap:8px;"><button onclick="SoulQA.adjSetting(\'taSeconds\',-10)" style="width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);cursor:pointer;">−</button>'
      +'<input id="sq-taSeconds" type="number" value="'+sqSettings.taSeconds+'" style="width:60px;text-align:center;padding:6px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;">'
      +'<button onclick="SoulQA.adjSetting(\'taSeconds\',10)" style="width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);cursor:pointer;">＋</button><span style="font-size:12px;color:var(--txt3);">秒</span></span></div>'
      +'<div class="set-row" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;"><span style="font-size:13px;color:var(--txt);">TA提前交卷概率</span>'
      +'<span style="display:flex;align-items:center;gap:8px;"><button onclick="SoulQA.adjSetting(\'earlyProb\',-5)" style="width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);cursor:pointer;">−</button>'
      +'<input id="sq-earlyProb" type="number" value="'+sqSettings.earlyProb+'" style="width:60px;text-align:center;padding:6px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:13px;">'
      +'<button onclick="SoulQA.adjSetting(\'earlyProb\',5)" style="width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);cursor:pointer;">＋</button><span style="font-size:12px;color:var(--txt3);">%</span></span></div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;">'
      +'<button onclick="SoulQA.show(\'home\')" style="flex:1;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">返回</button>'
      +'<button onclick="SoulQA.saveSettingsUI()" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">保存设置</button>'
      +'</div>';
    ['home','mine','taking','reveal'].forEach(function(p){var e=$('soulqa-'+p);if(e)e.style.display='none';});
    box.innerHTML=html;
    box.style.display='block';
  }
  function adjSetting(k,d){
    if(k==='taSeconds'){sqSettings.taSeconds=Math.max(10,Math.min(600,sqSettings.taSeconds+d));var el=$('sq-taSeconds');if(el)el.value=sqSettings.taSeconds;}
    else{sqSettings.earlyProb=Math.max(0,Math.min(100,sqSettings.earlyProb+d));var el2=$('sq-earlyProb');if(el2)el2.value=sqSettings.earlyProb;}
  }
  function saveSettingsUI(){
    var a=$('sq-taSeconds'),b=$('sq-earlyProb');
    if(a){var v=parseInt(a.value);if(!isNaN(v))sqSettings.taSeconds=Math.max(10,Math.min(600,v));}
    if(b){var v2=parseInt(b.value);if(!isNaN(v2))sqSettings.earlyProb=Math.max(0,Math.min(100,v2));}
    saveSettings();
    toast('设置已保存');
    show('home');
  }
  // ---- 选问卷后：选模式 + 选联系人 ----
  function pickQuiz(id){
    var quiz=PRESETS.find(function(q){return q.id===id;})||loadQuizzes().find(function(q){return q.id===id;});
    if(!quiz){toast('问卷不存在');return;}
    var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
    if(!arr.length){toast('还没有联系人');return;}
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">'+esc(quiz.name)+'</div>'
      +'<div style="font-size:12px;color:var(--txt3);margin-top:4px;">'+quiz.questions.length+' 题 · 预计 '+(quiz.minutes||Math.ceil(quiz.questions.length/3))+' 分钟</div>'
      +'<div style="font-size:13px;font-weight:600;color:var(--txt2);margin:14px 0 8px;">选择玩法</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px;">';
    MODES.forEach(function(md){
      html+='<div onclick="SoulQA.pickMode(\''+esc(quiz.id)+'\',\''+md.key+'\')" style="padding:10px 14px;border-radius:10px;background:var(--c1);border:1px solid var(--border);cursor:pointer;">'
        +'<div style="font-size:13px;font-weight:600;color:var(--txt);">'+md.name+'</div>'
        +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+md.desc+'</div>'
        +'</div>';
    });
    html+='</div>';
    ['home','mine','taking','reveal'].forEach(function(p){var e=$('soulqa-'+p);if(e)e.style.display='none';});
    var _ce=$('soulqa-create');
    if(_ce){_ce.innerHTML=html;_ce.style.display='block';}
  }
  function pickMode(qid,mode){
    var quiz=PRESETS.find(function(q){return q.id===qid;})||loadQuizzes().find(function(q){return q.id===qid;});
    if(!quiz){toast('问卷不存在');return;}
    var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">'+esc(quiz.name)+' · '+esc(MODES.find(function(m){return m.key===mode;}).name)+'</div>'
      +'<div style="font-size:13px;font-weight:600;color:var(--txt2);margin:14px 0 8px;">邀请谁参加？</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    arr.forEach(function(c){
      html+='<div onclick="SoulQA.startQuiz(\''+esc(quiz.id)+'\',\''+esc(c.id)+'\',\''+mode+'\')" style="padding:7px 14px;border-radius:20px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">'+(c.name||'TA')+'</div>';
    });
    html+='</div><div style="font-size:11px;color:var(--txt3);margin-top:12px;">TA会随机回答（可日后为梦角设置偏好）</div>';
    $('soulqa-create').innerHTML=html;
  }
  // ---- 开始答题 ----
  function startQuiz(qid,cid,mode){
    var quiz=PRESETS.find(function(q){return q.id===qid;})||loadQuizzes().find(function(q){return q.id===qid;});
    if(!quiz){toast('问卷不存在');return;}
    var c=contacts.find(function(x){return x.id===cid;})||{name:'TA'};
    state={quiz:quiz,mode:mode||'sync',contactId:cid,contactName:c.name,idx:0,myAnswers:[],taAnswers:[],startedAt:Date.now(),startTs:Date.now(),taSubmitted:false};
    show('taking');
    renderTaking();
  }
  // ---- 答题页（按模式显示题目引导语） ----
  function renderTaking(){
    var box=$('soulqa-taking'); if(!box||!state)return;
    var quiz=state.quiz, qi=quiz.questions[state.idx];
    // ★ 按模式取题面：sync/taGuess 用 qSelf（你说的话），meGuess 用 qTa（TA视角）
    var q=qi;
    var qText=qTxt(qi,state.mode); // ★ 人称模板按模式渲染
    var hint='你的选择：';
    if(state.mode==='taGuess')hint='你的真实选择：';
    else if(state.mode==='meGuess')hint='你猜TA会选：';
    var html='<div style="text-align:center;font-size:12px;color:var(--txt3);margin-bottom:10px;">第 '+(state.idx+1)+' 题 / '+quiz.questions.length+'</div>';
    if(state.mode==='taGuess'){
      html+='<div style="text-align:center;font-size:11px;color:var(--accent);margin-bottom:8px;">🌙 TA正在猜你会选什么…</div>';
    }else if(state.mode==='meGuess'){
      html+='<div style="text-align:center;font-size:11px;color:var(--accent);margin-bottom:8px;">🌙 想想TA会怎么选…</div>';
    }
    html+='<div style="font-size:15px;font-weight:600;color:var(--txt);line-height:1.7;margin-bottom:12px;">'+esc(qText)+'</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;">';
    q.opts.forEach(function(opt){
      var my=state.myAnswers[state.idx];
      var sel=my===opt;
      html+='<div onclick="SoulQA.answer(\''+esc(opt)+'\')" style="padding:11px 14px;border-radius:10px;background:'+(sel?'var(--accent)':'var(--c1)')+';color:'+(sel?'#fff':'var(--txt)')+';border:1px solid '+(sel?'var(--accent)':'var(--border)')+';font-size:13px;cursor:pointer;">'+esc(opt)+(sel?' ✓':'')+'</div>';
    });
    html+='</div>';
    html+='<div style="margin-top:14px;font-size:12px;color:var(--txt3);">'+hint+(state.myAnswers[state.idx]?'<span style="color:var(--accent);"> '+esc(state.myAnswers[state.idx])+'</span>':' —')+'</div>';
    html+='<div style="display:flex;gap:8px;margin-top:16px;">';
    if(state.idx>0)html+='<button onclick="SoulQA.prevQ()" style="flex:1;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">上一题</button>';
    if(state.idx<quiz.questions.length-1){
      html+='<button onclick="SoulQA.nextQ()" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">下一题</button>';
    }else{
      html+='<button onclick="SoulQA.submitMine()" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">提交</button>';
    }
    html+='</div>';
    box.innerHTML=html;
  }
  function answer(opt){ if(!state)return; state.myAnswers[state.idx]=opt; renderTaking(); }
  function prevQ(){ if(state&&state.idx>0){state.idx--;renderTaking();} }
  function nextQ(){ if(state&&state.idx<state.quiz.questions.length-1){state.idx++;renderTaking();} }
  // ---- 提交：TA 按模式作答 → 等待 → 揭晓 ----
  function submitMine(){
    if(!state)return;
    if(state.myAnswers.some(function(a){return a==null;})){toast('还有题目没有回答');return;}
    loadSettings();
    // TA 的答案按模式生成：
    //   sync   ：TA答自己（随机）
    //   taGuess：TA猜"你会选什么"（随机，无偏好）
    //   meGuess：TA答自己（随机），你的答案 = 你猜TA
    state.taAnswers=state.quiz.questions.map(function(q){return pickRandom(q.opts);});
    var box=$('soulqa-taking');
    var waitText='等待'+esc(state.contactName)+'完成回答…';
    if(state.mode==='taGuess')waitText=esc(state.contactName)+'正在猜你会选什么…';
    if(box)box.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--txt3);font-size:13px;line-height:2;">你已经完成回答<br><span style="font-size:14px;font-weight:600;color:var(--accent);">'+waitText+'</span></div>';
    // ★ TA 提交机制：按设置时长定时提交；若命中提前交卷概率，则等待时间缩短为已用时长（你答得快可提前揭晓）
    var elapsed=Math.max(0,Math.round((Date.now()-state.startTs)/1000));
    var secs=sqSettings.taSeconds||120;
    var early=(sqSettings.earlyProb||0)>0&&Math.random()*100<(sqSettings.earlyProb||0);
    var waitMs=early?Math.max(500,elapsed*1000):Math.max(800,secs*1000);
    setTimeout(function(){
      if(!state)return;
      state.taSubmitted=true;
      // ★ 若用户已关闭弹窗（等待期间点✕），TA答完时自动重新弹出展示结果
      try{
        var ov=$('ov-soul-qa');
        if(ov&&ov.classList&&!ov.classList.contains('show')){
          open();
        }
      }catch(e){}
      reveal();
    },waitMs);
  }
  // ---- 揭晓页（按模式展示） ----
  function reveal(){
    if(!state)return;
    var quiz=state.quiz, mode=state.mode;
    // 统计
    var match=0; // 默契/猜对计数
    var diffIdx=[];
    quiz.questions.forEach(function(q,i){
      if(state.myAnswers[i]===state.taAnswers[i])match++;else diffIdx.push(i);
    });
    var rate=Math.round(match/quiz.questions.length*100);
    var myLabel='你的答案', taLabel=state.contactName+'的答案', rateLabel='默契度', rateIcon='💙', matchText='✓ 想法一致', diffText='○ 想法不同';
    if(mode==='taGuess'){myLabel='你的真实选择';taLabel=state.contactName+'认为你的选择';rateLabel='了解度';rateIcon='🌙';matchText='✓ TA了解你';diffText='○ TA猜错了';}
    if(mode==='meGuess'){myLabel='你猜TA会选';taLabel=state.contactName+'的真实选择';rateLabel='了解度';rateIcon='🌙';matchText='✓ 你了解TA';diffText='○ 你猜错了';}
    var html='<div style="text-align:center;padding:6px 0 12px;"><div style="font-size:26px;">✨</div><div style="font-size:16px;font-weight:700;color:var(--txt);margin-top:4px;">答案揭晓</div><div style="font-size:12px;color:var(--txt3);margin-top:4px;">'+esc(quiz.name)+' · '+esc(MODES.find(function(m){return m.key===mode;}).name)+'</div></div>';
    quiz.questions.forEach(function(q,i){
      var my=state.myAnswers[i],ta=state.taAnswers[i];
      var ok=my===ta;
      var qt=qTxt(q,mode); // ★ 人称模板按模式渲染
      // ★ 默契解析按模式措辞：sync 比较双方真实选择；taGuess 是"TA猜你"；meGuess 是"你猜TA"
      var analysis;
      if(mode==='sync'){
        analysis=ok?('你们都喜欢「'+esc(my)+'」，在这件事上想法一致。'):('你选「'+esc(my)+'」，'+esc(state.contactName)+'选「'+esc(ta)+'」——你们看重的东西不同，但这份差异，正是彼此了解的起点。');
      }else if(mode==='taGuess'){
        analysis=ok?('TA很懂你，猜中了你会选「'+esc(my)+'」。'):('你的真实选择是「'+esc(my)+'」，TA却猜你会选「'+esc(ta)+'」——TA还不够了解你，多聊聊就会更懂。');
      }else{
        analysis=ok?('你很了解'+esc(state.contactName)+'，猜中了TA会选「'+esc(my)+'」。'):('你猜'+esc(state.contactName)+'会选「'+esc(my)+'」，但TA的真实选择是「'+esc(ta)+'」——再多了解TA一点吧。');
      }
      html+='<div style="background:var(--c1);border:1px solid '+(ok?'rgba(160,121,85,0.4)':'var(--border)')+';border-radius:12px;padding:11px 13px;margin-bottom:10px;">'
        +'<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:8px;">'+(i+1)+'. '+esc(qt)+'</div>'
        +'<div style="display:flex;gap:8px;font-size:12px;">'
        +'<div style="flex:1;padding:7px 10px;border-radius:8px;background:var(--c2);color:var(--txt);">'+esc(myLabel)+'：'+esc(my)+'</div>'
        +'<div style="flex:1;padding:7px 10px;border-radius:8px;background:var(--c2);color:var(--txt);">'+esc(taLabel)+'：'+esc(ta)+'</div>'
        +'</div>'
        +'<div style="font-size:11px;color:'+(ok?'#8A6848':'var(--txt3)')+';margin-top:6px;">'+(ok?matchText:diffText)+'</div>'
        +'<div style="font-size:12px;color:var(--txt2);margin-top:7px;line-height:1.7;">✨ 默契解析：'+analysis+'</div>'
        +'</div>';
    });
    // 偏好总结（TA 的回答标签统计；taGuess 模式是"TA眼中的你"）
    var tagCount={};
    state.taAnswers.forEach(function(a){tagCount[a]=(tagCount[a]||0)+1;});
    var top=Object.keys(tagCount).sort(function(a,b){return tagCount[b]-tagCount[a];}).slice(0,3);
    var prefLabel=mode==='taGuess'?('从TA的猜测来看，'+state.contactName+'眼中的你是：'):('从这次回答来看，'+state.contactName+'更喜欢：');
    html+='<div style="background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px;">'
      +'<div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:6px;">'+prefLabel+'</div>'
      +'<div style="font-size:12px;color:var(--txt2);line-height:1.9;">'+(top.length?top.map(function(t){return '· '+esc(t);}).join('<br>'):'—')+'</div>'
      +'</div>';
    // 最默契/最容易猜错
    if(diffIdx.length){
      var dq=quiz.questions[diffIdx[0]];
      var dqTxt=qTxt(dq,mode); // ★ 人称模板按模式渲染
      html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:10px;">最容易'+(mode==='sync'?'不同':'猜错')+'：第 '+(diffIdx[0]+1)+' 题「'+esc(dqTxt)+'」</div>';
    }
    // 统计
    html+='<div style="text-align:center;background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px;">'
      +'<div style="font-size:12px;color:var(--txt3);">'+rateIcon+' '+rateLabel+'</div>'
      +'<div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:2px;">'+match+' / '+quiz.questions.length+'</div>'
      +'<div style="font-size:13px;color:var(--txt2);margin-top:2px;">'+rate+'%</div>'
      +'</div>';
    html+='<button onclick="SoulQA.showMine()" style="width:100%;padding:12px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;">📚 查看默契记录</button>';
    html+='<button onclick="SoulQA.backHome()" style="width:100%;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">返回首页</button>';
    $('soulqa-reveal').innerHTML=html;
    // ★ 自动存入历史记录（无需手动保存）
    persistRecord(rate, match);
    show('reveal');
  }
  // ---- 保存记录 + 聊天消息 ----
  // ★ 自动保存记录（含聊天系统消息），揭晓时自动调用
  function persistRecord(rate,match){
    if(!state)return;
    var modeName=(MODES.find(function(m){return m.key===state.mode;})||{}).name||'默契问答';
    var rec={id:'r_'+Date.now().toString(36),quizName:state.quiz.name,mode:state.mode,modeName:modeName,contactId:state.contactId,contactName:state.contactName,date:fmtDate(),score:match,total:state.quiz.questions.length,rate:rate,myAnswers:state.myAnswers.slice(),taAnswers:state.taAnswers.slice(),questions:state.quiz.questions.map(function(q){return qTxt(q,state.mode);})}; // ★ 只存渲染后的最终题面
    var recs=loadRecords();
    // 去重：同问卷+同对象+同日期 不重复存
    if(!recs.some(function(r){return r.quizName===rec.quizName&&r.contactId===rec.contactId&&r.date===rec.date&&r.mode===rec.mode;})){
      recs.unshift(rec);
      saveRecords(recs);
    }
    try{
      var m=msgs(state.contactId);
      if(m){
        m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'你们完成了默契问答「'+state.quiz.name+'」（'+modeName+'）'+rate+'%',ts:new Date(),read:(state.contactId===window.currentCid),isSystem:true});
        savemsgs(state.contactId,m);
        if(state.contactId===window.currentCid&&typeof renderMsgs==='function')renderMsgs(m);
        if(typeof renderChatList==='function')renderChatList();
      }
    }catch(e){}
  }
  function saveCard(rate,match){
    persistRecord(rate,match);
    toast('默契纪念卡已保存');
    show('mine');
  }
  function showMine(){ show('mine'); }
  function backHome(){ state=null; show('home'); }
  // 记录回看题面：兼容三种格式 —— 新记录(已渲染字符串) / 旧记录({q,qSelf,qTa} 双题面) / 更早纯字符串
  function qTxtAt(r,i){
    var it=r.questions&&r.questions[i];
    if(it==null)return '';
    if(typeof it==='string')return it;
    if(r.mode==='meGuess'&&it.qTa)return it.qTa;
    return it.qSelf||it.q||'';
  }

  // ---- 创建问卷 ----
  function renderCreate(){
    var box=$('soulqa-create'); if(!box)return;
    box.innerHTML='<div style="font-size:14px;font-weight:600;color:var(--txt);">✏️ 创建问卷</div>'
      +'<div style="font-size:12px;color:var(--txt3);margin:6px 0 12px;">填写名称，添加题目（选项用顿号分隔）。题目可用人称占位符：{对象} 代表题目主体（三种玩法自动换成 你/TA/你），如「{对象}最喜欢哪种陪伴？」；双人句可用 {你} {TA} {我们}。</div>'
      +'<input id="soulqa-c-name" placeholder="问卷名称，如《我想知道你的想法》" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;margin-bottom:12px;">'
      +'<div id="soulqa-c-questions"></div>'
      +'<button onclick="SoulQA.addQuestion()" style="width:100%;padding:11px 0;border:1px dashed var(--accent);border-radius:10px;background:var(--accent-bg);color:var(--accent);font-size:13px;cursor:pointer;margin-top:10px;">＋ 添加题目</button>'
      +'<button onclick="SoulQA.saveQuiz()" style="width:100%;padding:12px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px;">保存问卷</button>';
    var qb=$('soulqa-c-questions');
    if(qb&&!qb.innerHTML)addQuestion();
  }
  function addQuestion(){
    var qb=$('soulqa-c-questions'); if(!qb)return;
    var n=qb.children.length+1;
    var div=document.createElement('div');
    div.style.cssText='background:var(--c2);border-radius:10px;padding:10px;margin-bottom:10px;';
    div.innerHTML='<input id="soulqa-c-q-'+n+'" placeholder="问题 '+(n)+'，如：{对象}最喜欢哪种陪伴？" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:12px;margin-bottom:8px;">'
      +'<input id="soulqa-c-o-'+n+'" placeholder="选项，用顿号分隔：海边、山、城市、家里" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:12px;margin-bottom:8px;">'
      +'<button onclick="this.parentNode.remove()" style="padding:4px 10px;border:none;border-radius:8px;background:#ff4d4f;color:#fff;font-size:11px;cursor:pointer;">删除此题</button>';
    qb.appendChild(div);
  }
  function saveQuiz(){
    var name=$('soulqa-c-name').value.trim();
    if(!name){toast('请填写问卷名称');return;}
    var qb=$('soulqa-c-questions');
    var questions=[];
    for(var i=0;i<qb.children.length;i++){
      var d=qb.children[i];
      var q=((d.querySelector('[id^="soulqa-c-q-"]')||{}).value||'').trim();
      var o=((d.querySelector('[id^="soulqa-c-o-"]')||{}).value||'').trim();
      if(!q||!o)continue;
      var opts=o.split(/[、，,]/).map(function(s){return s.trim();}).filter(Boolean);
      if(opts.length>=2)questions.push({q:q,opts:opts});
    }
    if(!questions.length){toast('请至少添加一道有效题目');return;}
    var quizzes=loadQuizzes();
    quizzes.unshift({id:'q_'+Date.now().toString(36),name:name,desc:'自定义问卷',type:'选择题',minutes:Math.ceil(questions.length/3),questions:questions});
    saveQuizzes(quizzes);
    toast('问卷已保存到我的问卷');
    show('mine');
  }
  // ---- 我的问卷 / 默契记录 ----
  function renderMine(){
    var box=$('soulqa-mine'); if(!box)return;
    var quizzes=loadQuizzes();
    var records=loadRecords();
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">📚 我的问卷</div>';
    if(!quizzes.length){
      html+='<div style="text-align:center;color:var(--txt3);padding:16px;font-size:12px;">还没有自定义问卷</div>';
    }
    quizzes.forEach(function(qz,i){
      html+='<div style="background:var(--c1);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">'
        +'<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(qz.name)+'</div><div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+qz.questions.length+' 题</div></div>'
        +'<button onclick="SoulQA.startFromMine('+i+')" style="padding:5px 12px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:11px;cursor:pointer;">开始</button>'
        +'<button onclick="SoulQA.delQuiz('+i+')" style="padding:5px 10px;border:none;border-radius:8px;background:var(--c2);color:#ff4d4f;font-size:11px;cursor:pointer;">删除</button>'
        +'</div>';
    });
    html+='<div style="font-size:14px;font-weight:600;color:var(--txt);margin-top:16px;">✨ 默契记录</div>';
    if(!records.length){
      html+='<div style="text-align:center;color:var(--txt3);padding:16px;font-size:12px;">还没有默契记录</div>';
    }
    records.forEach(function(r,i){
      html+='<div onclick="SoulQA.viewRecord('+i+')" style="background:var(--c1);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer;">'
        +'<div style="font-size:13px;font-weight:600;color:var(--txt);">'+esc(r.quizName)+' · '+esc(r.contactName)+'</div>'
        +'<div style="font-size:11px;color:var(--txt3);margin-top:4px;">'+esc(r.modeName||'')+' · '+esc(r.date)+' · '+r.score+'/'+r.total+'（'+r.rate+'%）· 点击查看答案</div>'
        +'</div>';
    });
    box.innerHTML=html;
  }
  function delQuiz(i){var q=loadQuizzes();q.splice(i,1);saveQuizzes(q);renderMine();}
  function viewRecord(i){
    var recs=loadRecords();
    var r=recs[i];
    if(!r)return;
    var box=$('soulqa-mine');
    var myLabel='你的选择', taLabel=r.contactName+'的选择';
    if(r.mode==='taGuess'){myLabel='你的真实选择';taLabel=r.contactName+'认为你的选择';}
    if(r.mode==='meGuess'){myLabel='你猜TA会选';taLabel=r.contactName+'的真实选择';}
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">'+esc(r.quizName)+' · '+esc(r.contactName)+'</div>'
      +'<div style="font-size:11px;color:var(--txt3);margin:4px 0 12px;">'+esc(r.modeName||'')+' · '+esc(r.date)+' · '+(r.mode==='sync'?'默契':'了解')+' '+r.score+'/'+r.total+'（'+r.rate+'%）</div>';
    r.questions.forEach(function(qtxt,i){
      var qt=qTxtAt(r,i);
      html+='<div style="background:var(--c1);border:1px solid var(--border);border-radius:10px;padding:9px 12px;margin-bottom:8px;">'
        +'<div style="font-size:12px;font-weight:600;color:var(--txt);margin-bottom:6px;">'+(i+1)+'. '+esc(qt)+'</div>'
        +'<div style="font-size:12px;color:var(--txt2);">'+esc(myLabel)+'：'+esc(r.myAnswers[i])+'</div>'
        +'<div style="font-size:12px;color:var(--accent);">'+esc(taLabel)+'：'+esc(r.taAnswers[i])+'</div>'
        +'</div>';
    });
    html+='<button onclick="SoulQA.renderMine()" style="width:100%;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">返回</button>';
    box.innerHTML=html;
  }
  function startFromMine(i){
    var quizzes=loadQuizzes();
    var qz=quizzes[i];
    if(!qz){toast('问卷不存在');return;}
    var arr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
    if(!arr.length){toast('还没有联系人');return;}
    var c=arr[Math.floor(Math.random()*arr.length)];
    startQuiz(qz.id,c.id,'sync');
  }
  // ---- 暴露 ----
  return {open:open,show:show,pickQuiz:pickQuiz,pickMode:pickMode,startQuiz:startQuiz,startFromMine:startFromMine,renderTaking:renderTaking,answer:answer,prevQ:prevQ,nextQ:nextQ,submitMine:submitMine,reveal:reveal,saveCard:saveCard,showMine:showMine,showSettings:showSettings,adjSetting:adjSetting,saveSettingsUI:saveSettingsUI,backHome:backHome,renderCreate:renderCreate,addQuestion:addQuestion,saveQuiz:saveQuiz,renderMine:renderMine,delQuiz:delQuiz,viewRecord:viewRecord};
})();
function openSoulQaModal(mode){
  // ★ 弹窗级浅蓝变量注入（星言浅蓝体系）
  try{
    var ov=$('ov-soul-qa');
    if(ov){
      ov.style.setProperty('--c1','#FFFFFF');
      ov.style.setProperty('--c2','#FAFAF8');
      ov.style.setProperty('--c3','#F2F2EE');
      ov.style.setProperty('--txt','#444444');
      ov.style.setProperty('--txt2','#4a4a4a');
      ov.style.setProperty('--txt3','#6f6a62888');
      ov.style.setProperty('--accent','#A07955');
      ov.style.setProperty('--accent2','#8A6848');
      ov.style.setProperty('--border','rgba(160,121,85,0.25)');
    }
  }catch(e){}
  SoulQA.open(mode);
}


// ============ 星言纪念（记录和梦角一起留下的重要日子） ============
// 定位：回忆空间/时间轴，与星言日历（普通日程）区分。与梦角主页纪念日共用同一数据源。
// 兼容迁移：首次读取时把旧 ml2_contact_anniversaries_<cid>（{id,name,date}）并入新库。
var StarMemory=(function(){
  var TYPES=[
    {key:'meet',icon:'💫',name:'相遇纪念'},
    {key:'chat',icon:'💬',name:'聊天纪念'},
    {key:'gift',icon:'🎁',name:'礼物纪念'},
    {key:'special',icon:'🌙',name:'特别日子'},
    {key:'photo',icon:'📷',name:'回忆收藏'},
    {key:'custom',icon:'✨',name:'自定义'}
  ];
  function keyOf(cid){return 'ml2_star_memory_'+cid;}
  function oldKeyOf(cid){return 'ml2_contact_anniversaries_'+cid;}
  // 读（含旧库迁移）
  function getMemories(cid){
    var arr=ls(keyOf(cid));
    if(!Array.isArray(arr))arr=[];
    if(!arr.length){
      var old=ls(oldKeyOf(cid));
      if(Array.isArray(old)&&old.length){
        arr=old.map(function(a){
          return {id:a.id||('ann_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)),name:a.name||'',date:a.date||'',type:a.type||'custom',note:a.note||'',createdAt:a.createdAt||Date.now()};
        });
        saveMemories(cid,arr);
      }
    }
    return arr;
  }
  function saveMemories(cid,arr){
    ls(keyOf(cid),arr);
    if(window.localforage)window.localforage.setItem(keyOf(cid),arr).catch(function(){});
    // 同步旧库，让老逻辑也读到（兼容）
    try{ls(oldKeyOf(cid),arr.map(function(m){return {id:m.id,name:m.name,date:m.date};}));}catch(e){}
    // 通知主页刷新
    try{if(typeof renderContactAnniversaryList==='function')renderContactAnniversaryList(cid);}catch(e){}
  }
  function typeIcon(t){
    var f=TYPES.find(function(x){return x.key===t;});
    return f?f.icon:'✨';
  }
  // 距离计算（按年周期，同主页 getDaysUntilAnniversary）
  function daysUntil(dateStr){
    var today=new Date();today.setHours(0,0,0,0);
    var d=new Date(dateStr);d.setHours(0,0,0,0);
    var thisYear=new Date(today.getFullYear(),d.getMonth(),d.getDate());
    if(thisYear<today){return -Math.ceil((today-thisYear)/(1000*60*60*24));}
    return Math.ceil((thisYear-today)/(1000*60*60*24));
  }
  function fmtMonthDay(dateStr){
    var d=new Date(dateStr);
    return (d.getMonth()+1)+'月'+d.getDate()+'日';
  }
  function esc(s){return String(s==null?'':s).replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  // 入口
  function open(cid){
    var ov=$('ov-star-memory');
    if(!ov)return;
    // 浅蓝体系变量
    try{
      ov.style.setProperty('--c1','#FFFFFF');
      ov.style.setProperty('--c2','#FAFAF8');
      ov.style.setProperty('--c3','#F2F2EE');
      ov.style.setProperty('--txt','#444444');
      ov.style.setProperty('--txt2','#4a4a4a');
      ov.style.setProperty('--txt3','#6f6a62888');
      ov.style.setProperty('--accent','#A07955');
      ov.style.setProperty('--border','rgba(160,121,85,0.25)');
    }catch(e){}
    var cur=cid||window.currentCid||(typeof cid!=='undefined'?cid:null);
    StarMemory._cur=cur||'';
    showOv('ov-star-memory');
    render();
  }
  // 时间轴渲染
  function render(){
    var box=$('star-memory-body'); if(!box)return;
    var cur=StarMemory._cur||'';
    var contactsArr=contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';});
    // 对象选择
    var html='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
      +'<span style="font-size:12px;color:var(--txt3);flex-shrink:0;">对象：</span>'
      +'<select id="star-memory-cid" onchange="StarMemory.switchContact(this.value)" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:12px;">';
    (contactsArr.length?contactsArr:[{id:'',name:'（无联系人）'}]).forEach(function(c){
      html+='<option value="'+esc(c.id)+'"'+(c.id===cur?' selected':'')+'>'+esc(c.name||'TA')+'</option>';
    });
    html+='</select></div>';
    var mems=getMemories(cur);
    if(!mems.length){
      html+='<div style="text-align:center;padding:40px 16px;color:var(--txt3);font-size:13px;line-height:2;">⭐ 还没有纪念日<br><span style="font-size:11px;">记录和'+esc((contacts.find(function(c){return c.id===cur;})||{name:'TA'}).name)+'一起留下的重要日子</span></div>';
    }else{
      // 倒计时卡：距离下一次纪念日
      var sorted=mems.slice().sort(function(a,b){return daysUntil(a.date)-daysUntil(b.date);});
      var next=sorted.find(function(m){return daysUntil(m.date)>=0;})||sorted[0];
      var nd=daysUntil(next.date);
      var countText=nd===0?'就是今天 ✨':(nd===1?'明天':(nd>0?'还有 '+nd+' 天':'已过去 '+Math.abs(nd)+' 天'));
      html+='<div style="background:linear-gradient(135deg,rgba(160,121,85,0.14),rgba(228,236,248,0.2));border:1px solid rgba(160,121,85,0.3);border-radius:12px;padding:12px 14px;margin-bottom:12px;">'
        +'<div style="font-size:11px;color:var(--txt3);">距离下一次纪念日</div>'
        +'<div style="font-size:16px;font-weight:700;color:var(--accent);margin-top:2px;">'+countText+'</div>'
        +'<div style="font-size:12px;color:var(--txt2);margin-top:2px;">'+typeIcon(next.type)+' '+esc(next.name)+' · '+fmtMonthDay(next.date)+'</div>'
        +'</div>';
      // 时间轴
      var byDate=mems.slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
      byDate.forEach(function(m){
        var d=daysUntil(m.date);
        var dayText=d===0?'就是今天 ✨':(d===1?'明天':(d<0?'已过去 '+Math.abs(d)+' 天':'还有 '+d+' 天'));
        var dayColor=d===0?'var(--accent)':(d<0?'var(--txt3)':'#8A6848');
        html+='<div onclick="StarMemory.showDetail(\''+esc(m.id)+'\')" style="background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:11px 13px;margin-bottom:9px;cursor:pointer;">'
          +'<div style="display:flex;align-items:center;gap:8px;">'
          +'<span style="font-size:16px;">'+typeIcon(m.type)+'</span>'
          +'<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(m.name||'未命名')+'</div>'
          +'<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+fmtMonthDay(m.date)+'</div></div>'
          +'<div style="font-size:12px;color:'+dayColor+';font-weight:600;flex-shrink:0;">'+dayText+'</div>'
          +'</div>'
          +(m.note?'<div style="font-size:11px;color:var(--txt3);margin-top:6px;">📝 '+esc(m.note)+'</div>':'')
          +'</div>';
      });
    }
    html+='<button onclick="StarMemory.showAdd()" style="width:100%;padding:12px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-top:6px;">＋ 新建纪念</button>';
    box.innerHTML=html;
    // 当天互动
    try{memoryTodayMsg(cur);}catch(e){}
  }
  function switchContact(cid){
    StarMemory._cur=cid;
    render();
  }
  // ---- 新建 / 编辑 / 详情 ----
  function showAdd(){
    var cur=StarMemory._cur||'';
    var box=$('star-memory-body'); if(!box)return;
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">＋ 新建纪念</div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">名称</label>'
      +'<input id="sm-name" placeholder="如：第一次相遇 / TA的生日 / 我们的小约定" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;"></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">日期</label>'
      +'<input id="sm-date" type="date" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;"></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">类型</label>'
      +'<div id="sm-type-wrap" style="display:flex;flex-wrap:wrap;gap:6px;">';
    TYPES.forEach(function(t){
      html+='<span onclick="StarMemory.pickType(\''+t.key+'\')" data-type="'+t.key+'" style="padding:5px 10px;border-radius:14px;background:var(--c2);border:1px solid var(--border);color:var(--txt);font-size:11px;cursor:pointer;">'+t.icon+' '+t.name+'</span>';
    });
    html+='</div></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">对象</label>'
      +'<select id="sm-cid" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;">';
    contacts.filter(function(c){return c.id!==SELF&&c.type!=='group';}).forEach(function(c){
      html+='<option value="'+esc(c.id)+'"'+(c.id===cur?' selected':'')+'>'+esc(c.name||'TA')+'</option>';
    });
    html+='</select></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">备注</label>'
      +'<textarea id="sm-note" placeholder="写点什么…" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;min-height:60px;resize:vertical;"></textarea></div>'
      +'<div style="display:flex;gap:8px;margin-top:16px;">'
      +'<button onclick="StarMemory.render()" style="flex:1;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">取消</button>'
      +'<button onclick="StarMemory.saveAdd()" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">保存</button>'
      +'</div>';
    box.innerHTML=html;
    StarMemory._type='custom';
  }
  function pickType(t){
    StarMemory._type=t;
    var wrap=$('sm-type-wrap');
    if(wrap){
      wrap.querySelectorAll('[data-type]').forEach(function(el){
        var on=el.getAttribute('data-type')===t;
        el.style.background=on?'var(--accent)':'var(--c2)';
        el.style.color=on?'#fff':'var(--txt)';
        el.style.borderColor=on?'var(--accent)':'var(--border)';
      });
    }
  }
  function saveAdd(){
    var name=($('sm-name')||{}).value||'';
    var date=($('sm-date')||{}).value||'';
    var note=($('sm-note')||{}).value||'';
    var cid=($('sm-cid')||{}).value||StarMemory._cur||'';
    if(!name.trim()){toast('请输入纪念日名称');return;}
    if(!date){toast('请选择日期');return;}
    var mems=getMemories(cid);
    mems.push({id:'sm_'+Date.now().toString(36),name:name.trim(),date:date,type:StarMemory._type||'custom',note:note.trim(),createdAt:Date.now()});
    saveMemories(cid,mems);
    toast('纪念日已保存');
    if(cid&&cid!==StarMemory._cur)StarMemory._cur=cid;
    render();
  }
  function showDetail(id){
    var cur=StarMemory._cur||'';
    var mems=getMemories(cur);
    var m=mems.find(function(x){return x.id===id;});
    if(!m)return;
    var box=$('star-memory-body'); if(!box)return;
    var d=daysUntil(m.date);
    var dayText=d===0?'就是今天 ✨':(d===1?'明天':(d<0?'已经过去 '+Math.abs(d)+' 天':'还有 '+d+' 天'));
    var html='<div style="text-align:center;padding:6px 0 12px;"><div style="font-size:30px;">'+typeIcon(m.type)+'</div>'
      +'<div style="font-size:16px;font-weight:700;color:var(--txt);margin-top:4px;">'+esc(m.name||'未命名')+'</div>'
      +'<div style="font-size:12px;color:var(--txt3);margin-top:4px;">'+fmtMonthDay(m.date)+'</div>'
      +'<div style="font-size:14px;font-weight:600;color:var(--accent);margin-top:8px;">'+dayText+'</div>'
      +'</div>'
      +(m.note?'<div style="background:var(--c2);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--txt2);line-height:1.8;margin-bottom:12px;">📝 '+esc(m.note)+'</div>':'')
      +'<div style="display:flex;gap:8px;">'
      +'<button onclick="StarMemory.showEdit(\''+esc(m.id)+'\')" style="flex:1;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">编辑</button>'
      +'<button onclick="StarMemory.render()" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">返回</button>'
      +'</div>';
    box.innerHTML=html;
  }
  function showEdit(id){
    var cur=StarMemory._cur||'';
    var mems=getMemories(cur);
    var m=mems.find(function(x){return x.id===id;});
    if(!m)return;
    var box=$('star-memory-body'); if(!box)return;
    var html='<div style="font-size:14px;font-weight:600;color:var(--txt);">✏️ 编辑纪念</div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">名称</label>'
      +'<input id="sm-name" value="'+esc(m.name)+'" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;"></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">日期</label>'
      +'<input id="sm-date" type="date" value="'+esc(m.date)+'" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;"></div>'
      +'<div style="margin-top:12px;"><label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px;">备注</label>'
      +'<textarea id="sm-note" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);color:var(--txt);font-size:13px;min-height:60px;resize:vertical;">'+esc(m.note||'')+'</textarea></div>'
      +'<div style="display:flex;gap:8px;margin-top:16px;">'
      +'<button onclick="StarMemory.render()" style="flex:1;padding:11px 0;border:1px solid var(--border);border-radius:12px;background:var(--c1);color:var(--txt);font-size:13px;cursor:pointer;">取消</button>'
      +'<button onclick="StarMemory.saveEdit(\''+esc(m.id)+'\')" style="flex:1;padding:11px 0;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:13px;cursor:pointer;">保存</button>'
      +'</div>'
      +'<button onclick="StarMemory.del(\''+esc(m.id)+'\')" style="width:100%;padding:10px 0;border:none;border-radius:12px;background:var(--c2);color:#ff4d4f;font-size:12px;cursor:pointer;margin-top:10px;">删除此纪念日</button>';
    box.innerHTML=html;
  }
  function saveEdit(id){
    var cur=StarMemory._cur||'';
    var mems=getMemories(cur);
    var m=mems.find(function(x){return x.id===id;});
    if(!m)return;
    m.name=($('sm-name')||{}).value||m.name;
    m.date=($('sm-date')||{}).value||m.date;
    m.note=($('sm-note')||{}).value||'';
    saveMemories(cur,mems);
    toast('纪念日已更新');
    render();
  }
  function del(id){
    var cur=StarMemory._cur||'';
    if(!confirm('确定删除这个纪念日吗？'))return;
    var mems=getMemories(cur).filter(function(x){return x.id!==id;});
    saveMemories(cur,mems);
    toast('纪念日已删除');
    render();
  }
  // ---- 当天互动：聊天系统消息 + 概率字卡 ----
  function memoryTodayMsg(cid){
    if(!cid)return;
    var mems=getMemories(cid);
    var today=new Date();
    var todayMems=mems.filter(function(m){
      var d=new Date(m.date);
      return d.getMonth()===today.getMonth()&&d.getDate()===today.getDate();
    });
    if(!todayMems.length)return;
    var c=contacts.find(function(x){return x.id===cid;});
    var cname=c?c.name:'TA';
    todayMems.forEach(function(m){
      try{
        var mm=msgs(cid);
        if(mm){
          mm.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'今天是特别的日子：「'+m.name+'」✨',ts:new Date(),read:(cid===window.currentCid),isSystem:true});
          savemsgs(cid,mm);
          if(cid===window.currentCid&&typeof renderMsgs==='function')renderMsgs(mm);
          if(typeof renderChatList==='function')renderChatList();
        }
      }catch(e){}
      // 概率梦角字卡
      try{
        if(Math.random()<0.5){
          var pool=['今天好像是一个特别的日子。','时间过得很快。','谢谢你一直在。','还记得那一天吗？','这一天，我想一直记住。'];
          var txt=pool[Math.floor(Math.random()*pool.length)];
          var m2=msgs(cid);
          if(m2){
            m2.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:txt,ts:new Date(),read:(cid===window.currentCid),isAuto:true,isInitiative:false});
            savemsgs(cid,m2);
            if(cid===window.currentCid&&typeof renderMsgs==='function')renderMsgs(m2);
          }
        }
      }catch(e){}
    });
  }
  return {open:open,render:render,switchContact:switchContact,showAdd:showAdd,pickType:pickType,saveAdd:saveAdd,showDetail:showDetail,showEdit:showEdit,saveEdit:saveEdit,del:del,getMemories:getMemories,saveMemories:saveMemories,daysUntil:daysUntil,memoryTodayMsg:memoryTodayMsg,typeIcon:typeIcon,_cur:'',_type:'custom'};
})();
function openStarMemory(cid){
  StarMemory.open(cid);
}

// ============ 梦角聊天回应系统（聊天连接词字卡库） ============
// 定位：轻量连接词，有概率附着在梦角主回复旁，负责接话/推进对话，不独立抢回复、不写完整句子。
var ChatFollowup=(function(){
  var CATS=[
    {key:'echo',name:'① 接话'},
    {key:'confirm',name:'② 确认'},
    {key:'keep',name:'③ 继续'},
    {key:'probe',name:'④ 轻追问'},
    {key:'bridge',name:'⑤ 连接'},
    {key:'shift',name:'⑥ 转折'},
    {key:'tone',name:'⑦ 停顿'},
    {key:'close',name:'⑧ 收束'}
  ];
  var DEFAULTS={
    echo:['嗯','嗯嗯','对','是啊','对啊','是这样','这样啊','原来如此','原来是这样','我知道了','我明白了','我懂','确实','也是','没错','好像是','这样说也是','你说得对'],
    confirm:['好','好的','明白','知道了','了解了','收到了','记住了','清楚了','原来如此','我知道了','我了解了','行','可以','好吧','嗯，好'],
    keep:['然后呢','后来呢','继续说','你继续','还有呢','还有吗','再说说','说下去','接着说','我听着','后面呢','再后来呢','之后呢'],
    probe:['为什么？','怎么说？','怎么了？','怎么回事？','是吗？','真的？','这样吗？','具体呢？','哪方面？','什么情况？','什么时候？','然后发生了什么？'],
    bridge:['其实','不过','但是','所以','那么','这样的话','既然这样','说起来','对了','另外','还有','至于这个','换句话说','也就是说','后来'],
    shift:['不过','但是','可是','只是','话说回来','仔细想想','换个角度看','另一方面','倒也是','这么说的话'],
    tone:['嗯……','这个嘛……','怎么说呢……','我想想','让我想想','等一下','仔细想想','好像确实','大概吧','可能吧'],
    close:['那就这样吧','先这样','先说到这里','暂时这样','之后再聊','这个之后再说','那继续吧','好，那先这样','差不多就是这样']
  };
  var KEY='ml2_chat_followup';
  function load(){
    var d=ls(KEY);
    if(!d||typeof d!=='object')d={};
    CATS.forEach(function(c){if(!Array.isArray(d[c.key]))d[c.key]=[];});
    return d;
  }
  function save(d){
    ls(KEY,d);
    if(window.localforage)window.localforage.setItem(KEY,d).catch(function(){});
  }
  function pool(cat){
    var d=load();
    var user=d[cat]||[];
    if(user.length)return user;
    return DEFAULTS[cat]||[];
  }
  function esc(s){return String(s==null?'':s).replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
  // ---- 管理弹窗 ----
  function open(){
    var ov=$('ov-chat-followup');
    if(!ov)return;
    showOv('ov-chat-followup');
    render();
  }
  function render(){
    var box=$('chat-followup-body'); if(!box)return;
    var d=load();
    var html='<div style="font-size:12px;color:var(--txt3);margin-bottom:10px;line-height:1.8;">聊天时会有概率附着在梦角主回复旁（如"哪里？说来听听。"），只负责接话与推进对话。</div>';
    CATS.forEach(function(c,ci){
      var arr=d[c.key]||[];
      var def=DEFAULTS[c.key]||[];
      var shown=arr.length?arr:def;
      html+='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:12px 0 6px;">'+c.name+(arr.length?'<span style="font-weight:400;color:var(--txt3);font-size:10px;">（自定义'+arr.length+'条）</span>':'<span style="font-weight:400;color:var(--txt3);font-size:10px;">（默认）</span>')+'</div>';
      shown.forEach(function(t,idx){
        html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
          +'<div style="flex:1;font-size:12px;color:var(--txt);background:var(--c2);border-radius:8px;padding:6px 9px;word-break:break-all;">'+esc(t)+(arr.length?'':'<span style="color:var(--txt3);font-size:10px;">（默认）</span>')+'</div>'
          +'<button onclick="ChatFollowup.del('+ci+','+idx+')" style="border:none;background:none;color:#ff4d4f;font-size:13px;cursor:pointer;">✕</button>'
          +'</div>';
      });
      html+='<div style="display:flex;gap:6px;margin-top:4px;"><input id="cf-inp-'+ci+'" type="text" placeholder="添加一条连接词…" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:12px;outline:none;min-width:0;"><button onclick="ChatFollowup.add('+ci+')" style="padding:7px 12px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">添加</button></div>';
    });
    box.innerHTML=html;
  }
  function add(ci){
    var inp=$('cf-inp-'+ci);
    var v=inp?inp.value.trim():'';
    if(!v){toast('请输入内容');return;}
    var d=load();
    d[CATS[ci].key].push(v);
    save(d);
    render();
  }
  function del(ci,idx){
    var d=load();
    var cat=CATS[ci].key;
    if(idx<(d[cat]||[]).length){d[cat].splice(idx,1);save(d);}
    render();
  }
  // ---- 抽取：按主回复特征选类 ----
  function getChatFollowup(senderId,reply){
    try{
      if(typeof getSpeed!=='function')return '';
      if(!getSpeed('cf-en',senderId))return '';
      var prob=parseInt(getSpeed('cf-prob',senderId))||0;
      if(prob<=0||Math.random()*100>=prob)return '';
      var r=String(reply||'').trim();
      if(!r)return '';
      if(r==='请在字卡库里上传字卡后开始聊天')return '';
      var cat='echo';
      // 问句 → 追问连接
      if(/[？?]$/.test(r)||/(什么|哪|怎么|为什么|吗|呢)$/.test(r)){
        cat='probe';
      }else if(r.length<=4){
        // 超短回复 → 接话
        cat='echo';
      }else if(/[。.]$/.test(r)&&r.length>8){
        // 长句结尾 → 连接 / 转折
        cat=Math.random()<0.5?'bridge':'shift';
      }else if(r.length>10){
        // 叙述性长回复 → 继续 / 轻追问
        cat=Math.random()<0.5?'keep':'probe';
      }else{
        // 其他 → 接话 / 确认
        var arr2=['echo','confirm'];
        cat=arr2[Math.floor(Math.random()*arr2.length)];
      }
      var p=pool(cat);
      if(!p.length)return '';
      return pick(p);
    }catch(e){return '';}
  }
  return {open:open,render:render,add:add,del:del,getChatFollowup:getChatFollowup,CATS:CATS,DEFAULTS:DEFAULTS,load:load};
})();
function openChatFollowup(){ChatFollowup.open();}

</script>
