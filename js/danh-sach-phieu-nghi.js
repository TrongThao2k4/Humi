// ─── Auth ────────────────────────────────────────────────
const _s = DB.auth.requireAuth(); if(!_s) throw 0;
const currentUser = _s.user;

// ─── Dynamic user info ───────────────────────────────────
(function() {
  var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
  var name   = (emp && emp.name)     || currentUser.name     || '—';
  var role   = (emp && emp.position) || currentUser.position || '—';
  var _sk = 'humi_user_settings_' + currentUser.id;
  var _st = {}; try { _st = JSON.parse(localStorage.getItem(_sk)) || {}; } catch(e) {}
  var avatar = _st.avatar || (emp && emp.avatar) || '';
  var sid = document.getElementById('sidebarAvatar'); if(sid) sid.src = avatar || sid.src;
  var tid = document.getElementById('topbarAvatar');  if(tid) tid.src = avatar || tid.src;
  var sn  = document.getElementById('sidebarName');   if(sn)  sn.textContent = name;
  var sr  = document.getElementById('sidebarRole');   if(sr)  sr.textContent = role;
  var tn  = document.getElementById('topbarName');    if(tn)  tn.textContent = name;
  var tr  = document.getElementById('topbarRole');    if(tr)  tr.textContent = role;
  var dn  = document.getElementById('dropdownName');   if(dn)  dn.textContent  = name;
  var dr  = document.getElementById('dropdownRole');   if(dr)  dr.textContent  = role;
  var da  = document.getElementById('dropdownAvatar'); if(da)  da.src = avatar || da.src;
})();

// ─── Constants ───────────────────────────────────────────
const STATUS_LABEL = { pending:'Chưa duyệt', approved:'Đã duyệt', rejected:'Từ chối' };
const TYPE_LABEL   = { annual:'Nghỉ phép năm', sick:'Nghỉ ốm', unpaid:'Nghỉ không lương', maternity:'Nghỉ thai sản' };
const PAGE_SIZE = 10;
let currentPage = 1;
let filteredData = [];
let selectedIds = new Set();
let _dateRange = null;  // { from: Date, to: Date }
let _rejectIds = [];    // IDs being rejected (single or bulk)

// ─── Populate unit filter ────────────────────────────────
function populateUnitFilter() {
  var emps = DB.employees.getAll() || [];
  var units = [...new Set(emps.map(function(e){ return e.unit; }).filter(Boolean))].sort();
  var sel = document.getElementById('filterUnit');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  units.forEach(function(u) {
    var opt = document.createElement('option'); opt.value = u; opt.textContent = u; sel.appendChild(opt);
  });
}

populateUnitFilter();

// ─── Helper: format date ─────────────────────────────────
function fmtDate(iso) { if(!iso) return '—'; var p=iso.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function fmtDateTime(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()
    +' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function calcDays(start, end) {
  if (!start || !end) return 0;
  var s = new Date(start), e = new Date(end);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

// ─── Load data ───────────────────────────────────────────
function loadData() {
  var emps = DB.employees.getAll() || [];
  return DB.leaves.getAll().map(function(l) {
    var emp = emps.find(function(e){ return e.id === l.employeeId; }) || {};
    var approver = l.approverId ? (emps.find(function(e){ return e.id === l.approverId; }) || {}) : null;
    return {
      _raw: l,  // giữ raw để dùng trong sendMsg
      id: l.id,
      employeeId: l.employeeId,
      empName:  emp.name   || l.employeeId,
      empCode:  emp.code   || l.employeeId,
      empUnit:  emp.unit   || '—',
      empRole:  emp.position || '—',
      avatar:   emp.avatar || ('https://i.pravatar.cc/36?img='+(Math.abs(((l.employeeId||'x').charCodeAt(2)||5)%50)+1)),
      leaveType: l.leaveType,
      type:     l.leaveTypeName || TYPE_LABEL[l.leaveType] || l.leaveType,
      status:   l.status,
      startDate: l.startDate,
      endDate:   l.endDate,
      totalDays: l.totalDays,
      reason:    l.reason || '—',
      createdAt: l.createdAt,
      approverName: approver ? approver.name : (l.approverId || null),
      approvedAt:   l.approvedAt,
      rejectedAt:   l.rejectedAt,
      rejectReason: l.rejectReason
    };
  });
}

var DATA = loadData();

function refreshFromDb() {
  DATA = loadData();
  populateUnitFilter();
  filterTable();
}

window.addEventListener('humi_synced', refreshFromDb);
setTimeout(refreshFromDb, 1000);

// ─── Status badge ────────────────────────────────────────
function statusBadge(status) {
  if (status === 'approved') return '<span class="badge badge-approved"><span class="badge-dot" style="background:#16a34a;"></span>Đã duyệt</span>';
  if (status === 'rejected') return '<span class="badge badge-rejected"><span class="badge-dot" style="background:#ef4444;"></span>Từ chối</span>';
  return '<span class="badge badge-pending"><span class="badge-dot" style="background:#d97706;"></span>Chờ duyệt</span>';
}

// ─── Render table ────────────────────────────────────────
function renderTable() {
  var start = (currentPage - 1) * PAGE_SIZE;
  var pageData = filteredData.slice(start, start + PAGE_SIZE);
  var tbody = document.getElementById('tableBody');
  if (!pageData.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#7C8FAC;font-size:13px;">Không có dữ liệu</td></tr>';
    updateSummary(); renderPagination(); return;
  }
  tbody.innerHTML = pageData.map(function(r) {
    var checked = selectedIds.has(r.id) ? 'checked' : '';
    var actBtns = r.status === 'pending' ? (
      '<button class="btn-icon" title="Duyệt" onclick="approveOne(\''+r.id+'\')">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>'
      +'<button class="btn-icon" title="Từ chối" onclick="openRejectModal([\''+r.id+'\'])">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    ) : '';
    return '<tr>'
      +'<td><input type="checkbox" class="cb-table row-cb" value="'+r.id+'" onchange="onRowCheck()" '+checked+'></td>'
      +'<td><div style="display:flex;align-items:center;gap:10px;">'
        +'<img src="'+r.avatar+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
        +'<div><p style="font-size:13px;font-weight:700;color:#2A3547;margin:0 0 1px;">'+r.empName+'</p>'
        +'<p style="font-size:11px;color:#7C8FAC;margin:0;">'+r.empCode+'</p></div></div></td>'
      +'<td><span style="font-size:12px;font-weight:600;color:#4338ca;background:#ECF2FF;padding:3px 8px;border-radius:6px;">'+r.type+'</span></td>'
      +'<td style="font-size:12px;color:#5A6A85;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+r.empUnit+'</td>'
      +'<td style="font-size:12px;color:#5A6A85;white-space:nowrap;">'+fmtDateTime(r.createdAt)+'</td>'
      +'<td>'+statusBadge(r.status)+'</td>'
      +'<td style="font-size:12px;font-weight:600;color:#2A3547;white-space:nowrap;">'+fmtDate(r.startDate)+'</td>'
      +'<td style="font-size:12px;font-weight:600;color:#2A3547;white-space:nowrap;">'+fmtDate(r.endDate)+'</td>'
      +'<td style="text-align:center;"><span style="font-size:12px;font-weight:700;color:var(--primary);background:#ECF2FF;padding:3px 10px;border-radius:6px;">'+r.totalDays+' ngày</span></td>'
      +'<td><div style="display:flex;align-items:center;justify-content:center;gap:2px;">'
        +'<button class="btn-icon" title="Xem chi tiết" onclick="openDetail(\''+r.id+'\')">'
          +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>'
        +actBtns
      +'</div></td></tr>';
  }).join('');
  updateSummary(); renderPagination();
}

function updateSummary() {
  var all = DATA;
  document.getElementById('sumTotal').textContent    = all.length;
  document.getElementById('sumPending').textContent  = all.filter(function(r){ return r.status==='pending'; }).length;
  document.getElementById('sumApproved').textContent = all.filter(function(r){ return r.status==='approved'; }).length;
  document.getElementById('sumRejected').textContent = all.filter(function(r){ return r.status==='rejected'; }).length;
  document.getElementById('resultCount').textContent = 'Hiển thị '+filteredData.length+' kết quả';
}

function renderPagination() {
  var total = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
  document.getElementById('pageInfo').textContent = 'Trang '+currentPage+' / '+total;
  var html = '<button class="page-btn" onclick="goPage('+(currentPage-1)+')" '+(currentPage===1?'disabled style="opacity:0.4;cursor:not-allowed;"':'')+'>‹</button>';
  for (var i = 1; i <= total; i++) html += '<button class="page-btn '+(i===currentPage?'active':'')+'" onclick="goPage('+i+')">'+i+'</button>';
  html += '<button class="page-btn" onclick="goPage('+(currentPage+1)+')" '+(currentPage===total?'disabled style="opacity:0.4;cursor:not-allowed;"':'')+'>›</button>';
  document.getElementById('pagination').innerHTML = html;
}

function goPage(p) {
  var total = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
  if (p < 1 || p > total) return;
  currentPage = p; renderTable();
}

// ─── Filter ──────────────────────────────────────────────
function filterTable() {
  var empQ    = (document.getElementById('searchEmp').value || document.getElementById('globalSearch').value || '').toLowerCase();
  var unit    = document.getElementById('filterUnit').value;
  var status  = document.getElementById('filterStatus').value;
  var type    = document.getElementById('filterType').value;
  var sortBy  = document.getElementById('sortBy').value;

  filteredData = DATA.filter(function(r) {
    if (empQ && !r.empName.toLowerCase().includes(empQ) && !r.empCode.toLowerCase().includes(empQ)) return false;
    if (unit   && r.empUnit    !== unit)   return false;
    if (status && r.status     !== status) return false;
    if (type   && r.leaveType  !== type)   return false;
    if (_dateRange) {
      var start = new Date(r.startDate);
      if (start < _dateRange.from || start > _dateRange.to) return false;
    }
    return true;
  });

  filteredData.sort(function(a, b) {
    if (sortBy === 'oldest')    return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'days_desc') return b.totalDays - a.totalDays;
    if (sortBy === 'days_asc')  return a.totalDays - b.totalDays;
    return new Date(b.createdAt) - new Date(a.createdAt); // newest
  });

  currentPage = 1;
  renderTable();
}

function resetFilters() {
  document.getElementById('searchEmp').value   = '';
  document.getElementById('globalSearch').value = '';
  document.getElementById('filterUnit').value   = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterType').value   = '';
  document.getElementById('sortBy').value = 'newest';
  _dateRange = null;
  if (window._fpInstance) window._fpInstance.clear();
  DATA = loadData(); filterTable();
}

// ─── Checkbox ────────────────────────────────────────────
function onRowCheck() {
  selectedIds = new Set();
  document.querySelectorAll('.row-cb:checked').forEach(function(cb){ selectedIds.add(cb.value); });
  var page = filteredData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
  document.getElementById('checkAll').checked = selectedIds.size > 0 && selectedIds.size === page.length;
  document.getElementById('bulkActions').style.display = selectedIds.size > 0 ? 'flex' : 'none';
}

function toggleAll(cb) {
  var page = filteredData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
  if (cb.checked) page.forEach(function(r){ selectedIds.add(r.id); });
  else page.forEach(function(r){ selectedIds.delete(r.id); });
  renderTable();
  document.getElementById('checkAll').checked = cb.checked;
  document.getElementById('bulkActions').style.display = selectedIds.size > 0 ? 'flex' : 'none';
}

// ─── Send notification ───────────────────────────────────
function _sendLeaveMsg(raw, approved, reason) {
  if (!raw) return;
  var emps = DB.employees.getAll() || [];
  var emp = emps.find(function(e){ return e.id === raw.employeeId; });
  var empName = emp ? emp.name : raw.employeeId;
  var color = approved ? '#16a34a' : '#ef4444';
  var statusText = approved ? 'PHÊ DUYỆT' : 'TỪ CHỐI';
  DB.messages.sendSystem(
    raw.employeeId,
    'Đơn nghỉ phép ' + (approved ? 'đã được duyệt ✓' : 'bị từ chối ✗'),
    '<p>Kính gửi <strong>' + empName + '</strong>,</p>'
      + '<p>Đơn nghỉ phép <strong>' + (raw.leaveTypeName || TYPE_LABEL[raw.leaveType] || raw.leaveType) + '</strong>'
      + ' từ ngày <strong>' + fmtDate(raw.startDate) + '</strong>'
      + ' đến <strong>' + fmtDate(raw.endDate) + '</strong>'
      + ' (<strong>' + raw.totalDays + ' ngày</strong>)'
      + ' đã được <span style="color:' + color + ';font-weight:700;">' + statusText + '</span>.</p>'
      + (reason ? '<p style="background:#fef2f2;border-radius:8px;padding:10px 14px;font-size:12.5px;">Lý do từ chối: <em>' + reason + '</em></p>' : '')
      + '<p style="font-size:12px;color:#7C8FAC;">Xử lý bởi: ' + currentUser.name + ' – ' + new Date().toLocaleDateString('vi-VN') + '</p>',
    'leave'
  );
}

// ─── Approve ─────────────────────────────────────────────
function approveOne(id) {
  var r = DATA.find(function(x){ return x.id===id; });
  DB.leaves.approve(id, currentUser.id);
  DB.utils.showToast('Đã duyệt phiếu nghỉ');
  if (r) _sendLeaveMsg(r._raw, true, null);
  DATA = loadData(); filterTable();
}

function bulkApprove() {
  var ids = Array.from(selectedIds);
  ids.forEach(function(id) {
    var r = DATA.find(function(x){ return x.id===id; });
    if (r && r.status === 'pending') {
      DB.leaves.approve(id, currentUser.id);
      if (r) _sendLeaveMsg(r._raw, true, null);
    }
  });
  selectedIds.clear();
  DB.utils.showToast('Đã duyệt ' + ids.length + ' phiếu');
  DATA = loadData(); filterTable();
}

// ─── Reject modal ────────────────────────────────────────
function openRejectModal(ids) {
  _rejectIds = ids;
  var names = ids.map(function(id) {
    var r = DATA.find(function(x){ return x.id===id; });
    return r ? r.empName + ' (' + (r.type) + ', ' + fmtDate(r.startDate) + ')' : id;
  });
  document.getElementById('rejectTarget').innerHTML =
    '<strong>Đang từ chối:</strong><br>' + names.join('<br>');
  document.getElementById('rejectReason').value = '';
  document.getElementById('rejectModal').style.display = 'flex';
  setTimeout(function(){ document.getElementById('rejectReason').focus(); }, 100);
}

function openBulkRejectModal() {
  openRejectModal(Array.from(selectedIds).filter(function(id) {
    var r = DATA.find(function(x){ return x.id===id; });
    return r && r.status === 'pending';
  }));
}

function closeRejectModal() {
  document.getElementById('rejectModal').style.display = 'none';
  _rejectIds = [];
}

function confirmReject() {
  var reason = document.getElementById('rejectReason').value.trim();
  if (!reason) { DB.utils.showToast('Vui lòng nhập lý do từ chối', 'error'); return; }
  _rejectIds.forEach(function(id) {
    var r = DATA.find(function(x){ return x.id===id; });
    if (r && r.status === 'pending') {
      DB.leaves.reject(id, currentUser.id, reason);
      if (r) _sendLeaveMsg(r._raw, false, reason);
    }
  });
  DB.utils.showToast('Đã từ chối ' + _rejectIds.length + ' phiếu');
  closeRejectModal();
  selectedIds.clear();
  DATA = loadData(); filterTable();
}

// ─── Detail modal ────────────────────────────────────────
function openDetail(id) {
  var r = DATA.find(function(x){ return x.id===id; });
  if (!r) return;

  var approvalSection = '';
  if (r.status === 'approved') {
    approvalSection = '<div style="background:#f0fdf4;border-radius:8px;padding:14px 16px;margin-top:14px;">'
      + '<p style="font-size:12px;font-weight:700;color:#16a34a;margin:0 0 6px;">✓ ĐÃ DUYỆT</p>'
      + '<div class="info-row"><span class="info-label">Người duyệt</span><span class="info-val">'+(r.approverName||'—')+'</span></div>'
      + '<div class="info-row" style="margin-bottom:0;"><span class="info-label">Thời điểm</span><span class="info-val">'+fmtDateTime(r.approvedAt)+'</span></div>'
      + '</div>';
  } else if (r.status === 'rejected') {
    approvalSection = '<div style="background:#fef2f2;border-radius:8px;padding:14px 16px;margin-top:14px;">'
      + '<p style="font-size:12px;font-weight:700;color:#ef4444;margin:0 0 6px;">✗ ĐÃ TỪ CHỐI</p>'
      + '<div class="info-row"><span class="info-label">Người từ chối</span><span class="info-val">'+(r.approverName||'—')+'</span></div>'
      + '<div class="info-row"><span class="info-label">Thời điểm</span><span class="info-val">'+fmtDateTime(r.rejectedAt)+'</span></div>'
      + '<div class="info-row" style="margin-bottom:0;"><span class="info-label">Lý do</span><span class="info-val" style="color:#ef4444;">'+(r.rejectReason||'Không có lý do')+'</span></div>'
      + '</div>';
  }

  document.getElementById('detailContent').innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #EAEFF4;">'
      +'<img src="'+r.avatar+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
      +'<div style="flex:1;">'
        +'<p style="font-size:15px;font-weight:700;color:#2A3547;margin:0 0 3px;">'+r.empName+'</p>'
        +'<p style="font-size:12px;color:#7C8FAC;margin:0;">'+r.empCode+' · '+r.empRole+'</p>'
        +'<p style="font-size:12px;color:#7C8FAC;margin:2px 0 0;">'+r.empUnit+'</p>'
      +'</div>'
      +'<div>'+statusBadge(r.status)+'</div>'
    +'</div>'
    +'<div class="info-row"><span class="info-label">Loại phép</span><span class="info-val"><strong>'+r.type+'</strong></span></div>'
    +'<div class="info-row"><span class="info-label">Từ ngày</span><span class="info-val">'+fmtDate(r.startDate)+'</span></div>'
    +'<div class="info-row"><span class="info-label">Đến ngày</span><span class="info-val">'+fmtDate(r.endDate)+'</span></div>'
    +'<div class="info-row"><span class="info-label">Số ngày nghỉ</span><span class="info-val"><strong style="color:var(--primary);font-size:15px;">'+r.totalDays+' ngày</strong></span></div>'
    +'<div class="info-row"><span class="info-label">Ngày tạo</span><span class="info-val">'+fmtDateTime(r.createdAt)+'</span></div>'
    +'<div class="info-row" style="margin-bottom:0;"><span class="info-label">Lý do</span><span class="info-val" style="background:#F2F6FA;padding:8px 12px;border-radius:7px;display:block;">'+r.reason+'</span></div>'
    + approvalSection;

  var actions = document.getElementById('detailActions');
  actions.innerHTML = '<button onclick="closeDetail()" class="btn-outline">Đóng</button>';
  if (r.status === 'pending') {
    actions.innerHTML +=
      '<button onclick="openRejectModal([\''+r.id+'\']);closeDetail();" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:#fee2e2;border:none;color:#ef4444;">Từ chối</button>'
      +'<button onclick="approveOne(\''+r.id+'\');closeDetail();" style="padding:9px 20px;border-radius:7px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;background:linear-gradient(135deg,#16a34a,#15803d);border:none;color:white;">Duyệt phép</button>';
  }
  document.getElementById('detailModal').style.display = 'flex';
}

function closeDetail() { document.getElementById('detailModal').style.display = 'none'; }

// ─── Create modal ─────────────────────────────────────────
function openCreateModal() {
  // Populate employee dropdown
  var emps = (DB.employees.getAll()||[]).filter(function(e){ return e.status !== 'inactive'; });
  var sel = document.getElementById('createEmpId');
  sel.innerHTML = '<option value="">— Chọn nhân viên —</option>'
    + emps.map(function(e){ return '<option value="'+e.id+'">'+e.name+' ('+e.code+')</option>'; }).join('');

  document.getElementById('createLeaveType').value = '';
  document.getElementById('createReason').value = '';
  document.getElementById('createAutoApprove').checked = false;
  document.getElementById('calcDays').textContent = '0';
  document.getElementById('leaveBalanceInfo').style.display = 'none';

  if (window._fpStart) { window._fpStart.clear(); window._fpEnd.clear(); }
  document.getElementById('createModal').style.display = 'flex';
}

function closeCreateModal() { document.getElementById('createModal').style.display = 'none'; }

function updateLeaveBalance() {
  var empId = document.getElementById('createEmpId').value;
  if (!empId) { document.getElementById('leaveBalanceInfo').style.display = 'none'; return; }
  var bal = DB.leaves.getBalance(empId);
  var items = [
    { label:'Phép năm', key:'annual', color:'#5D87FF' },
    { label:'Nghỉ ốm',  key:'sick',   color:'#16a34a' },
    { label:'Thai sản', key:'maternity', color:'#a855f7' },
    { label:'Không lương', key:'unpaid', color:'#f59e0b' },
  ];
  document.getElementById('balanceDisplay').innerHTML = items.map(function(item) {
    var days = bal[item.key] !== undefined ? bal[item.key] : '—';
    return '<div style="text-align:center;">'
      +'<div style="font-size:18px;font-weight:800;color:'+item.color+';">'+days+'</div>'
      +'<div style="font-size:11px;color:#7C8FAC;">'+item.label+'</div>'
      +'</div>';
  }).join('');
  document.getElementById('leaveBalanceInfo').style.display = 'block';
}

function updateCalcDays() {
  var s = document.getElementById('createStartDate').value;
  var e = document.getElementById('createEndDate').value;
  if (!s || !e) return;
  // Convert dd/mm/yyyy → yyyy-mm-dd
  function toISO(ddmmyyyy) { var p=ddmmyyyy.split('/'); return p[2]+'-'+p[1]+'-'+p[0]; }
  var days = calcDays(toISO(s), toISO(e));
  document.getElementById('calcDays').textContent = days;
}

function submitCreate() {
  var empId   = document.getElementById('createEmpId').value;
  var type    = document.getElementById('createLeaveType').value;
  var startS  = document.getElementById('createStartDate').value;
  var endS    = document.getElementById('createEndDate').value;
  var reason  = document.getElementById('createReason').value.trim();
  var autoApp = document.getElementById('createAutoApprove').checked;

  if (!empId)  { DB.utils.showToast('Vui lòng chọn nhân viên', 'error'); return; }
  if (!type)   { DB.utils.showToast('Vui lòng chọn loại phép', 'error'); return; }
  if (!startS) { DB.utils.showToast('Vui lòng chọn ngày bắt đầu', 'error'); return; }
  if (!endS)   { DB.utils.showToast('Vui lòng chọn ngày kết thúc', 'error'); return; }

  function toISO(ddmmyyyy) { var p=ddmmyyyy.split('/'); return p[2]+'-'+p[1]+'-'+p[0]; }
  var startISO = toISO(startS), endISO = toISO(endS);
  if (startISO > endISO) { DB.utils.showToast('Ngày bắt đầu phải trước ngày kết thúc', 'error'); return; }

  var days = calcDays(startISO, endISO);
  var req = DB.leaves.submit({
    employeeId: empId,
    leaveType: type,
    leaveTypeName: TYPE_LABEL[type] || type,
    startDate: startISO,
    endDate: endISO,
    totalDays: days,
    reason: reason
  });

  if (autoApp) {
    DB.leaves.approve(req.id, currentUser.id);
    DB.utils.showToast('Đã tạo và duyệt phiếu nghỉ');
  } else {
    DB.utils.showToast('Đã tạo phiếu nghỉ thành công');
  }

  // Gửi thông báo cho nhân viên
  _sendLeaveMsg(req, autoApp, null);

  closeCreateModal();
  DATA = loadData(); filterTable();
}

// ─── Export CSV ──────────────────────────────────────────
function exportCSV() {
  try {
    // Lấy dữ liệu hiện tại (ưu tiên dữ liệu đã lọc)
    var dataToExport = [];
    if (filteredData && filteredData.length > 0) {
      dataToExport = filteredData;
    } else if (DATA && DATA.length > 0) {
      dataToExport = DATA;
    }
    
    // Nếu không có dữ liệu, lấy trực tiếp từ DB
    if (!dataToExport || dataToExport.length === 0) {
      var emps = DB.employees.getAll() || [];
      var leaves = DB.leaves.getAll() || [];
      dataToExport = leaves.map(function(l) {
        var emp = emps.find(function(e){ return e.id === l.employeeId; }) || {};
        var approver = l.approverId ? (emps.find(function(e){ return e.id === l.approverId; }) || {}) : null;
        return {
          empCode: emp.code || l.employeeId,
          empName: emp.name || l.employeeId,
          empUnit: emp.unit || '—',
          type: l.leaveTypeName || TYPE_LABEL[l.leaveType] || l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          totalDays: l.totalDays,
          status: l.status,
          reason: l.reason || '—',
          approverName: approver ? approver.name : (l.approverId || null),
          approvedAt: l.approvedAt,
          rejectedAt: l.rejectedAt
        };
      });
    }
    
    if (!dataToExport || dataToExport.length === 0) {
      DB.utils.showToast('Không có dữ liệu để xuất', 'error');
      return;
    }
    
    var headers = ['Mã NV','Tên nhân viên','Đơn vị','Loại phép','Từ ngày','Đến ngày','Số ngày','Trạng thái','Lý do','Người duyệt','Ngày duyệt'];
    var rows = dataToExport.map(function(r) {
      return [
        r.empCode, r.empName, r.empUnit, r.type,
        fmtDate(r.startDate), fmtDate(r.endDate), r.totalDays,
        STATUS_LABEL[r.status]||r.status, '"'+(r.reason||'').replace(/"/g,'""')+'"',
        r.approverName||'—', fmtDateTime(r.approvedAt||r.rejectedAt)
      ].join(',');
    });
    
    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'phieu-nghi-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Thành công
    var el = document.getElementById('toast');
    if (el) {
      el.textContent = 'Xuất dữ liệu thành công (' + dataToExport.length + ' bản ghi)';
      el.className = 'toast show';
      el.style.background = '#2A3547';
      clearTimeout(el._t);
      el._t = setTimeout(function(){ el.className = 'toast'; el.style.background = ''; }, 3000);
    }
  } catch (e) {
    console.error('Lỗi xuất dữ liệu:', e);
    DB.utils.showToast('Lỗi khi xuất dữ liệu: ' + e.message, 'error');
  }
}

// ─── Init flatpickr ──────────────────────────────────────
window._fpInstance = flatpickr('#filterDate', {
  mode: 'range', dateFormat: 'd/m/Y', locale: 'vn', allowInput: false, disableMobile: true,
  onChange: function(dates) {
    if (dates.length === 2) {
      _dateRange = { from: dates[0], to: dates[1] };
    } else {
      _dateRange = null;
    }
    filterTable();
  }
});

window._fpStart = flatpickr('#createStartDate', {
  dateFormat: 'd/m/Y', locale: 'vn', disableMobile: true,
  onChange: function() { updateCalcDays(); }
});
window._fpEnd = flatpickr('#createEndDate', {
  dateFormat: 'd/m/Y', locale: 'vn', disableMobile: true,
  onChange: function() { updateCalcDays(); }
});

// ─── Init ────────────────────────────────────────────────
filterTable();

window.addEventListener('humi_synced', function() {
  DATA = loadData(); filterTable();
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
