// Auth guard
  const _s = DB.auth.requireAuth(); if(!_s) throw 0;
  const currentUser = _s.user;


// ===== POPULATE BRANCH DROPDOWN FROM DB =====
function populateBranchDropdown(selId) {
  var sel = document.getElementById(selId);
  if (!sel) return;
  var emps = getScopedRaw() || [];
  var units = [...new Set(emps.map(function(e){ return e.unit; }).filter(Boolean))].sort();
  var current = sel.value;
  // Keep first option (placeholder)
  while (sel.options.length > 1) sel.remove(1);
  units.forEach(function(u) {
    var opt = document.createElement('option');
    opt.value = u; opt.textContent = u;
    if (u === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

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


  // ===== LOAD CONFIG FROM LOCALSTORAGE =====
const LS_KEY = 'humiShiftConfig';
let SLOTS = [];

let DAY_ASSIGNMENTS = {}; // { 'DD/MM/YYYY': [shiftId, ...] }

function loadConfig() {
  try {
    // Try DB shifts first
    const dbShifts = DB.shifts.getAll().filter(s => s.active === true || s.status === 'active');
    if (dbShifts.length) {
      SLOTS = dbShifts.map(s => {
        const [sh,sm] = (s.startTime||'08:00').split(':').map(Number);
        const [eh,em] = (s.endTime||'17:00').split(':').map(Number);
        let diff = (eh*60+em)-(sh*60+sm);
        if (diff < 0) diff += 24*60;
        return { id:s.id, name:s.name, time:`${s.startTime||'08:00'}\n${s.endTime||'17:00'}`, hours:Math.round(diff/60*10)/10, quota:s.quota||3 };
      });
    } else {
      const cfg = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (cfg.shifts && cfg.shifts.length) {
        SLOTS = cfg.shifts.filter(s => s.active).map(s => {
          const [sh,sm] = s.start.split(':').map(Number);
          const [eh,em] = s.end.split(':').map(Number);
          let diff = (eh*60+em)-(sh*60+sm);
          if (diff < 0) diff += 24*60;
          return { id:s.id, name:s.name, time:`${s.start}\n${s.end}`, hours:Math.round(diff/60*10)/10, quota:s.quota };
        });
      } else { SLOTS = []; }
    }
    const cfg = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    DAY_ASSIGNMENTS = cfg.dayAssignments || {};
  } catch(e) { SLOTS = []; DAY_ASSIGNMENTS = {}; }
}

function isAssigned(dayDate, slotIdx) {
  if (!DAY_ASSIGNMENTS[dayDate]) return true; // no config → show all
  return DAY_ASSIGNMENTS[dayDate].includes(SLOTS[slotIdx].id);
}

loadConfig();

function getScopedRaw() {
  var all = DB.employees.getAll().filter(function(e){ return e.status === 'active'; });
  if (currentUser.roleId === 'admin') return all;
  return all.filter(function(e) {
    return e.managerId === currentUser.id || e.id === currentUser.id;
  });
}

const ALL_EMPLOYEES = getScopedRaw().map(e=>({
  id: e.id, name: e.name, code: e.code, branch: e.unit,
  role: e.roleId==='manager' ? 'Quản lý' : 'Nhân viên',
  avatar: e.avatar || genAvatar(e.name)
}));

// ===== STATE =====
const checked = {};
let currentDays = [];
let currentEmployees = [];

// ===== HELPERS =====
const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function generateDays(start, end) {
  const days = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);

  while (cur <= endD) {
    const dd = String(cur.getDate()).padStart(2, '0');
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const yyyy = cur.getFullYear();
    days.push({
      date: dd + '/' + mm + '/' + yyyy,
      label: DAY_LABELS[cur.getDay()]
    });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

function parseVNDate(dateStr) {
  const parts = String(dateStr || '').split('/');
  if (parts.length !== 3) return null;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function isPastDate(dateStr) {
  const d = parseVNDate(dateStr);
  if (!d) return false;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function countSlot(dayIdx, slotIdx) {
  return currentEmployees.filter(emp => !!checked[`${emp.id}-${dayIdx}-${slotIdx}`]).length;
}

function updateRatioCell(dayIdx, slotIdx) {
  const cell = document.getElementById(`ratio-${dayIdx}-${slotIdx}`);
  if (!cell) return;
  const n = countSlot(dayIdx, slotIdx);
  const quota = SLOTS[slotIdx].quota;
  cell.textContent = `${n}/${quota}`;
  cell.style.color = n >= quota ? '#16a34a' : n > 0 ? '#dc2626' : '#7C8FAC';
  cell.style.fontWeight = n > 0 ? '700' : '500';
}

function calcEmpHours(empId) {
  let total = 0;
  currentDays.forEach((_, di) => {
    SLOTS.forEach((slot, si) => {
      if (checked[`${empId}-${di}-${si}`]) total += slot.hours;
    });
  });
  return total;
}

function updateBadge(empId) {
  const badge = document.getElementById(`badge-${empId}`);
  if (!badge) return;
  const hours = calcEmpHours(empId);
  const base = 56;
  badge.textContent = `${hours}/${base}`;
  badge.style.background = hours >= base ? '#16a34a' : hours > base * 0.8 ? '#f97316' : '#ef4444';
}

function toggleCheck(empId, dayIdx, slotIdx) {
  const day = currentDays[dayIdx];
  if (day && isPastDate(day.date)) {
    showSaveToast('Không được chỉnh ca trong ngày quá khứ', false);
    return;
  }

  const key = `${empId}-${dayIdx}-${slotIdx}`;
  const isCurrentlyChecked = !!checked[key];
  if (!isCurrentlyChecked) {
    // Kiểm tra quota của ca đó
    const quota = SLOTS[slotIdx].quota;
    const current = countSlot(dayIdx, slotIdx);
    if (current >= quota) return;
    // Rule: không được trùng CÙNG 1 ca (đã xử lý bởi unique key, không cần thêm check)
  }
  checked[key] = !isCurrentlyChecked;
  const box = document.getElementById(`cb-${key}`);
  if (box) {
    box.className = 'cb-box' + (checked[key] ? ' checked' : '');
    box.innerHTML = checked[key]
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
      : '';
  }
  updateRatioCell(dayIdx, slotIdx);
  updateBadge(empId);
}

// dbAssignments: cache dữ liệu shift_assignments từ DB cho lần lưu
var dbAssignments = [];

function applyAssignmentsToChecked(assignments) {
  // Đặt tất cả về false
  currentDays.forEach(function(_, di) {
    currentEmployees.forEach(function(emp) {
      SLOTS.forEach(function(_, si) {
        checked[emp.id + '-' + di + '-' + si] = false;
      });
    });
  });
  // Điền true theo dữ liệu DB
  assignments.forEach(function(a) {
    // date dạng yyyy-mm-dd → dd/mm/yyyy
    var parts = (a.date || '').split('-');
    var dateStr = parts.length === 3 ? (parts[2] + '/' + parts[1] + '/' + parts[0]) : '';
    var di = currentDays.findIndex(function(d) { return d.date === dateStr; });
    if (di === -1) return;
    // shift_id có thể là số hoặc string, so sánh loose
    var si = SLOTS.findIndex(function(s) { return String(s.id) === String(a.shift_id); });
    if (si === -1) return;
    var emp = currentEmployees.find(function(e) { return e.id === a.employee_id; });
    if (!emp) return;
    checked[a.employee_id + '-' + di + '-' + si] = true;
  });
}

// Load từ Supabase DB (async) → sau đó render lại bảng
function loadCheckedFromDB(callback) {
  if (!_sbClient || currentEmployees.length === 0 || currentDays.length === 0) {
    applyAssignmentsToChecked([]);
    dbAssignments = [];
    if (callback) callback();
    return;
  }
  var empIds = currentEmployees.map(function(e) { return e.id; });
  // Tính startDate / endDate từ currentDays
  function dayToISO(dateStr) { // dd/mm/yyyy → yyyy-mm-dd
    var p = dateStr.split('/');
    return p[2] + '-' + p[1] + '-' + p[0];
  }
  var startISO = dayToISO(currentDays[0].date);
  var endISO   = dayToISO(currentDays[currentDays.length - 1].date);

  _sbClient.from('shift_assignments')
    .select('*')
    .in('employee_id', empIds)
    .gte('date', startISO)
    .lte('date', endISO)
    .then(function(r) {
      if (r.error) {
        console.error('❌ Load shift_assignments:', r.error.message);
        dbAssignments = [];
      } else {
        dbAssignments = r.data || [];
      }
      applyAssignmentsToChecked(dbAssignments);
      if (callback) callback();
    });
}

function getFilteredEmployees() {
  var unitSelect = document.querySelector('select.filter-select');
  if (!unitSelect) return ALL_EMPLOYEES.slice();

  var selectedUnit = String(unitSelect.value || '').trim();
  if (!selectedUnit) return ALL_EMPLOYEES.slice();

  return ALL_EMPLOYEES.filter(function(emp) {
    return String(emp.branch || '').trim() === selectedUnit;
  });
}

function renderTable() {
  // ---- THEAD ----
  let hhtml = '<tr>';
  hhtml += `<th class="col-emp" rowspan="4" style="min-width:260px;padding:14px 18px;background:#F2F6FA;font-size:14px;font-weight:600;color:#5A6A85;text-align:left;border:1px solid #e5eaef;">Nhân viên</th>`;
  currentDays.forEach((day, di) => {
    const sep = di > 0 ? 'border-left:5px solid #F0F2F8;' : '';
    hhtml += `<th colspan="${SLOTS.length}" class="th-day" style="border:1px solid var(--primary-dark);${sep}">${day.label}<br><span style="font-weight:500;font-size:12px;opacity:0.85;">${day.date}</span></th>`;
  });
  hhtml += '</tr><tr>';
  currentDays.forEach(() => {
    SLOTS.forEach((slot, si) => {
      const sep = si === 0 ? 'border-left:5px solid #F0F2F8;' : '';
      hhtml += `<th class="th-shift" style="border:1px solid #e0e7ff;${sep}font-size:9.5px;padding:3px 2px;">${slot.name}</th>`;
    });
  });
  hhtml += '</tr><tr>';
  currentDays.forEach(() => {
    SLOTS.forEach((slot, si) => {
      const sep = si === 0 ? 'border-left:5px solid #F0F2F8;' : '';
      const parts = slot.time.split('\n');
      hhtml += `<th class="th-time" style="border:1px solid #e5eaef;${sep}min-width:38px;">${parts[0]}<br>${parts[1]}</th>`;
    });
  });
  hhtml += '</tr><tr>';
  currentDays.forEach((day, di) => {
    SLOTS.forEach((slot, si) => {
      const sep = si === 0 ? 'border-left:5px solid #F0F2F8;' : '';
      const assigned = isAssigned(day.date, si);
      if (!assigned) {
        hhtml += `<th class="th-ratio" style="border:1px solid #e5eaef;${sep}background:#F2F6FA;"></th>`;
      } else {
        const n = countSlot(di, si);
        const color = n >= slot.quota ? '#16a34a' : n > 0 ? '#dc2626' : '#7C8FAC';
        const fw = n > 0 ? '700' : '500';
        hhtml += `<th class="th-ratio" style="border:1px solid #e5eaef;${sep}"><span id="ratio-${di}-${si}" style="color:${color};font-weight:${fw};">${n}/${slot.quota}</span></th>`;
      }
    });
  });
  hhtml += '</tr>';
  document.getElementById('shiftHead').innerHTML = hhtml;

  // ---- TBODY ----
  let bhtml = '';
  if (currentEmployees.length === 0) {
    bhtml = `<tr><td colspan="${1 + currentDays.length * SLOTS.length}" style="text-align:center;padding:32px;color:#7C8FAC;font-size:13px;">Không có nhân viên thuộc đơn vị này</td></tr>`;
  } else {
    currentEmployees.forEach(emp => {
      bhtml += `<tr class="emp-row"><td class="col-emp" style="padding:10px 14px;border:1px solid #e5eaef;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${emp.avatar}" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
          <div style="flex:1;">
            <p style="font-size:14px;font-weight:700;color:#2A3547;margin:0 0 2px;">${emp.name}</p>
            <p style="font-size:12.5px;color:#7C8FAC;margin:0 0 2px;">${emp.code}</p>
            <p style="font-size:12px;color:#7C8FAC;margin:0;">${emp.branch} – ${emp.role}</p>
          </div>
          <span class="prog-badge" id="badge-${emp.id}">${calcEmpHours(emp.id)}/56</span>
        </div>
      </td>`;
      currentDays.forEach((day, di) => {
        SLOTS.forEach((_, si) => {
          const key = `${emp.id}-${di}-${si}`;
          const isChecked = !!checked[key];
          const sep = si === 0 ? 'border-left:5px solid #F0F2F8;' : '';
          const assigned = isAssigned(day.date, si);
          const lockedPast = isPastDate(day.date);
          if (!assigned) {
            bhtml += `<td class="td-check" style="border:1px solid #e5eaef;${sep}background:#F2F6FA;"></td>`;
          } else {
            bhtml += `<td class="td-check" style="border:1px solid #e5eaef;${sep}${lockedPast ? 'background:#F8FAFC;' : ''}">
              <div class="cb-wrap${lockedPast ? ' disabled' : ''}" ${lockedPast ? '' : `onclick="toggleCheck('${emp.id}',${di},${si})"`}>
                <div id="cb-${key}" class="cb-box${isChecked?' checked':''}">
                  ${isChecked ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
                </div>
              </div>
            </td>`;
          }
        });
      });
      bhtml += '</tr>';
    });
  }
  document.getElementById('shiftBody').innerHTML = bhtml;
  // Cập nhật màu badge sau khi render
  currentEmployees.forEach(emp => updateBadge(emp.id));
}

function buildTable() {
  loadConfig();
  currentEmployees = getFilteredEmployees();
  // Show loading skeleton
  document.getElementById('shiftBody').innerHTML =
    `<tr><td colspan="999" style="text-align:center;padding:32px;color:#7C8FAC;font-size:13px;">Đang tải dữ liệu...</td></tr>`;
  // Load từ DB rồi render
  loadCheckedFromDB(function() { renderTable(); });
}

// ===== INIT =====
function getBaseMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon;
}
const _baseMon = getBaseMonday();
const _baseSun = new Date(_baseMon);
_baseSun.setDate(_baseSun.getDate() + 6);

currentDays = generateDays(_baseMon, _baseSun);
buildTable();

// Date range picker
flatpickr('#dateRange', {
  mode: 'range',
  dateFormat: 'd/m/Y',
  defaultDate: [_baseMon, _baseSun],
  locale: 'vn',
  allowInput: false,
  disableMobile: true,
  onChange: function(selectedDates) {
    if (selectedDates.length === 2) {
      currentDays = generateDays(selectedDates[0], selectedDates[1]);
      buildTable();
    }
  }
});

// Unit filter
document.querySelector('select.filter-select').addEventListener('change', function() {
  buildTable();
});

// ===== LƯU LỊCH CA =====
function saveShiftAssignments() {
  if (!_sbClient) { showSaveToast('Không có kết nối Supabase!', false); return; }
  // ===== VALIDATION: Check quota and duplicate shifts =====
  var errors = [];
  
  // Check 1: Quota limit per shift per day
  currentDays.forEach(function(day, di) {
    SLOTS.forEach(function(slot, si) {
      var dayShiftCount = 0;
      currentEmployees.forEach(function(emp) {
        if (checked[emp.id + '-' + di + '-' + si]) {
          dayShiftCount++;
        }
      });
      if (dayShiftCount > slot.quota) {
        errors.push('Ca ' + slot.name + ' ngày ' + day.date + ': vượt quota (' + dayShiftCount + '/' + slot.quota + ')');
      }
    });
  });
  
  // Show errors if any
  if (errors.length > 0) {
    showSaveToast(errors[0], false);
    return;
  }
  
  var btn = document.getElementById('btnSaveShifts');
  var btnHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu lịch ca';
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = 'Đang lưu...'; }

  function done(ok, msg) {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = btnHTML; }
    showSaveToast(msg, ok);
    if (ok) {
      // Reload lại DB cache sau khi lưu
      loadCheckedFromDB(function() { renderTable(); });
    }
  }

  // --- Xác định selectedShifts (đang tick) và existingShifts (từ DB cache) ---
  var selectedShifts = []; // { employee_id, shift_id, date }
  currentEmployees.forEach(function(emp) {
    currentDays.forEach(function(day, di) {
      var parts = day.date.split('/');
      var dateISO = parts[2] + '-' + parts[1] + '-' + parts[0];
      SLOTS.forEach(function(slot, si) {
        if (checked[emp.id + '-' + di + '-' + si]) {
          selectedShifts.push({ employee_id: emp.id, shift_id: slot.id, date: dateISO });
        }
      });
    });
  });

  // dbAssignments = dữ liệu load được từ DB (set khi loadCheckedFromDB)
  var existingShifts = dbAssignments; // [{ id, employee_id, shift_id, date }]

  // Helper: tìm record trong DB khớp employee_id + shift_id + date
  function findInDB(empId, shiftId, date) {
    return existingShifts.find(function(a) {
      return a.employee_id === empId && String(a.shift_id) === String(shiftId) && a.date === date;
    });
  }
  function keyOf(empId, shiftId, date) { return empId + '|' + shiftId + '|' + date; }

  var selectedKeys = new Set(selectedShifts.map(function(s) { return keyOf(s.employee_id, s.shift_id, s.date); }));

  // 1. DELETE: existing trong DB nhưng KHÔNG còn trong selectedShifts
  var toDeleteIds = existingShifts
    .filter(function(a) { return !selectedKeys.has(keyOf(a.employee_id, a.shift_id, a.date)); })
    .map(function(a) { return a.id; });

  // 2. INSERT: selected nhưng CHƯA tồn tại trong DB
  var toInsert = selectedShifts.filter(function(s) {
    return !findInDB(s.employee_id, s.shift_id, s.date);
  });

  // 3. UPDATE: selected VÀ đã tồn tại trong DB → không cần làm gì (data không đổi)
  // (nếu muốn update thêm field khác thì bổ sung ở đây)

  var promises = [];

  if (toDeleteIds.length > 0) {
    for (var j = 0; j < toDeleteIds.length; j += 100) {
      promises.push(_sbClient.from('shift_assignments').delete().in('id', toDeleteIds.slice(j, j + 100)));
    }
  }
  if (toInsert.length > 0) {
    var rows = toInsert.map(function(s) {
      return { employee_id: s.employee_id, shift_id: s.shift_id, date: s.date };
    });
    for (var i = 0; i < rows.length; i += 100) {
      promises.push(_sbClient.from('shift_assignments').insert(rows.slice(i, i + 100)));
    }
  }

  if (promises.length === 0) {
    done(true, 'Đã lưu lịch đi ca thành công!');
    return;
  }

  Promise.all(promises).then(function(results) {
    var errs = results.filter(function(r) { return r && r.error; });
    if (errs.length > 0) {
      console.error('Supabase save errors:', errs.map(function(r) { return r.error; }));
      done(false, 'Lỗi lưu: ' + errs[0].error.message);
    } else {
      done(true, 'Đã lưu lịch đi ca thành công!');
    }
  }).catch(function(err) {
    console.error('Save error:', err);
    done(false, 'Lỗi không xác định khi lưu.');
  });
}

function showSaveToast(msg, success) {
  var t = document.getElementById('shiftSaveToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'shiftSaveToast';
    t.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;color:white;box-shadow:0 4px 20px rgba(0,0,0,.18);transition:opacity .3s;opacity:0;pointer-events:none;font-family:inherit;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = success !== false ? '#16a34a' : '#dc2626';
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(function(){ t.style.opacity = '0'; }, 3000);
}

populateBranchDropdown('branchSelect');

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

// ==================== EXPORT CSV ====================
function exportCSV() {
  if (currentDays.length === 0 || currentEmployees.length === 0) {
    showSaveToast('Không có dữ liệu để xuất', false); return;
  }
  var BOM = '\uFEFF';
  var headers = ['Mã NV', 'Tên nhân viên', 'Đơn vị', 'Vai trò'];
  currentDays.forEach(function(day) {
    SLOTS.forEach(function(slot) {
      headers.push(day.date + ' – ' + slot.name);
    });
  });
  headers.push('Tổng giờ');
  var rows = [headers];
  currentEmployees.forEach(function(emp) {
    var row = [emp.code || '', emp.name || '', emp.branch || '', emp.role || ''];
    currentDays.forEach(function(_, di) {
      SLOTS.forEach(function(_, si) {
        row.push(checked[emp.id + '-' + di + '-' + si] ? '✓' : '');
      });
    });
    row.push(calcEmpHours(emp.id));
    rows.push(row);
  });
  var csv = BOM + rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\r\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'lich-ca-' + (currentDays[0] ? currentDays[0].date.replace(/\//g,'-') : 'export') + '.csv';
  a.click();
}

// ==================== TOPBAR SEARCH ====================
function topbarSearchHandle(q) {
  var el = document.getElementById('searchInput');
  if (el) { el.value = q; if(typeof filterShifts === 'function') filterShifts(); }
}
