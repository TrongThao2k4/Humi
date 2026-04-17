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


  // ===== CONSTANTS — read from employee's allocated leave balance =====
  const _empRecord     = (DB.employees.getAll() || []).find(function(e){ return e.id === currentUser.id; }) || {};
  const _lb            = _empRecord.leaveBalance || {};
  const ANNUAL_TOTAL   = _lb.annual    != null ? _lb.annual    : 12;
  const SICK_TOTAL     = _lb.sick      != null ? _lb.sick      : 30;
  const MATERNITY_TOTAL = _lb.maternity != null ? _lb.maternity : 180;

  const LEAVE_TYPE_NAMES = { annual: 'Nghỉ phép năm', sick: 'Nghỉ ốm', unpaid: 'Nghỉ không lương' };
  const STATUS_PILL = {
    approved: '<span class="status-pill pill-green">Đã duyệt</span>',
    rejected:  '<span class="status-pill" style="background:#fee2e2;color:#ef4444;">Từ chối</span>',
    pending:   '<span class="status-pill pill-orange">Chờ duyệt</span>',
  };

  // ===== HELPERS =====
  function fmtD(iso) { return iso ? iso.split('-').reverse().join('/') : '—'; }
  function setVal(id, n) {
    document.getElementById(id).innerHTML = n + ' <span style="font-size:14px;font-weight:600;color:#7C8FAC;">ngày</span>';
  }

  // Count Mon-Sat working days between two Date objects (inclusive)
  function countWorkDays(start, end) {
    let days = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getDay() !== 0) days++; // exclude Sunday
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  // ===== LOAD & RENDER PAGE DATA =====
  function loadLeaveData() {
    const empId  = currentUser.id;
    const bal    = DB.leaves.getBalance(empId);
    const history = DB.leaves.getHistory(empId).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const usedAnnual    = ANNUAL_TOTAL   - (bal.annual    || 0);
    const usedSick      = SICK_TOTAL     - (bal.sick      || 0);
    const usedMaternity = MATERNITY_TOTAL - (bal.maternity || 0);

    const pendingDays   = history.filter(l => l.status === 'pending').reduce((s, l) => s + (l.totalDays || 0), 0);
    const totalUsed     = history.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0);
    const totalRemaining = (bal.annual || 0) + (bal.sick || 0);

    setVal('sumTotal',     ANNUAL_TOTAL);
    setVal('sumUsed',      totalUsed);
    setVal('sumRemaining', totalRemaining);
    setVal('sumPending',   pendingDays);

    // Leave type breakdown table
    const leaveTypes = [
      { label: 'Nghỉ phép năm',    color: '#16a34a', total: ANNUAL_TOTAL,    used: usedAnnual,    remaining: bal.annual    || 0,
        pending: history.filter(l => l.leaveType === 'annual'   && l.status === 'pending').reduce((s, l) => s + l.totalDays, 0) },
      { label: 'Nghỉ thai sản',    color: '#2563eb', total: MATERNITY_TOTAL, used: usedMaternity, remaining: bal.maternity || 0, pending: 0 },
      { label: 'Nghỉ ốm',          color: '#ea580c', total: SICK_TOTAL,      used: usedSick,      remaining: bal.sick      || 0,
        pending: history.filter(l => l.leaveType === 'sick'     && l.status === 'pending').reduce((s, l) => s + l.totalDays, 0) },
      { label: 'Nghỉ không lương', color: '#7C8FAC', total: '—',
        used: history.filter(l => l.leaveType === 'unpaid' && l.status === 'approved').reduce((s, l) => s + l.totalDays, 0),
        remaining: bal.unpaid || 0,
        pending:   history.filter(l => l.leaveType === 'unpaid' && l.status === 'pending').reduce((s, l) => s + l.totalDays, 0) },
    ];

    const pct = (used, total) => typeof total === 'number' && total > 0 ? Math.round(used / total * 100) : 0;
    const statusPillFn = (remaining) => typeof remaining === 'number' && remaining > 0
      ? '<span class="status-pill pill-green">Còn phép</span>'
      : '<span class="status-pill" style="background:#fee2e2;color:#ef4444;">Hết phép</span>';

    document.getElementById('leaveTableBody').innerHTML = leaveTypes.map(t => {
      const p = pct(t.used, t.total);
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:8px;height:8px;border-radius:50%;background:${t.color};flex-shrink:0;"></div><span style="font-weight:600;color:#2A3547;">${t.label}</span></div></td>
        <td style="font-weight:700;color:#2A3547;">${typeof t.total === 'number' ? t.total + ' ngày' : t.total}</td>
        <td style="color:#ea580c;font-weight:600;">${t.used} ngày</td>
        <td style="color:#16a34a;font-weight:700;">${t.remaining} ngày</td>
        <td style="color:#2563eb;font-weight:600;">${t.pending} ngày</td>
        <td><div class="progress-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${p}%;background:${t.color};"></div></div><span style="font-size:12px;font-weight:600;color:#2A3547;min-width:32px;">${p > 0 ? p + '%' : '—'}</span></div></td>
        <td>${statusPillFn(t.remaining)}</td>
      </tr>`;
    }).join('');

    // History card
    const histEl = document.getElementById('leaveHistory');
    if (!history.length) {
      histEl.innerHTML = '<p style="font-size:13px;color:#7C8FAC;text-align:center;padding:20px 0;">Chưa có đơn nghỉ phép</p>';
    } else {
      histEl.innerHTML = history.slice(0, 6).map(l => {
        const dateRange = l.startDate === l.endDate
          ? fmtD(l.startDate) + ' • ' + l.totalDays + ' ngày'
          : fmtD(l.startDate) + ' – ' + fmtD(l.endDate) + ' • ' + l.totalDays + ' ngày';
        return `<div class="hist-row">
          <div style="flex:1;">
            <p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${l.leaveTypeName || l.leaveType}</p>
            <p class="hist-date">${dateRange}</p>
          </div>
          ${STATUS_PILL[l.status] || ''}
        </div>`;
      }).join('');
    }
  }

  // ===== EXPORT CSV =====
  function exportCSV() {
    const emp     = DB.employees.getById(currentUser.id);
    const bal     = DB.leaves.getBalance(currentUser.id);
    const history = DB.leaves.getHistory(currentUser.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const STATUS_MAP = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối' };

    if (!emp) { DB.utils.showToast('Không có dữ liệu để xuất'); return; }

    const rows = [
      ['THÔNG TIN PHÉP TỒN'],
      [],
      ['THÔNG TIN NHÂN VIÊN'],
      ['Họ và tên',   emp.name],
      ['Mã nhân viên', emp.code],
      ['Vị trí',      emp.position || '—'],
      ['Đơn vị',      emp.unit     || '—'],
      [],
      ['SỐ DƯ PHÉP'],
      ['Loại phép',         'Tổng',            'Đã dùng',                           'Còn lại'],
      ['Nghỉ phép năm',     ANNUAL_TOTAL,       ANNUAL_TOTAL    - (bal.annual    || 0), bal.annual    || 0],
      ['Nghỉ ốm',           SICK_TOTAL,         SICK_TOTAL      - (bal.sick      || 0), bal.sick      || 0],
      ['Nghỉ thai sản',     MATERNITY_TOTAL,    MATERNITY_TOTAL - (bal.maternity || 0), bal.maternity || 0],
      ['Nghỉ không lương',  '—',
        history.filter(l => l.leaveType === 'unpaid' && l.status === 'approved').reduce((s, l) => s + l.totalDays, 0), '—'],
      [],
      ['LỊCH SỬ NGHỈ PHÉP'],
      ['Loại phép', 'Từ ngày', 'Đến ngày', 'Số ngày', 'Lý do', 'Trạng thái', 'Ngày tạo'],
      ...history.map(l => [
        l.leaveTypeName || l.leaveType,
        fmtD(l.startDate),
        fmtD(l.endDate),
        l.totalDays,
        l.reason || '—',
        STATUS_MAP[l.status] || l.status,
        l.createdAt ? l.createdAt.slice(0, 10).split('-').reverse().join('/') : '—',
      ]),
    ];

    if (!history.length) rows.push(['Chưa có đơn nghỉ phép']);

    const esc = v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
    const csv  = rows.map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Phep_ton_${emp.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    DB.utils.showToast('Xuất file thành công!');
  }

  // ===== LEAVE REQUEST MODAL =====
  function openLeaveModal() {
    document.getElementById('leaveForm').reset();
    document.getElementById('daysCount').textContent = '—';
    document.getElementById('leaveWarning').style.display = 'none';

    // Show current balance
    const bal = DB.leaves.getBalance(currentUser.id);
    document.getElementById('balancePreview').innerHTML = [
      { label: 'Phép năm còn lại', value: (bal.annual || 0) + ' ngày', color: '#16a34a' },
      { label: 'Nghỉ ốm còn lại',  value: (bal.sick   || 0) + ' ngày', color: '#ea580c' },
    ].map(b => `
      <div style="flex:1;text-align:center;">
        <p style="font-size:18px;font-weight:800;color:${b.color};margin:0;">${b.value}</p>
        <p style="font-size:11px;color:#7C8FAC;margin:3px 0 0;">${b.label}</p>
      </div>
    `).join('<div style="width:1px;background:#EAEFF4;"></div>');

    // Set min date to today
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('leaveStart').min = today;
    document.getElementById('leaveEnd').min   = today;

    document.getElementById('leaveModal').style.display = 'flex';
  }

  function closeLeaveModal() {
    document.getElementById('leaveModal').style.display = 'none';
  }

  function recalcDays() {
    const startVal   = document.getElementById('leaveStart').value;
    const endVal     = document.getElementById('leaveEnd').value;
    const leaveType  = document.getElementById('leaveType').value;
    const warning    = document.getElementById('leaveWarning');
    const daysEl     = document.getElementById('daysCount');

    warning.style.display = 'none';
    daysEl.textContent = '—';
    if (!startVal || !endVal) return;

    const start = new Date(startVal);
    const end   = new Date(endVal);

    if (end < start) {
      warning.textContent = 'Đến ngày phải sau hoặc bằng Từ ngày';
      warning.style.display = 'block';
      return;
    }

    const days = countWorkDays(start, end);
    daysEl.textContent = days + ' ngày';

    // Validate balance for annual leave
    if (leaveType === 'annual') {
      const remaining = DB.leaves.getBalance(currentUser.id).annual || 0;
      if (days > remaining) {
        warning.textContent = `Số ngày nghỉ (${days}) vượt quá phép năm còn lại (${remaining} ngày)`;
        warning.style.display = 'block';
      }
    }
  }

  function submitLeaveForm(e) {
    e.preventDefault();
    const leaveType = document.getElementById('leaveType').value;
    const startVal  = document.getElementById('leaveStart').value;
    const endVal    = document.getElementById('leaveEnd').value;
    const reason    = document.getElementById('leaveReason').value.trim();

    const start = new Date(startVal);
    const end   = new Date(endVal);

    if (end < start) {
      DB.utils.showToast('Đến ngày phải sau hoặc bằng Từ ngày');
      return;
    }

    const totalDays = countWorkDays(start, end);

    if (leaveType === 'annual') {
      const remaining = DB.leaves.getBalance(currentUser.id).annual || 0;
      if (totalDays > remaining) {
        DB.utils.showToast(`Số ngày nghỉ vượt quá phép còn lại (${remaining} ngày)`);
        return;
      }
    }

    const btn = document.getElementById('leaveSubmitBtn');
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      DB.leaves.submit({
        employeeId:    currentUser.id,
        leaveType:     leaveType,
        leaveTypeName: LEAVE_TYPE_NAMES[leaveType] || leaveType,
        startDate:     startVal,
        endDate:       endVal,
        totalDays:     totalDays,
        reason:        reason,
      });
      closeLeaveModal();
      DB.utils.showToast('Gửi đơn nghỉ phép thành công!');
      loadLeaveData();
    } catch (err) {
      DB.utils.showToast('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  // Close modal on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLeaveModal(); });

  // ===== INIT =====
  loadLeaveData();

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
