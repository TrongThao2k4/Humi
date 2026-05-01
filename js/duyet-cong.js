// Auth guard
  var _s = DB.auth.requireAuth(); if(!_s) throw 0;
  var currentUser = _s.user;
  if (currentUser.roleId === 'employee') { window.location.href = '../index.html'; throw 0; }

// ===== LOAD USER INFO (sidebar + topbar) =====
(function loadUserInfo() {
  var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
  var name   = (emp && emp.name)     || currentUser.name     || '—';
  var role   = (emp && emp.position) || currentUser.position || '—';
  // Ưu tiên avatar mặc định (user muốn ảnh mặc định trên mọi trang)
  var DEFAULT_AVATAR_ID = 47;
  function defaultAv(sz) { return 'https://i.pravatar.cc/' + (sz||32) + '?img=' + DEFAULT_AVATAR_ID; }
  var sid = document.getElementById('sidebarAvatar'); if(sid) sid.src = defaultAv(32);
  var tid = document.getElementById('topbarAvatar');  if(tid) tid.src = defaultAv(32);
  var sn  = document.getElementById('sidebarName');   if(sn)  sn.textContent  = name;
  var sr  = document.getElementById('sidebarRole');   if(sr)  sr.textContent  = role;
  var tn  = document.getElementById('topbarName');    if(tn)  tn.textContent  = name;
  var tr  = document.getElementById('topbarRole');    if(tr)  tr.textContent  = role;
  var dn  = document.getElementById('dropdownName');   if(dn)  dn.textContent  = name;
  var dr  = document.getElementById('dropdownRole');   if(dr)  dr.textContent  = role;
  var da  = document.getElementById('dropdownAvatar'); if(da)  da.src = defaultAv(36);
})();


  // ===== DATA from DB =====
var ROLE_MAP = { manager:'Quản lý', employee:'Nhân viên', admin:'Quản trị' };

function getApprovedLeave(employeeId, dateStr) {
  return DB.leaves.getAll().find(l =>
    l.employeeId === employeeId &&
    l.status === 'approved' &&
    l.startDate <= dateStr && l.endDate >= dateStr
  ) || null;
}

function fmtLeaveLabel(l) {
  if (!l) return '';
  const type = l.leaveTypeName || l.leaveType || 'Nghỉ phép';
  const days = l.totalDays || 1;
  // Short label like "Pm(1 ng)"
  const short = type.includes('năm') || type.includes('annual') ? 'Pm' :
                type.includes('ốm') || type.includes('sick') ? 'Pốm' :
                type.includes('thai') || type.includes('maternity') ? 'Pthai' : 'Ptn';
  return `${short}(${days} ng)`;
}

function buildWeekDays(employeeId, weekMonday) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekMonday);
    d.setDate(d.getDate() + i);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const allRecs = DB.attendance.getAll({employeeId, date:dateStr});
    const rec = allRecs[0];
    if (!rec) {
      const leave = getApprovedLeave(employeeId, dateStr);
      days.push(leave ? {leave:true, label:fmtLeaveLabel(leave), date:dateStr} : {empty:true, date:dateStr});
      continue;
    }
    let checkOut = rec.checkOut || null;
    if (rec.checkIn && !checkOut) {
      const [h, m] = rec.checkIn.split(':').map(Number);
      checkOut = String((h + 8) % 24).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    const _statuses = ['approved','approved','approved','pending','pending','rejected'];
    const approvalStatus = rec.approvalStatus || _statuses[Math.floor(Math.random() * _statuses.length)];
    const faceImageIn  = allRecs.map(r => r.faceImageIn).find(Boolean)  || null;
    const faceImageOut = allRecs.map(r => r.faceImageOut).find(Boolean) || null;
    // Chuẩn hóa tất cả records cho multi-shift
    const records = allRecs.map(function(r) {
      var co = r.checkOut || null;
      if (r.checkIn && !co) {
        var p = r.checkIn.split(':').map(Number);
        co = String((p[0]+8)%24).padStart(2,'0') + ':' + String(p[1]).padStart(2,'0');
      }
      return { id:r.id, shiftId:r.shiftId||null, checkIn:r.checkIn||null, checkOut:co, approvalStatus:r.approvalStatus||'pending', status:r.status||'present' };
    });
    days.push({
      checkIn: rec.checkIn || null,
      checkOut,
      status: rec.status || 'present',
      approvalStatus,
      date: dateStr,
      faceImageIn,
      faceImageOut,
      records  // tất cả ca trong ngày
    });
  }
  return days;
}

function getBaseMonday() {
  // Use current week's Monday
  const now = new Date();
  const day = now.getDay();
  const diff = day===0 ? -6 : 1-day;
  const mon = new Date(now);
  mon.setDate(now.getDate()+diff);
  return mon;
}

function getScopedEmployees() {
  var all = DB.employees.getAll();
  if (currentUser.roleId === 'admin') return all;
  return all.filter(function(e) {
    return e.managerId === currentUser.id || e.id === currentUser.id;
  });
}

function buildEmployees(weekMondayDate) {
  return getScopedEmployees().map(emp => {
    const days = buildWeekDays(emp.id, weekMondayDate);
    // Count worked hours: each day with checkIn = 8h, each with checkOut counted
    let workedHours = 0;
    days.forEach(d => {
      if (d.empty || d.leave || !d.checkIn) return;
      if (d.checkIn && d.checkOut) {
        const [ih,im] = d.checkIn.split(':').map(Number);
        const [oh,om] = d.checkOut.split(':').map(Number);
        workedHours += Math.round(((oh*60+om)-(ih*60+im))/60);
      }
    });
    // Scheduled: Mon–Fri × 8h = 40h per week
    const scheduledHours = 5 * 8;
    return {
      id: emp.id, name: emp.name, code: emp.code,
      branch: emp.unit, role: ROLE_MAP[emp.roleId]||'Nhân viên',
      avatar: emp.avatar || genAvatar(emp.name),
      faceImage: emp.faceImage || null,
      worked: workedHours, scheduled: scheduledHours,
      days
    };
  });
}

// Global state
var _baseMonday = getBaseMonday();
var employees = buildEmployees(_baseMonday);
var filterState = {
  units: [],
  search: ''
};

function getAllUnits() {
  return [...new Set(getScopedEmployees().map(function(e) { return e.unit; }).filter(Boolean))].sort();
}

function getVisibleEmployees() {
  var query = (filterState.search || '').toLowerCase().trim();
  return employees.filter(function(emp) {
    if (filterState.units.length && filterState.units.indexOf(emp.branch) === -1) return false;
    if (query) {
      var haystack = [emp.name, emp.code, emp.branch, emp.role].join(' ').toLowerCase();
      if (haystack.indexOf(query) === -1) return false;
    }
    return true;
  });
}

function updateFilterSummary() {
  var activeTag = document.getElementById('activeFilterTag');
  var resultRange = document.getElementById('resultRange');
  var visible = getVisibleEmployees();
  if (resultRange) {
    resultRange.textContent = visible.length ? ('1 - ' + visible.length + ' trong số ' + employees.length) : ('0 trong số ' + employees.length);
  }
  var resetLink = document.getElementById('filterResetLink');
  var hasFilter = filterState.units.length > 0 || !!filterState.search;
  if (activeTag) {
    if (filterState.units.length > 0) {
      activeTag.textContent = 'Đơn vị(' + filterState.units.length + ')';
    } else if (filterState.search) {
      activeTag.textContent = 'Từ khóa';
    } else {
      activeTag.textContent = 'Tất cả';
    }
    activeTag.style.display = 'inline-flex';
  }
  if (resetLink) {
    resetLink.style.display = hasFilter ? 'inline-flex' : 'none';
  }
}

function renderFilterPanel() {
  var wrap = document.getElementById('unitFilterList');
  if (!wrap) return;
  wrap.innerHTML = '';
  var selected = new Set(filterState.units);
  getAllUnits().forEach(function(unit) {
    var label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e5eaef;border-radius:10px;cursor:pointer;background:#fff;';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = unit;
    cb.checked = selected.has(unit);
    cb.style.width = '16px';
    cb.style.height = '16px';
    cb.style.accentColor = 'var(--primary)';
    var text = document.createElement('span');
    text.textContent = unit;
    text.style.fontSize = '13px';
    text.style.color = '#2A3547';
    label.appendChild(cb);
    label.appendChild(text);
    wrap.appendChild(label);
  });
}

function syncSearchFilter() {
  var input = document.getElementById('empSearch');
  filterState.search = input ? input.value : '';
  updateFilterSummary();
  renderTable();
}

function mapRemoteEmployee(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    avatar: r.avatar,
    unit: r.unit,
    position: r.position,
    roleId: r.role_id,
    status: r.status,
    faceImage: r.face_image || null
  };
}

function mapRemoteAttendance(r) {
  return {
    id: r.id,
    employeeId: r.employee_id,
    shiftId: r.shift_id || null,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status,
    approvalStatus: r.approval_status,
    note: r.note,
    faceImageIn: r.face_image_in || null,
    faceImageOut: r.face_image_out || null
  };
}

function buildEmployeesFromRows(employeeRows, attendanceRows) {
  var employeeMap = {};
  employeeRows.forEach(function(r) {
    employeeMap[r.id] = mapRemoteEmployee(r);
  });

  function getApprovedLeaveFromRows(employeeId, dateStr) {
    return DB.leaves.getAll().find(function(l) {
      return l.employeeId === employeeId && l.status === 'approved' && l.startDate <= dateStr && l.endDate >= dateStr;
    }) || null;
  }

  function buildWeekDaysFromRows(employeeId, weekMonday) {
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(weekMonday);
      d.setDate(d.getDate() + i);
      var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var allRecs = attendanceRows.filter(function(r) { return String(r.employeeId) === String(employeeId) && r.date === dateStr; });
      var rec = allRecs[0];
      if (!rec) {
        var leave = getApprovedLeaveFromRows(employeeId, dateStr);
        days.push(leave ? { leave:true, label:fmtLeaveLabel(leave) } : { empty:true });
        continue;
      }
      var checkOut = rec.checkOut || null;
      if (rec.checkIn && !checkOut) {
        var parts = rec.checkIn.split(':').map(Number);
        checkOut = String((parts[0] + 8) % 24).padStart(2, '0') + ':' + String(parts[1]).padStart(2, '0');
      }
      var approvalStatus = rec.approvalStatus || 'pending';
      var faceImageIn = allRecs.map(function(r) { return r.faceImageIn; }).find(Boolean) || null;
      var faceImageOut = allRecs.map(function(r) { return r.faceImageOut; }).find(Boolean) || null;
      var records = allRecs.map(function(r) {
        var co = r.checkOut || null;
        if (r.checkIn && !co) {
          var p = r.checkIn.split(':').map(Number);
          co = String((p[0] + 8) % 24).padStart(2, '0') + ':' + String(p[1]).padStart(2, '0');
        }
        return { id:r.id, shiftId:r.shiftId || null, checkIn:r.checkIn || null, checkOut:co, approvalStatus:r.approvalStatus || 'pending', status:r.status || 'present' };
      });
      days.push({
        checkIn: rec.checkIn || null,
        checkOut: checkOut,
        status: rec.status || 'present',
        approvalStatus: approvalStatus,
        date: dateStr,
        faceImageIn: faceImageIn,
        faceImageOut: faceImageOut,
        records: records
      });
    }
    return days;
  }

  return employeeRows.map(function(r) {
    var emp = employeeMap[r.id];
    var days = buildWeekDaysFromRows(r.id, _baseMonday);
    var workedHours = 0;
    days.forEach(function(d) {
      if (d.empty || d.leave || !d.checkIn) return;
      if (d.checkIn && d.checkOut) {
        var ih = d.checkIn.split(':').map(Number);
        var oh = d.checkOut.split(':').map(Number);
        workedHours += Math.round(((oh[0] * 60 + oh[1]) - (ih[0] * 60 + ih[1])) / 60);
      }
    });
    return {
      id: emp.id,
      name: emp.name,
      code: emp.code,
      branch: emp.unit,
      role: ROLE_MAP[emp.roleId] || 'Nhân viên',
      avatar: emp.avatar || genAvatar(emp.name),
      faceImage: emp.faceImage || null,
      worked: workedHours,
      scheduled: 40,
      days: days
    };
  });
}

function hydrateFromSupabase() {
  if (typeof SB === 'undefined' || !SB.select) return;
  Promise.all([SB.select('employees'), SB.select('attendance')]).then(function(results) {
    var employeeRows = results[0] || [];
    var attendanceRows = (results[1] || []).map(mapRemoteAttendance);
    if (!employeeRows.length && !attendanceRows.length) return;
    employees = buildEmployeesFromRows(employeeRows, attendanceRows);
    reRender();
  });
}

// Khi Supabase sync xong → rebuild data và re-render bảng
window.addEventListener('humi_synced', function() {
  employees = buildEmployees(_baseMonday);
  reRender();
});

setTimeout(function() {
  employees = buildEmployees(_baseMonday);
  reRender();
}, 1200);

setTimeout(hydrateFromSupabase, 150);

function renderDayCell(day, isSunday, empId) {
  const bgStyle = isSunday ? 'background:rgba(220,252,231,0.35);' : '';
  const tdStyle = `${bgStyle}padding:0 8px;text-align:center;vertical-align:middle;height:72px;border-bottom:1px solid #f5f5f8;`;
  const dateAttr = day.date ? `data-date="${day.date}"` : '';
  const empAttr  = empId   ? `data-empid="${empId}"`    : '';
  const circle = `<svg class="add-att-circle" ${dateAttr} ${empAttr} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;flex-shrink:0;transition:opacity .15s;" title="Thêm chấm công" onmouseover="this.style.opacity='.6'" onmouseout="this.style.opacity='1'">
    <circle cx="8" cy="8" r="7" stroke="#DFE5EF" stroke-width="1.25" stroke-dasharray="3 2"/>
    <line x1="8" y1="4.5" x2="8" y2="11.5" stroke="#DFE5EF" stroke-width="1.25" stroke-linecap="round"/>
    <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#DFE5EF" stroke-width="1.25" stroke-linecap="round"/>
  </svg>`;

  // Empty
  if (day.empty) {
    return `<td style="${tdStyle}">
      <div style="display:flex;align-items:center;justify-content:center;height:100%;">${circle}</div>
    </td>`;
  }

  // Ngày lễ
  if (day.type === 'holiday') {
    const pill = `<span style="display:inline-flex;align-items:center;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;color:white;background:#0d9488;white-space:nowrap;">${day.label||'Quốc Khánh'}</span>`;
    return `<td style="${tdStyle}"><div style="display:flex;align-items:center;justify-content:center;gap:5px;">${pill}</div></td>`;
  }

  // Ngày bù lễ
  if (day.type === 'holiday_comp') {
    const pill = `<span style="display:inline-flex;align-items:center;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;color:white;background:#3B82F6;white-space:nowrap;">${day.label||'Ngày bù lễ'}</span>`;
    return `<td style="${tdStyle}"><div style="display:flex;align-items:center;justify-content:center;gap:5px;">${pill}</div></td>`;
  }

  // Hỗ trợ đơn vị khác
  if (day.type === 'support') {
    const pill = `<span style="display:inline-flex;align-items:center;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;color:white;background:var(--primary-dark);white-space:nowrap;">Hỗ trợ</span>`;
    return `<td style="${tdStyle}"><div style="display:flex;align-items:center;justify-content:center;gap:5px;">${pill}${circle}</div></td>`;
  }

  // Nghỉ phép
  if (day.leave) {
    const leaveStatus = day.leaveStatus || 'approved';
    const leaveBg = leaveStatus === 'approved' ? '#16a34a'
                  : leaveStatus === 'rejected'  ? '#dc2626' : 'white';
    const leaveColor = leaveStatus === 'pending' ? 'var(--primary)' : 'white';
    const leaveBorder = leaveStatus === 'pending' ? 'border:1.5px solid #c4b5fd;' : '';
    const leavePill = `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;color:${leaveColor};background:${leaveBg};white-space:nowrap;${leaveBorder}">${day.label}</span>`;
    return `<td style="${tdStyle}">
      <div style="display:inline-flex;align-items:center;gap:4px;">${leavePill}${circle}</div>
    </td>`;
  }

  // Render từng ca thành một pill
  function makePill(rec) {
    var ci = rec.checkIn, co = rec.checkOut, approval = rec.approvalStatus || 'pending';
    var label = ci || '—';
    if (ci && co) {
      var ih = parseInt(ci)*60 + parseInt(ci.split(':')[1]);
      var oh = parseInt(co)*60 + parseInt(co.split(':')[1]);
      var mins = oh - ih;
      if (mins > 0) label = String(Math.floor(mins/60)).padStart(2,'0') + ':' + String(mins%60).padStart(2,'0');
    }
    var da = `data-checkin="${ci||''}" data-checkout="${co||''}" data-approval="${approval}" data-shiftid="${rec.shiftId||''}" data-recid="${rec.id||''}"`;
    var ps = approval === 'approved'
      ? 'background:#16a34a;color:white;border:none;'
      : approval === 'rejected'
      ? 'background:#dc2626;color:white;border:none;'
      : 'background:white;color:#ea580c;border:1.5px dashed #ea580c;';
    return `<span class="att-pill-click" ${da} style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer;${ps}">${label}</span>`;
  }

  const records = day.records && day.records.length ? day.records : [{
    id: null, shiftId: null,
    checkIn: day.checkIn, checkOut: day.checkOut,
    approvalStatus: day.approvalStatus || 'pending', status: day.status
  }];

  // Ensure each record has a stable id (use synthetic id when missing)
  records.forEach(function(r) {
    if (!r.id) r.id = 'att_' + (empId || '') + '_' + (day.date || '');
    if (!r.shiftId) r.shiftId = r.shiftId || '';
    r.checkIn = r.checkIn || '';
    r.checkOut = r.checkOut || '';
    r.approvalStatus = r.approvalStatus || 'pending';
  });

  const pills = records.map(makePill).join('');
  return `<td style="${tdStyle}">
    <div style="display:flex;align-items:center;justify-content:center;gap:5px;height:100%;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">${pills}</div>
      ${circle}
    </div>
  </td>`;
}

function dayHours(day) {
  if (!day.checkIn || !day.checkOut) return 0;
  const [ih,im] = day.checkIn.split(':').map(Number);
  const [oh,om] = day.checkOut.split(':').map(Number);
  return Math.max(0, Math.round(((oh*60+om)-(ih*60+im))/60));
}

function renderTable() {
  const tbody = document.getElementById('attendanceTable');
  const visibleEmployees = getVisibleEmployees();
  tbody.innerHTML = visibleEmployees.map(emp => {
    // Công đã duyệt
    const approvedH = emp.days.reduce((s,d) => d.approvalStatus === 'approved' ? s + dayHours(d) : s, 0);
    // Tổng đã chấm (approved + rejected + pending)
    const stampedH  = emp.days.reduce((s,d) => (d.checkIn && d.checkOut) ? s + dayHours(d) : s, 0);
    const dayCells = emp.days.map((d, i) => renderDayCell(d, i === 6, emp.id)).join('');

    return `<tr class="att-row" data-empid="${emp.id}" style="transition:background 0.12s;">
      <td class="col-employee" style="padding:0 12px 0 20px;vertical-align:middle;height:72px;border-bottom:1px solid #f5f5f8;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${emp.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
          <div>
            <p style="font-size:13px;font-weight:600;color:#2A3547;margin:0 0 2px;">${emp.name}</p>
            <p style="font-size:11px;color:#7C8FAC;margin:0 0 1px;">${emp.code}</p>
            <p style="font-size:11px;color:#7C8FAC;margin:0;">${emp.branch} – ${emp.role}</p>
          </div>
        </div>
      </td>
      <td style="padding:0 10px;text-align:center;vertical-align:middle;height:72px;border-bottom:1px solid #f5f5f8;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span class="progress-badge" style="background:${approvedH > stampedH ? '#fca5a5;color:#dc2626' : 'var(--primary)'};">${approvedH}/${stampedH}</span>
        </div>
      </td>
      ${dayCells}
    </tr>`;
  }).join('');
  updateFilterSummary();
}

function updateDetailStatus(status) {
  const header = document.getElementById('det-header');
  const label  = document.getElementById('det-status-label');
  const name   = document.getElementById('det-name');
  if (status === 'approved') {
    header.style.background = '#f0fdf4';
    label.innerHTML = 'Đã duyệt công cho <strong id="det-name" style="color:#15803d;">' + name.textContent + '</strong>';
  } else if (status === 'rejected') {
    header.style.background = '#fef2f2';
    label.innerHTML = 'Đã hủy công cho <strong id="det-name" style="color:#dc2626;">' + name.textContent + '</strong>';
  } else {
    header.style.background = '';
    label.innerHTML = 'Duyệt công cho <strong id="det-name" style="color:#2A3547;">' + name.textContent + '</strong>';
  }
}

// ===== DETAIL PANEL =====
var WEEK_DAYS_VN = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
var MONTHS_VN = ['tháng 01','tháng 02','tháng 03','tháng 04','tháng 05','tháng 06','tháng 07','tháng 08','tháng 09','tháng 10','tháng 11','tháng 12'];

var _detailCtx = null; // { empIdx, dayIdx }

function openDetail(pill, td, tr) {
  const empId = tr.dataset.empid;
  const empIdx = employees.findIndex(e => e.id === empId || String(e.id) === empId);
  if (empIdx < 0) return;
  const emp = employees[empIdx];

  // Lấy data từ pill (ca cụ thể được click), không phải từ td
  const checkIn  = pill.dataset.checkin;
  const checkOut = pill.dataset.checkout;

  const cells = Array.from(tr.querySelectorAll('td'));
  const dayIdx = cells.indexOf(td) - 2; // 0=Mon..6=Sun
  const clickedShiftId = pill.dataset.shiftid || null;
  const clickedRecId   = pill.dataset.recid   || null;
  _detailCtx = { empIdx, dayIdx, shiftId: clickedShiftId, recId: clickedRecId, checkIn, checkOut };

  const cellDate = new Date(_baseMonday);
  cellDate.setDate(cellDate.getDate() + dayIdx);
  const dayName = WEEK_DAYS_VN[cellDate.getDay()];
  const dateStr = `${dayName}, ${cellDate.getDate()} ${MONTHS_VN[cellDate.getMonth()]}, ${cellDate.getFullYear()}`;

  renderAllFaceImages();

  // use default avatar for detail panel
  document.getElementById('det-avatar').src = defaultAv(80);
  document.getElementById('det-name').textContent = emp.name;
  document.getElementById('det-date').textContent = dateStr;
  updateDetailStatus(emp.days[dayIdx].approvalStatus);
  document.getElementById('det-unit').textContent = emp.branch;
  
  // Get shift from DB instead of hardcoded
  var shiftId = pill.dataset.shiftid;
  var shift = shiftId ? DB.shifts.getById(shiftId) : null;
  var shiftName = 'Ca không xác định';
  if (shift) {
    shiftName = shift.name + ' (' + (shift.startTime || '—') + ' – ' + (shift.endTime || '—') + ') (Nghỉ ' + (shift.breakMinutes || 0) + ' phút)';
  }
  document.getElementById('det-shift').textContent = shiftName;
  document.getElementById('det-checkin').textContent = checkIn || '—';
  document.getElementById('det-checkout').textContent = checkOut || '—';
  document.getElementById('det-note').value = '';

  // Cập nhật label nút Duyệt nửa ca đầu/sau với giờ và số tiếng cụ thể
  var _fBtn = document.querySelector('[onclick="applyHalfShift(\'first\')"]');
  var _lBtn = document.querySelector('[onclick="applyHalfShift(\'last\')"]');
  if (checkIn && checkOut && _fBtn && _lBtn) {
    var _toMin2 = function(t) { var p = t.split(':').map(Number); return p[0]*60+p[1]; };
    var _totalMin2 = _toMin2(checkOut) - _toMin2(checkIn);
    if (_totalMin2 > 0) {
      var _halfMin2 = Math.floor(_totalMin2 / 2);
      var _mh2 = String(Math.floor((_toMin2(checkIn) + _halfMin2)/60)%24).padStart(2,'0');
      var _mm2 = String((_toMin2(checkIn) + _halfMin2) % 60).padStart(2,'0');
      var _mid2 = _mh2 + ':' + _mm2;
      var _hh2 = (_halfMin2/60).toFixed(1);
      _fBtn.textContent = 'Nửa ca đầu (' + checkIn + '–' + _mid2 + ', ' + _hh2 + 'h)';
      _lBtn.textContent = 'Nửa ca sau (' + _mid2 + '–' + checkOut + ', ' + _hh2 + 'h)';
    } else {
      _fBtn.textContent = 'Duyệt nửa ca đầu';
      _lBtn.textContent = 'Duyệt nửa ca sau';
    }
  } else {
    if (_fBtn) _fBtn.textContent = 'Duyệt nửa ca đầu';
    if (_lBtn) _lBtn.textContent = 'Duyệt nửa ca sau';
  }

  // Tự động xác định đi muộn / về sớm dựa vào ca làm việc của pill được click
  (function() {
    var isLate = false, isEarly = false;
    if (shift && shift.startTime && shift.endTime) {
      var toMin = function(t) { var p = t.split(':').map(Number); return p[0]*60 + p[1]; };
      if (checkIn  && toMin(checkIn)  > toMin(shift.startTime)) isLate  = true;
      if (checkOut && toMin(checkOut) < toMin(shift.endTime))   isEarly = true;
    }
    document.getElementById('tog-late').checked  = isLate;
    document.getElementById('tog-early').checked = isEarly;
  })();

  if (checkIn && checkOut && shift) {
    var toMin = function(t) { var p = t.split(':').map(Number); return p[0]*60 + p[1]; };
    var ciMins = toMin(checkIn);
    var coMins = toMin(checkOut);
    var ssMins = toMin(shift.startTime || '00:00');
    var seMins = toMin(shift.endTime || '24:00');
    var totalMin = coMins - ciMins;
    var workedMin = Math.max(0, Math.min(seMins, coMins) - Math.max(ssMins, ciMins));
    var breakMin = shift.breakMinutes || 0;
    var workedHours = (workedMin - breakMin) / 60;
    var earlyMin = Math.max(0, ssMins - ciMins);
    var extraMin = Math.max(0, coMins - seMins);
    var h = Math.floor(totalMin/60), m = totalMin%60;
    var wh = Math.floor(workedHours), wm = Math.round((workedHours % 1) * 60);
    document.getElementById('det-total-hours').textContent = `${(totalMin/60).toFixed(1)}h (${h} giờ ${m} phút)`;
    document.getElementById('det-hours-detail').innerHTML = `Theo ca: ${wh} giờ ${wm} phút &nbsp;|&nbsp; Ngoài ca: ${Math.floor(extraMin/60)} giờ ${extraMin%60} phút<br>Checkin sớm: ${Math.floor(earlyMin/60)} giờ ${earlyMin%60} phút`;
  } else if (checkIn && checkOut) {
    const [ih,im] = checkIn.split(':').map(Number);
    const [oh,om] = checkOut.split(':').map(Number);
    const totalMin = (oh*60+om) - (ih*60+im);
    const h = Math.floor(totalMin/60), m = totalMin%60;
    document.getElementById('det-total-hours').textContent = `${(totalMin/60).toFixed(1)}h (${h} giờ ${m} phút)`;
    document.getElementById('det-hours-detail').innerHTML = `Tổng thời gian: ${h} giờ ${m} phút`;
  } else {
    document.getElementById('det-total-hours').textContent = '—';
    document.getElementById('det-hours-detail').textContent = '';
  }

  document.getElementById('detailOverlay').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return String(Math.floor(total/60)%24).padStart(2,'0') + ':' + String(total%60).padStart(2,'0');
}

function recalcWorked(emp) {
  let total = 0;
  emp.days.forEach(d => {
    if (!d.checkIn || !d.checkOut) return;
    const [ih,im] = d.checkIn.split(':').map(Number);
    const [oh,om] = d.checkOut.split(':').map(Number);
    const mins = (oh*60+om) - (ih*60+im);
    if (mins > 0) total += mins;
  });
  emp.worked = Math.round(total / 60);
}

// Rebuild employees array from latest localStorage data (essential for realtime updates)
function refreshEmployeeData() {
  try {
    employees = buildEmployees(_baseMonday);
    return true;
  } catch (e) {
    console.error('refreshEmployeeData error:', e);
    return false;
  }
}

// Update pill DOM for a specific record/shift immediately (no full reload needed)
function updatePillApproval(recId, shiftId, approvalStatus) {
  try {
    document.querySelectorAll('.att-pill-click').forEach(function(p) {
      var rid = p.getAttribute('data-recid') || '';
      var sid = p.getAttribute('data-shiftid') || '';
      if ((recId && String(rid) === String(recId)) || (shiftId && String(sid) === String(shiftId))) {
        p.setAttribute('data-approval', approvalStatus);
        if (approvalStatus === 'approved') {
          p.style.background = '#16a34a'; p.style.color = 'white'; p.style.border = 'none';
        } else if (approvalStatus === 'rejected') {
          p.style.background = '#dc2626'; p.style.color = 'white'; p.style.border = 'none';
        } else {
          p.style.background = 'white'; p.style.color = '#ea580c'; p.style.border = '1.5px dashed #ea580c';
        }
      }
    });
  } catch (e) {
    console.error('updatePillApproval error', e);
  }
}

// Ensure attendance record exists in localStorage when approve() can't find it
function upsertLocalAttendance(attId, empId, date, checkIn, checkOut, approvalStatus, note) {
  try {
    var key = 'humi_attendance';
    var list = JSON.parse(localStorage.getItem(key) || '[]');
    var idx = list.findIndex(function(r){ return String(r.id) === String(attId); });
    var nowIso = new Date().toISOString();
    if (idx === -1) {
      var rec = {
        id: attId,
        employeeId: empId,
        date: date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: 'present',
        approvalStatus: approvalStatus || 'approved',
        note: note || '',
        approverId: currentUser.id,
        approvedAt: nowIso
      };
      list.push(rec);
    } else {
      list[idx] = Object.assign({}, list[idx], {
        checkIn: checkIn || list[idx].checkIn,
        checkOut: checkOut || list[idx].checkOut,
        approvalStatus: approvalStatus || list[idx].approvalStatus,
        approverId: currentUser.id,
        approvedAt: nowIso,
        approverNote: note || list[idx].approverNote || ''
      });
    }
    localStorage.setItem(key, JSON.stringify(list));
    // Try to push to Supabase (best-effort)
    try { SB.upsert && SB.upsert('attendance', { id: attId, employee_id: empId, date: date, check_in: checkIn || null, check_out: checkOut || null, approval_status: approvalStatus || 'approved', note: note || '' }); } catch(e){}
    return true;
  } catch (e) {
    console.error('upsertLocalAttendance error', e);
    return false;
  }
}

function applyHalfShift(half) {
  if (!_detailCtx) return;
  const { empIdx, dayIdx, recId: ctxRecId } = _detailCtx;
  const emp = employees[empIdx];
  const day = emp.days[dayIdx];

  // Dùng checkIn/checkOut từ pill được click (lưu trong _detailCtx), không dùng day-level
  const checkIn  = _detailCtx.checkIn  || day.checkIn;
  const checkOut = _detailCtx.checkOut || day.checkOut;
  if (!checkIn || !checkOut) return;

  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  const totalMin = (oh*60+om) - (ih*60+im);
  if (totalMin <= 0) return;
  const halfMin = Math.floor(totalMin / 2);
  const midTime = addMinutes(checkIn, halfMin);

  const newIn  = half === 'first' ? checkIn  : midTime;
  const newOut = half === 'first' ? midTime  : checkOut;

  // Cập nhật day-level
  day.checkIn  = newIn;
  day.checkOut = newOut;
  day.approvalStatus = 'approved';
  day.type = undefined;

  // Cập nhật record tương ứng trong day.records (để pill hiển thị đúng duration)
  if (day.records && day.records.length) {
    day.records.forEach(function(rec) {
      var isTarget = ctxRecId ? String(rec.id) === String(ctxRecId) : true;
      if (isTarget) {
        rec.checkIn       = newIn;
        rec.checkOut      = newOut;
        rec.approvalStatus = 'approved';
      }
    });
  }

  // Lưu DB
  var attId = (ctxRecId) || ('att_' + emp.id + '_' + day.date);
  var ok = false; try { ok = DB.attendance.approve(attId, currentUser.id, { checkIn: newIn, checkOut: newOut }); } catch(e){}
  if (!ok) upsertLocalAttendance(attId, emp.id, day.date, newIn, newOut, 'approved');
  try { updatePillApproval(attId, (_detailCtx && _detailCtx.shiftId) || null, 'approved'); } catch(e){}

  refreshEmployeeData();
  reRender();
  closeDetail();

  const label = half === 'first'
    ? '✓ Nửa ca đầu: ' + checkIn + ' – ' + midTime + ' (' + (halfMin/60).toFixed(1) + 'h)'
    : '✓ Nửa ca sau: ' + midTime + ' – ' + checkOut + ' (' + (halfMin/60).toFixed(1) + 'h)';
  showToast(label);
}

function applyApproval(approvalStatus, label) {
  if (!_detailCtx) return;
  const { empIdx, dayIdx } = _detailCtx;
  const emp = employees[empIdx];
  const day = emp.days[dayIdx];
  // Chỉ cập nhật ca được click (theo shiftId hoặc recId)
  const { shiftId: ctxShiftId, recId: ctxRecId } = _detailCtx;
  function _isTargetRec(rec) {
    if (ctxRecId  && rec.id)      return String(rec.id)      === String(ctxRecId);
    if (ctxShiftId && rec.shiftId) return String(rec.shiftId) === String(ctxShiftId);
    return true; // fallback: cập nhật tất cả
  }
  if (day.records) {
    day.records.forEach(function(rec) {
      if (_isTargetRec(rec)) rec.approvalStatus = approvalStatus;
    });
  }
  // Cập nhật approvalStatus của day từ records
  const allApproved  = day.records && day.records.every(r => r.approvalStatus === 'approved');
  const anyRejected  = day.records && day.records.some(r => r.approvalStatus === 'rejected');
  day.approvalStatus = allApproved ? 'approved' : anyRejected ? 'rejected' : 'pending';
  if (approvalStatus !== 'rejected') day.type = undefined;

  const note = document.getElementById('det-note') ? document.getElementById('det-note').value.trim() : '';
  const targetRecs = day.records && day.records.length
    ? day.records.filter(_isTargetRec)
    : [{ id: null }];
  targetRecs.forEach(function(rec) {
    var attId = rec.id || ('att_' + emp.id + '_' + day.date);
    if (approvalStatus === 'approved') {
      var ok = false; try { ok = DB.attendance.approve(attId, currentUser.id, note ? { approverNote: note } : null); } catch(e){}
      if (!ok) upsertLocalAttendance(attId, emp.id, day.date, rec.checkIn || day.checkIn, rec.checkOut || day.checkOut, 'approved', note);
      try { updatePillApproval(attId, rec.shiftId || (_detailCtx && _detailCtx.shiftId), 'approved'); } catch(e){}
    } else {
      var ok2 = false; try { ok2 = DB.attendance.reject(attId, currentUser.id, note); } catch(e){}
      if (!ok2) upsertLocalAttendance(attId, emp.id, day.date, rec.checkIn || day.checkIn, rec.checkOut || day.checkOut, 'rejected', note);
      try { updatePillApproval(attId, rec.shiftId || (_detailCtx && _detailCtx.shiftId), 'rejected'); } catch(e){}
    }
  });
  refreshEmployeeData();
  reRender();
  closeDetail();
  showToast(label);
  // Gửi thông báo cho nhân viên
  (function() {
    var _color = approvalStatus === 'approved' ? '#16a34a' : '#ef4444';
    var _word  = approvalStatus === 'approved' ? 'DUYỆT ✓' : 'TỪ CHỐI ✗';
    var _in  = day.checkIn  || '—';
    var _out = day.checkOut || '—';
    DB.messages.sendSystem(
      emp.id,
      'Ca làm ngày ' + day.date + ' đã ' + (approvalStatus === 'approved' ? 'được duyệt ✓' : 'bị từ chối ✗'),
      '<p>Kính gửi <strong>' + emp.name + '</strong>,</p>'
        + '<p>Ca làm việc của bạn vào ngày <strong>' + day.date + '</strong>'
        + ' (chấm vào: <strong>' + _in + '</strong>, chấm ra: <strong>' + _out + '</strong>)'
        + ' đã được <span style="color:' + _color + ';font-weight:700;">' + _word + '</span>.</p>'
        + (note ? '<p>Ghi chú từ quản lý: <em>' + note + '</em></p>' : '')
        + '<p style="font-size:12px;color:#7C8FAC;">Xử lý bởi: ' + currentUser.name + '</p>',
      'attendance'
    );
  })();
}

// ===== HELPER: 24h time select =====
function _initTimeSelect(prefix) {
  var hEl = document.getElementById(prefix + '-h');
  var mEl = document.getElementById(prefix + '-m');
  if (!hEl || !mEl || hEl.options.length) return;
  for (var h = 0; h < 24; h++) {
    var o = document.createElement('option');
    o.value = o.textContent = String(h).padStart(2, '0');
    hEl.appendChild(o);
  }
  for (var m = 0; m < 60; m += 5) {
    var o2 = document.createElement('option');
    o2.value = o2.textContent = String(m).padStart(2, '0');
    mEl.appendChild(o2);
  }
}

function _setTimeSelect(prefix, timeStr) {
  _initTimeSelect(prefix);
  var parts = (timeStr || '08:00').split(':');
  var hEl = document.getElementById(prefix + '-h');
  var mEl = document.getElementById(prefix + '-m');
  if (hEl) hEl.value = String(parseInt(parts[0] || 8)).padStart(2, '0');
  if (mEl) {
    var mm = parseInt(parts[1] || 0);
    var nearest = String(Math.round(mm / 5) * 5 % 60).padStart(2, '0');
    mEl.value = nearest;
    if (!mEl.value) mEl.value = '00';
  }
}

function _getTimeSelect(prefix) {
  var hEl = document.getElementById(prefix + '-h');
  var mEl = document.getElementById(prefix + '-m');
  if (!hEl || !mEl) return '';
  return hEl.value + ':' + mEl.value;
}

function updateCtHoursPreview() {
  var ci = _getTimeSelect('ct-checkin');
  var co = _getTimeSelect('ct-checkout');
  var preview = document.getElementById('ct-hours-preview');
  if (!preview) return;
  if (ci && co) {
    var _toMin3 = function(t) { var p = t.split(':').map(Number); return p[0]*60+p[1]; };
    var mins = _toMin3(co) - _toMin3(ci);
    if (mins > 0) {
      var h = Math.floor(mins/60), m = mins%60;
      var parts = [];
      if (h > 0) parts.push(h + ' giờ');
      if (m > 0) parts.push(m + ' phút');
      preview.textContent = '⏱ ' + ci + ' – ' + co + '  →  ' + (mins/60).toFixed(1) + 'h (' + parts.join(' ') + ')';
      preview.style.display = 'block';
      return;
    }
  }
  preview.style.display = 'none';
}

function openChiTiet() {
  if (!_detailCtx) return;
  const { empIdx, dayIdx } = _detailCtx;
  const day = employees[empIdx].days[dayIdx];
  _initTimeSelect('ct-checkin');
  _initTimeSelect('ct-checkout');
  _setTimeSelect('ct-checkin',  day.checkIn  || '08:00');
  _setTimeSelect('ct-checkout', day.checkOut || '17:00');
  document.getElementById('ct-note').value = '';
  updateCtHoursPreview();
  document.getElementById('chitietOverlay').classList.add('open');
}

function closeChiTiet() {
  document.getElementById('chitietOverlay').classList.remove('open');
}

function confirmChiTiet() {
  if (!_detailCtx) return;
  const { empIdx, dayIdx } = _detailCtx;
  const emp = employees[empIdx];
  const day = emp.days[dayIdx];
  const newIn  = _getTimeSelect('ct-checkin');
  const newOut = _getTimeSelect('ct-checkout');
  const note   = document.getElementById('ct-note') ? document.getElementById('ct-note').value.trim() : '';
  // Lưu approved_check_in/out — giữ nguyên check_in/out gốc
  day.approvedCheckIn  = newIn  || day.checkIn;
  day.approvedCheckOut = newOut || day.checkOut;
  day.approvalStatus = 'approved';
  day.type = undefined;
  const { shiftId: ctxSId, recId: ctxRId } = _detailCtx;
  function _isTarget(rec) {
    if (ctxRId  && rec.id)      return String(rec.id)      === String(ctxRId);
    if (ctxSId  && rec.shiftId) return String(rec.shiftId) === String(ctxSId);
    return true;
  }
  if (day.records) day.records.forEach(function(rec) { if (_isTarget(rec)) rec.approvalStatus = 'approved'; });
  const targetRecs = day.records && day.records.length ? day.records.filter(_isTarget) : [{ id: null }];
  targetRecs.forEach(function(rec) {
    var attId = rec.id || ('att_' + emp.id + '_' + day.date);
    var ok = false; try { ok = DB.attendance.approve(attId, currentUser.id, { checkIn: day.approvedCheckIn, checkOut: day.approvedCheckOut, approverNote: note }); } catch(e){}
    if (!ok) upsertLocalAttendance(attId, emp.id, day.date, day.approvedCheckIn, day.approvedCheckOut, 'approved', note);
    try { updatePillApproval(attId, rec.shiftId || (_detailCtx && _detailCtx.shiftId), 'approved'); } catch(e){}
  });
  refreshEmployeeData();
  reRender();
  closeChiTiet();
  closeDetail();
  showToast(`✓ Đã duyệt: ${day.approvedCheckIn} – ${day.approvedCheckOut}${note ? ' · ' + note : ''}`);
  // Gửi thông báo điều chỉnh giờ cho nhân viên
  DB.messages.sendSystem(
    emp.id,
    'Ca làm ngày ' + day.date + ' đã được duyệt (điều chỉnh giờ) ✓',
    '<p>Kính gửi <strong>' + emp.name + '</strong>,</p>'
      + '<p>Ca làm việc của bạn vào ngày <strong>' + day.date + '</strong> đã được <span style="color:#16a34a;font-weight:700;">DUYỆT</span> với giờ điều chỉnh:</p>'
      + '<div style="background:#F2F6FA;border-radius:8px;padding:14px 18px;margin:10px 0;">'
      + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span style="color:#7C8FAC;">Giờ gốc (chấm công)</span><span>' + (day.checkIn||'—') + ' – ' + (day.checkOut||'—') + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span style="color:#7C8FAC;">Giờ duyệt</span><span style="color:#16a34a;">' + day.approvedCheckIn + ' – ' + day.approvedCheckOut + '</span></div>'
      + '</div>'
      + (note ? '<p><em>Ghi chú: ' + note + '</em></p>' : '')
      + '<p style="font-size:12px;color:#7C8FAC;">Xử lý bởi: ' + currentUser.name + '</p>',
    'attendance'
  );
}

function reRender() {
  renderFilterPanel();
  renderTable();
  initRowHover();
  initPillClick();
}

function showToast(msg) {
  let t = document.getElementById('approvalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'approvalToast';
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#2A3547;color:white;padding:10px 20px;border-radius:7px;font-size:13px;font-weight:600;z-index:999;opacity:0;transition:opacity 0.2s;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2000);
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
}

function renderAllFaceImages() {
  if (!_detailCtx) return;
  const emp = employees[_detailCtx.empIdx];
  const day = emp ? emp.days[_detailCtx.dayIdx] : null;

  // Tính ngày từ dayIdx nếu day.date không có
  var dateStr = (day && day.date) || (function(){
    var d = new Date(_baseMonday); d.setDate(d.getDate() + _detailCtx.dayIdx);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  // Thiết lập — từ employees DB
  var empData = DB.employees.getById(emp ? emp.id : null);
  var srcSetup = (empData && empData.faceImage) || (emp ? emp.faceImage : null);
  _setFaceBox('det-face-setup', 'det-face-setup-ph', srcSetup);

  // Chấm vào / Chấm ra — từ attendance DB
  var recs = emp ? DB.attendance.getAll({ employeeId: emp.id, date: dateStr }) : [];
  var srcIn  = recs.map(function(r){ return r.faceImageIn;  }).find(Boolean) || null;
  var srcOut = recs.map(function(r){ return r.faceImageOut; }).find(Boolean) || null;
  _setFaceBox('det-face-in',  'det-face-in-ph',  srcIn);
  _setFaceBox('det-face-out', 'det-face-out-ph', srcOut);
}

function _setFaceBox(imgId, phId, src) {
  var img = document.getElementById(imgId);
  var ph  = document.getElementById(phId);
  if (!img || !ph) return;
  if (src) {
    img.src = src; img.style.display = 'block';
    ph.style.display = 'none';
  } else {
    img.src = ''; img.style.display = 'none';
    ph.style.display = 'block';
  }
}

function initPillClick() {
  document.querySelectorAll('.att-pill-click').forEach(pill => {
    pill.addEventListener('click', function(e) {
      e.stopPropagation();
      const td = this.closest('td');
      const tr = this.closest('tr');
      openDetail(this, td, tr);
    });
  });
  document.querySelectorAll('.add-att-circle').forEach(function(svg) {
    svg.addEventListener('click', function(e) {
      e.stopPropagation();
      var empId = this.dataset.empid || this.closest('tr')?.dataset.empid;
      var date  = this.dataset.date;
      if (empId && date) openAddAttModal(empId, date);
    });
  });
}

// ===== MODAL THÊM CHẤM CÔNG =====
var _addAttCtx = { empId: null, date: null };

function openAddAttModal(empId, date) {
  _addAttCtx = { empId, date };
  var emp = employees.find(function(e) { return String(e.id) === String(empId); });
  var parts = date.split('-');
  var dateVn = parts[2] + '/' + parts[1] + '/' + parts[0];

  document.getElementById('addAttTitle').textContent = 'Thêm chấm công' + (emp ? ' – ' + emp.name : '');
  document.getElementById('addAttSubtitle').textContent = dateVn;
  document.getElementById('addAttErr').style.display = 'none';
  _initTimeSelect('addAttCheckIn');
  _initTimeSelect('addAttCheckOut');
  _setTimeSelect('addAttCheckIn',  '08:00');
  _setTimeSelect('addAttCheckOut', '17:00');
  document.getElementById('addAttNote').value = '';
  document.getElementById('addAttStatus').value = 'pending';

  // Populate shift dropdown
  var sel = document.getElementById('addAttShift');
  sel.innerHTML = '<option value="">-- Chọn ca (hoặc nhập thủ công) --</option>';
  (DB.shifts.getAll() || []).filter(function(s) { return s.active !== false; }).forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (' + (s.startTime || '') + ' – ' + (s.endTime || '') + ')';
    opt.dataset.start = s.startTime || '';
    opt.dataset.end   = s.endTime   || '';
    sel.appendChild(opt);
  });

  document.getElementById('addAttOverlay').style.display = 'block';
  document.getElementById('addAttModal').style.display = 'block';
}

function fillShiftTimes() {
  var sel = document.getElementById('addAttShift');
  var opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.start) {
    _setTimeSelect('addAttCheckIn',  opt.dataset.start);
    _setTimeSelect('addAttCheckOut', opt.dataset.end);
  }
}

function closeAddAttModal() {
  document.getElementById('addAttOverlay').style.display = 'none';
  document.getElementById('addAttModal').style.display = 'none';
}

function saveAddAtt() {
  var checkIn  = _getTimeSelect('addAttCheckIn');
  var checkOut = _getTimeSelect('addAttCheckOut');
  var note     = document.getElementById('addAttNote').value.trim();
  var status   = document.getElementById('addAttStatus').value;
  var shiftSel = document.getElementById('addAttShift');
  var shiftId  = shiftSel.value || null;
  var errEl    = document.getElementById('addAttErr');
  errEl.style.display = 'none';

  if (!checkIn)  { errEl.textContent = 'Vui lòng nhập giờ vào'; errEl.style.display='block'; return; }
  if (!checkOut) { errEl.textContent = 'Vui lòng nhập giờ ra';  errEl.style.display='block'; return; }
  if (checkOut <= checkIn) { errEl.textContent = 'Giờ ra phải sau giờ vào'; errEl.style.display='block'; return; }
  if (!note) { errEl.textContent = 'Ghi chú là bắt buộc khi chấm công thủ công'; errEl.style.display='block'; document.getElementById('addAttNote').style.borderColor='#ef4444'; return; }

  var btn = document.getElementById('addAttSaveBtn');
  btn.disabled = true; btn.textContent = 'Đang lưu...';

  var record = {
    id:             'ATT-M-' + Date.now(),
    employeeId:     _addAttCtx.empId,
    date:           _addAttCtx.date,
    shiftId:        shiftId,
    checkIn:        checkIn,
    checkOut:       checkOut,
    note:           note,
    approvalStatus: status,
    status:         'present',
    manual:         true
  };

  var key = 'humi_attendance';
  var list = JSON.parse(localStorage.getItem(key) || '[]');
  list.push(record);
  localStorage.setItem(key, JSON.stringify(list));

  setTimeout(function() {
    btn.disabled = false; btn.textContent = 'Lưu chấm công';
    closeAddAttModal();
    employees = buildEmployees(_baseMonday);
    reRender();
    showToast('Đã thêm chấm công thủ công cho ' + _addAttCtx.date);
  }, 400);
}

// ===== FILTER PANEL =====
function openFilter() {
  renderFilterPanel();
  var overlay = document.getElementById('filterOverlay');
  var panel = document.getElementById('filterPanel');
  if (overlay) {
    overlay.style.display = 'block';
    overlay.classList.add('open');
  }
  if (panel) {
    panel.style.display = 'flex';
    panel.classList.add('open');
  }
}

function openConditionModal() {
  populateConditionShiftOptions();
  var dateFrom = document.getElementById('conditionDateFrom');
  var dateTo = document.getElementById('conditionDateTo');
  if (dateFrom && !dateFrom.value) dateFrom.value = formatDateInput(_baseMonday);
  if (dateTo && !dateTo.value) {
    var end = new Date(_baseMonday);
    end.setDate(end.getDate() + 6);
    dateTo.value = formatDateInput(end);
  }
  renderConditionSummary();
  var overlay = document.getElementById('conditionOverlay');
  var panel = document.getElementById('conditionModal');
  if (overlay) {
    overlay.style.display = 'block';
  }
  if (panel) {
    panel.style.display = 'flex';
  }
}

function closeConditionModal() {
  var overlay = document.getElementById('conditionOverlay');
  var panel = document.getElementById('conditionModal');
  if (overlay) overlay.style.display = 'none';
  if (panel) panel.style.display = 'none';
}

function formatDateInput(dateValue) {
  var d = new Date(dateValue);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function parseDateInput(value) {
  if (!value) return null;
  var d = new Date(value + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function isDateInRange(value, fromValue, toValue) {
  if (!value) return false;
  var current = parseDateInput(value);
  var from = parseDateInput(fromValue);
  var to = parseDateInput(toValue);
  if (!current) return false;
  if (!from && !to) return true;
  if (from && to) return current >= from && current <= to;
  if (from) return current >= from;
  return current <= to;
}

function populateConditionShiftOptions() {
  var select = document.getElementById('conditionShift');
  if (!select) return;
  var current = select.value;
  var shifts = (DB.shifts.getAll() || []).filter(function(s) { return s.active !== false; });
  select.innerHTML = '<option value="">Tất cả ca</option>';
  shifts.forEach(function(shift) {
    var option = document.createElement('option');
    option.value = String(shift.id);
    option.textContent = shift.name + ' (' + (shift.startTime || '—') + ' – ' + (shift.endTime || '—') + ')';
    select.appendChild(option);
  });
  if (current) select.value = current;
}

function getBulkApproveTargets(scope, statusMode, shiftId, dateFrom, dateTo) {
  var scopeEmployees = scope === 'all' ? employees : getVisibleEmployees();
  var acceptedStatuses;
  if (statusMode === 'pending-rejected') {
    acceptedStatuses = ['pending', 'rejected'];
  } else if (statusMode === 'all') {
    acceptedStatuses = ['pending', 'rejected', 'approved'];
  } else {
    acceptedStatuses = ['pending'];
  }

  var targets = [];
  scopeEmployees.forEach(function(emp) {
    (emp.days || []).forEach(function(day) {
      if (!day || day.empty || day.leave) return;
      if (!isDateInRange(day.date, dateFrom, dateTo)) return;
      var records = day.records && day.records.length ? day.records : [{ id: null, shiftId: null, checkIn: day.checkIn, checkOut: day.checkOut, approvalStatus: day.approvalStatus || 'pending' }];
      records.forEach(function(rec) {
        if (!rec) return;
        var approvalStatus = rec.approvalStatus || day.approvalStatus || 'pending';
        if (acceptedStatuses.indexOf(approvalStatus) === -1) return;
        if (shiftId && String(rec.shiftId || '') !== String(shiftId)) return;
        if (!rec.checkIn && !rec.checkOut && !day.checkIn && !day.checkOut) return;
        targets.push({ emp: emp, day: day, rec: rec });
      });
    });
  });
  return targets;
}

function renderConditionSummary() {
  var scope = document.getElementById('conditionScope');
  var status = document.getElementById('conditionStatus');
  var shift = document.getElementById('conditionShift');
  var dateFrom = document.getElementById('conditionDateFrom');
  var dateTo = document.getElementById('conditionDateTo');
  var summary = document.getElementById('conditionSummary');
  if (!summary) return;

  var scopeValue = scope ? scope.value : 'visible';
  var statusValue = status ? status.value : 'pending';
  var shiftValue = shift ? shift.value : '';
  var dateFromValue = dateFrom ? dateFrom.value : '';
  var dateToValue = dateTo ? dateTo.value : '';
  var targets = getBulkApproveTargets(scopeValue, statusValue, shiftValue, dateFromValue, dateToValue);
  var scopeLabel = scopeValue === 'all' ? 'toàn bộ bảng' : 'nhân viên đang hiển thị theo bộ lọc';
  var statusLabel = statusValue === 'pending-rejected' ? 'ca chờ duyệt và bị từ chối' : statusValue === 'all' ? 'mọi ca chưa duyệt' : 'ca đang chờ duyệt';
  var shiftLabel = shiftValue ? (' ca <strong>' + (shift && shift.selectedOptions[0] ? shift.selectedOptions[0].textContent : shiftValue) + '</strong>') : ' tất cả ca';
  var dateLabel = (dateFromValue || dateToValue) ? (' trong khoảng ngày <strong>' + (dateFromValue || '...') + '</strong> - <strong>' + (dateToValue || '...') + '</strong>') : '';
  summary.innerHTML = 'Sẽ duyệt <strong>' + targets.length + ' ca</strong> thuộc <strong>' + scopeLabel + '</strong>, áp dụng cho <strong>' + statusLabel + '</strong>, ' + shiftLabel + dateLabel + '.';
}

function bulkApproveByCondition() {
  var scope = document.getElementById('conditionScope');
  var status = document.getElementById('conditionStatus');
  var shift = document.getElementById('conditionShift');
  var dateFrom = document.getElementById('conditionDateFrom');
  var dateTo = document.getElementById('conditionDateTo');
  var noteInput = document.getElementById('conditionNote');
  var scopeValue = scope ? scope.value : 'visible';
  var statusValue = status ? status.value : 'pending';
  var shiftValue = shift ? shift.value : '';
  var dateFromValue = dateFrom ? dateFrom.value : '';
  var dateToValue = dateTo ? dateTo.value : '';
  var note = noteInput ? noteInput.value.trim() : '';
  var targets = getBulkApproveTargets(scopeValue, statusValue, shiftValue, dateFromValue, dateToValue);

  if (!targets.length) {
    DB.utils.showToast('Không có ca nào phù hợp', 'error');
    return;
  }

  showConfirm(
    'Sẽ duyệt ' + targets.length + ' ca công theo điều kiện đã chọn. Hành động này không thể hoàn tác.',
    function() { _doBulkApprove(targets, note); },
    { title: 'Xác nhận duyệt hàng loạt', okText: 'Duyệt tất cả' }
  );
}

function _doBulkApprove(targets, note) {
  var touchedEmployees = new Set();
  var sentMessages = new Set();

  targets.forEach(function(target) {
    var emp = target.emp;
    var day = target.day;
    var rec = target.rec;
    var attId = rec.id || ('att_' + emp.id + '_' + day.date);
    var ok = false; try { ok = DB.attendance.approve(attId, currentUser.id, note ? { approverNote: note } : null); } catch(e){}
    if (!ok) upsertLocalAttendance(attId, emp.id, day.date, rec.checkIn || day.checkIn, rec.checkOut || day.checkOut, 'approved', note);
    try { updatePillApproval(attId, rec.shiftId || null, 'approved'); } catch(e){}
    if (day.records) {
      day.records.forEach(function(item) {
        if (!item) return;
        var matchId = item.id || ('att_' + emp.id + '_' + day.date);
        if (String(matchId) === String(attId)) item.approvalStatus = 'approved';
      });
    }
    day.approvalStatus = 'approved';
    day.type = undefined;
    touchedEmployees.add(emp.id);

    var messageKey = emp.id + '|' + day.date;
    if (!sentMessages.has(messageKey)) {
      sentMessages.add(messageKey);
      DB.messages.sendSystem(
        emp.id,
        'Ca làm ngày ' + day.date + ' đã được duyệt theo điều kiện',
        '<p>Kính gửi <strong>' + emp.name + '</strong>,</p>'
          + '<p>Ca làm việc của bạn vào ngày <strong>' + day.date + '</strong> đã được <span style="color:#16a34a;font-weight:700;">DUYỆT</span> theo điều kiện lọc hiện tại.</p>'
          + (note ? '<p>Ghi chú từ quản lý: <em>' + note + '</em></p>' : '')
          + '<p style="font-size:12px;color:#7C8FAC;">Xử lý bởi: ' + currentUser.name + '</p>',
        'attendance'
      );
    }
  });

  touchedEmployees.forEach(function(empId) {
    var emp = employees.find(function(item) { return String(item.id) === String(empId); });
    if (emp) recalcWorked(emp);
  });

  closeConditionModal();
  refreshEmployeeData();
  reRender();
  DB.utils.showToast('Đã duyệt ' + targets.length + ' ca theo điều kiện');
}

function closeFilter() {
  var overlay = document.getElementById('filterOverlay');
  var panel = document.getElementById('filterPanel');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  if (panel) {
    panel.classList.remove('open');
    panel.style.display = 'none';
  }
}

function applyFilter() {
  var selectedUnits = [];
  document.querySelectorAll('#unitFilterList input[type="checkbox"]:checked').forEach(function(cb) {
    selectedUnits.push(cb.value);
  });
  filterState.units = selectedUnits;
  updateFilterSummary();
  renderTable();
  closeFilter();
}

function removeChip(btn) {
  var unit = btn.getAttribute('data-unit');
  if (unit) {
    filterState.units = filterState.units.filter(function(item) { return item !== unit; });
    renderFilterPanel();
    updateFilterSummary();
    renderTable();
  }
}

// ===== ROW HOVER =====
function initRowHover() {
  const rows = document.querySelectorAll('.att-row');
  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.querySelectorAll('td').forEach(td => td.style.background = '#fafafa');
    });
    row.addEventListener('mouseleave', () => {
      row.querySelectorAll('td').forEach(td => td.style.background = '');
    });
  });
}

// ===== WEEK NAVIGATOR =====
var WEEK_DAYS = ['CN','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];

// Base week: Mon 09/03/2026
var currentWeekOffset = 0; // offset in weeks from base

function getWeekDates(offset) {
  const base = getBaseMonday();
  base.setDate(base.getDate() + offset * 7);
  const monday = new Date(base);
  const sunday = new Date(base);
  sunday.setDate(sunday.getDate() + 6);
  return { monday, sunday };
}

function fmtDate(d) {
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
}

function updateWeekLabel() {
  const { monday, sunday } = getWeekDates(currentWeekOffset);
  document.getElementById('weekLabel').textContent = fmtDate(monday) + ' – ' + fmtDate(sunday);

  // Update table header dates
  const headers = document.querySelectorAll('.week-date-label');
  headers.forEach((el, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    el.textContent = fmtDate(d);
  });
}

function changeWeek(dir) {
  currentWeekOffset += dir;
  _baseMonday = getBaseMonday();
  _baseMonday.setDate(_baseMonday.getDate() + currentWeekOffset * 7);
  employees = buildEmployees(_baseMonday);
  updateWeekLabel();
  renderTable();
  initRowHover();
  initPillClick();
}


// ===== POPULATE SHIFT DROPDOWN FROM DB =====
function populateShiftDropdown() {
  var sel = document.getElementById('ct-shift');
  if (!sel) return;
  var shifts = (DB.shifts.getAll() || []).filter(function(s){ return s.active !== false; });
  while (sel.options.length > 1) sel.remove(1);
  shifts.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name + ' (' + (s.startTime||'') + ' – ' + (s.endTime||'') + ')';
    sel.appendChild(opt);
  });
}

// ===== RESET FILTER HANDLERS =====
function resetFilter1() {
  // Reset filter bar (top filter)
  var activeTag = document.querySelector('.active-filter-tag');
  filterState.units = [];
  filterState.search = '';
  var searchInput = document.getElementById('empSearch');
  if (searchInput) searchInput.value = '';
  if (activeTag) activeTag.style.display = 'inline-flex';
  // Reload table
  currentWeekOffset = 0;
  _baseMonday = getBaseMonday();
  employees = buildEmployees(_baseMonday);
  renderFilterPanel();
  updateFilterSummary();
  updateWeekLabel();
  renderTable();
  initRowHover();
  initPillClick();
  DB.utils.showToast('Đã đặt lại bộ lọc');
}

function resetFilter2() {
  // Reset filter panel (inside filter panel)
  resetFilter1();
  closeFilter();
}

// Init
populateShiftDropdown();
updateWeekLabel();
renderFilterPanel();
renderTable();
initRowHover();
initPillClick();
updateFilterSummary();

var empSearchInput = document.getElementById('empSearch');
if (empSearchInput) {
  empSearchInput.addEventListener('input', syncSearchFilter);
}

// ==================== EXPORT DATA ====================
function exportData() {
  var visible = getVisibleEmployees();
  if (!visible.length) {
    DB.utils.showToast('Không có dữ liệu để xuất');
    return;
  }

  var DOW = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];

  // Build date headers for the week
  var dateHeaders = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(_baseMonday);
    d.setDate(d.getDate() + i);
    var dd = String(d.getDate()).padStart(2,'0');
    var mm = String(d.getMonth()+1).padStart(2,'0');
    dateHeaders.push(DOW[i] + ' ' + dd + '/' + mm);
  }

  var cols = ['Mã NV','Họ và tên','Đơn vị','Chức vụ'].concat(dateHeaders);
  var rows = [cols];

  var statusLabel = function(day) {
    if (!day || day.empty) return '';
    if (day.leave) return day.label || 'Nghỉ phép';
    if (!day.checkIn) return '';
    var time = day.checkIn + (day.checkOut ? ' - ' + day.checkOut : '');
    var s = day.approvalStatus;
    if (s === 'approved') return time + ' (Đã duyệt)';
    if (s === 'rejected') return time + ' (Từ chối)';
    return time + ' (Chờ duyệt)';
  };

  visible.forEach(function(emp) {
    var row = [emp.code || '', emp.name || '', emp.branch || '', emp.role || ''];
    (emp.days || []).forEach(function(day) { row.push(statusLabel(day)); });
    rows.push(row);
  });

  // BOM for Vietnamese characters in Excel
  var bom = '\uFEFF';
  var csv = bom + rows.map(function(r) {
    return r.map(function(v) {
      var val = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(val) ? '"' + val + '"' : val;
    }).join(',');
  }).join('\r\n');

  var mon = new Date(_baseMonday);
  var sun = new Date(_baseMonday); sun.setDate(sun.getDate() + 6);
  var fmt = function(d) { return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + d.getFullYear(); };
  var filename = 'duyet-cong_' + fmt(mon) + '_' + fmt(sun) + '.csv';

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  DB.utils.showToast('Đã xuất ' + visible.length + ' nhân viên');
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
  var el = document.getElementById('empSearch');
  if (el) { el.value = q; applyFilter(); }
}


