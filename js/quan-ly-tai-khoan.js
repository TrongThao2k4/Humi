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

// ==================== LOGOUT ====================
function doLogout() {
  DB.auth.logout();
  window.location.href = '../login.html';
}

// ==================== LOAD USER INFO ====================
(function() {
  var s = null;
  try { s = JSON.parse(localStorage.getItem('humi_session')); } catch(e) {}
  var currentUser = (s && s.user) ? s.user : { id: 'admin', name: 'Admin', position: 'Quản trị hệ thống', roleId: 'admin' };

  function loadUserInfo() {
    try {
      var employees = (DB.employees && DB.employees.getAll) ? DB.employees.getAll() : [];
      var emp = employees.find(function(e){ return e.id === currentUser.id; });
      
      var name = (emp && emp.name) ? emp.name : (currentUser.name || 'Admin');
      var role = (emp && emp.position) ? emp.position : (currentUser.position || 'Quản trị hệ thống');
      var _sk = 'humi_user_settings_' + currentUser.id;
      var _st = {}; 
      try { _st = JSON.parse(localStorage.getItem(_sk)) || {}; } catch(e) {}
      var avatar = (_st && _st.avatar) ? _st.avatar : ((emp && emp.avatar) ? emp.avatar : '');
      
      var el1 = document.getElementById('topbarAvatar'); if(el1) el1.src = avatar || 'https://i.pravatar.cc/32?img=47';
      var el2 = document.getElementById('topbarName'); if(el2) el2.textContent = name || 'Admin';
      var el3 = document.getElementById('topbarRole'); if(el3) el3.textContent = role || 'Quản trị hệ thống';
      var el4 = document.getElementById('dropdownAvatar'); if(el4) el4.src = avatar || 'https://i.pravatar.cc/36?img=47';
      var el5 = document.getElementById('dropdownName'); if(el5) el5.textContent = name || 'Admin';
      var el6 = document.getElementById('dropdownRole'); if(el6) el6.textContent = role || 'Quản trị hệ thống';
    } catch(e) { console.error('Error loading user info:', e); }
  }

  loadUserInfo();
  window.addEventListener('humi_synced', loadUserInfo);
})();

document.addEventListener('DOMContentLoaded', function(){
  var currentPage = 1;
  var itemsPerPage = 10;
  var searchTerm = '';
  var accountModalState = { mode: 'add', employeeId: null };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInitials(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function(part) { return part.charAt(0).toUpperCase(); })
      .join('') || 'NA';
  }

  function getRoleMeta(emp) {
    var roleId = String((emp && emp.roleId) || '').toLowerCase();
    var position = String((emp && emp.position) || '').toLowerCase();

    if (roleId === 'admin' || position.indexOf('quản trị') !== -1) {
      return { label: 'Quản trị viên', className: 'role-admin' };
    }
    if (roleId === 'manager' || position.indexOf('quản lý') !== -1) {
      return { label: 'Quản lý', className: 'role-manager' };
    }
    return { label: 'Nhân viên', className: 'role-employee' };
  }

  function getAccountStatusMeta(locked) {
    return locked
      ? { label: 'Đã khóa', className: 'locked', dot: true }
      : { label: 'Hoạt động', className: 'active', dot: true };
  }

  function getAvatarClass(index) {
    var classes = ['', 'avatar-alt-1', 'avatar-alt-2', 'avatar-alt-3'];
    return classes[index % classes.length] || '';
  }

  function lockIcon() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
  }

  function editIcon() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 114 4L7 21l-4 1 1-4 13-15z"/><path d="M15 5l4 4"/></svg>';
  }

  function resetIcon() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/></svg>';
  }

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchTerm = e.target.value.toLowerCase().trim();
      currentPage = 1;
      renderAccounts();
    });
  }

  function renderAccounts() {
    var tbody = document.getElementById('accountsTbody');
    var paginationDiv = document.getElementById('pagination');
    var pageInfoDiv = document.getElementById('pageInfo');
    var pageControlsDiv = document.getElementById('pageControls');
    if (!tbody) return;

    var rows = DB.accounts.getAll() || [];
    
    // Filter by search term
    if (searchTerm) {
      rows = rows.filter(function(r) {
        var emp = r.employee || {};
        var name = (emp.name || '').toLowerCase();
        var code = (emp.code || '').toLowerCase();
        return name.includes(searchTerm) || code.includes(searchTerm);
      });
    }

    var totalItems = rows.length;
    var totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    var pagedRows = rows.slice(startIndex, endIndex);

    tbody.innerHTML = pagedRows.map(function(r, index){
      var emp = r.employee || {};
      var roleMeta = getRoleMeta(emp);
      var statusMeta = getAccountStatusMeta(r.locked);
      var avatarClass = getAvatarClass(startIndex + index);
      var name = emp.name || r.employeeId;
      var code = emp.code || r.employeeId;
      var unit = emp.unit || '—';
      return '<tr class="account-row">' +
        '<td>' +
          '<div class="account-person">' +
            '<div class="account-avatar ' + avatarClass + '">' + escapeHtml(getInitials(name)) + '</div>' +
            '<div>' +
              '<div class="account-name">' + escapeHtml(name) + '</div>' +
              '<div class="account-code">' + escapeHtml(code) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<span class="role-pill ' + roleMeta.className + '">' + escapeHtml(roleMeta.label) + '</span>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<span style="font-size:13px;color:#2A3547;font-weight:500;">' + escapeHtml(unit) + '</span>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<span class="status-pill ' + statusMeta.className + '">' +
            (statusMeta.dot ? '<span class="status-dot"></span>' : '') +
            escapeHtml(statusMeta.label) +
          '</span>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div class="account-actions">' +
            '<button type="button" class="icon-action icon-action-edit" title="Chỉnh sửa" aria-label="Chỉnh sửa tài khoản" onclick="window.__editAccount(\'' + r.employeeId + '\')">' + editIcon() + '</button>' +
            '<button type="button" class="icon-action icon-action-lock" title="' + (r.locked ? 'Mở khóa' : 'Khóa') + '" aria-label="' + (r.locked ? 'Mở khóa' : 'Khóa') + ' tài khoản" onclick="window.__lockAccount(\'' + r.employeeId + '\', ' + (!r.locked) + ')">' + lockIcon() + '</button>' +
            '<button type="button" class="icon-action icon-action-reset" title="Đặt lại mật khẩu" aria-label="Đặt lại mật khẩu" onclick="window.__resetPwd(\'' + r.employeeId + '\')">' + resetIcon() + '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    if (totalItems === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:#7C8FAC;">Không tìm thấy tài khoản nào</td></tr>';
    }

    // Render Pagination Controls
    if (pageInfoDiv) {
      pageInfoDiv.textContent = 'Hiển thị ' + (totalItems === 0 ? 0 : startIndex + 1) + ' - ' + endIndex + ' trong số ' + totalItems + ' tài khoản';
    }

    if (pageControlsDiv) {
      if (paginationDiv) {
        paginationDiv.style.display = totalItems > itemsPerPage ? 'flex' : 'none';
      }

      if (totalItems <= itemsPerPage) {
        pageControlsDiv.innerHTML = '';
        return;
      }

      var controlsHTML = '';
      var btnStyle = 'padding:6px 12px;border:1px solid #e5eaef;border-radius:5px;background:white;color:#5A6A85;cursor:pointer;font-size:13px;transition:all 0.2s;';
      var disabledStyle = btnStyle + 'opacity:0.5;cursor:not-allowed;';
      
      controlsHTML += '<button style="'+(currentPage === 1 ? disabledStyle : btnStyle)+'" '+(currentPage === 1 ? 'disabled' : '')+' onclick="window.__changePage('+(currentPage - 1)+')">Trước</button>';
      
      var startPage = Math.max(1, currentPage - 2);
      var endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        controlsHTML += '<span style="padding:6px 4px;color:#7C8FAC;">...</span>';
      }
      
      for (var i = startPage; i <= endPage; i++) {
        var isCurrent = i === currentPage;
        var activeStyle = isCurrent ? btnStyle + 'background:#ECF2FF;color:#5D87FF;border-color:#5D87FF;font-weight:600;' : btnStyle;
        controlsHTML += '<button style="'+activeStyle+'" onclick="window.__changePage('+i+')">'+i+'</button>';
      }

      if (endPage < totalPages && totalPages > 0) {
        controlsHTML += '<span style="padding:6px 4px;color:#7C8FAC;">...</span>';
      }

      controlsHTML += '<button style="'+(currentPage === totalPages || totalPages === 0 ? disabledStyle : btnStyle)+'" '+(currentPage === totalPages || totalPages === 0 ? 'disabled' : '')+' onclick="window.__changePage('+(currentPage + 1)+')">Sau</button>';
      pageControlsDiv.innerHTML = controlsHTML;
    }
  }

  window.__changePage = function(page) {
    currentPage = page;
    renderAccounts();
  };

  window.__lockAccount = function(employeeId, lockFlag) {
    showConfirm(lockFlag? 'Khóa tài khoản này?':'Mở khóa tài khoản này?', function(){
      var res = DB.accounts.setLocked(employeeId, !!lockFlag);
      if (res && res.ok !== false) {
        DB.utils.showToast(lockFlag? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        renderAccounts();
      } else {
        DB.utils.showToast((res && res.error) || 'Không thể thay đổi trạng thái', 'error');
      }
    }, { title: 'Xác nhận', okText: lockFlag? 'Khóa' : 'Mở khóa', danger: lockFlag });
  };

  window.__resetPwd = function(employeeId) {
    showConfirm('Đặt lại mật khẩu mặc định (123456) cho tài khoản này?', function(){
      var res = DB.accounts.setPassword(employeeId, '123456');
      if (res && res.ok) {
        DB.utils.showToast('Đã đặt lại mật khẩu');
      } else {
        DB.utils.showToast((res && res.error) || 'Không thể đặt lại mật khẩu', 'error');
      }
    }, { title:'Xác nhận', okText:'Đặt lại', danger:false });
  };

  window.__editAccount = function(employeeId) {
    var account = DB.accounts.getByEmployeeId(employeeId);
    var emp = (DB.employees && DB.employees.getById) ? DB.employees.getById(employeeId) : null;
    if (!emp && account && account.employee) emp = account.employee;
    if (!emp) {
      DB.utils.showToast('Không tìm thấy tài khoản cần cập nhật', 'error');
      return;
    }
    buildUnitOptions();
    buildPositionOptions();
    buildManagerOptions();
    hideAddAccountError();

    accountModalState.mode = 'edit';
    accountModalState.employeeId = employeeId;

    var modal = document.getElementById('addAccountModal');
    var title = document.getElementById('addAccountModalTitle');
    var saveBtn = document.getElementById('addAccountModalSaveBtn');
    if (title) title.textContent = 'Cập nhật tài khoản';
    if (saveBtn) saveBtn.textContent = 'Cập nhật tài khoản';

    var nName = document.getElementById('aName'); if (nName) nName.value = emp.name || '';
    var nEmail = document.getElementById('aEmail'); if (nEmail) nEmail.value = emp.email || '';
    var nPhone = document.getElementById('aPhone'); if (nPhone) nPhone.value = emp.phone || '';
    var nUnit = document.getElementById('aUnit'); if (nUnit) nUnit.value = emp.unit || '';
    var nStatus = document.getElementById('aStatus'); if (nStatus) nStatus.value = emp.status || 'active';
    var nPosition = document.getElementById('aPosition'); if (nPosition) nPosition.value = emp.position || '';
    var nManager = document.getElementById('aManager'); if (nManager) nManager.value = emp.managerName || '';
    var nStart = document.getElementById('aStartDate'); if (nStart) nStart.value = emp.startDate || '';
    var nDob = document.getElementById('aDob'); if (nDob) nDob.value = emp.dob || '';
    var nMode = document.getElementById('aWorkMode'); if (nMode) nMode.value = emp.workMode || 'Toàn thời gian';

    if (modal) modal.style.display = 'flex';
  };

  function showAddAccountError(message) {
    var el = document.getElementById('addAccountFormErr');
    if (!el) {
      DB.utils.showToast(message, 'error');
      return;
    }
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideAddAccountError() {
    var el = document.getElementById('addAccountFormErr');
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function buildUnitOptions() {
    var units = [];
    try {
      units = (DB.employees.getAll() || [])
        .map(function(e) { return e.unit; })
        .filter(Boolean)
        .filter(function(unit, index, arr) { return arr.indexOf(unit) === index; })
        .sort();
    } catch (e) {}

    var select = document.getElementById('aUnit');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn đơn vị --</option>' + units.map(function(unit) {
      return '<option value="' + escapeHtml(unit) + '">' + escapeHtml(unit) + '</option>';
    }).join('');
  }

  function buildPositionOptions() {
    var positions = [];
    try {
      positions = (DB.employees.getAll() || [])
        .map(function(e) { return e.position; })
        .filter(Boolean)
        .filter(function(position, index, arr) { return arr.indexOf(position) === index; })
        .sort();
    } catch (e) {}

    var select = document.getElementById('aPosition');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn vị trí công việc --</option>' + positions.map(function(position) {
      return '<option value="' + escapeHtml(position) + '">' + escapeHtml(position) + '</option>';
    }).join('');
  }

  function buildManagerOptions() {
    var managers = [];
    try {
      managers = (DB.employees.getAll() || [])
        .map(function(e) { return e.managerName || e.name; })
        .filter(Boolean)
        .filter(function(manager, index, arr) { return arr.indexOf(manager) === index; })
        .sort();
    } catch (e) {}

    var select = document.getElementById('aManager');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn quản lý trực tiếp --</option>' + managers.map(function(manager) {
      return '<option value="' + escapeHtml(manager) + '">' + escapeHtml(manager) + '</option>';
    }).join('');
  }

  window.closeAddAccountModal = function() {
    var modal = document.getElementById('addAccountModal');
    if (modal) modal.style.display = 'none';
    accountModalState.mode = 'add';
    accountModalState.employeeId = null;
    var title = document.getElementById('addAccountModalTitle');
    if (title) title.textContent = 'Thêm tài khoản mới';
    var saveBtn = document.getElementById('addAccountModalSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Thêm tài khoản';
    hideAddAccountError();
  };

  window.saveNewAccount = function() {
    var name = document.getElementById('aName').value.trim();
    var email = document.getElementById('aEmail').value.trim();
    var phone = document.getElementById('aPhone').value.trim();
    var unit = document.getElementById('aUnit').value;
    var status = document.getElementById('aStatus').value;
    var position = document.getElementById('aPosition').value.trim() || 'Nhân viên';
    var managerName = document.getElementById('aManager').value.trim() || '—';
    var startDate = document.getElementById('aStartDate').value || new Date().toISOString().slice(0, 10);
    var dob = document.getElementById('aDob').value || null;
    var workMode = document.getElementById('aWorkMode').value;

    hideAddAccountError();

    if (!name) return showAddAccountError('Vui lòng nhập họ và tên');
    if (!email) return showAddAccountError('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAddAccountError('Email không đúng định dạng');
    if (!phone) return showAddAccountError('Vui lòng nhập số điện thoại');
    if (phone.replace(/\D/g, '').length < 9) return showAddAccountError('Số điện thoại phải có ít nhất 9 chữ số');
    if (!unit) return showAddAccountError('Vui lòng chọn đơn vị');

    var duplicateEmail = (DB.employees.getAll() || []).find(function(e) {
      return e.email && e.email.toLowerCase() === email.toLowerCase() && e.id !== accountModalState.employeeId;
    });
    if (duplicateEmail) return showAddAccountError('Email này đã được sử dụng bởi nhân viên khác');

    var btn = document.getElementById('addAccountModalSaveBtn');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }

    var isEdit = accountModalState.mode === 'edit' && !!accountModalState.employeeId;

    try {
      if (isEdit) {
        DB.employees.update(accountModalState.employeeId, {
          name: name,
          email: email,
          phone: phone,
          unit: unit,
          status: status,
          position: position,
          managerName: managerName,
          startDate: startDate,
          dob: dob,
          workMode: workMode
        });
      } else {
        DB.employees.create({
          name: name,
          email: email,
          phone: phone,
          unit: unit,
          status: status,
          position: position,
          managerName: managerName,
          startDate: startDate,
          dob: dob,
          workMode: workMode,
          contractStatus: 'Đã có hợp đồng',
          contractType: 'Hợp đồng đào tạo',
          roleId: 'employee'
        });
      }
      renderAccounts();
      window.closeAddAccountModal();
      DB.utils.showToast(isEdit ? 'Đã cập nhật tài khoản' : 'Đã thêm tài khoản mới thành công');
    } catch (err) {
      DB.utils.showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }
  };

  window.__openAddAccount = function() {
    buildUnitOptions();
    buildPositionOptions();
    buildManagerOptions();
    hideAddAccountError();
    accountModalState.mode = 'add';
    accountModalState.employeeId = null;
    var form = document.getElementById('addAccountModal');
    var title = document.getElementById('addAccountModalTitle');
    var saveBtn = document.getElementById('addAccountModalSaveBtn');
    if (title) title.textContent = 'Thêm tài khoản mới';
    if (saveBtn) saveBtn.textContent = 'Thêm tài khoản';
    if (!form) return;
    ['aName','aEmail','aPhone','aDob'].forEach(function(id) {
      var input = document.getElementById(id);
      if (input) input.value = '';
    });
    var position = document.getElementById('aPosition'); if (position) position.value = '';
    var manager = document.getElementById('aManager'); if (manager) manager.value = '';
    var status = document.getElementById('aStatus'); if (status) status.value = 'active';
    var workMode = document.getElementById('aWorkMode'); if (workMode) workMode.value = 'Toàn thời gian';
    var startDate = document.getElementById('aStartDate'); if (startDate) startDate.value = new Date().toISOString().slice(0, 10);
    form.style.display = 'flex';
  };

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeAddAccountModal();
  });

  renderAccounts();
  // Re-render when DB sync occurs
  window.addEventListener('humi_synced', renderAccounts);
});
