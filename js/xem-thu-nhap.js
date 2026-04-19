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


  let currentPeriod = null;

  // ===== HELPERS =====
  function fmt(n) { return (n || 0).toLocaleString('vi-VN'); }
  function fmtD(iso) { return iso ? iso.split('-').reverse().join('/') : '—'; }
  function periodLabel(p) {
    // '2026-03' → 'Tháng 03/2026'
    const [y, m] = p.split('-');
    return `Tháng ${m}/${y}`;
  }

  // ===== PERIOD DROPDOWN =====
  function togglePeriod() {
    var dd = document.getElementById('periodDropdown');
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
  }

  function populatePeriodDropdown() {
    const allRecords = DB.salary.getAll().filter(r => r.employeeId === currentUser.id);
    const periods = [...new Set(allRecords.map(r => r.period))].sort().reverse();
    const dropdown = document.getElementById('periodDropdown');
    dropdown.innerHTML = '';

    if (!periods.length) {
      dropdown.innerHTML = '<div style="padding:12px 16px;font-size:13px;color:#7C8FAC;text-align:center;">Không có dữ liệu</div>';
      return periods;
    }

    periods.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'period-option' + (i === 0 ? ' selected' : '');
      div.dataset.period = p;
      div.textContent = periodLabel(p);
      div.addEventListener('click', () => selectPeriod(p));
      dropdown.appendChild(div);
    });
    return periods;
  }

  function selectPeriod(period) {
    currentPeriod = period;
    document.getElementById('selectedPeriod').textContent = periodLabel(period);
    document.getElementById('periodDropdown').style.display = 'none';
    document.querySelectorAll('.period-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.period === period);
    });
    loadSalaryData(period);
    renderHistory(); // refresh history highlight
  }

  function clearPeriod(e) {
    e.stopPropagation();
    currentPeriod = null;
    document.getElementById('selectedPeriod').textContent = 'Chọn kỳ lương';
    document.querySelectorAll('.period-option').forEach(o => o.classList.remove('selected'));
    // Clear display
    const tbody = document.getElementById('salaryTableBody');
    tbody.querySelectorAll('tr:not(#salaryNoData)').forEach(r => r.remove());
    document.getElementById('salaryNoData').style.display = '';
    ['cardIncome','cardContract','cardAttendance'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div style="padding:20px;text-align:center;color:#7C8FAC;font-size:13px;">Chưa có dữ liệu thu nhập</div>';
    });
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('#periodTrigger') && !e.target.closest('#periodDropdown'))
      document.getElementById('periodDropdown').style.display = 'none';
  });

  // ===== EXPORT CSV =====
  function exportCSV() {
    if (!currentPeriod) {
      DB.utils.showToast('Vui lòng chọn kỳ lương trước khi xuất');
      return;
    }
    const emp = DB.employees.getById(currentUser.id);
    const rec = DB.salary.getRecord(currentUser.id, currentPeriod);
    if (!rec || !emp) {
      DB.utils.showToast('Không có dữ liệu để xuất');
      return;
    }
    const allow  = Object.values(rec.allowances  || {}).reduce((a, b) => a + b, 0);
    const deduct = Object.values(rec.deductions  || {}).reduce((a, b) => a + b, 0);

    const rows = [
      ['THÔNG TIN THU NHẬP - ' + periodLabel(currentPeriod)],
      [],
      ['THÔNG TIN NHÂN VIÊN'],
      ['Họ và tên',     emp.name],
      ['Mã nhân viên',  emp.code],
      ['Vị trí',        emp.position || '—'],
      ['Đơn vị',        emp.unit     || '—'],
      ['Loại hợp đồng', emp.contractType || '—'],
      [],
      ['CHI TIẾT THU NHẬP'],
      ['Khoản mục',                 'Số tiền (VNĐ)'],
      ['Lương cơ bản',              rec.baseSalary],
      ['Phụ cấp ăn trưa',           (rec.allowances || {}).meal      || 0],
      ['Phụ cấp đi lại',            (rec.allowances || {}).transport || 0],
      ['Thưởng',                    rec.bonus       || 0],
      ['Tăng ca',                   rec.overtimePay || 0],
      ['Tổng trước thuế',           rec.grossSalary],
      ['Bảo hiểm & Khấu trừ khác', deduct - ((rec.deductions || {}).thueTNCN || 0)],
      ['Thuế TNCN',                 (rec.deductions || {}).thueTNCN || 0],
      ['THỰC LÃNH',                 rec.netSalary],
      [],
      ['NGÀY CÔNG'],
      ['Ngày công chuẩn',   rec.workDays       || 26],
      ['Ngày công thực tế', rec.actualWorkDays || 0],
      ['Giờ công chuẩn',    Math.round((rec.actualWorkDays || 0) * 8 * 10) / 10],
    ];

    const escape = v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
    const csv = rows.map(r => r.map(escape).join(',')).join('\r\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Thu_nhap_${emp.code}_${currentPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    DB.utils.showToast('Xuất file thành công!');
  }

  // ===== OT CALCULATION FROM ATTENDANCE =====
  function calcOTHours(empId, period) {
    var recs = DB.attendance.getAll({ employeeId: empId }).filter(function(r) {
      return r.date && r.date.startsWith(period) && r.checkIn && r.checkOut;
    });
    var totalOtMin = 0;
    recs.forEach(function(r) {
      var shift = r.shiftId ? DB.shifts.getById(r.shiftId) : null;
      var endTime = (shift && shift.endTime) ? shift.endTime : '17:00';
      var checkOut = r.approvedCheckOut || r.checkOut;
      if (!checkOut) return;
      var coH = parseInt(checkOut.split(':')[0]);
      var coM = parseInt(checkOut.split(':')[1] || 0);
      var endH = parseInt(endTime.split(':')[0]);
      var endM = parseInt(endTime.split(':')[1] || 0);
      var otMin = (coH * 60 + coM) - (endH * 60 + endM);
      if (otMin > 0) totalOtMin += otMin;
    });
    return Math.round(totalOtMin / 60 * 10) / 10;
  }

  // ===== LOAD SALARY DATA =====
  function loadSalaryData(period) {
    const emp    = DB.employees.getById(currentUser.id);
    const rec    = DB.salary.getRecord(currentUser.id, period);
    const tbody  = document.getElementById('salaryTableBody');
    const noData = document.getElementById('salaryNoData');

    if (!rec || !emp) {
      noData.style.display = '';
      tbody.querySelectorAll('tr:not(#salaryNoData)').forEach(r => r.remove());
      ['cardIncome','cardContract','cardAttendance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div style="padding:20px;text-align:center;color:#7C8FAC;font-size:13px;">Chưa có dữ liệu thu nhập</div>';
      });
      return;
    }

    noData.style.display = 'none';
    const allow  = Object.values(rec.allowances  || {}).reduce((a, b) => a + b, 0);
    const deduct = Object.values(rec.deductions  || {}).reduce((a, b) => a + b, 0);
    const allLeaveHistory = DB.leaves.getHistory(currentUser.id);
    const approvedLeaveDays = allLeaveHistory
      .filter(l => l.status === 'approved' && l.leaveType !== 'unpaid' && l.startDate && l.startDate.startsWith(period))
      .reduce((s, l) => s + (l.totalDays || 0), 0);
    const unpaidLeaveDays = allLeaveHistory
      .filter(l => l.status === 'approved' && l.leaveType === 'unpaid' && l.startDate && l.startDate.startsWith(period))
      .reduce((s, l) => s + (l.totalDays || 0), 0);
    const otHours = calcOTHours(currentUser.id, period);

    // Salary table row
    const oldRow = tbody.querySelector('tr.sal-data-row');
    if (oldRow) oldRow.remove();
    const tr = document.createElement('tr');
    tr.className = 'sal-data-row';
    tr.innerHTML = `
      <td class="col-emp">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${emp.avatar || 'https://i.pravatar.cc/34?img=1'}" style="width:34px;height:34px;border-radius:50%;border:2px solid #bbf7d0;flex-shrink:0;" />
          <div>
            <p style="font-size:12.5px;font-weight:700;color:#2A3547;margin:0;">${emp.name}</p>
            <p style="font-size:10.5px;color:#7C8FAC;margin:1px 0 0;">${emp.code} · ${emp.position || '—'}</p>
            <p style="font-size:10.5px;color:#7C8FAC;margin:0;">${emp.unit || '—'}</p>
          </div>
        </div>
      </td>
      <td>${fmt(rec.baseSalary)}</td>
      <td>${fmt(rec.baseSalary)}</td>
      <td class="green">${fmt(rec.netSalary)}</td>
      <td class="green">${fmt(rec.netSalary)}</td>
      <td>${rec.workDays || 26}</td>
      <td>0</td>
      <td class="green">${rec.actualWorkDays || 0}</td>
      <td class="green">${rec.actualWorkDays || 0}</td>
      <td>0</td><td>0</td>
      <td>${approvedLeaveDays}</td>
      <td>${unpaidLeaveDays}</td>
      <td>${fmt(rec.baseSalary)}</td>
      <td>${fmt(allow + (rec.bonus || 0) + (rec.overtimePay || 0))}</td>
      <td class="green">${fmt(rec.grossSalary)}</td>
      <td>${fmt((rec.deductions || {}).thueTNCN || 0)}</td>
      <td class="green" style="font-weight:800;">${fmt(rec.netSalary)}</td>
    `;
    tbody.appendChild(tr);

    // Card 1 — Tổng thu nhập
    document.getElementById('cardIncome').innerHTML = `
      <div class="inc-row" style="margin-top:6px;"><span class="inc-label">+ 1. Ngày công thực tế</span><span class="inc-val">${rec.actualWorkDays || 0}</span></div>
      <div class="inc-row"><span class="inc-label">+ 2. Lương theo thời gian</span><span class="inc-val">${fmt(rec.baseSalary)}</span></div>
      <div class="inc-row"><span class="inc-label">+ 5. Các khoản bổ sung</span><span class="inc-val">${fmt(allow + (rec.bonus || 0) + (rec.overtimePay || 0))}</span></div>
      <div class="inc-row"><span class="inc-label">+ 7. Tổng TN trước thuế</span><span class="inc-val">${fmt(rec.grossSalary)}</span></div>
      <div class="inc-row"><span class="inc-label">− Bảo hiểm & khấu trừ</span><span class="inc-val" style="background:#f97316;">${fmt(deduct - ((rec.deductions || {}).thueTNCN || 0))}</span></div>
      <div class="inc-row"><span class="inc-label">− 10. Thuế TNCN</span><span class="inc-val" style="background:#f97316;">${fmt((rec.deductions || {}).thueTNCN || 0)}</span></div>
      <button class="thuc-lanh-btn">
        <span>THỰC LÃNH</span>
        <span style="background:rgba(255,255,255,0.25);padding:3px 14px;border-radius:7px;font-size:14px;">${fmt(rec.netSalary)} đ</span>
      </button>
    `;

    // Card 2 — Hợp đồng & Chức vụ
    document.getElementById('cardContract').innerHTML = `
      <div class="con-row" style="margin-top:6px;">
        <span class="con-label">Hợp đồng</span>
        <div style="text-align:right;">
          <p style="font-size:12.5px;font-weight:700;color:#2563eb;margin:0;line-height:1.35;">${emp.code}/${new Date().getFullYear()}</p>
          <p style="font-size:10.5px;color:#7C8FAC;margin:2px 0 0;">${emp.contractType || '—'}</p>
        </div>
      </div>
      <div class="con-row"><span class="con-label">Lương cơ bản</span><span class="con-value">${fmt(rec.baseSalary)} đ</span></div>
      <div class="con-row"><span class="con-label">Phụ cấp ăn trưa</span><span class="con-value">${fmt((rec.allowances || {}).meal || 0)} đ</span></div>
      <div class="con-row"><span class="con-label">Phụ cấp đi lại</span><span class="con-value">${fmt((rec.allowances || {}).transport || 0)} đ</span></div>
      <div class="con-row"><span class="con-label">Thưởng tháng</span><span class="con-value">${fmt(rec.bonus || 0)} đ</span></div>
      <div class="con-row"><span class="con-label">Thực lãnh kỳ này</span><span class="con-value" style="color:#16a34a;font-weight:700;">${fmt(rec.netSalary)} đ</span></div>
      <div class="subhead">Thông tin vị trí</div>
      <div class="hist-row" style="border-bottom:none;">
        <div><p class="hist-pos">${emp.position || '—'}</p><p class="hist-date">Từ ${fmtD(emp.startDate)}</p></div>
        <p class="hist-branch">${emp.unit || '—'}</p>
      </div>
    `;

    // Card 3 — Chấm công & Nghỉ phép
    const actualHours = Math.round((rec.actualWorkDays || 0) * 8 * 10) / 10;
    const leaveBal    = DB.leaves.getBalance(currentUser.id);
    document.getElementById('cardAttendance').innerHTML = `
      <div class="subhead" style="margin-top:6px;">Chấm công</div>
      <div class="att-row"><span class="att-label">Chấm công chuẩn</span><span class="att-value">${actualHours} giờ</span></div>
      <div class="att-row"><span class="att-label">Tăng ca (OT)</span><span class="att-value">${otHours} giờ</span></div>
      <div class="att-row"><span class="att-label">Nghỉ phép hưởng lương</span><span class="att-value">${approvedLeaveDays} ngày</span></div>
      ${unpaidLeaveDays > 0 ? `<div class="att-row"><span class="att-label">Nghỉ không lương</span><span class="att-value" style="color:#ef4444;">${unpaidLeaveDays} ngày</span></div>` : ''}
      <div class="subhead">Phép tồn</div>
      <div class="att-row"><span class="leave-label">Phép năm còn lại</span><span class="leave-value">${leaveBal.annual || 0} ngày</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:7px;padding:10px 12px;text-align:center;">
          <p style="font-size:20px;font-weight:800;color:#16a34a;margin:0;">${rec.actualWorkDays || 0}</p>
          <p style="font-size:10.5px;color:#5A6A85;margin:2px 0 0;">Ngày thực tế</p>
        </div>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:7px;padding:10px 12px;text-align:center;">
          <p style="font-size:20px;font-weight:800;color:var(--primary);margin:0;">${rec.workDays || 26}</p>
          <p style="font-size:10.5px;color:#5A6A85;margin:2px 0 0;">Ngày chuẩn</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;padding:10px 12px;text-align:center;">
          <p style="font-size:20px;font-weight:800;color:#2563eb;margin:0;">${actualHours}</p>
          <p style="font-size:10.5px;color:#5A6A85;margin:2px 0 0;">Giờ chuẩn</p>
        </div>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:7px;padding:10px 12px;text-align:center;">
          <p style="font-size:20px;font-weight:800;color:var(--primary);margin:0;">${otHours}</p>
          <p style="font-size:10.5px;color:#5A6A85;margin:2px 0 0;">Giờ OT</p>
        </div>
      </div>
    `;
  }

  // ===== HISTORY SECTION =====
  function renderHistory() {
    const records = DB.salary.getAll()
      .filter(r => r.employeeId === currentUser.id)
      .sort((a, b) => b.period.localeCompare(a.period));
    const container = document.getElementById('historySection');

    if (!records.length) {
      container.innerHTML = '<div style="text-align:center;padding:28px;color:#7C8FAC;font-size:13px;">Chưa có dữ liệu thu nhập</div>';
      return;
    }

    container.innerHTML = records.map((r, i) => {
      const isActive = r.period === currentPeriod;
      const last = i === records.length - 1;
      return `
        <div onclick="selectPeriod('${r.period}')"
          style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;cursor:pointer;border-bottom:${last ? 'none' : '1px solid #F2F6FA'};background:${isActive ? '#f0fdf4' : 'white'};transition:background 0.12s;"
          onmouseover="this.style.background='#F2F6FA'" onmouseout="this.style.background='${isActive ? '#f0fdf4' : 'white'}'">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;border-radius:8px;background:${isActive ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#F2F6FA'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${isActive ? 'white' : '#5A6A85'}" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div>
              <p style="font-size:13px;font-weight:700;color:${isActive ? '#16a34a' : '#2A3547'};margin:0;">${periodLabel(r.period)}</p>
              <p style="font-size:11px;color:#7C8FAC;margin:2px 0 0;">${r.actualWorkDays || 0} ngày công · ${r.workDays || 26} ngày chuẩn</p>
            </div>
          </div>
          <div style="text-align:right;">
            <p style="font-size:13.5px;font-weight:800;color:#16a34a;margin:0;">${fmt(r.netSalary)} đ</p>
            <p style="font-size:11px;color:#7C8FAC;margin:2px 0 0;">${isActive ? '<span style="color:var(--primary);font-weight:600;">● Đang xem</span>' : 'Click để xem'}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===== INIT =====
  (function init() {
    const periods = populatePeriodDropdown();
    if (periods && periods.length) {
      selectPeriod(periods[0]); // auto-select latest
    } else {
      // No salary data at all
      ['cardIncome','cardContract','cardAttendance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div style="padding:20px;text-align:center;color:#7C8FAC;font-size:13px;">Chưa có dữ liệu thu nhập</div>';
      });
      renderHistory();
    }
    // Show manager salary toggle for managers/admins
    var roleId = currentUser.roleId;
    if (roleId === 'manager' || roleId === 'admin') {
      var wrap = document.getElementById('mgrSalaryToggleWrap');
      if (wrap) wrap.style.display = 'block';
    }
  })();

  // ===== MANAGER: ALL EMPLOYEES SALARY VIEW =====
  var _mgrSalaryMode = false;

  function toggleMgrSalaryView() {
    _mgrSalaryMode = !_mgrSalaryMode;
    var btn = document.getElementById('mgrSalaryToggleBtn');
    if (btn) btn.textContent = _mgrSalaryMode ? 'Xem lương của tôi' : 'Xem toàn bộ nhân viên';

    // Toggle individual salary section visibility
    var scrollArea = document.getElementById('salaryScrollArea');
    var mgrTable = document.getElementById('mgrAllSalaryWrap');

    if (_mgrSalaryMode) {
      if (!mgrTable) {
        mgrTable = document.createElement('div');
        mgrTable.id = 'mgrAllSalaryWrap';
        mgrTable.style.cssText = 'flex:1;overflow:auto;background:#F2F6FA;';
        mgrTable.innerHTML = buildMgrSalaryTable();
        if (scrollArea && scrollArea.parentNode) scrollArea.parentNode.insertBefore(mgrTable, scrollArea);
      } else {
        mgrTable.innerHTML = buildMgrSalaryTable();
        mgrTable.style.display = '';
      }
      if (scrollArea) scrollArea.style.display = 'none';
    } else {
      if (mgrTable) mgrTable.style.display = 'none';
      if (scrollArea) scrollArea.style.display = '';
    }
  }

  function buildMgrSalaryTable() {
    var employees = DB.employees.getAll().filter(function(e) { return e.status === 'active'; });
    var allSalary = DB.salary.getAll();
    var periods = [...new Set(allSalary.map(function(r) { return r.period; }))].sort().reverse();
    var period = periods[0] || currentPeriod || '';

    var rows = employees.map(function(emp) {
      var rec = allSalary.find(function(r) { return r.employeeId === emp.id && r.period === period; });
      var net = rec ? (rec.netSalary || rec.grossSalary || 0) : 0;
      var gross = rec ? (rec.grossSalary || 0) : 0;
      var tax = rec ? (rec.tax || 0) : 0;
      return '<tr>'
        + '<td style="padding:12px 16px;font-weight:600;color:#2A3547;">' + (emp.name || '—') + '</td>'
        + '<td style="padding:12px 16px;color:#7C8FAC;font-size:12px;">' + (emp.code || emp.id) + '</td>'
        + '<td style="padding:12px 16px;color:#5A6A85;">' + (emp.unit || '—') + '</td>'
        + '<td style="padding:12px 16px;color:#5A6A85;">' + (emp.position || '—') + '</td>'
        + '<td style="padding:12px 16px;text-align:right;">' + fmt(gross) + '</td>'
        + '<td style="padding:12px 16px;text-align:right;color:#ef4444;">-' + fmt(tax) + '</td>'
        + '<td style="padding:12px 16px;text-align:right;font-weight:700;color:#16a34a;">' + fmt(net) + '</td>'
        + '</tr>';
    }).join('');

    return '<div style="margin:14px 16px;background:white;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden;">'
      + '<div style="padding:14px 16px;border-bottom:1px solid #e5eaef;display:flex;align-items:center;justify-content:space-between;">'
      + '<span style="font-size:14px;font-weight:700;color:#2A3547;">Bảng lương toàn công ty — ' + (period ? periodLabel(period) : '—') + '</span>'
      + '<span style="font-size:12px;color:#7C8FAC;">' + employees.length + ' nhân viên</span>'
      + '</div>'
      + '<div style="overflow-x:auto;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      + '<thead><tr style="background:#F2F6FA;">'
      + '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Họ tên</th>'
      + '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Mã NV</th>'
      + '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Đơn vị</th>'
      + '<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Chức vụ</th>'
      + '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Lương gộp</th>'
      + '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Thuế TNCN</th>'
      + '<th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#7C8FAC;letter-spacing:.06em;text-transform:uppercase;">Thực lãnh</th>'
      + '</tr></thead>'
      + '<tbody>' + (rows || '<tr><td colspan="7" style="text-align:center;padding:40px;color:#7C8FAC;">Không có dữ liệu</td></tr>') + '</tbody>'
      + '</table></div></div>';
  }

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
  if (q) DB.utils.showToast('Trang này không có chức năng tìm kiếm');
}
