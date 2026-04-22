// Auth guard
const _s = DB.auth.requireAuth(); if(!_s) throw 0;
const currentUser = _s.user;
if (currentUser.roleId === 'employee') { window.location.href = '../index.html'; throw 0; }

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


// Map DB employee → UI format
function empToUi(e) {
  return {
    id: e.id,
    name: e.name,
    code: e.code,
    email: e.email || '',
    avatar: e.avatar || genAvatar(e.name),
    unit: e.unit || '',
    position: e.position || '—',
    manager: e.managerName || '—',
    startDate: DB.utils.formatDate(e.startDate),
    contractStatus: e.contractStatus || '—',
    contractType: e.contractType || '—',
    workMode: e.workMode || '—',
    phone: e.phone || '—',
    dob: DB.utils.formatDate(e.dob),
    status: e.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ việc',
    rawStatus: e.status || 'active'
  };
}

// Validate email format
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
// Validate phone (10-11 digits, allow spaces/dashes)
function isValidPhone(v) { return /^[0-9\s\-]{9,12}$/.test(v.replace(/\s/g,'')); }

// Trả về danh sách nhân viên theo phạm vi quyền hạn:
// admin → tất cả | manager → chỉ nhân viên do mình quản lý
function getScopedEmployees() {
  var all = DB.employees.getAll();
  if (currentUser.roleId === 'admin') return all;
  return all.filter(function(e) {
    return e.managerId === currentUser.id || e.id === currentUser.id;
  });
}

function loadEmployees() {
  return getScopedEmployees().map(empToUi);
}

let EMPLOYEES = loadEmployees();

// Populate unit filter dynamically from DB
(function() {
  const units = [...new Set(EMPLOYEES.map(e => e.unit).filter(Boolean))].sort();
  const sel = document.getElementById('filterUnit');
  units.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    sel.appendChild(opt);
  });
})();

let filteredData = [];
const PAGE_SIZE = 10;
let currentPage = 1;
let selectedIds = new Set();

function contractBadge(s) {
  if (s === 'Đã có hợp đồng') return `<span class="badge-contract badge-green"><span style="width:5px;height:5px;border-radius:50%;background:#16a34a;display:inline-block;"></span>${s}</span>`;
  return `<span class="badge-contract badge-orange">${s}</span>`;
}
function workModeBadge(m) {
  if (m === 'Toàn thời gian') return `<span class="badge-contract badge-blue">${m}</span>`;
  return `<span class="badge-contract badge-gray">${m}</span>`;
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const unit = document.getElementById('filterUnit').value;
  const statusVal = document.getElementById('filterStatus').value; // "active" | "resigned" | "" (Tất cả)
  filteredData = EMPLOYEES.filter(e =>
    (!statusVal || e.rawStatus === statusVal) &&
    (!unit || e.unit === unit) &&
    (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.phone.includes(q))
  );
  currentPage = 1;
  renderTable();
  updateActiveFilterRow();
}

function renderTable() {
  const empCountEl = document.getElementById('empCount');
  if (empCountEl) empCountEl.textContent = filteredData.length;
  const start = (currentPage-1)*PAGE_SIZE;
  const pageData = filteredData.slice(start, start+PAGE_SIZE);
  const tbody = document.getElementById('tableBody');
  if (!pageData.length) {
    const msg = EMPLOYEES.length === 0 ? 'Chưa có nhân viên' : 'Không tìm thấy nhân viên phù hợp';
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:48px;color:#7C8FAC;font-size:13px;">${msg}</td></tr>`;
  } else {
    tbody.innerHTML = pageData.map(e => `
      <tr>
        <td><input type="checkbox" style="width:15px;height:15px;accent-color:var(--primary);cursor:pointer;" class="row-cb" value="${e.id}" onchange="onRowCheck()" ${selectedIds.has(e.id)?'checked':''}></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${e.avatar}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;">
            <div>
              <a class="emp-link" onclick="openDetail('${e.id}')">${e.name}</a>
              <p style="font-size:11px;color:#7C8FAC;margin:2px 0 0;">${e.code}</p>
            </div>
          </div>
        </td>
        <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;">${e.unit}</td>
        <td>${e.position}</td>
        <td>${e.manager}</td>
        <td>${e.startDate}</td>
        <td>${contractBadge(e.contractStatus)}</td>
        <td><span style="font-size:12px;color:#2A3547;">${e.contractType}</span></td>
        <td>${workModeBadge(e.workMode)}</td>
        <td>${e.phone}</td>
        <td>${e.dob}</td>
        <td>
          <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
            <button class="btn-icon" title="Xem chi tiết" onclick="openDetail('${e.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" title="Chỉnh sửa" onclick="openEdit('${e.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A3547" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredData.length/PAGE_SIZE)||1;
  document.getElementById('pageInfo').textContent = `Trang ${currentPage} / ${total}`;
  let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>‹</button>`;
  for(let i=1;i<=total;i++) html+=`<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  html+=`<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===total?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>›</button>`;
  document.getElementById('pagination').innerHTML = html;
}

function goPage(p) {
  const total = Math.ceil(filteredData.length/PAGE_SIZE)||1;
  if(p<1||p>total) return;
  currentPage=p; renderTable();
}

function onRowCheck() {
  selectedIds = new Set();
  document.querySelectorAll('.row-cb:checked').forEach(cb => selectedIds.add(Number(cb.value)));
}
function toggleAll(cb) {
  const pageData = filteredData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
  if(cb.checked) pageData.forEach(e=>selectedIds.add(e.id));
  else pageData.forEach(e=>selectedIds.delete(e.id));
  renderTable();
  document.getElementById('checkAll').checked = cb.checked;
}

// Status filter
function removeStatusFilter() {
  document.getElementById('filterStatus').value = '';
  applyFilters();
}
function updateActiveFilterRow() {
  const row = document.getElementById('activeFilterRow');
  if (!row) return;
  const statusVal = document.getElementById('filterStatus').value;
  if (!statusVal) { row.style.display = 'none'; return; }
  row.style.display = 'flex';
  const labels = { active: 'Đang làm việc', resigned: 'Đã nghỉ việc' };
  const el = document.getElementById('activeStatusLabel');
  if (el) el.textContent = labels[statusVal] || statusVal;
}
document.addEventListener('click', e => {
  if (e.target === document.getElementById('detailModal')) closeModal();
});

// Detail modal
function openDetail(id) {
  const e = EMPLOYEES.find(x=>x.id===id);
  document.getElementById('modalTitle').textContent = 'Thông tin nhân viên';
  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding-bottom:20px;border-bottom:1px solid #EAEFF4;margin-bottom:20px;">
      <img src="${e.avatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #ECF2FF;">
      <div>
        <p style="font-size:17px;font-weight:800;color:#2A3547;margin:0 0 4px;">${e.name}</p>
        <p style="font-size:12px;color:#7C8FAC;margin:0 0 6px;">${e.code}</p>
        ${contractBadge(e.contractStatus)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div><p class="form-label" style="color:#7C8FAC;">Đơn vị</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.unit}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Vị trí công việc</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.position}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Quản lý trực tiếp</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.manager}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Ngày bắt đầu làm việc</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.startDate}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Loại HĐLĐ</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.contractType}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Hình thức làm việc</p><p style="font-size:13px;margin:0;">${workModeBadge(e.workMode)}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Số điện thoại</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.phone}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Ngày sinh</p><p style="font-size:13px;font-weight:600;color:#2A3547;margin:0;">${e.dob}</p></div>
      <div><p class="form-label" style="color:#7C8FAC;">Trạng thái</p><p style="font-size:13px;margin:0;"><span class="badge-contract ${e.status==='Đang làm việc'?'badge-green':'badge-gray'}"><span style="width:5px;height:5px;border-radius:50%;background:${e.status==='Đang làm việc'?'#16a34a':'#7C8FAC'};display:inline-block;"></span>${e.status}</span></p></div>
    </div>`;
  document.getElementById('modalActions').innerHTML = `
    <button onclick="closeModal()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#EAEFF4;border:none;color:#2A3547;">Đóng</button>
    <button onclick="openEdit('${id}')" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border:none;color:white;box-shadow:none;">Chỉnh sửa</button>`;
  document.getElementById('detailModal').style.display='flex';
}

function openEdit(id) {
  const e = EMPLOYEES.find(x => x.id === id);
  const selStyle = `cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222.5%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 10px center;`;

  document.getElementById('modalTitle').textContent = 'Chỉnh sửa nhân viên';
  document.getElementById('modalContent').innerHTML = `
    <div id="editFormErr" style="display:none;margin-bottom:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:10px 14px;font-size:12.5px;color:#dc2626;font-weight:600;"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div style="grid-column:1/-1;"><label class="form-label">Họ và tên <span style="color:#ef4444;">*</span></label><input class="form-input" id="eName" value="${e.name}"></div>
      <div><label class="form-label">Mã nhân viên</label><input class="form-input" value="${e.code}" disabled style="background:#F2F6FA;color:#7C8FAC;"></div>
      <div><label class="form-label">Email <span style="color:#ef4444;">*</span></label><input class="form-input" id="eEmail" type="email" value="${e.email}"></div>
      <div><label class="form-label">Số điện thoại <span style="color:#ef4444;">*</span></label><input class="form-input" id="ePhone" value="${e.phone === '—' ? '' : e.phone}"></div>
      <div><label class="form-label">Trạng thái</label>
        <select class="form-input" id="eSt" style="${selStyle}">
          <option value="active"   ${e.rawStatus==='active'  ?'selected':''}>Đang làm việc</option>
          <option value="inactive" ${e.rawStatus==='inactive'?'selected':''}>Đã nghỉ việc</option>
        </select>
      </div>
      <div><label class="form-label">Vị trí công việc</label><input class="form-input" id="ePos" value="${e.position === '—' ? '' : e.position}"></div>
      <div><label class="form-label">Quản lý trực tiếp</label><input class="form-input" id="eMgr" value="${e.manager === '—' ? '' : e.manager}"></div>
      <div><label class="form-label">Hình thức làm việc</label>
        <select class="form-input" id="eMode" style="${selStyle}">
          <option ${e.workMode==='Toàn thời gian'?'selected':''}>Toàn thời gian</option>
          <option ${e.workMode==='Bán thời gian'  ?'selected':''}>Bán thời gian</option>
        </select>
      </div>
      <div><label class="form-label">Ngày sinh</label><input class="form-input" id="eDob" type="date" value="${e.dob && e.dob!=='—' ? e.dob.split('/').reverse().join('-') : ''}"></div>
    </div>`;
  document.getElementById('modalActions').innerHTML = `
    <button onclick="closeModal()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#EAEFF4;border:none;color:#2A3547;">Hủy</button>
    <button onclick="saveEdit('${id}')" id="saveEditBtn" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border:none;color:white;">Lưu thay đổi</button>`;
  document.getElementById('detailModal').style.display = 'flex';
}

function saveEdit(id) {
  const name   = document.getElementById('eName').value.trim();
  const email  = document.getElementById('eEmail').value.trim();
  const phone  = document.getElementById('ePhone').value.trim();

  // Validate
  if (!name)  { const el=document.getElementById('editFormErr'); el.textContent='Vui lòng nhập họ và tên'; el.style.display='block'; return; }
  if (!email || !isValidEmail(email)) { const el=document.getElementById('editFormErr'); el.textContent='Email không đúng định dạng'; el.style.display='block'; return; }
  if (!phone || phone.replace(/\D/g,'').length < 9) { const el=document.getElementById('editFormErr'); el.textContent='Số điện thoại phải có ít nhất 9 chữ số'; el.style.display='block'; return; }

  // Duplicate email check (exclude self)
  const dup = DB.employees.getAll().find(e => e.id !== id && e.email && e.email.toLowerCase() === email.toLowerCase());
  if (dup) { const el=document.getElementById('editFormErr'); el.textContent=`Email "${email}" đã được sử dụng bởi nhân viên khác`; el.style.display='block'; return; }

  const btn = document.getElementById('saveEditBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

  try {
    const dobVal = document.getElementById('eDob').value; // YYYY-MM-DD from date input
    DB.employees.update(id, {
      name,
      email,
      phone,
      status:      document.getElementById('eSt').value,
      position:    document.getElementById('ePos').value.trim() || '—',
      managerName: document.getElementById('eMgr').value.trim() || '—',
      workMode:    document.getElementById('eMode').value,
      dob:         dobVal || null,
    });
    EMPLOYEES = loadEmployees();
    closeModal();
    applyFilters();
    DB.utils.showToast('Đã cập nhật thông tin nhân viên');
  } catch(err) {
    DB.utils.showToast('Có lỗi xảy ra, vui lòng thử lại');
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

function openAddModal() {
  // Build unit options from existing DB data
  const units = [...new Set(DB.employees.getAll().map(e => e.unit).filter(Boolean))].sort();
  const unitOpts = ['<option value="">-- Chọn đơn vị --</option>',
    ...units.map(u => `<option value="${u}">${u}</option>`)].join('');
  const selStyle = `cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222.5%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 10px center;`;

  document.getElementById('modalTitle').textContent = 'Thêm nhân viên mới';
  document.getElementById('modalContent').innerHTML = `
    <div id="addFormErr" style="display:none;margin-bottom:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:10px 14px;font-size:12.5px;color:#dc2626;font-weight:600;"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div style="grid-column:1/-1;"><label class="form-label">Họ và tên <span style="color:#ef4444;">*</span></label><input class="form-input" id="nName" placeholder="Nhập họ và tên đầy đủ"></div>
      <div><label class="form-label">Email <span style="color:#ef4444;">*</span></label><input class="form-input" id="nEmail" type="email" placeholder="vd: nhanvien@company.com"></div>
      <div><label class="form-label">Số điện thoại <span style="color:#ef4444;">*</span></label><input class="form-input" id="nPhone" placeholder="VD: 0912345678"></div>
      <div><label class="form-label">Đơn vị <span style="color:#ef4444;">*</span></label>
        <select class="form-input" id="nUnit" style="${selStyle}">${unitOpts}</select>
      </div>
      <div><label class="form-label">Trạng thái <span style="color:#ef4444;">*</span></label>
        <select class="form-input" id="nStatus" style="${selStyle}">
          <option value="active">Đang làm việc</option>
          <option value="inactive">Đã nghỉ việc</option>
        </select>
      </div>
      <div><label class="form-label">Vị trí công việc</label><input class="form-input" id="nPos" placeholder="VD: Nhân viên bán hàng"></div>
      <div><label class="form-label">Quản lý trực tiếp</label><input class="form-input" id="nMgr" placeholder="Tên quản lý"></div>
      <div><label class="form-label">Ngày bắt đầu làm việc</label><input class="form-input" id="nStart" type="date"></div>
      <div><label class="form-label">Ngày sinh</label><input class="form-input" id="nDob" type="date"></div>
      <div><label class="form-label">Hình thức làm việc</label>
        <select class="form-input" id="nMode" style="${selStyle}">
          <option>Toàn thời gian</option><option>Bán thời gian</option>
        </select>
      </div>
    </div>`;
  document.getElementById('modalActions').innerHTML = `
    <button onclick="closeModal()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#EAEFF4;border:none;color:#2A3547;">Hủy</button>
    <button onclick="saveNew()" id="saveNewBtn" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border:none;color:white;">Thêm nhân viên</button>`;
  document.getElementById('detailModal').style.display='flex';
}

function showFormErr(msg) {
  const el = document.getElementById('addFormErr');
  if (!el) { DB.utils.showToast(msg); return; }
  el.textContent = msg;
  el.style.display = 'block';
}

function saveNew() {
  const name   = document.getElementById('nName').value.trim();
  const email  = document.getElementById('nEmail').value.trim();
  const phone  = document.getElementById('nPhone').value.trim();
  const unit   = document.getElementById('nUnit').value;
  const status = document.getElementById('nStatus').value;

  // Validate required
  if (!name)  { showFormErr('Vui lòng nhập họ và tên'); return; }
  if (!email) { showFormErr('Vui lòng nhập email'); return; }
  if (!isValidEmail(email)) { showFormErr('Email không đúng định dạng (vd: abc@xyz.com)'); return; }
  if (!phone) { showFormErr('Vui lòng nhập số điện thoại'); return; }
  if (phone.replace(/\D/g,'').length < 9) { showFormErr('Số điện thoại phải có ít nhất 9 chữ số'); return; }
  if (!unit)  { showFormErr('Vui lòng chọn đơn vị'); return; }

  // Check duplicate email
  const dupEmail = DB.employees.getAll().find(e => e.email && e.email.toLowerCase() === email.toLowerCase());
  if (dupEmail) { showFormErr(`Email "${email}" đã được sử dụng bởi nhân viên khác`); return; }

  const btn = document.getElementById('saveNewBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

  try {
    DB.employees.create({
      name, email, phone,
      unit,
      status,
      dob:         document.getElementById('nDob').value   || null,
      position:    document.getElementById('nPos').value.trim()   || 'Nhân viên',
      managerName: document.getElementById('nMgr').value.trim()   || '—',
      startDate:   document.getElementById('nStart').value || new Date().toISOString().slice(0, 10),
      workMode:    document.getElementById('nMode').value,
      contractStatus: 'Đã có hợp đồng',
      contractType:   'Hợp đồng đào tạo',
      roleId: 'employee',
    });
    EMPLOYEES = loadEmployees();
    closeModal();
    applyFilters();
    DB.utils.showToast('Đã thêm nhân viên mới thành công');
  } catch(err) {
    DB.utils.showToast('Có lỗi xảy ra, vui lòng thử lại');
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

function exportCSV() {
  const data = filteredData.length ? filteredData : EMPLOYEES;
  if (!data.length) { DB.utils.showToast('Không có dữ liệu để xuất'); return; }
  const rows = [
    ['DANH SÁCH NHÂN VIÊN'],
    [`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['Mã NV', 'Họ và tên', 'Email', 'Số điện thoại', 'Đơn vị', 'Vị trí', 'Quản lý', 'Ngày bắt đầu', 'Loại HĐLĐ', 'Hình thức', 'Ngày sinh', 'Trạng thái'],
    ...data.map(e => [e.code, e.name, e.email, e.phone, e.unit, e.position, e.manager, e.startDate, e.contractType, e.workMode, e.dob, e.status])
  ];
  const esc = v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`;
  const csv  = rows.map(r => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `Nhan_vien_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  DB.utils.showToast('Xuất file thành công!');
}

function closeModal() { document.getElementById('detailModal').style.display='none'; }

// Init — show skeleton while waiting for Supabase sync
if (typeof showTableSkeleton === 'function') showTableSkeleton('tableBody', 6, 7);
applyFilters();

// Khi Supabase sync xong → reload nhân viên và render lại
window.addEventListener('humi_synced', function() {
  EMPLOYEES = loadEmployees();
  // Cập nhật lại dropdown đơn vị
  const sel = document.getElementById('filterUnit');
  const units = [...new Set(EMPLOYEES.map(e => e.unit).filter(Boolean))].sort();
  while (sel.options.length > 1) sel.remove(1);
  units.forEach(u => { const opt = document.createElement('option'); opt.value = u; opt.textContent = u; sel.appendChild(opt); });
  applyFilters();
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
  if (el) { el.value = q; el.dispatchEvent(new Event('input')); }
}
