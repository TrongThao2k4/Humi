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


  // ===== TOTALS — read dynamically so Supabase sync is reflected =====
  function getLeaveTotal(type, fallback) {
    var emp = (DB.employees.getAll() || []).find(function(e){ return e.id === currentUser.id; }) || {};
    var lb  = emp.leaveBalance || {};
    return lb[type] != null ? lb[type] : fallback;
  }

  const LEAVE_TYPE_NAMES = { annual: 'Nghỉ phép năm', sick: 'Nghỉ ốm', unpaid: 'Nghỉ không lương' };

  const STATUS_PILL = {
    approved: '<span class="status-pill pill-green"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block;"></span>Đã duyệt</span>',
    rejected: '<span class="status-pill pill-red"><span style="width:6px;height:6px;border-radius:50%;background:#dc2626;display:inline-block;"></span>Từ chối</span>',
    pending:  '<span class="status-pill pill-orange"><span style="width:6px;height:6px;border-radius:50%;background:#ea580c;display:inline-block;"></span>Chờ duyệt</span>',
  };

  const BADGE_CLASS = { annual:'badge-green', sick:'badge-red', unpaid:'badge-gray', maternity:'badge-blue' };

  // Leave type SVG icons
  const LEAVE_ICONS = {
    annual:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    sick:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    unpaid:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    maternity:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  };

  // ===== HELPERS =====
  function fmtD(iso) { return iso ? iso.split('-').reverse().join('/') : '—'; }
  function setVal(id, n) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = n + ' <span>ngày</span>';
  }

  // Count Mon-Sat working days between two Date objects (inclusive)
  function countWorkDays(start, end) {
    let days = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getDay() !== 0) days++;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  // ===== LOAD & RENDER PAGE DATA =====
  function loadLeaveData() {
    const now    = new Date();
    const year   = now.getFullYear();
    const empId  = currentUser.id;
    const bal    = DB.leaves.getBalance(empId);
    const history = DB.leaves.getHistory(empId).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const ANNUAL_TOTAL    = getLeaveTotal('annual',    12);
    const SICK_TOTAL      = getLeaveTotal('sick',      30);
    const MATERNITY_TOTAL = getLeaveTotal('maternity', 180);

    const usedAnnual    = ANNUAL_TOTAL    - (bal.annual    || 0);
    const usedSick      = SICK_TOTAL      - (bal.sick      || 0);
    const usedMaternity = MATERNITY_TOTAL - (bal.maternity || 0);

    const pendingDays    = history.filter(l => l.status === 'pending').reduce((s, l) => s + (l.totalDays || 0), 0);
    const totalUsed      = history.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0);
    const totalRemaining = (bal.annual || 0) + (bal.sick || 0);

    // Year badges
    var yb = document.getElementById('yearBadge');
    if (yb) yb.textContent = year;
    var hy = document.getElementById('histYear');
    if (hy) hy.textContent = year;

    // KPI cards
    setVal('sumTotal',     ANNUAL_TOTAL);
    setVal('sumUsed',      totalUsed);
    setVal('sumRemaining', totalRemaining);
    setVal('sumPending',   pendingDays);

    // ── Leave type breakdown cards ──
    const leaveTypes = [
      { key:'annual',   label:'Phép năm',      color:'#5D87FF', iconBg:'rgba(93,135,255,0.12)',
        total: ANNUAL_TOTAL,    used: usedAnnual,    remaining: bal.annual    || 0,
        pending: history.filter(l => l.leaveType==='annual'   && l.status==='pending').reduce((s,l)=>s+l.totalDays,0) },
      { key:'sick',     label:'Phép bệnh',     color:'#ef4444', iconBg:'rgba(239,68,68,0.10)',
        total: SICK_TOTAL,      used: usedSick,      remaining: bal.sick      || 0,
        pending: history.filter(l => l.leaveType==='sick'     && l.status==='pending').reduce((s,l)=>s+l.totalDays,0) },
      { key:'unpaid',   label:'Phép không lương', color:'#7C8FAC', iconBg:'rgba(124,143,172,0.12)',
        total: null,
        used: history.filter(l=>l.leaveType==='unpaid'&&l.status==='approved').reduce((s,l)=>s+l.totalDays,0),
        remaining: null,
        pending: history.filter(l=>l.leaveType==='unpaid'&&l.status==='pending').reduce((s,l)=>s+l.totalDays,0) },
      { key:'maternity',label:'Phép thai sản', color:'#ec4899', iconBg:'rgba(236,72,153,0.10)',
        total: MATERNITY_TOTAL, used: usedMaternity, remaining: bal.maternity || 0, pending: 0 },
    ];

    const pct = (used, total) => (typeof total === 'number' && total > 0) ? Math.round(used / total * 100) : 0;
    const statusBadge = (remaining) => {
      if (remaining === null) return '';
      return remaining > 0
        ? `<span class="status-pill pill-green" style="margin-left:auto;"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block;"></span>Còn phép</span>`
        : `<span class="status-pill pill-red" style="margin-left:auto;"><span style="width:6px;height:6px;border-radius:50%;background:#dc2626;display:inline-block;"></span>Hết phép</span>`;
    };

    document.getElementById('leaveCardsGrid').innerHTML = leaveTypes.map(t => {
      const p = pct(t.used, t.total);
      const remDisplay = t.remaining === null
        ? `<span style="font-size:38px;font-weight:800;color:${t.color};">∞</span>`
        : `<span style="font-size:38px;font-weight:800;color:${t.color};">${t.remaining}</span>`;
      const totalText = t.total !== null ? `Tổng cấp: ${t.total} ngày/năm` : 'Không giới hạn';
      return `
        <div class="leave-card">
          <div class="leave-card-header">
            <div class="leave-card-header-left">
              <div class="leave-card-icon" style="background:${t.iconBg};color:${t.color};">
                ${LEAVE_ICONS[t.key] || ''}
              </div>
              <div>
                <div class="leave-card-name">${t.label}</div>
                <div class="leave-card-total">${totalText}</div>
              </div>
            </div>
          </div>
          <div class="leave-card-remaining">
            ${remDisplay}
            <span class="leave-card-unit">ngày còn lại</span>
          </div>
          <div class="leave-progress-bg">
            <div class="leave-progress-fill" style="width:${p}%;background:${t.color};"></div>
          </div>
          <div class="leave-card-footer">
            <span class="leave-card-stat">Đã dùng: <strong>${t.used}</strong></span>
            <span class="leave-card-stat">Chờ duyệt: <strong style="color:#ca8a04;">${t.pending}</strong></span>
            ${statusBadge(t.remaining)}
          </div>
        </div>`;
    }).join('');

    // ── History table ──
    const histTbody = document.getElementById('leaveHistoryTable');
    if (!history.length) {
      histTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#7C8FAC;font-size:13px;">Chưa có đơn nghỉ phép nào</td></tr>`;
    } else {
      histTbody.innerHTML = history.slice(0, 10).map(l => {
        const bClass = BADGE_CLASS[l.leaveType] || 'badge-gray';
        const submittedAt = l.createdAt ? l.createdAt.slice(0,10).split('-').reverse().join('/') : '—';
        return `<tr>
          <td><span class="leave-badge ${bClass}">${l.leaveTypeName || l.leaveType}</span></td>
          <td>${fmtD(l.startDate)}</td>
          <td>${fmtD(l.endDate)}</td>
          <td style="font-weight:700;color:#2A3547;">${l.totalDays}</td>
          <td><span class="hist-reason">${l.reason || '—'}</span></td>
          <td style="color:#7C8FAC;">${submittedAt}</td>
          <td>${STATUS_PILL[l.status] || ''}</td>
        </tr>`;
      }).join('');
    }
  }

  // ===== EXPORT CSV =====
  function exportCSV() {
    const emp     = DB.employees.getById(currentUser.id);
    const bal     = DB.leaves.getBalance(currentUser.id);
    const history = DB.leaves.getHistory(currentUser.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const STATUS_MAP = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối' };
    const ANNUAL_TOTAL    = getLeaveTotal('annual',    12);
    const SICK_TOTAL      = getLeaveTotal('sick',      30);
    const MATERNITY_TOTAL = getLeaveTotal('maternity', 180);

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

  // Reload sau khi Supabase sync xong
  window.addEventListener('humi_synced', function() {
    loadLeaveData();
  });

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
  var el = document.getElementById('searchInput');
  if (el) { el.value = q; }
  else if (q) { DB.utils.showToast('Dùng bộ lọc bên dưới để tìm kiếm'); }
}
