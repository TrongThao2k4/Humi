document.addEventListener('DOMContentLoaded', function(){
  // Get current user with proper defaults
  var s = null;
  try { s = JSON.parse(localStorage.getItem('humi_session')); } catch(e) {}
  var currentUser = (s && s.user) ? s.user : { id: 'admin', name: 'Admin', position: 'Quản trị hệ thống', roleId: 'admin' };
  var dashboardSnapshot = null;

  function mapEmployeeRow(row) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      avatar: row.avatar,
      unit: row.unit,
      position: row.position,
      roleId: row.role_id,
      status: row.status,
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      dob: row.dob,
      startDate: row.start_date,
      contractStatus: row.contract_status,
      contractType: row.contract_type,
      workMode: row.work_mode,
      managerName: row.manager_name,
      leaveBalance: row.leave_balance || { annual: 12, sick: 30, maternity: 180, unpaid: 99 },
      idCard: row.id_card
    };
  }

  function mapAccountRow(row) {
    return {
      employeeId: row.employee_id,
      password: row.password,
      locked: !!row.locked,
      createdAt: row.created_at || null
    };
  }

  function getDashboardEmployees() {
    if (dashboardSnapshot && dashboardSnapshot.employees) return dashboardSnapshot.employees;
    return (DB.employees && DB.employees.getAll ? DB.employees.getAll() : []) || [];
  }

  function getDashboardAccounts() {
    if (dashboardSnapshot && dashboardSnapshot.accounts) return dashboardSnapshot.accounts;
    return (DB.accounts && DB.accounts.getAll ? DB.accounts.getAll() : []) || [];
  }

  // ===== LOAD USER INFO (topbar) =====
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

      var el1 = document.getElementById('topbarAvatar');
      if (el1) el1.src = avatar || 'https://i.pravatar.cc/32?img=47';
      var el2 = document.getElementById('topbarName');
      if (el2) el2.textContent = name || 'Admin';
      var el3 = document.getElementById('topbarRole');
      if (el3) el3.textContent = role || 'Quản trị hệ thống';

      var el4 = document.getElementById('dropdownAvatar');
      if (el4) el4.src = avatar || 'https://i.pravatar.cc/36?img=47';
      var el5 = document.getElementById('dropdownName');
      if (el5) el5.textContent = name || 'Admin';
      var el6 = document.getElementById('dropdownRole');
      if (el6) el6.textContent = role || 'Quản trị hệ thống';
    } catch(e) {
      console.error('Error loading user info:', e);
      var els = ['topbarName', 'dropdownName'];
      els.forEach(function(id) { var e = document.getElementById(id); if(e) e.textContent = 'Admin'; });
      var els2 = ['topbarRole', 'dropdownRole'];
      els2.forEach(function(id) { var e = document.getElementById(id); if(e) e.textContent = 'Quản trị hệ thống'; });
    }
  }

  loadUserInfo();
  window.addEventListener('humi_synced', loadUserInfo);

  (function() {
    try {
      var accounts = JSON.parse(localStorage.getItem('humi_accounts') || '[]');
      if (!accounts.length) {
        var employees = JSON.parse(localStorage.getItem('humi_employees') || '[]');
        if (employees.length) {
          accounts = employees.map(function(e) {
            return { employeeId: e.id, password: '123456', locked: false };
          });
          localStorage.setItem('humi_accounts', JSON.stringify(accounts));
        }
      }
    } catch(e) { /* ignore */ }
  })();

  function formatDateTime(iso) {
    if (!iso) return '—';
    try { var d = new Date(iso); return d.toLocaleString(); } catch(e){ return iso; }
  }

  function formatShortDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    } catch(e) {
      return iso;
    }
  }

  function iconSvg(name) {
    var icons = {
      users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      userCheck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6"/><path d="M19 8v6"/></svg>',
      userPlus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>',
      fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="9" y1="9" x2="10" y2="9"/></svg>',
      alertCircle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="1"/></svg>',
      settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
      checkCircle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
      lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      lockOpen: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.5-2.5"/><path d="M14 11h-1"/></svg>',
      shieldCheck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>'
    };
    return icons[name] || icons.fileText;
  }

  function activityIcon(action) {
    action = String(action || '').toLowerCase();
    if (action.indexOf('unlock') !== -1 || action.indexOf('mở khóa') !== -1) return { key:'lockOpen', wrap:'activity-icon activity-icon-blue' };
    if (action.indexOf('lock') !== -1 || action.indexOf('khóa') !== -1) return { key:'lock', wrap:'activity-icon activity-icon-orange' };
    if (action.indexOf('create_employee') !== -1 || action.indexOf('tạo mới') !== -1) return { key:'userPlus', wrap:'activity-icon activity-icon-green' };
    if (action.indexOf('settings') !== -1 || action.indexOf('config') !== -1) return { key:'settings', wrap:'activity-icon activity-icon-green' };
    if (action.indexOf('request') !== -1 || action.indexOf('yêu cầu') !== -1) return { key:'alertCircle', wrap:'activity-icon activity-icon-orange' };
    return { key:'fileText', wrap:'activity-icon activity-icon-cyan' };
  }

  var chartMode = 'attendance';
  var chartTabsBound = false;

  function setChartHeader(title, subtitle) {
    var chartTitle = document.getElementById('chartTitle');
    var chartSubtitle = document.getElementById('chartSubtitle');
    if (chartTitle) chartTitle.textContent = title;
    if (chartSubtitle) {
      if (subtitle) {
        chartSubtitle.textContent = subtitle;
        chartSubtitle.style.display = 'block';
      } else {
        chartSubtitle.textContent = '';
        chartSubtitle.style.display = 'none';
      }
    }
  }

  function setChartLegend(html, hideLegend) {
    var chartLegend = document.getElementById('chartLegend');
    if (!chartLegend) return;
    if (hideLegend) {
      chartLegend.innerHTML = '';
      chartLegend.className = 'chart-legend chart-legend-empty';
      return;
    }
    chartLegend.className = 'chart-legend';
    chartLegend.innerHTML = html || '';
  }

  function chartPointPosition(index, total, value, minValue, maxValue, width, height) {
    var left = 24;
    var right = 20;
    var top = 22;
    var bottom = 30;
    var x = left + (total === 1 ? 0 : index * ((width - left - right) / (total - 1)));
    var y = top + ((maxValue - value) / (maxValue - minValue || 1)) * (height - top - bottom);
    return { x: x, y: y };
  }

  function normalizeDateKey(value) {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function weekdayLabel(dateKey) {
    if (!dateKey) return '';
    var date = new Date(dateKey + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  }

  function formatShortDateKey(dateKey) {
    if (!dateKey) return '';
    var parts = dateKey.split('-');
    if (parts.length !== 3) return dateKey;
    return parts[2] + '/' + parts[1] + '/' + parts[0].slice(2);
  }

  function parseTimeToMinutes(value) {
    if (!value) return null;
    var parts = String(value).split(':');
    if (parts.length < 2) return null;
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  function getAttendanceChartData() {
    var records = (DB.attendance && DB.attendance.getAll ? DB.attendance.getAll() : []) || [];
    var byDate = {};
    records.forEach(function(record) {
      var dateKey = normalizeDateKey(record && record.date);
      if (!dateKey) return;
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(record);
    });

    var dateKeys = Object.keys(byDate).sort();
    if (!dateKeys.length) {
      var today = new Date();
      for (var i = 6; i >= 0; i--) {
        var date = new Date(today);
        date.setDate(date.getDate() - i);
        dateKeys.push(normalizeDateKey(date));
      }
    } else {
      dateKeys = dateKeys.slice(-7);
    }

    return dateKeys.map(function(dateKey) {
      var items = byDate[dateKey] || [];
      var onTime = 0;
      var late = 0;
      var early = 0;
      items.forEach(function(item) {
        var checkIn = parseTimeToMinutes(item && item.checkIn);
        var checkOut = parseTimeToMinutes(item && item.checkOut);
        if (checkIn != null && checkIn > 8 * 60 + 5) late += 1;
        if (checkOut != null && checkOut < 17 * 60) early += 1;
        if ((checkIn == null || checkIn <= 8 * 60 + 5) && (checkOut == null || checkOut >= 17 * 60)) onTime += 1;
      });

      return {
        dateKey: dateKey,
        label: weekdayLabel(dateKey) || dateKey,
        subtitle: formatShortDateKey(dateKey),
        onTime: onTime,
        late: late,
        early: early
      };
    });
  }

  function getPersonnelChartData() {
    var employees = getDashboardEmployees();
    var accounts = getDashboardAccounts();
    var months = [];
    var current = new Date();
    current.setDate(1);
    current.setHours(0, 0, 0, 0);

    for (var i = 5; i >= 0; i--) {
      var monthDate = new Date(current.getFullYear(), current.getMonth() - i, 1);
      var monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      var monthKey = monthDate.getFullYear() + '-' + String(monthDate.getMonth() + 1).padStart(2, '0');
      var count = accounts.filter(function(account) {
        if (!account) return false;
        var createdAt = account.createdAt || '';
        if (createdAt) {
          var created = new Date(createdAt);
          return !isNaN(created.getTime()) && created <= monthEnd;
        }

        var emp = employees.find(function(item) { return item && item.id === account.employeeId; });
        if (!emp || emp.status !== 'active') return false;
        if (!emp.startDate) return true;
        var start = new Date(emp.startDate + 'T00:00:00');
        return !isNaN(start.getTime()) && start <= monthEnd;
      }).length;

      months.push({
        key: monthKey,
        label: String(monthDate.getMonth() + 1).padStart(2, '0') + '/' + String(monthDate.getFullYear()).slice(2),
        fullLabel: String(monthDate.getMonth() + 1).padStart(2, '0') + '/' + monthDate.getFullYear(),
        count: count
      });
    }

    return months;
  }

  function getLeaveChartData() {
    var leaveRequests = (DB.leaves && DB.leaves.getAll ? DB.leaves.getAll() : []) || [];
    var employees = (DB.employees && DB.employees.getAll ? DB.employees.getAll() : []) || [];
    var leaveTypes = [
      { key: 'annual', title: 'Phép năm', color: '#3f80ff' },
      { key: 'sick', title: 'Nghỉ ốm', color: '#ff4b6b' },
      { key: 'unpaid', title: 'Nghỉ không lương', color: '#748096' },
      { key: 'maternity', title: 'Nghỉ thai sản', color: '#ad63ff' }
    ];

    return leaveTypes.map(function(type) {
      var approvedDays = leaveRequests.filter(function(request) {
        return String(request.leaveType || '') === type.key && request.status === 'approved';
      }).reduce(function(total, request) {
        return total + (Number(request.totalDays) || 0);
      }, 0);

      var pendingDays = leaveRequests.filter(function(request) {
        return String(request.leaveType || '') === type.key && request.status === 'pending';
      }).reduce(function(total, request) {
        return total + (Number(request.totalDays) || 0);
      }, 0);

      var remainingDays = employees.reduce(function(total, employee) {
        var balance = employee && employee.leaveBalance ? Number(employee.leaveBalance[type.key]) || 0 : 0;
        return total + balance;
      }, 0);

      var usedDays = approvedDays;
      var baseDays = usedDays + remainingDays;
      var percent = baseDays > 0 ? Math.round((usedDays / baseDays) * 100) : 0;

      return {
        title: type.title,
        subtitle: 'Đã dùng ' + usedDays + ' / còn lại ' + remainingDays + ' ngày' + (pendingDays > 0 ? ' · ' + pendingDays + ' chờ duyệt' : ''),
        percent: percent,
        color: type.color
      };
    });
  }

  function renderAttendanceChart() {
    var chartData = getAttendanceChartData();
    setChartHeader('Biểu đồ chuyên cần', 'Kết hợp số lượng đúng giờ và biến động trễ/sớm');
    setChartLegend('' +
      '<span><i class="legend-dot legend-dot-green"></i>ĐÚNG GIỜ</span>' +
      '<span><i class="legend-dot legend-dot-red"></i>ĐI TRỄ</span>' +
      '<span><i class="legend-dot legend-dot-blue"></i>VỀ SỚM</span>', false);

    var chart = document.getElementById('overviewChart');
    if (!chart) return;

    var labels = chartData.map(function(item) { return item.label; });
    var green = chartData.map(function(item) { return item.onTime; });
    var red = chartData.map(function(item) { return item.late; });
    var blue = chartData.map(function(item) { return item.early; });
    var width = 640;
    var height = 230;
    var baseY = 176;
    var maxValue = Math.max.apply(null, green.concat(red).concat(blue));
    if (!isFinite(maxValue) || maxValue <= 0) maxValue = 1;

    function barHeight(value) {
      return Math.max(3, Math.round((value / maxValue) * 116));
    }

    var svg = '' +
      '<div class="personnel-chart">' +
        '<div class="personnel-chart-wrap">' +
          '<div class="attendance-tooltip" id="attendanceTooltip"></div>' +
          '<svg viewBox="0 0 ' + width + ' ' + height + '" class="personnel-svg" preserveAspectRatio="none">' +
          '<line x1="0" y1="42" x2="640" y2="42" class="attendance-grid-line" />' +
          '<line x1="0" y1="98" x2="640" y2="98" class="attendance-grid-line" />' +
          '<line x1="0" y1="154" x2="640" y2="154" class="attendance-grid-line" />' +
          labels.map(function(label, index) {
            var centerX = labels.length === 1 ? width / 2 : 28 + index * ((width - 56) / (labels.length - 1));
            var greenH = barHeight(green[index]);
            var redH = barHeight(red[index]);
            var blueH = barHeight(blue[index]);
            return '' +
              '<g class="attendance-group" data-day="' + (chartData[index].subtitle || label) + '" data-on-time="' + green[index] + '" data-late="' + red[index] + '" data-early="' + blue[index] + '">' +
                '<rect x="' + (centerX - 16).toFixed(1) + '" y="' + (baseY - greenH).toFixed(1) + '" width="10" height="' + greenH.toFixed(1) + '" rx="2" fill="#35d18a" />' +
                '<rect x="' + (centerX - 2).toFixed(1) + '" y="' + (baseY - redH).toFixed(1) + '" width="8" height="' + redH.toFixed(1) + '" rx="2" fill="#ff5671" />' +
                '<rect x="' + (centerX + 9).toFixed(1) + '" y="' + (baseY - blueH).toFixed(1) + '" width="8" height="' + blueH.toFixed(1) + '" rx="2" fill="#5f6de8" />' +
                '<rect x="' + (centerX - 24).toFixed(1) + '" y="36" width="48" height="150" fill="transparent" />' +
              '</g>';
          }).join('') +
          '</svg>' +
        '</div>' +
        '<div class="attendance-axis">' + labels.map(function(label, index) {
          var centerX = 28 + index * ((width - 56) / (labels.length - 1));
          return '<span style="left:' + (centerX / width * 100).toFixed(3) + '%">' + label + '</span>';
        }).join('') + '</div>' +
      '</div>';

    chart.innerHTML = svg;

    var wrap = chart.querySelector('.personnel-chart-wrap');
    var tooltip = chart.querySelector('#attendanceTooltip');
    var groups = chart.querySelectorAll('.attendance-group');
    if (!wrap || !tooltip || !groups.length) return;

    function setTooltipPosition(evt) {
      var wrapRect = wrap.getBoundingClientRect();
      var tipRect = tooltip.getBoundingClientRect();
      var left = evt.clientX - wrapRect.left + 14;
      var top = evt.clientY - wrapRect.top - tipRect.height - 10;

      if (left + tipRect.width > wrapRect.width - 6) left = wrapRect.width - tipRect.width - 6;
      if (left < 6) left = 6;
      if (top < 8) top = evt.clientY - wrapRect.top + 12;

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    groups.forEach(function(group) {
      group.addEventListener('mouseenter', function(evt) {
        var day = group.getAttribute('data-day') || '';
        var onTime = group.getAttribute('data-on-time') || '0';
        var late = group.getAttribute('data-late') || '0';
        var early = group.getAttribute('data-early') || '0';

        tooltip.innerHTML = '' +
          '<div class="attendance-tooltip-title">' + day + '</div>' +
          '<div class="attendance-tooltip-row"><span><i class="attendance-dot attendance-dot-green"></i>Đúng giờ</span><b>' + onTime + '</b></div>' +
          '<div class="attendance-tooltip-row"><span><i class="attendance-dot attendance-dot-red"></i>Đi trễ</span><b>' + late + '</b></div>' +
          '<div class="attendance-tooltip-row"><span><i class="attendance-dot attendance-dot-blue"></i>Về sớm</span><b>' + early + '</b></div>';

        tooltip.classList.add('show');
        setTooltipPosition(evt);
      });

      group.addEventListener('mousemove', function(evt) {
        if (!tooltip.classList.contains('show')) return;
        setTooltipPosition(evt);
      });

      group.addEventListener('mouseleave', function() {
        tooltip.classList.remove('show');
      });
    });
  }

  function renderPersonnelChart() {
    var months = getPersonnelChartData();
    setChartHeader('TỔNG NHÂN SỰ', '6 tháng gần nhất');
    setChartLegend('<span><i class="legend-dot legend-dot-blue"></i>TỔNG NHÂN SỰ (6 THÁNG GẦN NHẤT)</span>', false);

    var chart = document.getElementById('overviewChart');
    if (!chart) return;

    var values = months.map(function(item) { return item.count; });
    var labels = months.map(function(item) { return item.label; });
    var width = 640;
    var height = 230;
    var minValue = Math.max(0, Math.min.apply(null, values.length ? values : [0]));
    var maxValue = Math.max.apply(null, values.length ? values : [0]);
    if (maxValue === minValue) maxValue = minValue + 1;
    var points = values.map(function(value, index) {
      return chartPointPosition(index, values.length, value, minValue, maxValue, width, height);
    });

    var linePath = 'M ' + points.map(function(point) { return point.x.toFixed(1) + ' ' + point.y.toFixed(1); }).join(' L ');
    var areaPath = linePath + ' L ' + points[points.length - 1].x.toFixed(1) + ' 196 L ' + points[0].x.toFixed(1) + ' 196 Z';

    var svg = '' +
      '<div class="attendance-line-chart">' +
        '<div class="attendance-tooltip" id="personnelTooltip"></div>' +
        '<svg viewBox="0 0 ' + width + ' ' + height + '" class="attendance-svg" preserveAspectRatio="none">' +
          '<defs>' +
            '<linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#8fb0ff" stop-opacity="0.48" />' +
              '<stop offset="100%" stop-color="#8fb0ff" stop-opacity="0.06" />' +
            '</linearGradient>' +
          '</defs>' +
          '<line x1="0" y1="42" x2="640" y2="42" class="attendance-grid-line" />' +
          '<line x1="0" y1="98" x2="640" y2="98" class="attendance-grid-line" />' +
          '<line x1="0" y1="154" x2="640" y2="154" class="attendance-grid-line" />' +
          '<path d="' + areaPath + '" fill="url(#attendanceFill)" />' +
          '<path d="' + linePath + '" fill="none" stroke="#3f80ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
          points.map(function(point, index) {
            return '' +
              '<g class="personnel-point-group" data-month="' + (months[index].fullLabel || labels[index]) + '" data-total="' + values[index] + '">' +
                '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="5" fill="#ffffff" stroke="#3f80ff" stroke-width="3" />' +
                '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="15" fill="transparent" />' +
                '<text x="' + point.x.toFixed(1) + '" y="' + (point.y - 14).toFixed(1) + '" text-anchor="middle" class="attendance-value">' + values[index] + '</text>' +
              '</g>';
          }).join('') +
        '</svg>' +
        '<div class="attendance-axis">' + labels.map(function(label, index) {
          return '<span style="left:' + (labels.length === 1 ? 50 : (points[index].x / width * 100)).toFixed(3) + '%">' + label + '</span>';
        }).join('') + '</div>' +
      '</div>';

    chart.innerHTML = svg;

    var lineWrap = chart.querySelector('.attendance-line-chart');
    var tooltip = chart.querySelector('#personnelTooltip');
    var pointGroups = chart.querySelectorAll('.personnel-point-group');
    if (!lineWrap || !tooltip || !pointGroups.length) return;

    function setPersonnelTooltipPosition(evt) {
      var wrapRect = lineWrap.getBoundingClientRect();
      var tipRect = tooltip.getBoundingClientRect();
      var left = evt.clientX - wrapRect.left + 14;
      var top = evt.clientY - wrapRect.top - tipRect.height - 10;

      if (left + tipRect.width > wrapRect.width - 6) left = wrapRect.width - tipRect.width - 6;
      if (left < 6) left = 6;
      if (top < 8) top = evt.clientY - wrapRect.top + 12;

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    pointGroups.forEach(function(group) {
      group.addEventListener('mouseenter', function(evt) {
        var month = group.getAttribute('data-month') || '';
        var total = group.getAttribute('data-total') || '0';
        tooltip.innerHTML = '' +
          '<div class="attendance-tooltip-title">' + month + '</div>' +
          '<div class="attendance-tooltip-row"><span><i class="attendance-dot attendance-dot-blue"></i>Tổng nhân sự</span><b>' + total + '</b></div>';
        tooltip.classList.add('show');
        setPersonnelTooltipPosition(evt);
      });

      group.addEventListener('mousemove', function(evt) {
        if (!tooltip.classList.contains('show')) return;
        setPersonnelTooltipPosition(evt);
      });

      group.addEventListener('mouseleave', function() {
        tooltip.classList.remove('show');
      });
    });
  }

  function renderLeaveChart() {
    var items = getLeaveChartData();
    setChartHeader('THỐNG KÊ NGHỈ PHÉP', 'Dùng dữ liệu từ đơn nghỉ và số dư phép hiện tại');
    setChartLegend('', true);

    var chart = document.getElementById('overviewChart');
    if (!chart) return;

    chart.innerHTML = '' +
      '<div class="leave-grid">' + items.map(function(item) {
        return '' +
          '<div class="leave-card">' +
            '<div class="leave-ring" style="--leave-progress:' + item.percent + ';--leave-color:' + item.color + '">' +
              '<span>' + item.percent + '%</span>' +
            '</div>' +
            '<div class="leave-copy">' +
              '<p class="leave-title">' + item.title + '</p>' +
              '<p class="leave-subtitle">' + item.subtitle + '</p>' +
            '</div>' +
          '</div>';
      }).join('') + '</div>';
  }

  function renderOverviewChart(logs, emps, reqs) {
    var chart = document.getElementById('overviewChart');
    if (!chart) return;
    if (chartMode === 'leave') {
      renderLeaveChart();
      return;
    }
    if (chartMode === 'personnel') {
      renderPersonnelChart();
      return;
    }
    renderAttendanceChart();
  }

  function bindChartTabs(logs, emps, reqs) {
    if (chartTabsBound) return;
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.chart-tab'));
    tabs.forEach(function(tab) {
      tab.onclick = function() {
        var mode = tab.getAttribute('data-chart-mode') || 'attendance';
        chartMode = mode;
        tabs.forEach(function(item) { item.classList.toggle('active', item === tab); });
        renderOverviewChart(logs, emps, reqs);
      };
    });
    chartTabsBound = true;
  }

  function refreshKPIs() {
    try {
      var emps = getDashboardEmployees();
      var acs  = getDashboardAccounts();
      var logs = (DB.audit && DB.audit.getAll ? DB.audit.getAll() : []) || [];
      var reqs = (DB.requests && DB.requests.getAll ? DB.requests.getAll() : []) || [];
      var settings = null;
      try { settings = (DB.settings && DB.settings.get) ? DB.settings.get('all') : null; } catch(e) {}

      var today = new Date();
      var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      var logsToday = logs.filter(function(l) {
        var ts = l && l.timestamp ? new Date(l.timestamp) : null;
        if (!ts || isNaN(ts.getTime())) return false;
        var key = ts.getFullYear() + '-' + String(ts.getMonth() + 1).padStart(2, '0') + '-' + String(ts.getDate()).padStart(2, '0');
        return key === todayKey;
      }).length;

      var elEmps = document.getElementById('kpiEmployees'); if (elEmps) elEmps.textContent = acs.length || emps.length || 0;
      var elLogs = document.getElementById('kpiLogs'); if (elLogs) elLogs.textContent = logsToday || 0;
      var elReqs = document.getElementById('kpiRequests'); if (elReqs) elReqs.textContent = (reqs.filter(function(r){ return r.status==='pending'; }).length || 0);
      var elSets = document.getElementById('kpiSettings'); if (elSets) elSets.textContent = settings ? 'Đã cấu hình' : 'Chưa';
      var elStatus = document.getElementById('kpiStatus'); if (elStatus) elStatus.textContent = 'OK';

      renderOverviewChart(logs, emps, reqs);
      bindChartTabs(logs, emps, reqs);

      // recent activity
      var ra = document.getElementById('recentActivityList');
      if (!ra) return;
      if (!logs.length) { ra.innerHTML = '<div style="padding:22px 24px;color:#7C8FAC;">Không có hoạt động gần đây</div>'; return; }

      var html = logs.slice(0, 6).map(function(l) {
        var meta = activityIcon(l.action || '');
        var title = l.detail || l.action || 'Hoạt động hệ thống';
        var actor = l.actorName || l.actorId || 'Admin';
        var moduleLabel = l.module || 'system';
        var actionLabel = l.action || '';
        return '' +
          '<div class="recent-activity-item">' +
            '<div class="' + meta.wrap + '">' + iconSvg(meta.key) + '</div>' +
            '<div class="recent-activity-main">' +
              '<div class="recent-activity-title">' + title + '</div>' +
              '<div class="recent-activity-meta">' +
                '<span class="recent-activity-badge">' + actor + '</span>' +
                '<span class="recent-activity-path">' + moduleLabel + ' / ' + actionLabel + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="recent-activity-time">' +
              '<div class="recent-activity-time-main">' + (new Date(l.timestamp)).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) + '</div>' +
              '<div class="recent-activity-time-sub">' + formatShortDate(l.timestamp) + '</div>' +
            '</div>' +
          '</div>';
      }).join('');
      ra.innerHTML = html;
    } catch(e) { console.error('KPIs refresh error', e); }
  }

  function loadDashboardSnapshot() {
    if (!window.SB || !SB.select) return;
    Promise.all([
      SB.select('employees'),
      SB.select('accounts')
    ]).then(function(results) {
      var employees = (results[0] || []).map(mapEmployeeRow);
      var accounts = (results[1] || []).map(mapAccountRow);
      if (employees.length || accounts.length) {
        dashboardSnapshot = {
          employees: employees,
          accounts: accounts
        };
        refreshKPIs();
      }
    }).catch(function(err) {
      console.error('Dashboard snapshot load failed:', err);
    });
  }

  refreshKPIs();
  loadDashboardSnapshot();
  window.addEventListener('humi_synced', refreshKPIs);
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

// ==================== LOGOUT ====================
function doLogout() {
  DB.auth.logout();
  window.location.href = '../login.html';
}
