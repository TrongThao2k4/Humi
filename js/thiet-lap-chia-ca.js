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


const DAY_LABELS = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
const LS_KEY = 'humiShiftConfig';

// ===== DATA =====
function _normalizeShifts(raw) {
  return raw.map(s => ({
    ...s,
    active: s.active !== undefined ? s.active : s.status === 'active',
    start: s.start || s.startTime || '08:00',
    end:   s.end   || s.endTime   || '22:00',
  }));
}
let shifts = _normalizeShifts(DB.shifts.getAll());
let editingId = null;
let deletingId = null;

// Update sidebar user info
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = currentUser.name);
  document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = currentUser.position || currentUser.roleId);
});

// ===== HELPERS =====
function calcHours(start, end) {
  const [sh,sm] = start.split(':').map(Number);
  const [eh,em] = end.split(':').map(Number);
  let diff = (eh*60+em)-(sh*60+sm);
  if (diff < 0) diff += 24*60;
  return Math.round(diff/60*10)/10;
}

function saveConfig(dayAssignments) {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e) {}
  if (dayAssignments) { cfg.dayAssignments = { ...(cfg.dayAssignments || {}), ...dayAssignments }; localStorage.setItem(LS_KEY, JSON.stringify(cfg)); }
  shifts = _normalizeShifts(DB.shifts.getAll()); 
}

function showToast(msg, type) { DB.utils.showToast(msg, type||'success'); }

// ===== TABS =====
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

// ===== TAB 1: SHIFT LIST =====
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  if (!data) data = shifts;
  tbody.innerHTML = data.map((s, i) => `
    <tr>
      <td style="text-align:center;color:#7C8FAC;font-size:12px;font-weight:600;">${String(i+1).padStart(2,'0')}</td>
      <td><span style="font-size:11px;font-weight:700;color:var(--primary);background:#ECF2FF;padding:2px 8px;border-radius:6px;">${s.code}</span></td>
      <td><span style="font-weight:600;color:#2A3547;">${s.name}</span></td>
      <td style="text-align:center;"><span style="background:#f0fdf4;color:#16a34a;font-weight:700;font-size:12px;padding:3px 10px;border-radius:6px;">${s.start}</span></td>
      <td style="text-align:center;"><span style="background:#fef3c7;color:#d97706;font-weight:700;font-size:12px;padding:3px 10px;border-radius:6px;">${s.end}</span></td>
      <td style="text-align:center;font-weight:700;color:#2A3547;">${calcHours(s.start,s.end)}h</td>
      <td style="text-align:center;"><span class="${s.active?'badge-active':'badge-inactive'}"><span style="width:5px;height:5px;border-radius:50%;background:${s.active?'#16a34a':'#7C8FAC'};display:inline-block;"></span>${s.active?'Hoạt động':'Tạm ngưng'}</span></td>
      <td style="text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
          <button class="btn-action edit" title="Chỉnh sửa" onclick="openEditModal('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action" title="${s.active?'Tạm ngưng':'Kích hoạt'}" onclick="toggleStatus('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s.active?'#f59e0b':'#16a34a'}" stroke-width="2">${s.active?'<path d="M10 9v6m4-6v6"/><circle cx="12" cy="12" r="10"/>':'<circle cx="12" cy="12" r="10"/><polyline points="10 8 16 12 10 16 10 8"/>'}</svg>
          </button>
          <button class="btn-action delete" title="Xóa" onclick="openDeleteModal('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
  updateSummary();
}

function updateSummary() {
  document.getElementById('totalCount').textContent = shifts.length;
  document.getElementById('activeCount').textContent = shifts.filter(s=>s.active).length;
  document.getElementById('inactiveCount').textContent = shifts.filter(s=>!s.active).length;
  document.getElementById('totalQuota').textContent = shifts.filter(s=>s.active).reduce((sum,s)=>sum+s.quota,0);
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderTable(shifts.filter(s => s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q)));
}

// Modal thêm/sửa
function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Thêm ca mới';
  ['fName','fCode'].forEach(id => document.getElementById(id).value='');
  document.getElementById('fStart').value='08:00';
  document.getElementById('fEnd').value='22:00';
  document.getElementById('fQuota').value='';
  document.getElementById('fStatus').value='active';
  document.getElementById('modalOverlay').classList.add('open');
}
function openEditModal(id) {
  const s = shifts.find(x=>x.id===id); editingId=id;
  document.getElementById('modalTitle').textContent='Chỉnh sửa ca';
  document.getElementById('fName').value=s.name;
  document.getElementById('fCode').value=s.code;
  document.getElementById('fStart').value=s.start;
  document.getElementById('fEnd').value=s.end;
  document.getElementById('fQuota').value=s.quota;
  document.getElementById('fStatus').value=s.active?'active':'inactive';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeOnBackdrop(e) { if(e.target===document.getElementById('modalOverlay')) closeModal(); }

function saveShift() {
  const name=document.getElementById('fName').value.trim();
  const code=document.getElementById('fCode').value.trim();
  const start=document.getElementById('fStart').value;
  const end=document.getElementById('fEnd').value;
  const quota=parseInt(document.getElementById('fQuota').value);
  const active=document.getElementById('fStatus').value==='active';
  if(!name||!code||!start||!end||isNaN(quota)||quota<1){DB.utils.showToast('Vui lòng điền đầy đủ thông tin.','error');return;}
  if(editingId!==null) {
    DB.shifts.update(editingId,{name,code,startTime:start,endTime:end,quota,active:active});
    showToast('Đã cập nhật ca thành công!');
  } else {
    DB.shifts.create({name,code,startTime:start,endTime:end,quota,active:active,breakMinutes:60,workHours:calcHours(start,end),color:'var(--primary)',applyDays:[1,2,3,4,5,6]});
    showToast('Đã thêm ca mới thành công!');
  }
  shifts=_normalizeShifts(DB.shifts.getAll()); closeModal();
}

// ===== POPULATE BRANCH DROPDOWN FROM DB =====
function populateBranchDropdown(selId) {
  var sel = document.getElementById(selId);
  if (!sel) return;
  var emps = DB.employees.getAll() || [];
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

// ===== INIT BRANCH DROPDOWNS =====
populateBranchDropdown('branchSelect');
populateBranchDropdown('branchSelect2');

renderTable();

function toggleStatus(id) {
  const sh=DB.shifts.getById(id);
  if(sh) DB.shifts.update(id,{active:!sh.active});
  shifts=_normalizeShifts(DB.shifts.getAll()); renderTable();
}

function openDeleteModal(id) {
  deletingId=id;
  document.getElementById('deleteShiftName').textContent=shifts.find(x=>x.id===id).name;
  document.getElementById('deleteOverlay').classList.add('open');
}
function closeDeleteModal() { document.getElementById('deleteOverlay').classList.remove('open'); }
function closeDeleteOnBackdrop(e) { if(e.target===document.getElementById('deleteOverlay')) closeDeleteModal(); }
function confirmDelete() {
  // Call DB.shifts.delete() first to sync with Supabase
  DB.shifts.delete(deletingId);
  // Then update local array
  shifts = shifts.filter(x => x.id !== deletingId);
  saveConfig(); 
  closeDeleteModal(); 
  renderTable();
  showToast('Đã xóa ca thành công!');
}

// ===== TAB 2: GẮN CA VÀO NGÀY =====
let assignDays = [];
let assignState = {}; // key: 'date-shiftId' => boolean

function generateDays(start, end) {
  const days=[]; const cur=new Date(start); cur.setHours(0,0,0,0);
  const endD=new Date(end); endD.setHours(0,0,0,0);
  while(cur<=endD) {
    const d=String(cur.getDate()).padStart(2,'0');
    const m=String(cur.getMonth()+1).padStart(2,'0');
    const y=cur.getFullYear();
    days.push({label:DAY_LABELS[cur.getDay()], date:`${d}/${m}/${y}`});
    cur.setDate(cur.getDate()+1);
  }
  return days;
}

function generateAssignGrid() {
  const fp = document.getElementById('assignDateRange')._flatpickr;
  if (!fp || fp.selectedDates.length < 2) { DB.utils.showToast('Vui lòng chọn khoảng thời gian.', 'error'); return; }
  assignDays = generateDays(fp.selectedDates[0], fp.selectedDates[1]);
  const activeShifts = shifts.filter(s => s.active);
  if (!activeShifts.length) { DB.utils.showToast('Chưa có ca nào đang hoạt động.', 'error'); return; }

  // Load existing config
  let existingAssign = {};
  try { existingAssign = JSON.parse(localStorage.getItem(LS_KEY) || '{}').dayAssignments || {}; } catch(e){}

  // Init state
  assignDays.forEach(day => {
    activeShifts.forEach(s => {
      const key = `${day.date}-${s.id}`;
      if (existingAssign[day.date]) assignState[key] = existingAssign[day.date].includes(s.id);
      else assignState[key] = true;
    });
  });

  renderCards();
  document.getElementById('btnConfirmAssign').style.display = 'flex';
}

function renderCards() {
  const activeShifts = shifts.filter(s => s.active);
  let html = `<div class="day-cards">`;
  assignDays.forEach(day => {
    const assigned = activeShifts.filter(s => assignState[`${day.date}-${s.id}`]);
    html += `
    <div class="day-card" id="card-${day.date.replace(/\//g,'-')}">
      <div class="day-card-header">
        <div><div class="day-label">${day.label}</div><div class="day-date">${day.date}</div></div>
        <button class="btn-more"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
      </div>
      <div class="shift-list" id="slist-${day.date.replace(/\//g,'-')}">`;
    assigned.forEach(s => {
      html += `
        <div class="shift-row">
          <div class="shift-info">
            <div class="shift-name">${s.name}</div>
            <div class="shift-time">${s.start} – ${s.end}</div>
            <div class="shift-quota">Tối thiểu: <span style="color:#f59e0b;">${s.minQuota||1}</span> &nbsp;|&nbsp; Tối đa: <span style="color:var(--primary);">${s.quota}</span></div>
          </div>
          <button class="btn-remove" title="Xóa ca này" onclick="removeShiftFromDay('${day.date}',${s.id})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>`;
    });
    if (!assigned.length) {
      html += `<div style="text-align:center;padding:16px 8px;color:#DFE5EF;font-size:11px;">Chưa có ca nào</div>`;
    }
    html += `</div>
      <div style="position:relative;">
        <button class="card-add-btn" onclick="openAddPopup('${day.date}', this)">+</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  document.getElementById('assignGrid').innerHTML = html;
}

function removeShiftFromDay(date, shiftId) {
  assignState[`${date}-${shiftId}`] = false;
  renderCards();
}

let activePopupDate = null;
function openAddPopup(date, btn) {
  // Close existing popup
  document.querySelectorAll('.add-popup').forEach(p => p.remove());
  if (activePopupDate === date) { activePopupDate = null; return; }
  activePopupDate = date;

  const activeShifts = shifts.filter(s => s.active);
  const unassigned = activeShifts.filter(s => !assignState[`${date}-${s.id}`]);
  if (!unassigned.length) { showToast('Tất cả ca đã được gắn cho ngày này.'); activePopupDate = null; return; }

  const overlay = document.createElement('div');
  overlay.className = 'add-popup-overlay';
  overlay.id = 'addPopupOverlay';
  overlay.onclick = e => { if (e.target === overlay) closeAddPopup(); };

  const popup = document.createElement('div');
  popup.className = 'add-popup';
  popup.innerHTML = `
    <div class="add-popup-header">
      <h3>Chọn ca và thiết lập nhân sự</h3>
      <button onclick="closeAddPopup()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="add-popup-body">
    ${unassigned.map(s => `
      <div class="add-popup-item">
        <input type="checkbox" id="pop-chk-${date}-${s.id}" checked onclick="togglePopupInputs('${date}',${s.id})">
        <div style="flex:1;min-width:0;">
          <div class="pop-name">${s.name}</div>
          <div class="pop-time">${s.start} – ${s.end}</div>
          <div class="pop-quota-row" id="pop-quota-${date}-${s.id}">
            <span class="pop-quota-label">Tối thiểu:</span>
            <input class="pop-quota-input" type="number" min="0" id="pop-min-${date}-${s.id}" placeholder="–">
            <span class="pop-quota-label" style="margin-left:4px;">Tối đa:</span>
            <input class="pop-quota-input" type="number" min="1" id="pop-max-${date}-${s.id}" placeholder="–">
          </div>
        </div>
      </div>`).join('')}
    </div>
    <div class="add-popup-footer">
      <button class="pop-btn-cancel" onclick="closeAddPopup()">Hủy</button>
      <button class="pop-btn-add" onclick="confirmAddPopup('${date}',[${unassigned.map(s=>s.id).join(',')}])">Thêm ca</button>
    </div>`;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function closeAddPopup() {
  const overlay = document.getElementById('addPopupOverlay');
  if (overlay) overlay.remove();
  activePopupDate = null;
}

function togglePopupInputs(date, id) {
  const chk = document.getElementById(`pop-chk-${date}-${id}`);
  const row = document.getElementById(`pop-quota-${date}-${id}`);
  if (row) row.style.opacity = chk.checked ? '1' : '0.35';
}

function confirmAddPopup(date, ids) {
  ids.forEach(id => {
    const chk = document.getElementById(`pop-chk-${date}-${id}`);
    if (!chk?.checked) return;
    assignState[`${date}-${id}`] = true;
    // Lưu min/max nếu người dùng nhập
    const minVal = parseInt(document.getElementById(`pop-min-${date}-${id}`)?.value);
    const maxVal = parseInt(document.getElementById(`pop-max-${date}-${id}`)?.value);
    const s = shifts.find(x => x.id === id);
    if (s) {
      if (!isNaN(minVal) && minVal >= 0) s.minQuota = minVal;
      if (!isNaN(maxVal) && maxVal >= 1) s.quota = maxVal;
    }
  });
  closeAddPopup();
  renderCards();
}

function confirmAssign() {
  const activeShifts = shifts.filter(s => s.active);
  const dayAssignments = {};
  assignDays.forEach(day => {
    dayAssignments[day.date] = activeShifts.filter(s => assignState[`${day.date}-${s.id}`]).map(s => s.id);
  });
  saveConfig(dayAssignments);
  showToast('Đã xác nhận gắn ca thành công! Vào trang Chia ca để xem kết quả.');
}

// ===== INIT =====
flatpickr('#assignDateRange', {
  mode:'range', dateFormat:'d/m/Y', locale:'vn',
  allowInput:false, disableMobile:true,
});

renderTable();

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
