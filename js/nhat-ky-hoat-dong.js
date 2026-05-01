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
  var tbody = document.getElementById('auditTbody');
  var filter = document.getElementById('filterInput');
  var clearBtn = document.getElementById('clearLogsBtn');
  var pageInfo = document.getElementById('pageInfo');
  var pageControls = document.getElementById('pageControls');
  
  var currentPage = 1;
  var itemsPerPage = 10;
  
  function render() {
    if (!tbody) return;
    var logs = DB.audit.getAll() || [];
    var q = filter && filter.value && filter.value.trim().toLowerCase();
    if (q) {
      logs = logs.filter(function(l){
        return (l.actorName||'').toLowerCase().indexOf(q) !== -1 || (l.module||'').toLowerCase().indexOf(q) !== -1 || (l.action||'').toLowerCase().indexOf(q) !== -1 || (l.detail||'').toLowerCase().indexOf(q) !== -1 || (l.targetName||'').toLowerCase().indexOf(q) !== -1;
      });
    }
    
    var totalItems = logs.length;
    var totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    var pagedLogs = logs.slice(startIndex, endIndex);
    
    tbody.innerHTML = pagedLogs.map(function(l){
      return '<tr>' +
        '<td style="padding:10px;white-space:nowrap;">' + (DB.utils.formatDate((l.timestamp||'').slice(0,10)) + ' ' + ((l.timestamp||'').slice(11,19) || '')) + '</td>' +
        '<td style="padding:10px;">' + (l.actorName || l.actorId || 'Hệ thống') + '<div style="font-size:11px;color:#7C8FAC;">' + (l.actorRole||'') + '</div></td>' +
        '<td style="padding:10px;">' + (l.module || '') + ' · ' + (l.action || '') + '</td>' +
        '<td style="padding:10px;">' + (l.targetName || l.targetId || '') + '</td>' +
        '<td style="padding:10px;">' + (l.detail || '') + '</td>' +
      '</tr>';
    }).join('');
    
    // Update pagination info
    if (pageInfo) {
      pageInfo.textContent = 'Hiển thị ' + (startIndex + 1) + '–' + endIndex + ' trong ' + totalItems + ' mục';
    }
    
    // Build pagination controls
    if (pageControls) {
      pageControls.innerHTML = '';
      var btnStyle = 'padding:6px 10px;border:1px solid #e5eaef;border-radius:5px;background:white;cursor:pointer;font-size:12px;color:#2A3547;transition:all 0.12s;font-family:inherit;';
      var disabledStyle = btnStyle + 'opacity:0.5;cursor:not-allowed;';
      
      // Previous button
      pageControls.innerHTML += '<button style="' + (currentPage === 1 ? disabledStyle : btnStyle) + '" ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="window.__changePage(' + (currentPage - 1) + ')">Trước</button>';
      
      // Page numbers
      var startPage = Math.max(1, currentPage - 1);
      var endPage = Math.min(totalPages, currentPage + 1);
      
      if (startPage > 1) {
        pageControls.innerHTML += '<button style="' + btnStyle + '" onclick="window.__changePage(1)">1</button>';
      }
      if (startPage > 2) {
        pageControls.innerHTML += '<span style="padding:6px 4px;color:#7C8FAC;">...</span>';
      }
      
      for (var i = startPage; i <= endPage; i++) {
        var isCurrent = i === currentPage;
        var activeStyle = isCurrent ? btnStyle + 'background:#ECF2FF;color:#5D87FF;border-color:#5D87FF;font-weight:600;' : btnStyle;
        pageControls.innerHTML += '<button style="' + activeStyle + '" onclick="window.__changePage(' + i + ')">' + i + '</button>';
      }
      
      if (endPage < totalPages && totalPages > 0) {
        pageControls.innerHTML += '<span style="padding:6px 4px;color:#7C8FAC;">...</span>';
      }
      
      if (endPage < totalPages) {
        pageControls.innerHTML += '<button style="' + btnStyle + '" onclick="window.__changePage(' + totalPages + ')">' + totalPages + '</button>';
      }
      
      // Next button
      pageControls.innerHTML += '<button style="' + (currentPage === totalPages || totalPages === 0 ? disabledStyle : btnStyle) + '" ' + (currentPage === totalPages || totalPages === 0 ? 'disabled' : '') + ' onclick="window.__changePage(' + (currentPage + 1) + ')">Sau</button>';
    }
  }
  
  window.__changePage = function(page) {
    currentPage = page;
    render();
  };
  
  if (filter) filter.addEventListener('input', function(){ currentPage = 1; render(); });
  if (clearBtn) clearBtn.addEventListener('click', function(){
    showConfirm('Xoá toàn bộ nhật ký? Hành động này không thể hoàn tác.', function(){ DB.audit.clear(); DB.utils.showToast('Đã xoá nhật ký'); currentPage = 1; render(); }, { title:'Xác nhận', okText:'Xoá', danger:true });
  });
  render();
  window.addEventListener('humi_synced', function() { currentPage = 1; render(); });
});
