// Auth guard
  const _s = DB.auth.requireAuth(); if(!_s) throw 0;
  const currentUser = _s.user;

// ===== LOAD USER INFO (sidebar + topbar) =====
(function loadUserInfo() {
  var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
  var name   = (emp && emp.name)     || currentUser.name     || '—';
  var role   = (emp && emp.position) || currentUser.position || '—';
  // Ưu tiên avatar từ settings (cập nhật real-time từ trang Cài đặt)
  var _sk = 'humi_user_settings_' + currentUser.id;
  var _st = {}; try { _st = JSON.parse(localStorage.getItem(_sk)) || {}; } catch(e) {}
  var avatar = _st.avatar || (emp && emp.avatar) || '';
  var sid = document.getElementById('sidebarAvatar'); if(sid) sid.src = avatar || sid.src;
  var tid = document.getElementById('topbarAvatar');  if(tid) tid.src = avatar || tid.src;
  var sn  = document.getElementById('sidebarName');   if(sn)  sn.textContent  = name;
  var sr  = document.getElementById('sidebarRole');   if(sr)  sr.textContent  = role;
  var tn  = document.getElementById('topbarName');    if(tn)  tn.textContent  = name;
  var tr  = document.getElementById('topbarRole');    if(tr)  tr.textContent  = role;
  var dn  = document.getElementById('dropdownName');   if(dn)  dn.textContent  = name;
  var dr  = document.getElementById('dropdownRole');   if(dr)  dr.textContent  = role;
  var da  = document.getElementById('dropdownAvatar'); if(da)  da.src = avatar || da.src;
})();


  // Build shiftData từ: shift_assignments + attendance + leave_requests
  function buildShiftData() {
    const data = {};
    const empId = currentUser.id;
    const allShifts = DB.shifts.getAll();

    // ── 1. Lịch ca đã lưu — đọc từ humi_shift_assignments (synced từ Supabase shift_assignments)
    var _rawAssign = [];
    try { _rawAssign = JSON.parse(localStorage.getItem('humi_shift_assignments') || '[]'); } catch(e) {}
    // Fallback: cũng đọc từ humi_work_shifts nếu có
    var _rawWS = [];
    try { _rawWS = JSON.parse(localStorage.getItem('humi_work_shifts') || '[]'); } catch(e) {}

    _rawAssign
      .filter(function(a) { return String(a.employeeId) === String(empId); })
      .forEach(function(a) {
        const sh = a.shiftId ? allShifts.find(s => String(s.id) === String(a.shiftId)) : null;
        if (!sh || !a.date) return;
        if (!data[a.date]) data[a.date] = [];
        data[a.date].push({
          html: (sh.startTime||'') + ' – ' + (sh.endTime||''),
          cls: 'sp-planned',
          note: 'Ca làm việc – lịch đã đăng ký'
        });
      });
    // Fallback: humi_work_shifts (dùng workDate)
    _rawWS
      .filter(function(a) { return String(a.employeeId) === String(empId); })
      .forEach(function(a) {
        if (!a.workDate) return;
        // Tránh duplicate nếu đã có từ shift_assignments
        var alreadyIn = _rawAssign.some(function(ra) {
          return String(ra.employeeId) === String(empId) && ra.date === a.workDate && String(ra.shiftId) === String(a.shiftId);
        });
        if (alreadyIn) return;
        const sh = a.shiftId ? allShifts.find(s => String(s.id) === String(a.shiftId)) : null;
        if (!sh) return;
        if (!data[a.workDate]) data[a.workDate] = [];
        data[a.workDate].push({
          html: (a.startTime || sh.startTime||'') + ' – ' + (a.endTime || sh.endTime||''),
          cls: 'sp-planned',
          note: 'Ca làm việc – lịch đã đăng ký'
        });
      });

    // ── 2. Chấm công thực tế + trạng thái duyệt ──
    DB.attendance.getAll({ employeeId: empId }).forEach(a => {
      if (!a.checkIn) return;
      if (!data[a.date]) data[a.date] = [];
      const time = a.checkIn + (a.checkOut ? ' – ' + a.checkOut : ' – ...');
      let cls, note;
      if (!a.checkOut)                         { cls = 'sp-active';   note = 'Đang làm việc'; }
      else if (a.approvalStatus === 'approved') { cls = 'sp-approved'; note = 'Chấm công đã duyệt'; }
      else if (a.approvalStatus === 'rejected') { cls = 'sp-rejected'; note = 'Chấm công bị từ chối'; }
      else                                      { cls = 'sp-pending';  note = 'Chấm công chờ duyệt'; }
      data[a.date].push({ html: time, cls, note });
    });

    // ── 3. Nghỉ phép (leave_requests) ──
    DB.leaves.getHistory(empId).forEach(l => {
      // Mỗi ngày trong khoảng nghỉ
      const start = new Date(l.startDate), end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const dateKey = d.getFullYear() + '-' +
          String(d.getMonth()+1).padStart(2,'0') + '-' +
          String(d.getDate()).padStart(2,'0');
        if (!data[dateKey]) data[dateKey] = [];
        let cls, note;
        if (l.status === 'approved')      { cls = 'sp-leave-ok';   note = 'Nghỉ phép đã duyệt'; }
        else if (l.status === 'rejected') { cls = 'sp-leave-no';   note = 'Nghỉ phép bị từ chối'; }
        else                              { cls = 'sp-leave-wait'; note = 'Nghỉ phép chờ duyệt'; }
        const typeName = l.leaveTypeName || 'Phép năm';
        data[dateKey].push({ html: typeName, cls, note });
      }
    });

    return data;
  }
  let shiftData = buildShiftData();

  const VI_MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                     'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const DOW_LABELS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];

  // Vietnamese public holidays (MM-DD format; for Tết we use Gregorian approx for 2025/2026)
  var VN_HOLIDAYS = {
    '01-01': 'Tết Dương lịch',
    '04-30': 'Ngày Giải phóng miền Nam',
    '05-01': 'Ngày Quốc tế Lao động',
    '09-02': 'Quốc khánh',
    '09-03': 'Quốc khánh (bù)',
    // Tết Nguyên Đán 2025: Jan 28 – Feb 2
    '2025-01-28': 'Tết Nguyên Đán',
    '2025-01-29': 'Tết Nguyên Đán',
    '2025-01-30': 'Tết Nguyên Đán',
    '2025-01-31': 'Tết Nguyên Đán',
    '2025-02-01': 'Tết Nguyên Đán',
    '2025-02-02': 'Tết Nguyên Đán',
    // Giỗ Tổ Hùng Vương 2025: April 7
    '2025-04-07': 'Giỗ Tổ Hùng Vương',
    // Tết 2026: Feb 16 – Feb 21
    '2026-02-16': 'Tết Nguyên Đán',
    '2026-02-17': 'Tết Nguyên Đán',
    '2026-02-18': 'Tết Nguyên Đán',
    '2026-02-19': 'Tết Nguyên Đán',
    '2026-02-20': 'Tết Nguyên Đán',
    '2026-02-21': 'Tết Nguyên Đán',
    // Giỗ Tổ 2026: April 25
    '2026-04-25': 'Giỗ Tổ Hùng Vương',
  };

  function getHoliday(y, m, d) {
    var full = y + '-' + pad(m+1) + '-' + pad(d);
    if (VN_HOLIDAYS[full]) return VN_HOLIDAYS[full];
    var md = pad(m+1) + '-' + pad(d);
    return VN_HOLIDAYS[md] || null;
  }

  const now = new Date();
  let curYear = now.getFullYear(), curMonth = now.getMonth();

  function pad(n) { return String(n).padStart(2,'0'); }
  function dateKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
  function isToday(y, m, d) {
    const t = new Date();
    return t.getFullYear()===y && t.getMonth()===m && t.getDate()===d;
  }

  function renderCalendar() {
    document.getElementById('monthLabel').textContent = `${VI_MONTHS[curMonth]}/${curYear}`;
    const grid = document.getElementById('calendarGrid');

    // Header
    let html = DOW_LABELS.map((d,i) =>
      `<div class="cal-header-cell${i===6?' sunday':''}">${d}</div>`
    ).join('');

    // First day offset (Mon-based: Mon=0 … Sun=6)
    const fd = new Date(curYear, curMonth, 1).getDay();
    const startOffset = fd === 0 ? 6 : fd - 1;
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const prevDays = new Date(curYear, curMonth, 0).getDate();

    let cells = [];
    // Prev month fillers
    for (let i = startOffset - 1; i >= 0; i--) {
      const pm = curMonth === 0 ? 11 : curMonth - 1;
      const py = curMonth === 0 ? curYear - 1 : curYear;
      cells.push({ d: prevDays - i, m: pm, y: py, other: true });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ d, m: curMonth, y: curYear, other: false });
    }
    // Next month fillers
    const nm = curMonth === 11 ? 0 : curMonth + 1;
    const ny = curMonth === 11 ? curYear + 1 : curYear;
    let fill = 1;
    while (cells.length % 7 !== 0) cells.push({ d: fill++, m: nm, y: ny, other: true });

    cells.forEach((cell, idx) => {
      const dow = idx % 7;
      const isSun = dow === 6;
      const today = isToday(cell.y, cell.m, cell.d);
      const shifts = (!cell.other && shiftData[dateKey(cell.y, cell.m, cell.d)]) || [];

      const holiday = !cell.other ? getHoliday(cell.y, cell.m, cell.d) : null;
      const isHoliday = !!holiday;

      const cls = ['cal-day', cell.other?'other-month':'', isSun?'sunday':'', today?'today':'', isHoliday?'holiday':'']
        .filter(Boolean).join(' ');

      const pillsHtml = shifts.map(s =>
        `<div class="shift-pill ${s.cls}" title="${s.note||''}">${s.html||s.label||''}</div>`
      ).join('');

      const holidayHtml = isHoliday
        ? `<div class="shift-pill sp-holiday" title="${holiday}" style="background:#fef2f2;color:#dc2626;font-size:10px;border-radius:4px;padding:2px 5px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">🎌 ${holiday}</div>`
        : '';

      html += `<div class="${cls}">
        <div class="day-header">
          <span class="day-num">${cell.d}</span>
          <button class="day-add-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        ${holidayHtml}${pillsHtml}
      </div>`;
    });

    grid.innerHTML = html;
  }

  function changeMonth(delta) {
    curMonth += delta;
    if (curMonth > 11) { curMonth = 0; curYear++; }
    if (curMonth < 0)  { curMonth = 11; curYear--; }
    shiftData = buildShiftData(); // Rebuild để lấy dữ liệu mới nhất
    renderCalendar();
  }

  // Gọi từ các trang khác (sau khi lưu lịch ca / duyệt công)
  function refreshCalendar() {
    shiftData = buildShiftData();
    renderCalendar();
  }

  // Khi Supabase sync xong → rebuild calendar với dữ liệu mới
  window.addEventListener('humi_synced', function() {
    refreshCalendar();
  });

  renderCalendar();

// ==================== LOGOUT ====================
function doLogout() { DB.auth.logout(); window.location.href = '../login.html'; }

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

// ==================== TOPBAR SEARCH ====================
function topbarSearchHandle(q) {
  if (q) DB.utils.showToast('Dùng nút ‹ › để điều hướng lịch');
}
