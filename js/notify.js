// notify.js — Humi Notification Engine
(function () {
  var sess = null;
  try { sess = JSON.parse(localStorage.getItem('humi_session')); } catch (e) {}
  if (!sess || !sess.user) return;

  var userId   = sess.user.id;
  var userRole = sess.user.roleId;
  var SETTINGS_KEY = 'humi_user_settings_' + userId;

  function getPrefs() {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      var n = s.notify || {};
      return {
        attendance : n.notify_attendance !== false,
        leave      : n.notify_leave      !== false,
        payroll    : n.notify_payroll    !== false,
        shift      : n.notify_shift      === true,
        inbox      : n.notify_inbox      !== false,
        weekly     : n.notify_weekly     !== false,
        urgent     : n.notify_urgent     !== false
      };
    } catch (e) { return { attendance:true, leave:true, payroll:true, shift:false, inbox:true, weekly:true, urgent:true }; }
  }

  // ── 1. Tạo danh sách notification items ────────────────────
  window.HumiNotify = {
    getItems: function (prefs) {
      var items = [];
      if (!window.DB) return items;

      // Duyệt công — chỉ manager/admin
      if (prefs.attendance && (userRole === 'manager' || userRole === 'admin')) {
        var allAtt = (DB.attendance ? DB.attendance.getAll() : []) || [];
        var pendingAtt = allAtt.filter(function (a) { return a.approvalStatus === 'pending'; });
        if (pendingAtt.length) {
          items.push({
            id   : 'att_pending',
            icon : '🕐',
            title: pendingAtt.length + ' yêu cầu duyệt công đang chờ',
            sub  : 'Nhấn để xem danh sách',
            time : '',
            href : 'duyet-cong.html'
          });
        }
      }

      // Đơn nghỉ phép — chỉ manager/admin
      if (prefs.leave && (userRole === 'manager' || userRole === 'admin')) {
        var allLeaves = (DB.leaves ? DB.leaves.getAll() : []) || [];
        var pendingLeaves = allLeaves.filter(function (l) { return l.status === 'pending'; });
        if (pendingLeaves.length) {
          items.push({
            id   : 'leave_pending',
            icon : '📋',
            title: pendingLeaves.length + ' đơn nghỉ phép chờ duyệt',
            sub  : 'Nhấn để xem danh sách',
            time : '',
            href : 'danh-sach-phieu-nghi.html'
          });
        }
      }

      // Bảng lương
      if (prefs.payroll) {
        var allSal = (DB.salary ? DB.salary.getAll() : []) || [];
        var mySal  = allSal.filter(function (s) { return s.employeeId === userId; });
        if (mySal.length) {
          mySal.sort(function (a, b) { return b.period.localeCompare(a.period); });
          var latest = mySal[0];
          items.push({
            id   : 'payroll_' + latest.period,
            icon : '💰',
            title: 'Bảng lương tháng ' + latest.period + ' đã có',
            sub  : 'Xem chi tiết thu nhập',
            time : latest.period + '-01',
            href : 'xem-thu-nhap.html'
          });
        }
      }

      // Tin nhắn chưa đọc
      if (prefs.inbox) {
        var inbox   = (DB.messages ? DB.messages.getInbox(userId) : []) || [];
        var unread  = inbox.filter(function (m) { return !m.isRead; });
        if (unread.length) {
          items.push({
            id   : 'inbox_' + unread.length,
            icon : '✉️',
            title: unread.length + ' tin nhắn chưa đọc',
            sub  : 'Xem trong hộp thư',
            time : '',
            href : 'hop-thu.html'
          });
        }
      }

      // Tóm tắt hàng tuần (thứ Hai)
      if (prefs.weekly && new Date().getDay() === 1) {
        var allLeaves2 = (DB.leaves ? DB.leaves.getAll() : []) || [];
        var myLeaves   = allLeaves2.filter(function (l) { return l.employeeId === userId; });
        var pendingL   = myLeaves.filter(function (l) { return l.status === 'pending'; }).length;
        var allSal2    = (DB.salary ? DB.salary.getAll() : []) || [];
        var mySal2     = allSal2.filter(function (s) { return s.employeeId === userId; });
        items.push({
          id   : 'weekly_' + new Date().toISOString().split('T')[0],
          icon : '📊',
          title: 'Tóm tắt tuần này',
          sub  : (pendingL ? pendingL + ' đơn chờ duyệt · ' : '') + mySal2.length + ' bảng lương',
          time : '',
          href : 'xem-thu-nhap.html'
        });
      }

      // Thông báo khẩn cấp từ công ty
      if (prefs.urgent) {
        var anns = (DB.announcements ? DB.announcements.getAll() : []) || [];
        var urgentKey2 = 'humi_urgent_seen_' + userId;
        var seen = new Set();
        try { seen = new Set(JSON.parse(localStorage.getItem(urgentKey2)) || []); } catch (e) {}
        anns
          .filter(function (a) { return !seen.has(a.id); })
          .slice(0, 2)
          .forEach(function (a) {
            items.push({
              id   : 'urgent_' + a.id,
              icon : '🔔',
              title: a.title || 'Thông báo khẩn cấp',
              sub  : a.content ? a.content.substring(0, 50) + '…' : '',
              time : a.createdAt || '',
              href : ''
            });
          });
      }

      return items;
    }
  };

  // ── 2. Nhắc nhở ca làm việc (Browser Notification) ─────────
  function scheduleShiftReminder(prefs) {
    if (!prefs.shift) return;
    if (!('Notification' in window)) return;

    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') return;
      if (!window.DB) return;

      var today       = new Date().toISOString().split('T')[0];
      var assignments = (DB.shift_assignments ? DB.shift_assignments.getAll() : []) || [];
      var shifts      = (DB.shifts ? DB.shifts.getAll() : []) || [];

      assignments
        .filter(function (a) { return a.employeeId === userId && a.date === today; })
        .forEach(function (ass) {
          var shift = shifts.find(function (s) { return s.id === ass.shiftId; });
          if (!shift || !shift.startTime) return;

          var parts    = shift.startTime.split(':');
          var start    = new Date();
          start.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          var remind   = start.getTime() - 30 * 60 * 1000;
          var delay    = remind - Date.now();

          if (delay > 0) {
            var alreadyKey = 'humi_shift_reminded_' + userId + '_' + today + '_' + ass.shiftId;
            if (localStorage.getItem(alreadyKey)) return;
            setTimeout(function () {
              new Notification('Humi – Nhắc nhở ca làm việc', {
                body: 'Ca ' + shift.name + ' bắt đầu lúc ' + shift.startTime + ' (còn 30 phút)',
                icon: '../img/logo.png'
              });
              localStorage.setItem(alreadyKey, '1');
            }, delay);
          }
        });
    });
  }

  // ── INIT ───────────────────────────────────────────────────
  function run() {
    if (!window.DB) return;
    var prefs = getPrefs();
    scheduleShiftReminder(prefs);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(run, 1000);
  });
  window.addEventListener('humi_synced', run);

})();
