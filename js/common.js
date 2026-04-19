/**
 * common.js — Shared utilities for all Humi pages
 * Improvements: role-based sidebar, confirm dialog, mobile sidebar, skeleton loader
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1. ROLE-BASED SIDEBAR FILTERING
  // Hide manager-only sidebar links for regular employees
  // ─────────────────────────────────────────────
  var MGR_HREF_PATTERNS = ['duyet-cong', 'danh-sach-phieu-nghi', 'danh-sach-nhan-vien'];

  function applyRoleSidebar() {
    var sess = null;
    try { sess = JSON.parse(localStorage.getItem('humi_session')); } catch (e) {}
    if (!sess || !sess.user) return;
    var roleId = sess.user.roleId;
    if (roleId === 'manager' || roleId === 'admin') return;

    document.querySelectorAll('nav a.sidebar-item, nav a[href]').forEach(function (el) {
      var href = (el.getAttribute('href') || '').toLowerCase();
      if (MGR_HREF_PATTERNS.some(function (p) { return href.indexOf(p) !== -1; })) {
        el.style.display = 'none';
      }
    });
  }

  // ─────────────────────────────────────────────
  // 2. CONFIRM DIALOG
  // Usage: showConfirm('Bạn chắc chắn?', function(){ /* on yes */ }, { title:'...', okText:'Xóa', danger:true })
  // ─────────────────────────────────────────────
  function _buildConfirmDialog() {
    if (document.getElementById('_humiCfmOvl')) return;
    var ovl = document.createElement('div');
    ovl.id = '_humiCfmOvl';
    ovl.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;';
    ovl.innerHTML =
      '<div style="background:white;border-radius:16px;padding:28px 32px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2);text-align:center;">'
      + '<div id="_humiCfmIcon" style="width:52px;height:52px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">'
      + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      + '</div>'
      + '<h3 id="_humiCfmTitle" style="font-size:16px;font-weight:700;color:#2A3547;margin:0 0 8px;">Xác nhận</h3>'
      + '<p id="_humiCfmMsg" style="font-size:13px;color:#7C8FAC;margin:0 0 24px;line-height:1.6;"></p>'
      + '<div style="display:flex;gap:10px;">'
      + '<button id="_humiCfmCancel" style="flex:1;padding:10px 0;border-radius:8px;border:1.5px solid #e5eaef;background:white;font-size:13px;font-weight:600;color:#5A6A85;cursor:pointer;font-family:inherit;">Hủy</button>'
      + '<button id="_humiCfmOk" style="flex:1;padding:10px 0;border-radius:8px;border:none;background:#ef4444;font-size:13px;font-weight:600;color:white;cursor:pointer;font-family:inherit;">Xác nhận</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ovl);
    ovl.addEventListener('click', function (e) { if (e.target === ovl) ovl.style.display = 'none'; });
  }

  window.showConfirm = function (msg, onConfirm, opts) {
    _buildConfirmDialog();
    opts = opts || {};
    var ovl = document.getElementById('_humiCfmOvl');
    document.getElementById('_humiCfmTitle').textContent = opts.title || 'Xác nhận';
    document.getElementById('_humiCfmMsg').textContent = msg;
    var okBtn = document.getElementById('_humiCfmOk');
    okBtn.textContent = opts.okText || 'Xác nhận';
    okBtn.style.background = opts.danger === false ? '#5D87FF' : '#ef4444';
    ovl.style.display = 'flex';

    var newOk = okBtn.cloneNode(true);
    var newCancel = document.getElementById('_humiCfmCancel').cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    document.getElementById('_humiCfmCancel').parentNode.replaceChild(newCancel, document.getElementById('_humiCfmCancel'));

    newOk.addEventListener('click', function () {
      ovl.style.display = 'none';
      if (typeof onConfirm === 'function') onConfirm();
    });
    newCancel.addEventListener('click', function () { ovl.style.display = 'none'; });
  };

  // ─────────────────────────────────────────────
  // 3. MOBILE SIDEBAR (responsive)
  // ─────────────────────────────────────────────
  function initMobileSidebar() {
    var style = document.createElement('style');
    style.textContent =
      '@media(max-width:768px){'
      + 'aside.sidebar,aside.bg-white.card{position:fixed!important;left:0!important;top:0!important;height:100dvh!important;width:240px!important;z-index:1000;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);}'
      + 'aside.sidebar.mob-open,aside.bg-white.mob-open{transform:translateX(0)!important;}'
      + '#_humiSideOvl{display:none;position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:999;}'
      + '#_humiSideOvl.mob-open{display:block!important;}'
      + '#_humiHamBtn{display:flex!important;}'
      + '}'
      + '#_humiHamBtn{display:none;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:none;background:transparent;cursor:pointer;border-radius:7px;flex-shrink:0;}';
    document.head.appendChild(style);

    var sideOvl = document.createElement('div');
    sideOvl.id = '_humiSideOvl';
    sideOvl.onclick = window.closeMobSidebar;
    document.body.appendChild(sideOvl);

    var btn = document.createElement('button');
    btn.id = '_humiHamBtn';
    btn.setAttribute('aria-label', 'Mở menu');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A3547" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    btn.onclick = window.toggleMobSidebar;

    var topbar = document.querySelector('header.topbar, .topbar');
    if (topbar) topbar.insertBefore(btn, topbar.firstChild);
  }

  window.toggleMobSidebar = function () {
    var sb = document.querySelector('aside.sidebar, aside.bg-white');
    var ovl = document.getElementById('_humiSideOvl');
    if (sb) sb.classList.toggle('mob-open');
    if (ovl) ovl.classList.toggle('mob-open');
  };
  window.closeMobSidebar = function () {
    var sb = document.querySelector('aside.sidebar, aside.bg-white');
    var ovl = document.getElementById('_humiSideOvl');
    if (sb) sb.classList.remove('mob-open');
    if (ovl) ovl.classList.remove('mob-open');
  };

  // ─────────────────────────────────────────────
  // 4. SKELETON TABLE LOADER
  // Usage: showTableSkeleton('tbodyId', rows, cols)
  // ─────────────────────────────────────────────
  window.showTableSkeleton = function (tbodyId, rows, cols) {
    var el = document.getElementById(tbodyId);
    if (!el) return;
    rows = rows || 5; cols = cols || 4;
    if (!document.getElementById('_humiShimCSS')) {
      var s = document.createElement('style');
      s.id = '_humiShimCSS';
      s.textContent = '@keyframes _hShim{0%{background-position:200% 0}100%{background-position:-200% 0}}'
        + '._hSkel{background:linear-gradient(90deg,#f0f0f5 25%,#e6e6ee 50%,#f0f0f5 75%);background-size:200% 100%;animation:_hShim 1.4s infinite;border-radius:4px;display:inline-block;}';
      document.head.appendChild(s);
    }
    var html = '';
    for (var r = 0; r < rows; r++) {
      html += '<tr>';
      for (var c = 0; c < cols; c++) {
        var w = 40 + ((r * 3 + c * 7) % 40);
        html += '<td style="padding:12px 16px;"><div class="_hSkel" style="height:13px;width:' + w + '%;"></div></td>';
      }
      html += '</tr>';
    }
    el.innerHTML = html;
  };

  // ─────────────────────────────────────────────
  // 4b. GLOBAL SEARCH (Ctrl+K or search button)
  // Searches employees, announcements, messages
  // ─────────────────────────────────────────────
  function initGlobalSearch() {
    // Inject CSS + modal
    var style = document.createElement('style');
    style.textContent =
      '#_humiSearch{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;align-items:flex-start;justify-content:center;padding-top:10vh;}'
      + '#_humiSearchBox{background:white;border-radius:14px;width:90%;max-width:560px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;}'
      + '#_humiSearchInput{width:100%;padding:16px 20px;font-size:15px;border:none;outline:none;font-family:inherit;color:#2A3547;}'
      + '#_humiSearchResults{max-height:380px;overflow-y:auto;border-top:1px solid #e5eaef;}'
      + '._hSR{display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;border-bottom:1px solid #f5f5f8;}'
      + '._hSR:hover{background:#F2F6FA;}'
      + '._hSRI{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '._hSRK{font-size:10px;color:#7C8FAC;background:#F2F6FA;padding:2px 6px;border-radius:4px;border:1px solid #e5eaef;margin-left:auto;flex-shrink:0;}';
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = '_humiSearch';
    modal.innerHTML =
      '<div id="_humiSearchBox">'
      + '<div style="display:flex;align-items:center;padding:0 16px;">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C8FAC" stroke-width="2" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      + '<input id="_humiSearchInput" placeholder="Tìm nhân viên, thông báo..." autocomplete="off" />'
      + '<button onclick="closeGlobalSearch()" style="padding:8px;border:none;background:none;cursor:pointer;color:#7C8FAC;font-size:18px;line-height:1;">×</button>'
      + '</div>'
      + '<div id="_humiSearchResults"><div style="padding:40px;text-align:center;color:#7C8FAC;font-size:13px;">Gõ để tìm kiếm...</div></div>'
      + '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) { if (e.target === modal) closeGlobalSearch(); });

    var input = document.getElementById('_humiSearchInput');
    var timer;
    input.addEventListener('input', function() {
      clearTimeout(timer);
      timer = setTimeout(function() { doGlobalSearch(input.value.trim()); }, 220);
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeGlobalSearch();
      if (e.key === 'Enter') doGlobalSearch(input.value.trim());
    });

    // Ctrl+K shortcut
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openGlobalSearch();
      }
    });

    // Add search icon to topbar notification area (if bell button exists)
    var bell = document.getElementById('notifBell');
    if (bell && bell.parentNode) {
      var searchBtn = document.createElement('button');
      searchBtn.title = 'Tìm kiếm (Ctrl+K)';
      searchBtn.onclick = openGlobalSearch;
      searchBtn.style.cssText = 'padding:10px;border-radius:7px;background:transparent;border:none;cursor:pointer;';
      searchBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A3547" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
      bell.parentNode.insertBefore(searchBtn, bell);
    }
  }

  window.openGlobalSearch = function () {
    var modal = document.getElementById('_humiSearch');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(function () { var inp = document.getElementById('_humiSearchInput'); if (inp) { inp.value = ''; inp.focus(); } }, 50);
    document.getElementById('_humiSearchResults').innerHTML = '<div style="padding:40px;text-align:center;color:#7C8FAC;font-size:13px;">Gõ để tìm kiếm...</div>';
  };

  window.closeGlobalSearch = function () {
    var modal = document.getElementById('_humiSearch');
    if (modal) modal.style.display = 'none';
  };

  function doGlobalSearch(q) {
    var results = document.getElementById('_humiSearchResults');
    if (!q) { results.innerHTML = '<div style="padding:40px;text-align:center;color:#7C8FAC;font-size:13px;">Gõ để tìm kiếm...</div>'; return; }
    var items = [];
    var ql = q.toLowerCase();
    var isInPages = window.location.pathname.indexOf('/pages/') !== -1;
    var base = isInPages ? '' : 'pages/';

    if (window.DB) {
      // Employees
      (DB.employees.getAll() || []).forEach(function(e) {
        if ((e.name || '').toLowerCase().indexOf(ql) !== -1 || (e.code || '').toLowerCase().indexOf(ql) !== -1) {
          items.push({ icon: '👤', color: '#EEF2FF', title: e.name, sub: (e.code || '') + (e.unit ? ' · ' + e.unit : ''), href: (isInPages ? '' : 'pages/') + 'danh-sach-nhan-vien.html', hint: 'Nhân viên' });
        }
      });
      // Announcements
      (DB.announcements && DB.announcements.getAll ? DB.announcements.getAll() : []).forEach(function(a) {
        if ((a.title || '').toLowerCase().indexOf(ql) !== -1) {
          items.push({ icon: '📢', color: '#F0FDF4', title: a.title, sub: a.department || '', href: (isInPages ? '' : 'pages/') + 'hop-thu.html', hint: 'Thông báo' });
        }
      });
      // Pages
      var pages = [
        { k: 'lịch', icon: '📅', title: 'Lịch làm việc', href: (isInPages ? '' : 'pages/') + 'lich-lam-viec.html' },
        { k: 'phép', icon: '📋', title: 'Xem phép tồn', href: (isInPages ? '' : 'pages/') + 'xem-phep-ton.html' },
        { k: 'thu nhập', icon: '💰', title: 'Xem thu nhập', href: (isInPages ? '' : 'pages/') + 'xem-thu-nhap.html' },
        { k: 'hộp thư', icon: '✉️', title: 'Hộp thư', href: (isInPages ? '' : 'pages/') + 'hop-thu.html' },
        { k: 'cài đặt', icon: '⚙️', title: 'Cài đặt', href: (isInPages ? '' : 'pages/') + 'cai-dat.html' },
      ];
      pages.forEach(function(p) { if (p.k.indexOf(ql) !== -1) items.push({ icon: p.icon, color: '#F2F6FA', title: p.title, sub: 'Trang', href: p.href, hint: 'Trang' }); });
    }

    if (!items.length) {
      results.innerHTML = '<div style="padding:40px;text-align:center;color:#7C8FAC;font-size:13px;">Không tìm thấy kết quả cho "<strong>' + q + '</strong>"</div>';
      return;
    }
    results.innerHTML = items.slice(0, 8).map(function(it) {
      return '<div class="_hSR" onclick="window.location.href=\'' + (it.href || '#') + '\'">'
        + '<div class="_hSRI" style="background:' + (it.color || '#F2F6FA') + '"><span style="font-size:16px;">' + it.icon + '</span></div>'
        + '<div style="min-width:0;flex:1;">'
        + '<div style="font-size:13px;font-weight:600;color:#2A3547;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + it.title + '</div>'
        + (it.sub ? '<div style="font-size:11px;color:#7C8FAC;">' + it.sub + '</div>' : '')
        + '</div>'
        + (it.hint ? '<span class="_hSRK">' + it.hint + '</span>' : '')
        + '</div>';
    }).join('');
  }

  // ─────────────────────────────────────────────
  // 5. MANAGER DASHBOARD STATS (index.html only)
  // ─────────────────────────────────────────────
  function initManagerStats() {
    var section = document.getElementById('mgrStatsSection');
    if (!section) return;
    var sess = null;
    try { sess = JSON.parse(localStorage.getItem('humi_session')); } catch (e) {}
    if (!sess || !sess.user) return;
    var roleId = sess.user.roleId;
    if (roleId !== 'manager' && roleId !== 'admin') { section.style.display = 'none'; return; }
    section.style.display = 'block';
    renderManagerStats();
    window.addEventListener('humi_synced', renderManagerStats);
  }

  function renderManagerStats() {
    var section = document.getElementById('mgrStatsSection');
    if (!section || section.style.display === 'none') return;

    var employees  = (window.DB && DB.employees  ? DB.employees.getAll()  : []) || [];
    var attendance = (window.DB && DB.attendance ? DB.attendance.getAll() : []) || [];
    var leaves     = (window.DB && DB.leaves     ? DB.leaves.getAll()     : []) || [];
    var requests   = (window.DB && DB.requests   ? DB.requests.getAll()   : []) || [];

    var activeEmps = employees.filter(function (e) { return e.status === 'active'; });
    var today = new Date().toISOString().slice(0, 10);

    var presentToday = attendance.filter(function (a) { return a.date === today && a.checkIn; }).length;
    var presentPct = activeEmps.length > 0 ? Math.round(presentToday / activeEmps.length * 100) : 0;

    var pendingLeaves = leaves.filter(function (l) { return l.status === 'pending'; }).length;
    var pendingOT     = requests.filter(function (r) { return r.status === 'pending'; }).length;

    function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    setEl('mgrStatEmps',    activeEmps.length + ' người');
    setEl('mgrStatPresent', presentToday + '/' + activeEmps.length + ' (' + presentPct + '%)');
    setEl('mgrStatLeaves',  pendingLeaves + ' đơn');
    setEl('mgrStatOT',      pendingOT + ' yêu cầu');

    var bar = document.getElementById('mgrPresentBar');
    if (bar) bar.style.width = presentPct + '%';
  }

  window._renderManagerStats = renderManagerStats;

  // ─────────────────────────────────────────────
  // 6. NOTIFICATION POLLING
  // Re-fires humi_synced every 5 min to refresh badge counts
  // ─────────────────────────────────────────────
  function initNotifPolling() {
    var notifBell = document.getElementById('notifBell');
    if (!notifBell) return; // only on pages with notification bell
    setInterval(function () {
      if (window.DB && DB.sync) {
        DB.sync().catch(function () {});
      } else {
        // Just re-dispatch humi_synced so badge re-renders
        window.dispatchEvent(new CustomEvent('humi_synced'));
      }
    }, 5 * 60 * 1000); // every 5 minutes
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    _buildConfirmDialog();
    applyRoleSidebar();
    initMobileSidebar();
    initGlobalSearch();
    initManagerStats();
    initNotifPolling();
  });

})();
