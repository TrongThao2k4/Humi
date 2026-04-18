// Auth guard
  const _s = DB.auth.requireAuth(); if(!_s) throw 0;
  const currentUser = _s.user;

  // Real-time clock
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${h}:${m}:${s}`;

    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    document.getElementById('date-display').textContent = `${dayName}, Ngày ${date}/${month}/${year}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Populate monthly stats from DB
  (function() {
    const now = new Date();
    const period = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    const stats = DB.attendance.getMonthStats(currentUser.id, period);
    const bal   = DB.leaves.getBalance(currentUser.id);
    const totalWD = stats.total || 22;
    const worked  = stats.worked || 0;
    const pct = totalWD > 0 ? Math.round(worked / totalWD * 100) : 0;
    const el = id => document.getElementById(id);
    if (el('statWorkDays'))  el('statWorkDays').textContent  = worked + '/' + totalWD;
    if (el('statLeaveLeft')) el('statLeaveLeft').textContent = (bal.annual || 0) + ' ngày';
    if (el('statPct'))       el('statPct').textContent       = pct + '%';
    if (el('statBar'))       el('statBar').style.width       = pct + '%';
  })();

  // Populate user info & shift from DB — đồng bộ với loadUserInfo() ở các trang khác
  (function() {
    var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
    var name = (emp && emp.name)     || currentUser.name     || '—';
    var role = (emp && emp.position) || currentUser.position || '—';

    // Avatar: ưu tiên từ settings (đồng bộ với trang Cài đặt)
    var _sk = 'humi_user_settings_' + currentUser.id;
    var _st = {}; try { _st = JSON.parse(localStorage.getItem(_sk)) || {}; } catch(e) {}
    var avatar = _st.avatar || (emp && emp.avatar) || '';

    var el = function(id) { return document.getElementById(id); };
    if (el('sidebarAvatar'))   el('sidebarAvatar').src       = avatar || el('sidebarAvatar').src;
    if (el('topbarAvatar'))    el('topbarAvatar').src        = avatar || el('topbarAvatar').src;
    if (el('sidebarUserName')) el('sidebarUserName').textContent = name;
    if (el('sidebarUserRole')) el('sidebarUserRole').textContent = role;
    if (el('topbarUserName'))  el('topbarUserName').textContent  = name;
    if (el('topbarUserRole'))  el('topbarUserRole').textContent  = role;
    if (el('dropdownAvatar'))  el('dropdownAvatar').src          = avatar || el('dropdownAvatar').src;
    if (el('dropdownName'))    el('dropdownName').textContent    = name;
    if (el('dropdownRole'))    el('dropdownRole').textContent    = role;
    if (el('modalUnitName'))   el('modalUnitName').textContent   = (emp && emp.unit) || currentUser.unit || '—';
    if (el('cardUnitName'))    el('cardUnitName').textContent    = (emp && emp.unit) || currentUser.unit || '—';
  })();

  // ==================== NOTIFICATION BELL ====================
  (function initNotifPanel() {
    var LS_NOTIF = 'humi_notif_read_' + currentUser.id;
    var readIds = new Set();
    try { readIds = new Set(JSON.parse(localStorage.getItem(LS_NOTIF)) || []); } catch(e) {}

    function saveRead() { localStorage.setItem(LS_NOTIF, JSON.stringify([...readIds])); }

    function renderNotifPanel() {
      var announcements = (DB.announcements ? DB.announcements.getAll() : []) || [];
      var leaves        = (DB.leaves ? DB.leaves.getHistory(currentUser.id) : []) || [];
      var attendance    = (DB.attendance ? DB.attendance.getAll({ employeeId: currentUser.id }) : []) || [];

      var items = [];
      // Thông báo công ty
      announcements.slice(0,5).forEach(function(a) {
        items.push({ id: 'ann_'+a.id, icon: '📢', title: a.title || 'Thông báo', sub: a.department || '', time: a.createdAt || '' });
      });
      // Đơn nghỉ phép được duyệt/từ chối
      leaves.filter(function(l){ return l.status !== 'pending'; }).slice(0,3).forEach(function(l) {
        var icon = l.status === 'approved' ? '✅' : '❌';
        var txt  = l.status === 'approved' ? 'Đơn nghỉ phép đã được duyệt' : 'Đơn nghỉ phép bị từ chối';
        items.push({ id: 'leave_'+l.id, icon: icon, title: txt, sub: (l.startDate||'') + ' → ' + (l.endDate||''), time: l.updatedAt || l.createdAt || '' });
      });
      // Chấm công được duyệt/từ chối
      attendance.filter(function(a){ return a.approvalStatus && a.approvalStatus !== 'pending'; }).slice(0,3).forEach(function(a) {
        var icon = a.approvalStatus === 'approved' ? '✅' : '❌';
        var txt  = a.approvalStatus === 'approved' ? 'Chấm công ngày '+a.date+' đã duyệt' : 'Chấm công ngày '+a.date+' bị từ chối';
        items.push({ id: 'att_'+a.id, icon: icon, title: txt, sub: (a.checkIn||'')+(a.checkOut?' – '+a.checkOut:''), time: a.date || '' });
      });

      var unread = items.filter(function(i){ return !readIds.has(i.id); }).length;
      var badge = document.getElementById('notifBadge');
      if (badge) badge.style.display = unread > 0 ? 'block' : 'none';

      var list = document.getElementById('notifList');
      if (!list) return;
      if (!items.length) {
        list.innerHTML = '<div style="padding:32px;text-align:center;color:#7C8FAC;font-size:13px;">Không có thông báo</div>';
        return;
      }
      list.innerHTML = items.map(function(item) {
        var isRead = readIds.has(item.id);
        return '<div onclick="markNotifRead(\''+item.id+'\')" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid #f5f5f8;background:'+(isRead?'white':'#f8f6ff')+';display:flex;gap:12px;align-items:flex-start;" onmouseover="this.style.background=\'#F2F6FA\'" onmouseout="this.style.background=\''+(isRead?'white':'#f8f6ff')+'\'">'
          +'<span style="font-size:18px;flex-shrink:0;margin-top:1px;">'+item.icon+'</span>'
          +'<div style="min-width:0;flex:1;">'
          +'<p style="font-size:13px;font-weight:'+(isRead?'500':'700')+';color:#2A3547;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+item.title+'</p>'
          +(item.sub ? '<p style="font-size:11px;color:#7C8FAC;margin:0;">'+item.sub+'</p>' : '')
          +'</div>'
          +(isRead ? '' : '<span style="width:7px;height:7px;border-radius:50%;background:#5D87FF;flex-shrink:0;margin-top:6px;"></span>')
          +'</div>';
      }).join('');
    }

    window.toggleNotifPanel = function() {
      var panel = document.getElementById('notifPanel');
      if (!panel) return;
      var isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) renderNotifPanel();
    };
    window.markNotifRead = function(id) {
      readIds.add(id);
      saveRead();
      renderNotifPanel();
    };
    window.markAllNotifRead = function() {
      document.querySelectorAll('#notifList [onclick]').forEach(function(el) {
        var m = el.getAttribute('onclick').match(/'([^']+)'/);
        if (m) readIds.add(m[1]);
      });
      saveRead();
      renderNotifPanel();
    };

    // Init badge on load
    renderNotifPanel();

    // Close panel when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#notifBell') && !e.target.closest('#notifPanel')) {
        var panel = document.getElementById('notifPanel');
        if (panel) panel.style.display = 'none';
      }
    });

    window.addEventListener('humi_synced', renderNotifPanel);
  })();

  // ==================== USER DROPDOWN ====================
  function toggleUserDropdown() {
    var dd = document.getElementById('userDropdown');
    var chevron = document.getElementById('topbarChevron');
    var isOpen = dd.style.display !== 'none';
    dd.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('#topbarUserBtn') && !e.target.closest('#userDropdown')) {
      var dd = document.getElementById('userDropdown');
      var chevron = document.getElementById('topbarChevron');
      if (dd) dd.style.display = 'none';
      if (chevron) chevron.style.transform = '';
    }
  });

  // Render announcements from DB
  (function() {
    const list = DB.announcements.getAll();
    const el = document.getElementById('announcementList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<p style="font-size:13px;color:#7C8FAC;text-align:center;padding:20px;">Không có thông báo</p>'; return; }
    const fmtD = iso => iso ? iso.split('-').reverse().join('/') : '—';
    el.innerHTML = list.slice(0,3).map((a, i) => {
      const isLast = i === list.slice(0,3).length - 1;
      const badge = a.status === 'active'
        ? '<span class="badge-active text-[10px] font-600 px-2 py-0.5 rounded-full" style="font-weight:600;">Đang hiệu lực</span>'
        : '<span class="badge-expired text-[10px] font-600 px-2 py-0.5 rounded-full" style="font-weight:600;">Đã kết thúc</span>';
      return `<div class="announcement-item px-5 py-4${isLast ? '' : ' border-b border-gray-50'}">
        <div class="flex gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[10px] font-600 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md" style="font-weight:600;">${a.department}</span>
            </div>
            <h3 class="font-700 text-gray-900 text-sm mb-1" style="font-weight:700;">${a.title}</h3>
            <p class="text-xs text-gray-400 leading-relaxed line-clamp-2">${a.preview}</p>
          </div>
          <div class="flex-shrink-0 text-right space-y-1.5" style="min-width:180px;">
            <div class="flex items-center justify-end gap-1.5">
              <span class="text-xs text-gray-500">Người tạo:</span>
              <a href="#" class="text-xs font-500 text-purple-600 hover:underline">${a.creator}</a>
            </div>
            <div class="flex items-center justify-end gap-1.5">${badge}</div>
            <div class="flex items-center justify-end gap-1.5">
              <span class="text-xs text-gray-500">Người duyệt:</span>
              <a href="#" class="text-xs font-500 text-purple-600 hover:underline">${a.approver}</a>
            </div>
            <div class="flex items-center justify-end">
              <div class="flex items-center gap-1 text-gray-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                <span class="text-[10px]">Hiệu lực từ ${fmtD(a.startDate)} – ${fmtD(a.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  })();

  // ==================== INBOX WIDGET ====================
  var _inboxTab = 'unread';

  function renderInboxWidget() {
    var allMsgs = (DB.messages ? DB.messages.getAll() : [])
      .filter(function(m) { return m.toId === currentUser.id; })
      .sort(function(a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); });

    var unread = allMsgs.filter(function(m) { return !m.isRead; });
    var read   = allMsgs.filter(function(m) { return  m.isRead; });

    // Update badge
    var badge = document.getElementById('inboxUnreadBadge');
    if (badge) {
      if (unread.length > 0) { badge.textContent = unread.length; badge.style.display = 'inline'; }
      else { badge.style.display = 'none'; }
    }

    var list = _inboxTab === 'unread' ? unread : read;
    var container = document.getElementById('inboxContent');
    if (!container) return;

    if (!list.length) {
      var emptyText = _inboxTab === 'unread'
        ? 'Tuyệt quá! Bạn đã đọc tất cả thư trong hộp thư đến.'
        : 'Không có thư đã đọc.';
      container.innerHTML = '<div class="px-5 py-6 text-center border-b border-gray-50">' +
        '<div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<p class="text-sm text-gray-500 font-500">' + emptyText + '</p>' +
      '</div>';
      return;
    }

    var fmtTs = function(ts) {
      if (!ts) return '';
      var d = new Date(ts);
      var now = new Date();
      var diff = now - d;
      if (diff < 3600000) return Math.max(1, Math.round(diff / 60000)) + ' phút trước';
      if (diff < 86400000) return Math.round(diff / 3600000) + ' giờ trước';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    var colors = ['bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700'];
    container.innerHTML = list.slice(0, 5).map(function(m, i) {
      var initials = (m.sender || 'HT').split(' ').slice(-2).map(function(w) { return w[0]; }).join('').toUpperCase();
      var colorCls = colors[i % colors.length];
      var isLast = (i === Math.min(list.length, 5) - 1);
      return '<div class="inbox-row flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors' + (isLast ? '' : ' border-b border-gray-50') + '" onclick="window.location.href=\'pages/hop-thu.html\'">' +
        '<div class="w-8 h-8 rounded-full ' + colorCls + ' flex items-center justify-center flex-shrink-0">' +
          (m.avatar ? '<img src="' + m.avatar + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />' : '<span class="text-xs font-700">' + initials + '</span>') +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between mb-0.5">' +
            '<span class="text-sm ' + (!m.isRead ? 'font-700 text-gray-900' : 'font-500 text-gray-600') + '" style="font-weight:' + (!m.isRead ? '700' : '500') + ';">' + (m.sender || '—') + '</span>' +
            '<span class="text-xs text-gray-400">' + fmtTs(m.timestamp) + '</span>' +
          '</div>' +
          '<p class="text-xs text-gray-500 truncate">' + (m.subject || m.preview || '') + '</p>' +
        '</div>' +
        (!m.isRead ? '<div style="width:8px;height:8px;background:#3b82f6;border-radius:50%;flex-shrink:0;"></div>' : '') +
      '</div>';
    }).join('');
  }

  function switchInboxTab(tab) {
    _inboxTab = tab;
    var tabUnread = document.getElementById('inboxTabUnread');
    var tabOther  = document.getElementById('inboxTabOther');
    if (tabUnread) tabUnread.className = (tab === 'unread' ? 'tab-active' : '') + ' flex items-center gap-2 px-4 py-2 text-sm font-600 transition-colors';
    if (tabOther)  tabOther.className  = (tab === 'other'  ? 'tab-active' : '') + ' flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-500 transition-colors';
    if (tabUnread) tabUnread.style.fontWeight = tab === 'unread' ? '600' : '500';
    if (tabOther)  tabOther.style.fontWeight  = tab === 'other'  ? '600' : '500';
    renderInboxWidget();
  }

  renderInboxWidget();

  // ==================== ATTENDANCE MODAL ====================
  let cameraStream       = null;
  let modalClockInterval = null;
  let userIP             = null;
  let isFaceDetected     = false;
  let faceDetectInterval = null;
  let faceModelsLoaded   = false;
  // Cache kết quả xác minh — { verified: bool, pct: number, ts: timestamp }
  let _verifyCache       = null;
  let _verifying         = false; // tránh chạy song song

  const FACE_MODELS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';

  // ---- Face models ----
  let _faceModelPromise = null;
  let faceRecognitionModelsLoaded = false;
  let _faceRecogPromise = null;

  // Model nhẹ: chỉ detect (dùng cho vòng lặp chấm công)
  async function loadFaceModels() {
    if (faceModelsLoaded) return true;
    if (!_faceModelPromise) {
      _faceModelPromise = faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL)
        .then(function() { faceModelsLoaded = true; return true; })
        .catch(function(e) { console.warn('face-api detect model failed:', e); return false; });
    }
    return _faceModelPromise;
  }

  // Model nặng: landmark + recognition (dùng khi đăng ký & xác minh)
  async function loadFaceRecognitionModels() {
    if (faceRecognitionModelsLoaded) return true;
    if (!_faceRecogPromise) {
      _faceRecogPromise = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URL)
      ]).then(function() { faceModelsLoaded = true; faceRecognitionModelsLoaded = true; return true; })
        .catch(function(e) { console.warn('face-api recognition models failed:', e); return false; });
    }
    return _faceRecogPromise;
  }

  // Preload detection model ngay, recognition model load ngầm sau
  setTimeout(function() {
    if (typeof faceapi !== 'undefined') {
      loadFaceModels();
      setTimeout(function() { loadFaceRecognitionModels(); }, 3000); // load sau 3s
    }
  }, 1000);

  function _todayStr() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  }


  function getFallbackShifts(allShifts) {
    const todayDow = new Date().getDay();
    const fallbacks = allShifts.filter(function(s) {
      return s.active !== false && (!s.applyDays || s.applyDays.includes(todayDow));
    });
    if (fallbacks.length > 0) return { shifts: fallbacks, source: 'fallback' };
    return { shifts: [], source: 'none' };
  }

  // Lấy ca hôm nay đồng bộ từ localStorage — tức thì, không cần network
  function getTodayShifts(empId, callback) {
    const allShifts = DB.shifts.getAll();
    const today = _todayStr();
    const assignments = DB.workShifts.getAll({ employeeId: empId, fromDate: today, toDate: today }) || [];
    if (assignments.length > 0) {
      const shifts = assignments.map(function(a) {
        return allShifts.find(function(s) { return String(s.id) === String(a.shiftId); });
      }).filter(Boolean);
      if (shifts.length > 0) { callback({ shifts: shifts, source: 'assigned' }); return; }
    }
    callback(getFallbackShifts(allShifts));
  }

  // Ca đang được chấm công hiện tại (dùng trong captureAndSubmit)
  var _currentAttendanceShift = null;

  function _shiftLabel(s) {
    return s.name + ' (' + (s.startTime||'') + '–' + (s.endTime||'') + ')';
  }

  // Cập nhật card chấm công theo lịch ca + trạng thái thực tế
  function updateAttendanceCard() {
    const actionArea   = document.getElementById('attActionArea');
    const noShiftEl    = document.getElementById('attNoShift');
    const noShiftMsg   = document.getElementById('attNoShiftMsg');
    const btn          = document.getElementById('attendanceCardBtn');
    const statusBox    = document.getElementById('attendanceStatus');
    const noteWrap     = document.getElementById('attendanceNoteWrap');
    const inEl         = document.getElementById('attCheckInTime');
    const outEl        = document.getElementById('attCheckOutTime');
    const shiftEl      = document.getElementById('cardShiftName');
    const shiftNextEl  = document.getElementById('cardShiftNext');
    const modalShiftEl = document.getElementById('modalShiftName');
    if (!actionArea) return;

    getTodayShifts(currentUser.id, function(result) {
      var shifts = result.shifts;

      // 1. Dedup theo shiftId
      var seen = {};
      shifts = shifts.filter(function(s) {
        var k = String(s.id);
        if (seen[k]) return false;
        seen[k] = true;
        return true;
      });

      // 2. Sort theo startTime tăng dần (ưu tiên ca bắt đầu sớm)
      shifts.sort(function(a, b) {
        var at = parseInt((a.startTime||'00:00').replace(':', ''), 10);
        var bt = parseInt((b.startTime||'00:00').replace(':', ''), 10);
        return at - bt;
      });

      // 3. Tìm ca đang cần xử lý (ca đầu tiên chưa check-out)
      var activeShift  = null;
      var activeStatus = null;
      for (var i = 0; i < shifts.length; i++) {
        var st = DB.attendance.getTodayStatus(currentUser.id, shifts[i].id);
        if (!st.checkedOut) { activeShift = shifts[i]; activeStatus = st; break; }
      }

      // 4. Không có ca
      if (shifts.length === 0) {
        if (shiftEl) { shiftEl.textContent = 'Không có ca hôm nay'; }
        if (shiftNextEl) shiftNextEl.style.display = 'none';
        if (modalShiftEl) modalShiftEl.textContent = 'Không có ca hôm nay';
        actionArea.classList.add('hidden');
        noShiftEl.classList.remove('hidden');
        noShiftMsg.textContent = 'Hôm nay không có ca làm việc';
        return;
      }

      // 5. Tất cả ca đã xong
      if (!activeShift) {
        if (shiftEl) shiftEl.textContent = 'Đã hoàn thành tất cả ca';
        if (shiftNextEl) shiftNextEl.style.display = 'none';
        if (modalShiftEl) modalShiftEl.textContent = 'Đã hoàn thành tất cả ca';
        actionArea.classList.add('hidden');
        noShiftEl.classList.remove('hidden');
        noShiftMsg.textContent = 'Ca làm việc hôm nay đã kết thúc';
        return;
      }

      // 6. Hiển thị ca đang hoạt động + ca tiếp theo
      _currentAttendanceShift = activeShift;
      if (shiftEl) shiftEl.textContent = _shiftLabel(activeShift);
      if (modalShiftEl) modalShiftEl.textContent = _shiftLabel(activeShift);

      // Ca tiếp theo (sau activeShift, chưa done)
      var activeIdx = shifts.indexOf(activeShift);
      var remaining = shifts.slice(activeIdx + 1).filter(function(s) {
        return !DB.attendance.getTodayStatus(currentUser.id, s.id).checkedOut;
      });
      if (shiftNextEl) {
        if (remaining.length > 0) {
          shiftNextEl.textContent = 'Tiếp theo: ' + remaining.map(_shiftLabel).join(', ');
          shiftNextEl.style.display = 'block';
        } else {
          shiftNextEl.style.display = 'none';
        }
      }

      // 7. Render khu vực chấm công
      actionArea.classList.remove('hidden');
      noShiftEl.classList.add('hidden');

      if (!activeStatus.checkedIn) {
        statusBox.classList.add('hidden');
        noteWrap.classList.remove('hidden');
        btn.textContent = 'Bắt đầu ca';
        btn.style.background = '';
        btn.disabled = false;
        btn.onclick = openAttendanceModal;
      } else {
        inEl.textContent  = activeStatus.record.checkIn || '—';
        outEl.textContent = '—';
        statusBox.classList.remove('hidden');
        noteWrap.classList.add('hidden');
        btn.textContent = 'Kết thúc ca';
        btn.style.background = 'linear-gradient(135deg,#dc2626,#b91c1c)';
        btn.disabled = false;
        btn.onclick = openAttendanceModal;
      }
    });
  }

  // Gọi ngay khi load trang
  updateAttendanceCard();

  // Khi Supabase sync xong → refresh card để lấy dữ liệu mới nhất
  window.addEventListener('humi_synced', function() {
    updateAttendanceCard();
  });

  function openAttendanceModal() {
    document.getElementById('attendanceModal').classList.add('open');
    document.getElementById('cameraError').style.display = 'none';
    document.getElementById('cameraLoading').style.display = 'flex';
    document.getElementById('faceGuide').style.display = 'none';
    document.getElementById('faceNoFaceOverlay').style.display = 'none';
    document.getElementById('faceDetectedBadge').style.display = 'none';
    document.getElementById('faceModelLoadingBadge').style.display = 'none';
    document.getElementById('cameraWrapper').className = '';
    document.getElementById('attendanceNote').value = '';
    isFaceDetected = false;
    resetCaptureBtn(); // reset text/opacity/spinner từ lần dùng trước
    startModalClock();
    startCamera();
    fetchUserIP();
  }

  function closeAttendanceModal() {
    stopFaceDetection();
    stopCamera();
    stopModalClock();
    document.getElementById('attendanceModal').classList.remove('open');
  }

  // ---- Camera ----
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      cameraStream = stream;
      const video = document.getElementById('cameraVideo');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        document.getElementById('cameraLoading').style.display = 'none';
        document.getElementById('faceGuide').style.display = 'flex';
        startFaceDetection();
      };
    } catch (err) {
      document.getElementById('cameraLoading').style.display = 'none';
      const errEl = document.getElementById('cameraError');
      errEl.style.display = 'flex';
      console.error('Camera error:', err);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
      document.getElementById('cameraVideo').srcObject = null;
    }
  }

  // ---- Face Detection ----
  // Ưu tiên native FaceDetector API (Chrome, off main-thread, không block UI)
  // Fallback về face-api.js nếu không hỗ trợ
  var _nativeFaceDetector = null;
  function _getNativeDetector() {
    if (_nativeFaceDetector) return _nativeFaceDetector;
    if (typeof FaceDetector !== 'undefined') {
      try { _nativeFaceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 2 }); } catch(e) {}
    }
    return _nativeFaceDetector;
  }

  async function startFaceDetection() {
    const modelLoadEl = document.getElementById('faceModelLoadingBadge');
    const nativeDet = _getNativeDetector();

    if (nativeDet) {
      // Native API — không cần load model, không block main thread
      modelLoadEl.style.display = 'none';
      setFaceDetected(false, 0);
      let _detecting = false;
      faceDetectInterval = setInterval(async () => {
        if (_detecting) return;
        const video = document.getElementById('cameraVideo');
        if (!video || !cameraStream || video.readyState < 2) return;
        _detecting = true;
        try {
          const faces = await nativeDet.detect(video);
          setFaceDetected(faces.length === 1, faces.length);
        } catch(e) { /* skip */ } finally { _detecting = false; }
      }, 200);
      return;
    }

    // Fallback: face-api.js (chạy trên main thread — dùng interval dài hơn để tránh block)
    modelLoadEl.style.display = 'flex';
    const loaded = await loadFaceModels();
    modelLoadEl.style.display = 'none';
    if (!loaded) { isFaceDetected = true; updateCaptureButtonState(); return; }
    if (loaded) setFaceDetected(false, 0);

    const _detOpts = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 });
    let _detecting = false;
    faceDetectInterval = setInterval(async () => {
      if (_detecting) return;
      const video = document.getElementById('cameraVideo');
      if (!video || !cameraStream || video.readyState < 2) return;
      _detecting = true;
      try {
        const detections = await faceapi.detectAllFaces(video, _detOpts);
        setFaceDetected(detections.length === 1, detections.length);
      } catch(e) { /* skip */ } finally { _detecting = false; }
    }, 600); // interval dài hơn để tránh block UI
  }

  function stopFaceDetection() {
    if (faceDetectInterval) {
      clearInterval(faceDetectInterval);
      faceDetectInterval = null;
    }
    isFaceDetected = false;
    _verifyCache = null;
    _verifying = false;
  }

  // Chạy xác minh ngầm sau khi detect thấy mặt
  async function _runVerifyInBackground() {
    if (_verifying) return;
    const storedDescJson = currentUser.faceDescriptor ||
      (DB.employees.getById(currentUser.id) || {}).faceDescriptor || null;
    if (!storedDescJson) return; // chưa đăng ký descriptor → bỏ qua

    // Cache còn mới (<8s) → không cần tính lại
    if (_verifyCache && (Date.now() - _verifyCache.ts) < 8000) return;

    _verifying = true;
    try {
      const recLoaded = await loadFaceRecognitionModels();
      if (!recLoaded) { _verifying = false; return; }

      const video = document.getElementById('cameraVideo');
      if (!video || !cameraStream || video.readyState < 2) { _verifying = false; return; }

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
      const det = await faceapi.detectSingleFace(video, opts).withFaceLandmarks().withFaceDescriptor();
      if (!det) { _verifyCache = { verified: false, pct: 0, ts: Date.now() }; _verifying = false; return; }

      const storedDesc = new Float32Array(JSON.parse(storedDescJson));
      const distance = faceapi.euclideanDistance(storedDesc, det.descriptor);
      const pct = Math.round((1 - Math.min(distance, 1)) * 100);
      _verifyCache = { verified: distance <= 0.5, pct, distance, ts: Date.now() };
      console.log(`🔍 Verify ngầm: ${pct}% giống (distance=${distance.toFixed(3)}) → ${_verifyCache.verified ? '✅' : '❌'}`);
    } catch(e) { /* skip */ }
    _verifying = false;
  }

  function setFaceDetected(detected, count) {
    isFaceDetected = detected;
    const wrapper       = document.getElementById('cameraWrapper');
    const noFaceOverlay = document.getElementById('faceNoFaceOverlay');
    const detectedBadge = document.getElementById('faceDetectedBadge');
    const titleEl       = document.getElementById('faceNoFaceTitle');
    const oval          = document.getElementById('faceOval');

    if (count > 1) {
      // Multiple faces
      isFaceDetected                = false;
      wrapper.className             = 'face-multi';
      noFaceOverlay.style.display   = 'flex';
      noFaceOverlay.style.background= 'rgba(120,53,15,0.5)';
      detectedBadge.style.display   = 'none';
      titleEl.textContent           = `Phát hiện ${count} khuôn mặt — chỉ để 1 người`;
      oval.style.borderColor        = 'rgba(251,191,36,0.7)';
      oval.style.borderStyle        = 'solid';
    } else if (detected) {
      // Exactly 1 face ✓ — chạy verify ngầm
      wrapper.className             = 'face-ok';
      noFaceOverlay.style.display   = 'none';
      detectedBadge.style.display   = 'flex';
      oval.style.borderColor        = 'rgba(34,197,94,0.85)';
      oval.style.borderStyle        = 'solid';
      _runVerifyInBackground(); // không await — chạy ngầm
    } else {
      // No face detected
      wrapper.className             = 'face-fail';
      noFaceOverlay.style.display   = 'flex';
      noFaceOverlay.style.background= 'rgba(0,0,0,0.55)';
      detectedBadge.style.display   = 'none';
      titleEl.textContent           = 'Không nhận diện được khuôn mặt';
      oval.style.borderColor        = 'rgba(239,68,68,0.7)';
      oval.style.borderStyle        = 'dashed';
    }

    updateCaptureButtonState();
  }

  function updateCaptureButtonState() {
    const btn = document.getElementById('captureBtn');
    const txt = document.getElementById('captureBtnText');
    if (!btn) return;
    if (isFaceDetected) {
      btn.disabled = false;
      btn.title    = '';
      btn.style.background  = 'linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 50%,#2563EB 100%)';
      btn.style.boxShadow   = '0 4px 14px rgba(99,60,236,0.35)';
    } else {
      btn.disabled = true;
      btn.title    = 'Cần nhận diện khuôn mặt để chấm công';
      btn.style.background  = '#DFE5EF';
      btn.style.boxShadow   = 'none';
    }
  }

  // ---- IP ----
  async function fetchUserIP() {
    document.getElementById('modalIP').textContent = 'Đang tải...';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      userIP = data.ip;
      document.getElementById('modalIP').textContent = userIP;
    } catch (err) {
      document.getElementById('modalIP').textContent = 'Không lấy được IP';
      userIP = null;
    }
  }

  // ---- Modal clock ----
  function startModalClock() {
    function tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const el = document.getElementById('modalClock');
      if (el) el.textContent = `${h}:${m}:${s}`;
    }
    tick();
    modalClockInterval = setInterval(tick, 1000);
  }

  function stopModalClock() {
    if (modalClockInterval) {
      clearInterval(modalClockInterval);
      modalClockInterval = null;
    }
  }

  // ---- Capture & Submit ----
  async function captureAndSubmit() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('captureCanvas');
    const errEl = document.getElementById('cameraError');

    if (errEl.style.display === 'flex' || !cameraStream) {
      showToast('Không thể chụp ảnh — camera chưa được cấp quyền', 'error');
      return;
    }

    if (!isFaceDetected) {
      const overlay = document.getElementById('faceNoFaceOverlay');
      overlay.classList.add('shake');
      overlay.addEventListener('animationend', () => overlay.classList.remove('shake'), { once: true });
      showToast('Không nhận diện được khuôn mặt — vui lòng thử lại', 'error');
      return;
    }

    // Capture frame
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

    setLoadingBtn(true);

    // ── Xác minh khuôn mặt — dùng cache từ verify ngầm ──
    const storedDescJson = currentUser.faceDescriptor ||
      (DB.employees.getById(currentUser.id) || {}).faceDescriptor || null;

    if (storedDescJson) {
      const cacheAge = _verifyCache ? (Date.now() - _verifyCache.ts) : Infinity;
      if (_verifyCache && cacheAge < 8000) {
        // Dùng kết quả đã có sẵn → tức thì
        if (!_verifyCache.verified) {
          showToast(`Khuôn mặt không khớp (${_verifyCache.pct}% giống) — từ chối!`, 'error');
          setLoadingBtn(false); return;
        }
      } else {
        // Cache cũ / chưa có → verify nhanh 1 lần
        const txt = document.getElementById('captureBtnText');
        if (txt) txt.textContent = 'Đang xác minh...';
        try {
          const recLoaded = await loadFaceRecognitionModels();
          if (!recLoaded) { showToast('Không load được model nhận diện!', 'error'); setLoadingBtn(false); return; }
          const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
          const det = await faceapi.detectSingleFace(canvas, opts).withFaceLandmarks().withFaceDescriptor();
          if (!det) { showToast('Không nhận diện được khuôn mặt — thử lại!', 'error'); setLoadingBtn(false); return; }
          const storedDesc = new Float32Array(JSON.parse(storedDescJson));
          const distance = faceapi.euclideanDistance(storedDesc, det.descriptor);
          const pct = Math.round((1 - Math.min(distance, 1)) * 100);
          _verifyCache = { verified: distance <= 0.5, pct, distance, ts: Date.now() };
          if (distance > 0.5) { showToast(`Khuôn mặt không khớp (${pct}% giống) — từ chối!`, 'error'); setLoadingBtn(false); return; }
        } catch(e) { console.warn('verify error, skip:', e); }
      }
    }

    const payload = {
      time: new Date().toISOString(),
      image: imageBase64,
      ip: userIP || 'unknown',
      note: document.getElementById('attendanceNote').value.trim()
    };

    try {
      const shiftId = _currentAttendanceShift ? _currentAttendanceShift.id : null;
      const status = DB.attendance.getTodayStatus(currentUser.id, shiftId);
      let res;
      if (!status.checkedIn) {
        res = DB.attendance.checkIn(currentUser.id, shiftId, null, payload.note, payload.image);
      } else {
        res = DB.attendance.checkOut(currentUser.id, shiftId, payload.image);
      }
      if (res.ok) {
        const msg = !status.checkedIn ? 'Chấm công vào thành công! ✓' : 'Kết thúc ca thành công! ✓';
        setLoadingBtn(false);
        showToast(msg, 'success');
        closeAttendanceModal();
        updateAttendanceCard();
      } else {
        showToast(res.error || 'Chấm công thất bại', 'error');
        setLoadingBtn(false);
      }
    } catch (err) {
      showToast('Chấm công thất bại. Vui lòng thử lại.', 'error');
      setLoadingBtn(false);
    }
  }

  // ---- UI helpers ----
  function setLoadingBtn(loading) {
    const btn = document.getElementById('captureBtn');
    const txt = document.getElementById('captureBtnText');
    if (loading) {
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.style.cursor = 'not-allowed';
      txt.textContent = 'Đang xử lý...';
      btn.insertAdjacentHTML('afterbegin', '<span class="spinner" id="btnSpinner"></span>');
    } else {
      resetCaptureBtn();
    }
  }

  function resetCaptureBtn() {
    const sp = document.getElementById('btnSpinner');
    if (sp) sp.remove();
    const btn = document.getElementById('captureBtn');
    const txt = document.getElementById('captureBtnText');
    if (btn) { btn.style.opacity = '1'; btn.style.cursor = ''; }
    if (txt) txt.textContent = 'Chấm công';
    updateCaptureButtonState();
  }

  function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `show ${type}`;
    setTimeout(() => { toast.className = ''; }, 3000);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAttendanceModal(); closeFaceRegModal(); }
  });

// ===== ĐĂNG KÝ KHUÔN MẶT =====
  var _faceRegStream = null;
  var _faceRegCaptured = null;

  function openFaceRegModal() {
    document.getElementById('faceRegModal').style.display = 'flex';
    document.getElementById('faceRegLoading').style.display = 'flex';
    document.getElementById('faceRegGuide').style.display = 'flex';
    document.getElementById('faceRegPreview').style.display = 'none';
    document.getElementById('faceRegCaptureBtn').style.display = 'flex';
    document.getElementById('faceRegSaveBtn').style.display = 'none';
    document.getElementById('faceRegRetakeBtn').style.display = 'none';
    document.getElementById('faceRegCaptureTxt').textContent = 'Chụp ảnh';
    _faceRegCaptured = null;

    // Bắt đầu tải recognition models ngay khi mở modal (ngầm, không block UI)
    if (typeof faceapi !== 'undefined') loadFaceRecognitionModels();

    // Hiển thị ảnh đã đăng ký (nếu có)
    var existingImg = currentUser.faceImage || null;
    var existingBox = document.getElementById('faceRegExisting');
    if (existingImg) {
      document.getElementById('faceRegExistingImg').src = existingImg;
      existingBox.style.display = 'flex';
    } else {
      existingBox.style.display = 'none';
    }

    // Mở camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width:640, height:480 } })
      .then(function(stream) {
        _faceRegStream = stream;
        var video = document.getElementById('faceRegVideo');
        video.srcObject = stream;
        video.onloadedmetadata = function() {
          document.getElementById('faceRegLoading').style.display = 'none';
        };
      })
      .catch(function() {
        document.getElementById('faceRegLoading').innerHTML = '<p style="color:rgba(255,255,255,0.6);font-size:12px;padding:20px;text-align:center;">Không truy cập được camera</p>';
      });
  }

  function closeFaceRegModal() {
    document.getElementById('faceRegModal').style.display = 'none';
    if (_faceRegStream) { _faceRegStream.getTracks().forEach(function(t){ t.stop(); }); _faceRegStream = null; }
    _faceRegCaptured = null;
  }

  function faceRegCapture() {
    var video = document.getElementById('faceRegVideo');
    var canvas = document.getElementById('faceRegCanvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    ctx.save(); ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    _faceRegCaptured = canvas.toDataURL('image/jpeg', 0.85);

    // Hiện preview
    var preview = document.getElementById('faceRegPreview');
    preview.src = _faceRegCaptured;
    preview.style.display = 'block';
    document.getElementById('faceRegGuide').style.display = 'none';

    // Swap buttons
    document.getElementById('faceRegCaptureBtn').style.display = 'none';
    document.getElementById('faceRegSaveBtn').style.display = 'block';
    document.getElementById('faceRegRetakeBtn').style.display = 'block';
  }

  function faceRegRetake() {
    _faceRegCaptured = null;
    document.getElementById('faceRegPreview').style.display = 'none';
    document.getElementById('faceRegGuide').style.display = 'flex';
    document.getElementById('faceRegCaptureBtn').style.display = 'flex';
    document.getElementById('faceRegSaveBtn').style.display = 'none';
    document.getElementById('faceRegRetakeBtn').style.display = 'none';
  }

  async function faceRegSave() {
    if (!_faceRegCaptured) return;
    var saveBtn = document.getElementById('faceRegSaveBtn');
    var retakeBtn = document.getElementById('faceRegRetakeBtn');
    saveBtn.disabled = true;
    retakeBtn.disabled = true;

    // Tính face descriptor từ ảnh đã chụp
    var descriptor = null;
    try {
      saveBtn.textContent = 'Đang tải model...';
      var loaded = await loadFaceRecognitionModels();
      if (loaded) {
        saveBtn.textContent = 'Đang phân tích...';
        var canvas = document.getElementById('faceRegCanvas');
        var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
        var det = await faceapi.detectSingleFace(canvas, opts).withFaceLandmarks().withFaceDescriptor();
        if (det) {
          descriptor = JSON.stringify(Array.from(det.descriptor));
        } else {
          saveBtn.disabled = false;
          retakeBtn.disabled = false;
          saveBtn.textContent = 'Lưu khuôn mặt';
          showToast('Không tìm thấy khuôn mặt — chụp lại!', 'error');
          return;
        }
      }
    } catch(e) { console.warn('descriptor error:', e); }
    retakeBtn.disabled = false;

    saveBtn.textContent = 'Đang lưu...';
    DB.employees.update(currentUser.id, { faceImage: _faceRegCaptured, faceDescriptor: descriptor });
    currentUser.faceImage = _faceRegCaptured;
    currentUser.faceDescriptor = descriptor;

    saveBtn.disabled = false;
    saveBtn.textContent = 'Lưu khuôn mặt';
    closeFaceRegModal();

    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;color:white;background:#16a34a;box-shadow:0 4px 20px rgba(0,0,0,.18);transition:opacity .3s;font-family:inherit;';
    t.textContent = descriptor ? '✓ Đã lưu khuôn mặt + dữ liệu nhận diện!' : '✓ Đã lưu khuôn mặt (không có descriptor)';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); }, 300); }, 3000);
  }
