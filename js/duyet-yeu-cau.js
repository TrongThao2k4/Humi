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

function reqToUi(r) {
  const emp = DB.employees.getById(r.employeeId) || {};
  const fmtDate = iso => { if(!iso) return '—'; const d=new Date(iso); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); };
  return {
    id: r.id,
    name: emp.name || r.employeeId,
    code: emp.code || r.employeeId,
    avatar: emp.avatar || ('https://i.pravatar.cc/40?img=' + (Math.abs((r.employeeId||'x').charCodeAt(2)%50)+1)),
    branch: emp.unit || '—',
    role: emp.roleId === 'manager' ? 'Quản lý' : 'Nhân viên',
    type: r.typeLabel || r.type,
    dateRange: (r.currentValue || '—') + ' → ' + (r.requestedValue || '—'),
    note: r.reason || '—',
    created: fmtDate(r.createdAt),
    status: r.status
  };
}

function loadRequests() { return DB.requests.getAll().map(reqToUi); }
let REQUESTS = loadRequests();

let filtered = [...REQUESTS];
let PAGE = 1;
let PAGE_SIZE = 100;

function statusBadge(s) {
  if (s === 'approved') return `<span class="badge badge-approved"><span class="badge-dot" style="background:#16a34a;"></span>Đã duyệt</span>`;
  if (s === 'rejected') return `<span class="badge badge-rejected"><span class="badge-dot" style="background:#ef4444;"></span>Từ chối</span>`;
  return `<span class="badge badge-pending"><span class="badge-dot" style="background:#d97706;"></span>Chờ duyệt</span>`;
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  const start = (PAGE - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  document.getElementById('totalLabel').textContent = `Tổng cộng ${filtered.length} kết quả`;
  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><input type="checkbox" class="cb-row" data-id="${r.id}" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" /></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${r.avatar}" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #EAEFF4;" />
            <div>
              <p style="font-size:13px;font-weight:700;color:#2A3547;margin:0;line-height:1.3;">${r.name}</p>
              <p style="font-size:11px;color:#7C8FAC;margin:0;">${r.code}</p>
              <p style="font-size:11px;color:#7C8FAC;margin:0;">${r.branch} – ${r.role}</p>
            </div>
          </div>
        </td>
        <td><span style="font-size:13px;color:#2A3547;">${r.type}</span></td>
        <td><span style="font-size:13px;color:#2A3547;white-space:nowrap;">${r.dateRange}</span></td>
        <td><span style="font-size:13px;color:#2A3547;">${r.note}</span></td>
        <td><span style="font-size:13px;color:#2A3547;white-space:nowrap;">${r.created}</span></td>
        <td>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-action-info" title="Chi tiết" onclick="viewDetail('${r.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </button>
            <button class="btn-action-reject" title="Từ chối" onclick="rejectRequest('${r.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const pg = document.getElementById('pagination');
  if (total <= 1) { pg.innerHTML = ''; return; }
  let html = '';
  if (PAGE > 1) html += `<button class="page-btn" onclick="goPage(${PAGE-1})">&#8249;</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i > 3 && i < total - 1 && Math.abs(i - PAGE) > 1) {
      if (i === 4) html += `<span style="padding:0 4px;line-height:32px;font-size:13px;color:#7C8FAC;">…</span>`;
      continue;
    }
    html += `<button class="page-btn${i===PAGE?' active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (PAGE < total) html += `<button class="page-btn" onclick="goPage(${PAGE+1})">&#8250;</button>`;
  pg.innerHTML = html;
}

function goPage(p) { PAGE = p; renderTable(); }
function changePageSize(val) { PAGE_SIZE = parseInt(val); PAGE = 1; renderTable(); }

function applyFilters() {
  const type   = document.getElementById('filterType').value;
  const unit   = document.getElementById('filterUnit').value;
  const pos    = document.getElementById('filterPosition').value;
  const emp    = document.getElementById('filterEmployee').value.toLowerCase().trim();
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  filtered = REQUESTS.filter(r => {
    if (type   && r.type   !== type)  return false;
    if (unit   && r.branch !== unit)  return false;
    if (pos    && r.role   !== pos)   return false;
    if (emp    && !r.name.toLowerCase().includes(emp)    && !r.code.toLowerCase().includes(emp))    return false;
    if (search && !r.name.toLowerCase().includes(search) && !r.code.toLowerCase().includes(search)) return false;
    return true;
  });
  PAGE = 1;
  renderTable();
}

function toggleAll(cb) {
  document.querySelectorAll('.cb-row').forEach(c => c.checked = cb.checked);
}

function viewDetail(id) {
  const r = REQUESTS.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modalTitle').textContent = 'Chi tiết yêu cầu';
  document.getElementById('modalSub').textContent = 'Thông tin yêu cầu duyệt công';
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F2F6FA;border-radius:7px;margin-bottom:16px;">
      <img src="${r.avatar}" style="width:48px;height:48px;border-radius:50%;border:2px solid #ECF2FF;" />
      <div>
        <p style="font-size:14px;font-weight:700;color:#2A3547;margin:0;">${r.name}</p>
        <p style="font-size:12px;color:#7C8FAC;margin:2px 0 0;">${r.code} · ${r.branch}</p>
        <p style="font-size:12px;color:#7C8FAC;margin:0;">${r.role}</p>
      </div>
      <div style="margin-left:auto;">${statusBadge(r.status)}</div>
    </div>
    <div class="info-row"><span class="info-label">Loại yêu cầu</span><span class="info-value">${r.type}</span></div>
    <div class="info-row"><span class="info-label">Yêu cầu duyệt cho ngày</span><span class="info-value">${r.dateRange}</span></div>
    <div class="info-row"><span class="info-label">Ghi chú yêu cầu</span><span class="info-value">${r.note}</span></div>
    <div class="info-row"><span class="info-label">Ngày tạo yêu cầu</span><span class="info-value">${r.created}</span></div>
    <div class="info-row"><span class="info-label">Trạng thái</span><span class="info-value">${statusBadge(r.status)}</span></div>
  `;
  document.getElementById('modalFooter').innerHTML = r.status === 'pending' ? `
    <button onclick="rejectRequest('${r.id}',true)" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#fee2e2;border:none;color:#ef4444;">Từ chối</button>
    <button onclick="approveRequest('${r.id}',true)" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,#16a34a,#15803d);border:none;color:white;box-shadow:0 3px 10px rgba(22,163,74,0.3);">Duyệt yêu cầu</button>
  ` : `<button onclick="closeModal()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#EAEFF4;border:none;color:#2A3547;">Đóng</button>`;
  document.getElementById('detailModal').classList.add('open');
}

function approveRequest(id, fromModal) {
  DB.requests.approve(id, currentUser.id);
  REQUESTS = loadRequests();
  if (fromModal) closeModal();
  renderTable();
  applyFilters();
  DB.utils.showToast('Đã duyệt yêu cầu');
}

function rejectRequest(id, fromModal) {
  DB.requests.reject(id, currentUser.id);
  REQUESTS = loadRequests();
  if (fromModal) closeModal();
  renderTable();
  applyFilters();
  DB.utils.showToast('Đã từ chối yêu cầu', 'error');
}

function closeModal() { document.getElementById('detailModal').classList.remove('open'); }

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

// ===== POPULATE UNIT DROPDOWN =====
(function() {
  populateBranchDropdown('filterUnit');
})();

function exportData() {
  if (filtered.length === 0) {
    DB.utils.showToast('Không có dữ liệu để xuất', 'error');
    return;
  }
  var headers = ['STT', 'Người yêu cầu', 'Mã nhân viên', 'Loại yêu cầu', 'Yêu cầu duyệt cho ngày', 'Ghi chú', 'Ngày tạo', 'Trạng thái'];
  var rows = filtered.map(function(r, i) {
    var status = r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt';
    return [
      String(i + 1),
      r.name,
      r.code,
      r.type,
      r.dateRange,
      r.note,
      r.created,
      status
    ];
  });
  
  var csv = headers.join(',') + '\n' + rows.map(function(row) {
    return row.map(function(cell) {
      cell = String(cell || '').replace(/"/g, '""');
      return '"' + cell + '"';
    }).join(',');
  }).join('\n');
  
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'duyet-yeu-cau_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  DB.utils.showToast('Xuất dữ liệu thành công');
}

function showConditionModal() {
  document.getElementById('modalTitle').textContent = 'Duyệt theo điều kiện';
  document.getElementById('modalSub').textContent = 'Chọn điều kiện để duyệt hàng loạt';
  
  var emps = DB.employees.getAll() || [];
  var units = [...new Set(emps.map(function(e){ return e.unit; }).filter(Boolean))].sort();
  var unitOpts = units.map(function(u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
  
  document.getElementById('modalBody').innerHTML = `
    <p style="font-size:13px;color:#5A6A85;margin:0 0 16px;">Chọn điều kiện để duyệt hàng loạt các yêu cầu đang chờ duyệt phù hợp.</p>
    <div style="display:grid;gap:14px;">
      <div>
        <label style="font-size:12px;font-weight:600;color:#2A3547;display:block;margin-bottom:6px;">Loại yêu cầu</label>
        <select class="filter-select" id="condType" style="width:100%;">
          <option value="">Tất cả loại yêu cầu</option>
          <option>Yêu cầu tạo công</option>
          <option>Yêu cầu đổi ca</option>
          <option>Yêu cầu nghỉ phép</option>
        </select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#2A3547;display:block;margin-bottom:6px;">Đơn vị</label>
        <select class="filter-select" id="condUnit" style="width:100%;">
          <option value="">Tất cả đơn vị</option>
          ${unitOpts}
        </select>
      </div>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button onclick="closeModal()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#EAEFF4;border:none;color:#2A3547;">Hủy</button>
    <button onclick="bulkApprove()" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#2563eb;border:none;color:white;box-shadow:0 3px 10px rgba(37,99,235,0.3);">Duyệt theo điều kiện</button>
  `;
  document.getElementById('detailModal').classList.add('open');
}

function bulkApprove() {
  const type = document.getElementById('condType').value;
  const unit = document.getElementById('condUnit').value;
  let count = 0;
  var reqList = DB.requests.getAll();
  reqList.forEach(function(r) {
    if (r.status !== 'pending') return;
    if (type && r.typeLabel !== type && r.type !== type) return;
    if (unit) {
      var emp = DB.employees.getById(r.employeeId);
      if (!emp || emp.unit !== unit) return;
    }
    DB.requests.approve(r.id, currentUser.id);
    count++;
  });
  REQUESTS = loadRequests();
  closeModal();
  renderTable();
  applyFilters();
  if (count > 0) {
    DB.utils.showToast(`Đã duyệt ${count} yêu cầu thành công`);
  } else {
    DB.utils.showToast('Không có yêu cầu nào phù hợp', 'error');
  }
}

document.getElementById('detailModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

applyFilters();

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
