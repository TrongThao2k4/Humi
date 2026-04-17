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

    // ── 1. Lịch ca đã lưu (đọc trực tiếp từ Supabase qua DB.workShifts) ──
    DB.workShifts.getAll({ employeeId: empId }).forEach(function(a) {
      const sh = a.shiftId ? allShifts.find(s => String(s.id) === String(a.shiftId)) : null;
      if (!sh) return;
      if (!data[a.workDate]) data[a.workDate] = [];
      data[a.workDate].push({
        html: (sh.startTime||'') + ' – ' + (sh.endTime||''),
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

      const cls = ['cal-day', cell.other?'other-month':'', isSun?'sunday':'', today?'today':'']
        .filter(Boolean).join(' ');

      const pillsHtml = shifts.map(s =>
        `<div class="shift-pill ${s.cls}" title="${s.note||''}">${s.html||s.label||''}</div>`
      ).join('');

      html += `<div class="${cls}">
        <div class="day-header">
          <span class="day-num">${cell.d}</span>
          <button class="day-add-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        ${pillsHtml}
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
