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


  // ===== DATA from DB =====
  function empToUiNV(e) {
    const fmtDate = iso => iso ? iso.split('-').reverse().join('/') : '—';
    const trunc = (s, n) => s && s.length > n ? s.slice(0, n) + '...' : (s || '—');
    const sal = DB.salary.getByEmployee(e.id, 2026)[0];
    const salStr = sal ? (sal.netSalary || 0).toLocaleString('vi-VN') + ' đ' : '—';
    const allow = sal ? Object.values(sal.allowances || {}).reduce((a,b)=>a+b,0).toLocaleString('vi-VN') + ' đ' : '—';
    return {
      id: e.id, name: e.name, code: e.code,
      rawStatus: e.status || 'active',
      avatar: e.avatar || ('https://i.pravatar.cc/52?img=' + (Math.abs((e.id||'x').charCodeAt(2)%50)+1)),
      unit: trunc(e.unit, 16), unitFull: e.unit || '',
      position: trunc(e.position, 18), positionFull: e.position,
      manager: e.managerName || '—',
      startDate: fmtDate(e.startDate),
      contractStatus: e.contractStatus || '—',
      contractType: e.contractType || '—',
      workType: e.workMode || '—',
      phone: e.phone || '—',
      birth: fmtDate(e.dob),
      gender: e.gender || '—',
      email: e.email || '—',
      idCard: e.idCard || '—',
      contractDate: fmtDate(e.startDate),
      contractExpiry: '—',
      salary: salStr,
      allowance: allow,
      leave: ((e.leaveBalance && e.leaveBalance.annual) || 0) + ' ngày'
    };
  }
  const employees = DB.employees.getAll().map(empToUiNV);

  // ===== FILTER STATE =====
  let filterStatus = 'active'; // default: đang làm việc
  let filterUnit   = '';
  let filterSearch = '';
  let filteredData = [];

  const STATUS_LABELS = { active: 'Đang làm việc', inactive: 'Nghỉ việc', all: 'Tất cả' };

  // ===== CORE FILTER LOGIC =====
  function applyFilters() {
    filteredData = employees.filter(e => {
      const q = filterSearch.toLowerCase();
      const matchSearch = !q ||
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.phone.includes(q);
      const matchStatus = filterStatus === 'all' || !filterStatus || e.rawStatus === filterStatus;
      const matchUnit   = !filterUnit || e.unitFull === filterUnit;
      return matchSearch && matchStatus && matchUnit;
    });
    renderTable(filteredData);
    updateFilterUI();
  }

  // ===== RENDER =====
  function renderTable(data) {
    const tbody = document.getElementById('empBody');
    document.getElementById('empCount').textContent = data.length + ' Nhân viên';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#7C8FAC;">Không có dữ liệu phù hợp</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(emp => `
      <tr onclick="openDrawer('${emp.id}')">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${emp.avatar}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1.5px solid #ECF2FF;" />
            <div>
              <p style="font-size:13px;font-weight:600;color:var(--primary-dark);margin:0 0 1px;cursor:pointer;">${emp.name}</p>
              <p style="font-size:11px;color:#7C8FAC;margin:0;">${emp.code}</p>
            </div>
          </div>
        </td>
        <td style="color:#5A6A85;">${emp.unit}</td>
        <td style="color:#5A6A85;">${emp.position}</td>
        <td>${emp.manager}</td>
        <td>${emp.startDate}</td>
        <td>${emp.contractStatus}</td>
        <td>${emp.contractType}</td>
        <td>${emp.workType}</td>
        <td>${emp.phone}</td>
        <td>${emp.birth}</td>
      </tr>
    `).join('');
  }

  // ===== UPDATE FILTER UI =====
  function updateFilterUI() {
    // Status button label
    document.getElementById('statusBtnLabel').textContent = STATUS_LABELS[filterStatus] || 'Đang làm việc';

    // Highlight active status option
    ['active','inactive','all'].forEach(v => {
      const el = document.getElementById('statusOpt_' + v);
      if (!el) return;
      if (v === filterStatus) {
        el.style.color = 'var(--primary-dark)'; el.style.fontWeight = '600'; el.style.background = '#f0f0fe';
      } else {
        el.style.color = '#2A3547'; el.style.fontWeight = '400'; el.style.background = 'white';
      }
    });

    // Unit button label
    document.getElementById('unitBtnLabel').textContent = filterUnit || 'Chọn đơn vị';

    // Build active filter chips
    const chips = [];
    if (filterStatus && filterStatus !== 'all') chips.push({ label: STATUS_LABELS[filterStatus], type: 'status' });
    if (filterUnit) chips.push({ label: filterUnit, type: 'unit' });

    const bar = document.getElementById('activeFilterBar');
    const container = document.getElementById('filterChipsContainer');
    bar.style.display = chips.length ? 'flex' : 'none';
    container.innerHTML = chips.map(c =>
      `<span class="filter-chip-active">${c.label}
        <button onclick="removeFilter('${c.type}')" style="background:none;border:none;cursor:pointer;color:white;font-size:14px;line-height:1;padding:0 0 0 4px;display:flex;align-items:center;">×</button>
      </span>`
    ).join('');
  }

  // ===== FILTER ACTIONS =====
  function filterTable(q) {
    filterSearch = q.trim();
    applyFilters();
  }

  function selectStatus(val) {
    filterStatus = val;
    document.getElementById('statusDrop').style.display = 'none';
    applyFilters();
  }

  function selectUnit(val) {
    filterUnit = val;
    document.getElementById('unitDrop').style.display = 'none';
    applyFilters();
  }

  function removeFilter(type) {
    if (type === 'all') {
      filterStatus = 'all';
      filterUnit   = '';
      filterSearch = '';
      const inp = document.querySelector('.search-box input');
      if (inp) inp.value = '';
    } else if (type === 'status') {
      filterStatus = 'all';
    } else if (type === 'unit') {
      filterUnit = '';
    }
    applyFilters();
  }

  // ===== POPULATE UNIT DROPDOWN =====
  function populateUnitDropdown() {
    const units = [...new Set(employees.map(e => e.unitFull).filter(u => u && u !== '—'))].sort();
    const container = document.getElementById('unitDropItems');
    container.innerHTML = '';

    const makeItem = (label, val, isAll) => {
      const div = document.createElement('div');
      div.textContent = label;
      div.style.cssText = 'padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;color:#2A3547;';
      div.addEventListener('mouseover', () => { div.style.background = '#F2F6FA'; });
      div.addEventListener('mouseout',  () => { div.style.background = 'white'; });
      div.addEventListener('click', () => selectUnit(val));
      return div;
    };

    container.appendChild(makeItem('Tất cả đơn vị', ''));
    units.forEach(u => container.appendChild(makeItem(u, u)));
  }

  // ===== DRAWER =====
  let currentDrawerEmpId = null;

  function openDrawer(id) {
    currentDrawerEmpId = id;
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('drawerAvatar').src = emp.avatar;
    document.getElementById('drawerName').textContent = emp.name;
    document.getElementById('drawerCode').textContent = emp.code;

    document.getElementById('dName').textContent = emp.name;
    document.getElementById('dCode').textContent = emp.code;
    document.getElementById('dBirth').textContent = emp.birth;
    document.getElementById('dGender').textContent = emp.gender;
    document.getElementById('dPhone').textContent = emp.phone;
    document.getElementById('dEmail').textContent = emp.email;
    document.getElementById('dID').textContent = emp.idCard;
    document.getElementById('dUnit').textContent = emp.unitFull;
    document.getElementById('dPosition').textContent = emp.positionFull;
    document.getElementById('dManager').textContent = emp.manager;
    document.getElementById('dStartDate').textContent = emp.startDate;
    document.getElementById('dWorkType').textContent = emp.workType;

    document.getElementById('dContractType').textContent = emp.contractType;
    document.getElementById('dContractStatus').textContent = emp.contractStatus;
    document.getElementById('dContractDate').textContent = emp.contractDate;
    document.getElementById('dContractExpiry').textContent = emp.contractExpiry;

    // Load contract history
    loadContractHistory(emp.id);

    document.getElementById('dSalary').textContent = emp.salary;
    document.getElementById('dAllowance').textContent = emp.allowance;
    document.getElementById('dLeave').textContent = emp.leave;

    switchTabById('infoTab');
    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('empDrawer').classList.add('open');
  }

  function closeDrawer() {
    document.getElementById('drawerOverlay').classList.remove('open');
    document.getElementById('empDrawer').classList.remove('open');
  }

  function switchTab(btn, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['infoTab','contractTab','payTab'].forEach(id => {
      document.getElementById(id).style.display = id === tabId ? 'block' : 'none';
    });
  }

  function switchTabById(tabId) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      b.classList.toggle('active', ['infoTab','contractTab','payTab'][i] === tabId);
    });
    ['infoTab','contractTab','payTab'].forEach(id => {
      document.getElementById(id).style.display = id === tabId ? 'block' : 'none';
    });
  }

  function loadContractHistory(empId) {
    var emp = DB.employees.getById(empId);
    var historyList = document.getElementById('contractHistoryList');

    if (!emp) {
      historyList.innerHTML = '<div style="padding:12px;text-align:center;color:#7C8FAC;">Không có dữ liệu hợp đồng</div>';
      return;
    }

    var history = [];
    var startDate     = emp.startDate       || '';
    var contractType  = emp.contractType    || 'Hợp đồng lao động';
    var contractEndDate = emp.contractEndDate || null;

    // Trạng thái hợp đồng hiện tại
    var isActive = !contractEndDate || new Date(contractEndDate) >= new Date();
    var currentStatus = isActive ? 'Đang hiệu lực' : 'Hết hiệu lực';

    // Nếu nhân viên có lịch sử lương — mỗi kỳ lương là 1 mốc tồn tại
    var salaryRecords = (DB.salary.getAll() || [])
      .filter(function(r){ return r.employeeId === empId; })
      .sort(function(a,b){ return a.period > b.period ? 1 : -1; });

    var earliestSalaryPeriod = salaryRecords.length ? salaryRecords[0].period : null;

    // Hợp đồng thử việc: 2 tháng đầu kể từ startDate (nếu có)
    if (startDate) {
      var probeEnd = addMonths(startDate, 2);
      var probeDone = new Date(probeEnd) < new Date();
      if (probeDone) {
        history.push({ type: 'Hợp đồng thử việc (2 tháng)', status: 'Hết hiệu lực', startDate: startDate, endDate: probeEnd });
      }
    }

    // Hợp đồng chính — đọc từ dữ liệu thực của nhân viên
    history.push({
      type: contractType,
      status: currentStatus,
      startDate: startDate ? addMonths(startDate, 2) : (startDate || '—'),
      endDate: contractEndDate || (isActive ? null : '—')
    });

    // Nếu không có lịch sử thử việc, chỉ hiện hợp đồng hiện tại từ ngày vào
    if (history.length === 1 && startDate) {
      history[0].startDate = startDate;
    }

    historyList.innerHTML = history.map(function(h, i) {
      var isLast = (i === history.length - 1);
      var isActive = h.status === 'Đang hiệu lực';
      var bg   = isActive ? '#f0fdf4' : '#fef3c7';
      var col  = isActive ? '#16a34a' : '#d97706';
      var sd   = h.startDate && h.startDate !== '—' ? h.startDate.split('-').reverse().join('/') : '—';
      var ed   = h.endDate   && h.endDate   !== '—' ? h.endDate.split('-').reverse().join('/')   : '—';
      return '<div style="padding:10px 12px;' + (isLast ? '' : 'border-bottom:1px solid #e5eaef;') + 'display:flex;align-items:center;justify-content:space-between;">' +
        '<div>' +
          '<div style="font-weight:600;color:#2A3547;font-size:12.5px;">' + h.type + '</div>' +
          '<div style="font-size:11px;color:#7C8FAC;margin-top:2px;">Từ ' + sd + (ed !== '—' ? ' đến ' + ed : ' (đến nay)') + '</div>' +
        '</div>' +
        '<div style="background:' + bg + ';color:' + col + ';padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;">' + h.status + '</div>' +
      '</div>';
    }).join('');
  }

  // Helper: add N months to ISO date string, return ISO date string
  function addMonths(isoDate, n) {
    if (!isoDate || isoDate === '—') return '—';
    var d = new Date(isoDate);
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }

  // ===== EDIT DRAWER =====
  function openEditDrawer() {
    if (!currentDrawerEmpId) return;
    var emp = DB.employees.getById(currentDrawerEmpId);
    if (!emp) return;
    document.getElementById('editName').value     = emp.name     || '';
    document.getElementById('editPhone').value    = emp.phone    || '';
    document.getElementById('editEmail').value    = emp.email    || '';
    document.getElementById('editPosition').value = emp.position || '';
    document.getElementById('editUnit').value     = emp.unit     || '';
    document.getElementById('editEmpModal').style.display = 'flex';
  }

  function closeEditModal() {
    document.getElementById('editEmpModal').style.display = 'none';
  }

  function saveEditDrawer() {
    if (!currentDrawerEmpId) return;
    var name  = document.getElementById('editName').value.trim();
    var phone = document.getElementById('editPhone').value.trim();
    var email = document.getElementById('editEmail').value.trim();
    var pos   = document.getElementById('editPosition').value.trim();
    var unit  = document.getElementById('editUnit').value.trim();
    if (!name) { DB.utils.showToast('Họ tên không được để trống', 'error'); return; }

    DB.employees.update(currentDrawerEmpId, { name, phone, email, position: pos, unit });

    // Cập nhật ngay trên drawer
    document.getElementById('drawerName').textContent = name;
    document.getElementById('dName').textContent      = name;
    document.getElementById('dPhone').textContent     = phone || '—';
    document.getElementById('dEmail').textContent     = email || '—';
    document.getElementById('dPosition').textContent  = pos   || '—';
    document.getElementById('dUnit').textContent      = unit  || '—';

    // Cập nhật lại mảng employees (để table refresh đúng)
    var idx = employees.findIndex(function(e){ return e.id === currentDrawerEmpId; });
    if (idx !== -1) {
      employees[idx].name        = name;
      employees[idx].phone       = phone || '—';
      employees[idx].email       = email || '—';
      employees[idx].positionFull = pos || '—';
      employees[idx].position     = pos.length > 18 ? pos.slice(0,18)+'...' : (pos || '—');
      employees[idx].unitFull     = unit || '';
      employees[idx].unit         = unit.length > 16 ? unit.slice(0,16)+'...' : (unit || '—');
    }
    applyFilters();
    closeEditModal();
    DB.utils.showToast('Đã cập nhật thông tin nhân viên');
  }

  function viewFullProfile() {
    window.location.href = 'danh-sach-nhan-vien.html';
  }

  // ===== DROPDOWNS =====
  function toggleDropdown(id) {
    const el = document.getElementById(id);
    const isOpen = el.style.display !== 'none';
    document.querySelectorAll('[id$="Drop"]').forEach(d => d.style.display = 'none');
    el.style.display = isOpen ? 'none' : 'block';
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('[onclick*="Drop"]') && !e.target.closest('[id$="Drop"]')) {
      document.querySelectorAll('[id$="Drop"]').forEach(d => d.style.display = 'none');
    }
  });

  // ===== INIT =====
  populateUnitDropdown();
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

// ==================== TOPBAR SEARCH ====================
function topbarSearchHandle(q) {
  if (typeof filterTable === 'function') filterTable(q);
}
