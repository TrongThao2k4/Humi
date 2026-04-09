// Humi HRM – Data Layer v5 (localStorage + Supabase JS SDK)
// ─────────────────────────────────────────────────────────
// CẤU HÌNH SUPABASE: Điền URL và anon key của bạn vào đây
// Lấy từ: Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────────────────
var SUPABASE_URL = 'https://vbxyzblhcdiuaijshkls.supabase.co';  // ✅ Giữ nguyên
var SUPABASE_KEY = 'sb_publishable_s7_7ezmwir0sQW7uLiZ_Jw_KS8eXyXB';  // ✅ Giữ nguyên

// Sửa lại điều kiện kiểm tra cho phù hợp key mới
var SUPABASE_READY = SUPABASE_URL !== 'YOUR_PROJECT_URL' &&
                     SUPABASE_KEY !== 'YOUR_ANON_KEY' &&
                     (SUPABASE_KEY.substring(0, 3) === 'eyJ' ||      // key cũ
                      SUPABASE_KEY.substring(0, 3) === 'sb_');        // key mới ✅

// ─────────────────────────────────────────────────────────
// Khởi tạo Supabase JS Client (SDK chính thức v2)
// CDN đã được thêm vào tất cả HTML trước thẻ db.js
// ─────────────────────────────────────────────────────────
var _sbClient = null;
if (SUPABASE_READY && typeof supabase !== 'undefined') {
  try {
    _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase Client đã khởi tạo:', SUPABASE_URL);
  } catch(e) {
    console.error('❌ Không thể tạo Supabase Client:', e);
  }
}

// ─────────────────────────────────────────────────────────
// SB – wrapper gọn cho Supabase Client
// ─────────────────────────────────────────────────────────
var SB = {
  select: function(table) {
    if (!_sbClient) return Promise.resolve([]);
    return _sbClient.from(table).select('*')
      .then(function(r) {
        if (r.error) { console.error('❌ [Supabase] SELECT', table, r.error.message); return []; }
        console.log('✅ [Supabase] SELECT', table, '→', r.data.length, 'dòng');
        return r.data;
      });
  },
  upsert: function(table, data) {
    if (!_sbClient) return Promise.resolve();
    return _sbClient.from(table).upsert(Array.isArray(data) ? data : [data])
      .then(function(r) { if (r.error) console.error('❌ [Supabase] UPSERT', table, r.error.message); });
  },
  update: function(table, match, data) {
    if (!_sbClient) return Promise.resolve();
    var q = _sbClient.from(table).update(data);
    Object.keys(match).forEach(function(k) { q = q.eq(k, match[k]); });
    return q.then(function(r) { if (r.error) console.error('❌ [Supabase] UPDATE', table, r.error.message); });
  }
};

// ─────────────────────────────────────────────────────────
// Sync từ Supabase về localStorage (chạy 1 lần khi load)
// ─────────────────────────────────────────────────────────
function syncFromSupabase() {
  if (!SUPABASE_READY) return;
  var tables = [
    { remote:'employees',     local:'humi_employees',     map: function(r){ return { id:r.id, code:r.code, name:r.name, avatar:r.avatar, unit:r.unit, position:r.position, roleId:r.role_id, status:r.status, gender:r.gender, phone:r.phone, email:r.email, dob:r.dob, startDate:r.start_date, contractStatus:r.contract_status, contractType:r.contract_type, workMode:r.work_mode, managerName:r.manager_name, leaveBalance:r.leave_balance||{annual:12,sick:30,maternity:180,unpaid:99}, idCard:r.id_card, faceImage:r.face_image||null, faceDescriptor:r.face_descriptor||null }; } },
    { remote:'shifts',        local:'humi_shifts',        map: function(r){ return { id:r.id, name:r.name, code:r.code, startTime:r.start_time, endTime:r.end_time, breakMinutes:r.break_minutes, workHours:r.work_hours, quota:r.quota, active:r.active, color:r.color, applyDays:r.apply_days }; } },
    { remote:'leave_requests',local:'humi_leave_requests',map: function(r){ return { id:r.id, employeeId:r.employee_id, leaveType:r.leave_type, leaveTypeName:r.leave_type_name, startDate:r.start_date, endDate:r.end_date, totalDays:r.total_days, status:r.status, reason:r.reason, approverId:r.approver_id, approvedAt:r.approved_at||null, rejectedAt:r.rejected_at||null, rejectReason:r.reject_reason||null, createdAt:r.created_at }; } },
    { remote:'requests',      local:'humi_requests',      map: function(r){ return { id:r.id, employeeId:r.employee_id, type:r.type, typeLabel:r.type_label, content:r.content, status:r.status, approverId:r.approver_id, createdAt:r.created_at }; } },
    { remote:'salary',        local:'humi_salary',        map: function(r){ return { id:r.id, employeeId:r.employee_id, period:r.period, baseSalary:r.base_salary, grossSalary:r.gross_salary, netSalary:r.net_salary, workDays:r.work_days, actualWorkDays:r.actual_work_days, allowances:r.allowances||{}, deductions:r.deductions||{}, bonus:r.bonus, overtimePay:r.overtime_pay }; } },
    // announcements: Supabase dùng body thay preview, created_by_id thay creator
    { remote:'announcements', local:'humi_announcements', map: function(r){
        function strip(h){ return (h||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,150); }
        return { id:r.id, department:r.department||'', title:r.title,
          preview: r.preview || strip(r.body) || '',
          creator: r.creator || r.created_by_id || '',
          approver: r.approver || r.approved_by_id || '',
          status:r.status||'active', startDate:r.start_date, endDate:r.end_date };
      }
    },
    // messages: Supabase dùng from_name, from_id, tags[], created_at
    { remote:'messages', local:'humi_messages', map: function(r){
        function strip(h){ return (h||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,120); }
        var tagMap = { attendance:'Duyệt công', leave:'Nghỉ phép', salary:'Lương', shift:'Đổi ca', report:'Báo cáo', system:'Hệ thống', general:'Chung' };
        var clsMap = { attendance:'tag-orange', leave:'tag-blue', salary:'tag-green', shift:'tag-purple', report:'tag-green', system:'tag-gray', general:'tag-purple' };
        var rawTag = (r.tags && r.tags[0]) || '';
        return { id:r.id, toId:r.to_id, fromId:r.from_id||'',
          sender:  r.from_name  || r.sender  || 'Hệ thống',
          avatar:  r.avatar || 'https://i.pravatar.cc/36?img=12',
          subject: r.subject,
          preview: r.preview || strip(r.body),
          body:    r.body || '',
          actions: r.actions || [],
          tag:     r.tag || tagMap[rawTag] || rawTag || 'Hệ thống',
          tagClass:r.tag_class || clsMap[rawTag] || 'tag-purple',
          isRead:  r.is_read || false,
          important: r.important || false,
          deleted:   r.deleted  || false,
          timestamp: r.timestamp || r.created_at || '' };
      }
    },
    { remote:'attendance',    local:'humi_attendance',    map: function(r){ return { id:r.id, employeeId:r.employee_id, shiftId:r.shift_id||null, date:r.date, checkIn:r.check_in, checkOut:r.check_out, status:r.status, approvalStatus:r.approval_status, note:r.note, faceImageIn:r.face_image_in||null, faceImageOut:r.face_image_out||null, approverId:r.approver_id||null, approvedAt:r.approved_at||null, approvedCheckIn:r.approved_check_in||null, approvedCheckOut:r.approved_check_out||null, approverNote:r.approver_note||null }; } },
    // accounts KHÔNG sync từ Supabase — giữ local seed (password='123456') để login hoạt động
    { remote:'shift_assignments', local:'humi_shift_assignments', map: function(r){ return { id:r.id, employeeId:r.employee_id, shiftId:r.shift_id, date:r.date }; } },
  ];
  var promises = tables.map(function(t) {
    return SB.select(t.remote).then(function(rows) {
      if (rows && rows.length > 0) {
        var remoteData = rows.map(t.map);
        // Với messages: merge để không mất tin nhắn mới gửi chưa lên Supabase
        if (t.remote === 'messages') {
          try {
            var localMsgs = JSON.parse(localStorage.getItem(t.local) || '[]');
            var remoteIds = {};
            remoteData.forEach(function(r){ remoteIds[r.id] = true; });
            // Giữ lại tin nhắn local chưa có trên Supabase (vừa gửi, chưa sync)
            var localOnly = localMsgs.filter(function(r){ return !remoteIds[r.id]; });
            if (localOnly.length > 0) remoteData = remoteData.concat(localOnly);
          } catch(e) {}
        }
        // Với attendance: merge thông minh để không mất face image và record pending
        if (t.remote === 'attendance') {
          try {
            var localData = JSON.parse(localStorage.getItem(t.local) || '[]');
            // Map local theo id để tra nhanh
            var localMap = {};
            localData.forEach(function(r){ localMap[r.id] = r; });
            // Với mỗi record từ Supabase: bổ sung faceImage từ local nếu Supabase chưa có
            remoteData = remoteData.map(function(r) {
              var loc = localMap[r.id];
              if (loc) {
                if (!r.faceImageIn  && loc.faceImageIn)  r.faceImageIn  = loc.faceImageIn;
                if (!r.faceImageOut && loc.faceImageOut) r.faceImageOut = loc.faceImageOut;
              }
              return r;
            });
            // Giữ lại record local chưa có trên Supabase (pending upsert)
            var remoteIds = {};
            remoteData.forEach(function(r){ remoteIds[r.id] = true; });
            var pending = localData.filter(function(r){ return !remoteIds[r.id]; });
            if (pending.length > 0) remoteData = remoteData.concat(pending);
          } catch(e) {}
        }
        var newData = JSON.stringify(remoteData);
        var oldData = localStorage.getItem(t.local);
        if (newData !== oldData) {
          localStorage.setItem(t.local, newData);
          return true;
        }
      }
      return false;
    });
  });

  Promise.all(promises).then(function(results) {
    var hasUpdates = results.some(function(changed) { return changed; });
    if (hasUpdates && !sessionStorage.getItem('humi_synced_once')) {
      sessionStorage.setItem('humi_synced_once', '1');
      window.location.reload(); // Reload lần đầu để hiển thị dữ liệu từ Supabase
      return;
    }
    // Dispatch event để các trang tự refresh UI mà không cần reload
    window.dispatchEvent(new CustomEvent('humi_synced', { detail: { updated: hasUpdates } }));
  });
}

(function () {
  'use strict';

  // ==================== STORAGE KEYS ====================
  var SEED_KEY = 'humi_seeded_v6';
  var K = {
    employees:        'humi_employees',
    accounts:         'humi_accounts',
    session:          'humi_session',
    shifts:           'humi_shifts',
    shiftAssignments: 'humi_shift_assignments',
    attendance:       'humi_attendance',
    leaveRequests:    'humi_leave_requests',
    requests:         'humi_requests',
    salary:           'humi_salary',
    messages:         'humi_messages',
    settings:         'humi_settings',
    announcements:    'humi_announcements',
  };

  // ==================== HELPERS ====================
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
  }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  // ==================== SEED ====================
  function seed() {
    // Luôn seed dữ liệu local làm fallback.
    // Nếu Supabase hợp lệ, syncFromSupabase() sẽ ghi đè sau.
    if (localStorage.getItem(SEED_KEY)) return;

    var employees = [
      { id:'NV000001', code:'NV000001', name:'Nguyễn Văn An',   avatar:'https://i.pravatar.cc/80?img=11', unit:'CH613 Âu Cơ',        position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nam', phone:'0901234567', email:'an.nv@humi.vn',     dob:'1998-03-15', startDate:'2023-01-10', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Tiểu Nhi',   leaveBalance:{annual:10,sick:28,maternity:180,unpaid:99}, idCard:'012345678901' },
      { id:'NV000002', code:'NV000002', name:'Trần Thị Bích',   avatar:'https://i.pravatar.cc/80?img=32', unit:'CH613 Âu Cơ',        position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nữ',  phone:'0912345678', email:'bich.tt@humi.vn',   dob:'1999-07-22', startDate:'2023-03-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Tiểu Nhi',   leaveBalance:{annual:10,sick:30,maternity:180,unpaid:99}, idCard:'012345678902' },
      { id:'NV000003', code:'NV000003', name:'Lê Minh Quân',    avatar:'https://i.pravatar.cc/80?img=13', unit:'CH614 Lê Văn Sỹ',    position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nam', phone:'0923456789', email:'quan.lm@humi.vn',   dob:'1997-11-05', startDate:'2022-06-15', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Minh Quang', leaveBalance:{annual:12,sick:30,maternity:180,unpaid:99}, idCard:'012345678903' },
      { id:'NV000004', code:'NV000004', name:'Phạm Thị Thu',    avatar:'https://i.pravatar.cc/80?img=45', unit:'CH614 Lê Văn Sỹ',    position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nữ',  phone:'0934567890', email:'thu.pt@humi.vn',    dob:'2000-02-28', startDate:'2023-08-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng thử việc', workMode:'Toàn thời gian', managerName:'Minh Quang', leaveBalance:{annual:8, sick:30,maternity:180,unpaid:99}, idCard:'012345678904' },
      { id:'NV000005', code:'NV000005', name:'Hoàng Anh Tuấn',  avatar:'https://i.pravatar.cc/80?img=15', unit:'CH615 Nguyễn Trãi',  position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nam', phone:'0945678901', email:'tuan.ha@humi.vn',   dob:'1996-08-19', startDate:'2021-11-20', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Thanh Hương',leaveBalance:{annual:12,sick:27,maternity:180,unpaid:99}, idCard:'012345678905' },
      { id:'NV000006', code:'NV000006', name:'Đặng Thị Lan',    avatar:'https://i.pravatar.cc/80?img=16', unit:'CH615 Nguyễn Trãi',  position:'Nhân viên bán hàng', roleId:'employee', status:'active', gender:'Nữ',  phone:'0956789012', email:'lan.dt@humi.vn',    dob:'2001-04-12', startDate:'2024-02-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng thử việc', workMode:'Bán thời gian',  managerName:'Thanh Hương',leaveBalance:{annual:6, sick:30,maternity:180,unpaid:99}, idCard:'012345678906' },
      { id:'NV000007', code:'NV000007', name:'Bùi Văn Cường',   avatar:'https://i.pravatar.cc/80?img=17', unit:'CH613 Âu Cơ',        position:'Nhân viên kho',      roleId:'employee', status:'active', gender:'Nam', phone:'0967890123', email:'cuong.bv@humi.vn',  dob:'1995-09-30', startDate:'2020-05-15', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Tiểu Nhi',   leaveBalance:{annual:12,sick:30,maternity:180,unpaid:99}, idCard:'012345678907' },
      { id:'NV000008', code:'NV000008', name:'Nguyễn Thị Hoa',  avatar:'https://i.pravatar.cc/80?img=18', unit:'CH614 Lê Văn Sỹ',    position:'Thu ngân',           roleId:'employee', status:'active', gender:'Nữ',  phone:'0978901234', email:'hoa.nt@humi.vn',    dob:'1999-12-25', startDate:'2023-04-10', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Minh Quang', leaveBalance:{annual:11,sick:30,maternity:180,unpaid:99}, idCard:'012345678908' },
      { id:'NV000009', code:'NV000009', name:'Trương Văn Đức',  avatar:'https://i.pravatar.cc/80?img=19', unit:'CH615 Nguyễn Trãi',  position:'Nhân viên kho',      roleId:'employee', status:'active', gender:'Nam', phone:'0989012345', email:'duc.tv@humi.vn',    dob:'1997-06-14', startDate:'2022-09-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'Thanh Hương',leaveBalance:{annual:12,sick:30,maternity:180,unpaid:99}, idCard:'012345678909' },
      { id:'NV000010', code:'NV000010', name:'Lý Thị Mỹ',       avatar:'https://i.pravatar.cc/80?img=20', unit:'CH613 Âu Cơ',        position:'Thu ngân',           roleId:'employee', status:'active', gender:'Nữ',  phone:'0990123456', email:'my.lt@humi.vn',     dob:'2000-10-08', startDate:'2024-01-15', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng thử việc', workMode:'Toàn thời gian', managerName:'Tiểu Nhi',   leaveBalance:{annual:5, sick:30,maternity:180,unpaid:99}, idCard:'012345678910' },
      { id:'NV000011', code:'NV000011', name:'Tiểu Nhi',         avatar:'https://i.pravatar.cc/80?img=47', unit:'CH613 Âu Cơ',        position:'Quản lý chi nhánh',  roleId:'manager',  status:'active', gender:'Nữ',  phone:'0901111111', email:'nhi.t@humi.vn',     dob:'1992-05-20', startDate:'2019-03-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'—',          leaveBalance:{annual:15,sick:30,maternity:180,unpaid:99}, idCard:'012345678911' },
      { id:'NV000012', code:'NV000012', name:'Minh Quang',        avatar:'https://i.pravatar.cc/80?img=12', unit:'CH614 Lê Văn Sỹ',    position:'Quản lý chi nhánh',  roleId:'manager',  status:'active', gender:'Nam', phone:'0902222222', email:'quang.m@humi.vn',   dob:'1990-01-10', startDate:'2018-07-15', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'—',          leaveBalance:{annual:15,sick:30,maternity:180,unpaid:99}, idCard:'012345678912' },
      { id:'NV000013', code:'NV000013', name:'Thanh Hương',       avatar:'https://i.pravatar.cc/80?img=23', unit:'CH615 Nguyễn Trãi',  position:'Quản lý chi nhánh',  roleId:'manager',  status:'active', gender:'Nữ',  phone:'0903333333', email:'huong.t@humi.vn',   dob:'1991-08-30', startDate:'2019-01-20', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'—',          leaveBalance:{annual:15,sick:30,maternity:180,unpaid:99}, idCard:'012345678913' },
      { id:'NV000014', code:'NV000014', name:'Admin',              avatar:'https://i.pravatar.cc/80?img=7',  unit:'Công ty TNHH Humi',  position:'Quản trị hệ thống',  roleId:'admin',    status:'active', gender:'Nam', phone:'0904444444', email:'admin@humi.vn',      dob:'1985-12-01', startDate:'2015-01-01', contractStatus:'Đã có hợp đồng', contractType:'Hợp đồng dài hạn',   workMode:'Toàn thời gian', managerName:'—',          leaveBalance:{annual:20,sick:30,maternity:180,unpaid:99}, idCard:'012345678914' },
    ];

    var accounts = employees.map(function(e) {
      return { employeeId: e.id, password: '123456' };
    });

    var shifts = [
      { id:'SH001', name:'Ca sáng',      code:'CS',  startTime:'08:00', endTime:'17:00', breakMinutes:60, workHours:8, quota:5, active:true, color:'var(--primary)', applyDays:[1,2,3,4,5,6] },
      { id:'SH002', name:'Ca chiều',     code:'CC',  startTime:'13:00', endTime:'22:00', breakMinutes:60, workHours:8, quota:4, active:true, color:'#22c55e',       applyDays:[1,2,3,4,5,6] },
      { id:'SH003', name:'Ca tối',       code:'CT',  startTime:'18:00', endTime:'23:00', breakMinutes:30, workHours:5, quota:3, active:true, color:'#a855f7',       applyDays:[5,6,0] },
      { id:'SH004', name:'Ca ngắn sáng', code:'CNS', startTime:'08:00', endTime:'13:00', breakMinutes:0,  workHours:5, quota:3, active:true, color:'#f59e0b',       applyDays:[1,2,3,4,5,6] },
      { id:'SH005', name:'Ca ngắn chiều',code:'CNC', startTime:'15:00', endTime:'22:00', breakMinutes:30, workHours:7, quota:3, active:true, color:'#ea580c',       applyDays:[1,2,3,4,5,6] },
    ];

    // Generate attendance for March 2026 (Mon–Sat) and early April 2026
    var attendance = [];
    var empIds = employees.filter(function(e){ return e.status==='active'; }).map(function(e){ return e.id; });

    function genMonth(year, month) {
      var daysInMonth = new Date(year, month, 0).getDate();
      for (var day = 1; day <= daysInMonth; day++) {
        var d = new Date(year, month-1, day);
        var dow = d.getDay();
        if (dow === 0) continue; // skip Sunday
        var dateStr = year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
        empIds.forEach(function(eid) {
          var hash = (eid.charCodeAt(5)||0) + day;
          if (hash % 14 === 0) return; // ~7% absence
          var late = hash % 8 === 1;
          attendance.push({
            id: 'att_'+eid+'_'+dateStr,
            employeeId: eid,
            date: dateStr,
            checkIn:  late ? '08:15' : '08:00',
            checkOut: late ? '17:15' : '17:00',
            status: 'present',
            approvalStatus: (month === 3 && day <= 25) ? 'approved' : 'pending',
            note: ''
          });
        });
      }
    }

    genMonth(2026, 2); // February
    genMonth(2026, 3); // March
    // April: only first 4 days
    for (var ad = 1; ad <= 4; ad++) {
      var d = new Date(2026, 3, ad);
      if (d.getDay() === 0) continue;
      var ds = '2026-04-'+String(ad).padStart(2,'0');
      empIds.forEach(function(eid) {
        attendance.push({ id:'att_'+eid+'_'+ds, employeeId:eid, date:ds, checkIn:'08:00', checkOut:'17:00', status:'present', approvalStatus:'pending', note:'' });
      });
    }

    var leaveRequests = [
      { id:'LV001', employeeId:'NV000001', leaveType:'annual', leaveTypeName:'Nghỉ phép năm',    startDate:'2026-03-10', endDate:'2026-03-11', totalDays:2, status:'approved', reason:'Việc gia đình',  approverId:'NV000011', createdAt:'2026-03-05' },
      { id:'LV002', employeeId:'NV000002', leaveType:'sick',   leaveTypeName:'Nghỉ ốm',          startDate:'2026-03-15', endDate:'2026-03-15', totalDays:1, status:'approved', reason:'Ốm',            approverId:'NV000011', createdAt:'2026-03-14' },
      { id:'LV003', employeeId:'NV000003', leaveType:'annual', leaveTypeName:'Nghỉ phép năm',    startDate:'2026-04-07', endDate:'2026-04-07', totalDays:1, status:'pending',  reason:'Việc cá nhân',  approverId:null,       createdAt:'2026-03-31' },
      { id:'LV004', employeeId:'NV000004', leaveType:'sick',   leaveTypeName:'Nghỉ ốm',          startDate:'2026-03-20', endDate:'2026-03-21', totalDays:2, status:'rejected', reason:'Ốm đột ngột',   approverId:'NV000012', createdAt:'2026-03-19' },
      { id:'LV005', employeeId:'NV000005', leaveType:'annual', leaveTypeName:'Nghỉ phép năm',    startDate:'2026-04-10', endDate:'2026-04-12', totalDays:3, status:'pending',  reason:'Du lịch',       approverId:null,       createdAt:'2026-04-01' },
      { id:'LV006', employeeId:'NV000007', leaveType:'unpaid', leaveTypeName:'Nghỉ không lương', startDate:'2026-03-25', endDate:'2026-03-26', totalDays:2, status:'approved', reason:'Việc cá nhân',  approverId:'NV000011', createdAt:'2026-03-20' },
      { id:'LV007', employeeId:'NV000011', leaveType:'annual', leaveTypeName:'Nghỉ phép năm',    startDate:'2026-04-15', endDate:'2026-04-17', totalDays:3, status:'pending',  reason:'Nghỉ dưỡng',    approverId:null,       createdAt:'2026-04-02' },
      { id:'LV008', employeeId:'NV000008', leaveType:'maternity',leaveTypeName:'Nghỉ thai sản',  startDate:'2026-02-01', endDate:'2026-07-31', totalDays:180,status:'approved', reason:'Sinh con',      approverId:'NV000012', createdAt:'2026-01-25' },
    ];

    var requests = [
      { id:'REQ001', employeeId:'NV000002', type:'shift_change', typeLabel:'Đổi ca',        content:'Xin đổi ca ngày 15/04 từ ca sáng sang ca chiều',  status:'pending',  createdAt:'2026-03-30' },
      { id:'REQ002', employeeId:'NV000005', type:'overtime',     typeLabel:'Tăng ca',        content:'Xin tăng ca ngày 20/03 thêm 2 tiếng',            status:'approved', createdAt:'2026-03-18', approverId:'NV000013' },
      { id:'REQ003', employeeId:'NV000001', type:'attendance',   typeLabel:'Điều chỉnh công',content:'Xin điều chỉnh giờ vào ngày 05/03',               status:'pending',  createdAt:'2026-03-06' },
      { id:'REQ004', employeeId:'NV000003', type:'shift_change', typeLabel:'Đổi ca',        content:'Xin đổi ca ngày 22/03',                          status:'rejected', createdAt:'2026-03-15', approverId:'NV000012' },
    ];

    // Salary: build for each non-admin employee for Feb and Mar 2026
    var salary = [];
    employees.filter(function(e){ return e.roleId !== 'admin'; }).forEach(function(e) {
      var base = e.roleId === 'manager' ? 12000000 : 6500000;
      var meal = 730000, transport = 500000;
      var gross = base + meal + transport;
      var tax = e.roleId === 'manager' ? 500000 : 0;
      ['2026-02','2026-03'].forEach(function(period) {
        salary.push({
          id: 'SAL_'+e.id+'_'+period,
          employeeId: e.id, period: period,
          baseSalary: base, grossSalary: gross, netSalary: gross - tax,
          workDays: period === '2026-02' ? 24 : 26,
          actualWorkDays: period === '2026-02' ? 24 : 22,
          allowances: { meal: meal, transport: transport },
          deductions: { thueTNCN: tax },
          bonus: 0, overtimePay: 0,
        });
      });
    });

    // ── Sinh tin nhắn hệ thống động từ dữ liệu thực ──────────────────────
    var _sysAvatar = 'https://i.pravatar.cc/36?img=12';
    function _daysAgo(n, h) {
      var d = new Date(); d.setDate(d.getDate() - n);
      d.setHours(h !== undefined ? h : 8 + Math.floor(Math.random()*9), Math.floor(Math.random()*59), 0, 0);
      return d.toISOString();
    }
    function _vnd(n) { return n.toLocaleString('vi-VN') + 'đ'; }
    function _card(rows) {
      return '<div style="background:#F2F6FA;border-radius:8px;padding:14px 18px;margin:12px 0;display:flex;flex-direction:column;gap:8px;">' + rows + '</div>';
    }
    function _row(left, right, rightColor) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;">'
        + '<span style="font-size:12.5px;color:#2A3547;">' + left + '</span>'
        + '<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;' + (rightColor||'background:#f1f5f9;color:#64748b') + '">' + right + '</span>'
        + '</div>';
    }
    function _footer(link, label) {
      return '<p style="font-size:12px;color:#7C8FAC;margin-top:12px;">Truy cập <a href="' + link + '" style="color:var(--primary);font-weight:600;">' + label + '</a> để xem chi tiết.<br>– Hệ thống Humi tự động gửi</p>';
    }

    var messages = [];

    // 1. Thông báo lương cho từng nhân viên (kỳ mới nhất)
    var _latestPeriod = '2026-03';
    var _mm = _latestPeriod.split('-')[1], _yyyy = _latestPeriod.split('-')[0];
    var _nextMm = String(parseInt(_mm) + 1).padStart(2, '0');
    employees.forEach(function(e) {
      var sal = salary.find(function(s) { return s.employeeId === e.id && s.period === _latestPeriod; });
      if (!sal) return;
      var ded = sal.grossSalary - sal.netSalary;
      messages.push({
        id: 'msg_sys_sal_' + e.id + '_' + _latestPeriod.replace('-',''),
        fromId:'SYSTEM', toId:e.id, sender:'Hệ thống Humi', avatar:_sysAvatar,
        subject: 'Bảng lương tháng ' + _mm + '/' + _yyyy + ' đã sẵn sàng',
        preview: 'Lương thực nhận: ' + _vnd(sal.netSalary) + '. Chuyển khoản trước ngày 05/' + _nextMm + '/' + _yyyy,
        body: '<p>Kính gửi <strong>' + e.name + '</strong>,</p>'
          + '<p>Bảng lương tháng <strong>' + _mm + '/' + _yyyy + '</strong> đã được xử lý và sẵn sàng để xem.</p>'
          + '<div style="background:#F2F6FA;border-radius:8px;padding:16px 20px;margin:12px 0;">'
          + '<p style="margin:0 0 10px;font-size:12.5px;font-weight:700;color:#2A3547;">Tóm tắt lương tháng ' + _mm + '/' + _yyyy + '</p>'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;"><span style="color:#7C8FAC;">Lương gross</span><span style="font-weight:600;">' + _vnd(sal.grossSalary) + '</span></div>'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#7C8FAC;">Khấu trừ thuế</span><span style="color:#ef4444;font-weight:600;">-' + _vnd(ded) + '</span></div>'
          + '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;border-top:1px solid #e5eaef;padding-top:8px;"><span>Thực nhận</span><span style="color:#16a34a;">' + _vnd(sal.netSalary) + '</span></div>'
          + '</div>'
          + '<p style="font-size:13px;">Tiền lương sẽ được chuyển khoản trước ngày <strong>05/' + _nextMm + '/' + _yyyy + '</strong>.</p>'
          + _footer('xem-thu-nhap.html', 'Xem thu nhập'),
        tag:'Lương', tagClass:'tag-green',
        isRead:false, important:false, deleted:false, timestamp:_daysAgo(6, 8),
        actions:[{ label:'Xem bảng lương', href:'xem-thu-nhap.html', primary:true }]
      });
    });

    // 2. Tổng kết ca chờ duyệt cho từng quản lý
    var _pendingAtt = attendance.filter(function(a) { return a.approvalStatus === 'pending'; });
    if (_pendingAtt.length > 0) {
      var _byEmp = {};
      _pendingAtt.forEach(function(a) { _byEmp[a.employeeId] = (_byEmp[a.employeeId]||0) + 1; });
      var _attRows = Object.keys(_byEmp).slice(0,6).map(function(eid) {
        var em = employees.find(function(x) { return x.id === eid; });
        return _row((em ? em.name + ' – ' + eid : eid), _byEmp[eid] + ' ca chờ', 'background:#fff7ed;color:#ea580c;');
      }).join('');
      employees.filter(function(e) { return e.roleId === 'manager' || e.roleId === 'admin'; }).forEach(function(mgr) {
        messages.push({
          id: 'msg_sys_att_' + mgr.id,
          fromId:'SYSTEM', toId:mgr.id, sender:'Hệ thống Humi', avatar:_sysAvatar,
          subject: 'Có ' + _pendingAtt.length + ' ca chấm công chờ duyệt',
          preview: 'Hệ thống ghi nhận ' + _pendingAtt.length + ' ca chấm công đang chờ phê duyệt từ ' + Object.keys(_byEmp).length + ' nhân viên.',
          body: '<p>Kính gửi <strong>' + mgr.name + '</strong>,</p>'
            + '<p>Hệ thống ghi nhận có <strong>' + _pendingAtt.length + ' ca chấm công</strong> đang chờ phê duyệt từ <strong>' + Object.keys(_byEmp).length + ' nhân viên</strong>.</p>'
            + _card(_attRows)
            + _footer('duyet-cong.html', 'Duyệt công'),
          tag:'Duyệt công', tagClass:'tag-orange',
          isRead:false, important:false, deleted:false, timestamp:_daysAgo(1, 10),
          actions:[{ label:'Đi đến Duyệt công', href:'duyet-cong.html', primary:true }]
        });
      });
    }

    // 3. Đơn nghỉ phép chờ duyệt cho từng quản lý
    var _pendingLeave = leaveRequests.filter(function(r) { return r.status === 'pending'; });
    if (_pendingLeave.length > 0) {
      var _leaveRows = _pendingLeave.slice(0,6).map(function(lr) {
        var em = employees.find(function(x) { return x.id === lr.employeeId; });
        return _row((em ? em.name : lr.employeeId), lr.leaveTypeName + ' – ' + lr.totalDays + ' ngày', 'background:#eff6ff;color:#2563eb;');
      }).join('');
      employees.filter(function(e) { return e.roleId === 'manager' || e.roleId === 'admin'; }).forEach(function(mgr) {
        messages.push({
          id: 'msg_sys_leave_' + mgr.id,
          fromId:'SYSTEM', toId:mgr.id, sender:'Hệ thống Humi', avatar:_sysAvatar,
          subject: 'Có ' + _pendingLeave.length + ' đơn nghỉ phép chờ duyệt',
          preview: 'Có ' + _pendingLeave.length + ' đơn xin nghỉ phép đang chờ phê duyệt từ nhân viên.',
          body: '<p>Kính gửi <strong>' + mgr.name + '</strong>,</p>'
            + '<p>Có <strong>' + _pendingLeave.length + ' đơn nghỉ phép</strong> đang chờ phê duyệt:</p>'
            + _card(_leaveRows)
            + _footer('danh-sach-phieu-nghi.html', 'Duyệt phép'),
          tag:'Nghỉ phép', tagClass:'tag-blue',
          isRead:false, important:false, deleted:false, timestamp:_daysAgo(2, 9),
          actions:[{ label:'Đi đến Duyệt phép', href:'danh-sach-phieu-nghi.html', primary:true }]
        });
      });
    }

    save(K.employees,        employees);
    save(K.accounts,         accounts);
    save(K.shifts,           shifts);
    save(K.attendance,       attendance);
    save(K.leaveRequests,    leaveRequests);
    save(K.requests,         requests);
    save(K.salary,           salary);
    save(K.messages,         messages);
    save(K.settings,         {});
    var announcements = [
      { id:'ann_001', department:'Phòng hành chính nhân sự', title:'THÔNG BÁO NGHỈ TẾT ÂM LỊCH NĂM 2026', preview:'Phòng Hành chính Nhân sự trân trọng thông báo lịch nghỉ Tết Âm Lịch 2026 tới toàn thể CBNV như sau:', creator:'Nguyễn Hoàng Kim Phụng', approver:'Cao Thị Hà Như', status:'active', startDate:'2026-02-05', endDate:'2026-02-25' },
      { id:'ann_002', department:'Phòng hành chính nhân sự', title:'THÔNG BÁO TỔ CHỨC TIỆC TẤT NIÊN (YEAR END PARTY) 2025', preview:'Ban Tổ chức trân trọng kính mời toàn thể CBNV tham dự buổi tiệc tất niên năm 2025...', creator:'Nguyễn Hoàng Kim Phụng', approver:'Võ Lê Hoàng Văn', status:'expired', startDate:'2026-01-01', endDate:'2026-01-31' },
      { id:'ann_003', department:'Ban Giám đốc', title:'THÔNG BÁO ĐIỀU CHỈNH GIỜ LÀM VIỆC THÁNG 04/2026', preview:'Kính thông báo về điều chỉnh giờ làm việc trong tháng 04/2026 áp dụng cho tất cả chi nhánh.', creator:'Tiểu Nhi', approver:'Cao Thị Hà Như', status:'active', startDate:'2026-04-01', endDate:'2026-04-30' },
    ];
    save(K.announcements,    announcements);
    save(K.shiftAssignments, []);

    localStorage.setItem(SEED_KEY, '1');
  }

  seed();

  // ==================== PUBLIC DB API ====================
  window.DB = {

    auth: {
      getSession: function() {
        try { return JSON.parse(localStorage.getItem(K.session)); } catch(e) { return null; }
      },
      requireAuth: function() {
        var s = this.getSession();
        if (!s) { window.location.href = 'login.html'; return null; }
        return s;
      },
      login: function(empId, pwd) {
        var accounts = load(K.accounts);
        var acc = accounts.find(function(a){ return a.employeeId === empId && a.password === pwd; });
        if (!acc) return { ok:false, error:'Mã nhân viên hoặc mật khẩu không đúng' };
        var emp = load(K.employees).find(function(e){ return e.id === empId; });
        if (!emp || emp.status !== 'active') return { ok:false, error:'Tài khoản không hoạt động' };
        var session = { user: emp, loginAt: new Date().toISOString() };
        save(K.session, session);
        return { ok:true, user:emp };
      },
      logout: function() { localStorage.removeItem(K.session); },
      changePassword: function(oldPwd, newPwd) {
        var s = this.getSession();
        if (!s) return { ok:false, error:'Chưa đăng nhập' };
        var accounts = load(K.accounts);
        var idx = accounts.findIndex(function(a){ return a.employeeId === s.user.id && a.password === oldPwd; });
        if (idx === -1) return { ok:false, error:'Mật khẩu hiện tại không đúng' };
        accounts[idx].password = newPwd;
        save(K.accounts, accounts);
        // Đồng bộ mật khẩu mới lên Supabase
        SB.update('accounts', { employee_id: s.user.id }, { password: newPwd });
        return { ok:true };
      }
    },

    employees: {
      getAll: function() { return load(K.employees); },
      getById: function(id) { return this.getAll().find(function(e){ return e.id === id; }) || null; },
      update: function(id, data) {
        var list = this.getAll();
        var idx = list.findIndex(function(e){ return e.id === id; });
        if (idx === -1) return;
        list[idx] = Object.assign({}, list[idx], data);
        save(K.employees, list);
        // Sync session if same user
        try {
          var s = DB.auth.getSession();
          if (s && s.user && s.user.id === id) { s.user = list[idx]; save(K.session, s); }
        } catch(e) {}
        // Sync to Supabase
        var sbData = {};
        if (data.name !== undefined)     sbData.name = data.name;
        if (data.email !== undefined)    sbData.email = data.email;
        if (data.phone !== undefined)    sbData.phone = data.phone;
        if (data.avatar !== undefined)   sbData.avatar = data.avatar;
        if (data.unit !== undefined)     sbData.unit = data.unit;
        if (data.position !== undefined) sbData.position = data.position;
        if (data.dob !== undefined)      sbData.dob = data.dob;
        if (data.leaveBalance !== undefined) sbData.leave_balance = data.leaveBalance;
        if (data.faceImage      !== undefined) sbData.face_image      = data.faceImage;
        if (data.faceDescriptor !== undefined) sbData.face_descriptor = data.faceDescriptor;
        if (Object.keys(sbData).length > 0) SB.update('employees', { id: id }, sbData);
      },
      create: function(data) {
        var list = this.getAll();
        var maxNum = list.reduce(function(m,e){ var n=parseInt((e.id||'').replace(/\D/g,'')||0); return n>m?n:m; }, 0);
        var newId = 'NV' + String(maxNum+1).padStart(6,'0');
        var emp = Object.assign({ id:newId, code:newId, status:'active', leaveBalance:{annual:12,sick:30,maternity:180,unpaid:99} }, data);
        list.push(emp);
        save(K.employees, list);
        var accounts = load(K.accounts);
        accounts.push({ employeeId:newId, password:'123456' });
        save(K.accounts, accounts);
        return emp;
      }
    },

    attendance: {
      getAll: function(filter) {
        var list = load(K.attendance);
        if (filter) {
          if (filter.employeeId) list = list.filter(function(r){ return r.employeeId === filter.employeeId; });
          if (filter.date)       list = list.filter(function(r){ return r.date === filter.date; });
        }
        return list;
      },
      getTodayStatus: function(employeeId, shiftId) {
        var t = todayStr();
        var all = this.getAll({ employeeId:employeeId, date:t });
        var rec;
        if (shiftId != null) {
          rec = all.find(function(r){ return String(r.shiftId) === String(shiftId); });
        } else {
          rec = all[0];
        }
        return { checkedIn: !!(rec && rec.checkIn), checkedOut: !!(rec && rec.checkOut), record: rec || null };
      },
      checkIn: function(employeeId, shiftId, location, note, faceImage) {
        var t = todayStr();
        var list = load(K.attendance);
        var existing = list.find(function(r){ return r.employeeId===employeeId && r.date===t && String(r.shiftId)===String(shiftId); });
        if (existing && existing.checkIn) return { ok:false, error:'Đã chấm công vào ca này hôm nay' };
        var now = new Date();
        var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        var rec = { id:'att_'+employeeId+'_'+t+'_'+shiftId, employeeId:employeeId, shiftId:shiftId, date:t, checkIn:timeStr, checkOut:null, status:'present', approvalStatus:'pending', note:note||'', location:location||null, faceImageIn:faceImage||null, faceImageOut:null };
        list.push(rec);
        save(K.attendance, list);
        SB.upsert('attendance', { id:rec.id, employee_id:rec.employeeId, shift_id:rec.shiftId, date:rec.date, check_in:rec.checkIn, check_out:null, status:rec.status, approval_status:rec.approvalStatus, note:rec.note, face_image_in:rec.faceImageIn });
        return { ok:true, record:rec };
      },
      checkOut: function(employeeId, shiftId, faceImage) {
        var t = todayStr();
        var list = load(K.attendance);
        var idx = list.findIndex(function(r){ return r.employeeId===employeeId && r.date===t && String(r.shiftId)===String(shiftId) && r.checkIn && !r.checkOut; });
        if (idx === -1) return { ok:false, error:'Chưa chấm công vào hoặc đã chấm công ra ca này' };
        var now = new Date();
        list[idx].checkOut = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        list[idx].faceImageOut = faceImage || null;
        save(K.attendance, list);
        SB.update('attendance', { id: list[idx].id }, { check_out: list[idx].checkOut, face_image_out: list[idx].faceImageOut });
        return { ok:true, record:list[idx] };
      },
      getMonthStats: function(employeeId, period) {
        var list = this.getAll({ employeeId:employeeId }).filter(function(r){ return r.date && r.date.startsWith(period); });
        return { worked: list.filter(function(r){ return r.checkIn; }).length, total: list.length };
      },
      // Duyệt công: lưu vào approved_check_in/out — KHÔNG ghi đè check_in/out gốc
      approve: function(id, approverId, overrides) {
        var list = load(K.attendance);
        var idx = list.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        var now = new Date().toISOString();
        list[idx].approvalStatus  = 'approved';
        list[idx].approverId      = approverId;
        list[idx].approvedAt      = now;
        if (overrides) {
          if (overrides.checkIn)      list[idx].approvedCheckIn  = overrides.checkIn;
          if (overrides.checkOut)     list[idx].approvedCheckOut = overrides.checkOut;
          if (overrides.approverNote) list[idx].approverNote     = overrides.approverNote;
        }
        save(K.attendance, list);
        var sbData = { approval_status:'approved', approver_id:approverId, approved_at:now };
        if (overrides && overrides.checkIn)      sbData.approved_check_in  = overrides.checkIn;
        if (overrides && overrides.checkOut)     sbData.approved_check_out = overrides.checkOut;
        if (overrides && overrides.approverNote) sbData.approver_note      = overrides.approverNote;
        SB.update('attendance', { id: id }, sbData);
        return true;
      },
      // Từ chối công
      reject: function(id, approverId, note) {
        var list = load(K.attendance);
        var idx = list.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return false;
        var now = new Date().toISOString();
        list[idx].approvalStatus = 'rejected';
        list[idx].approverId     = approverId;
        list[idx].approvedAt     = now;
        if (note) list[idx].approverNote = note;
        save(K.attendance, list);
        SB.update('attendance', { id: id }, { approval_status:'rejected', approver_id:approverId, approved_at:now, approver_note:note||'' });
        return true;
      }
    },

    leaves: {
      getAll: function() { return load(K.leaveRequests); },
      getHistory: function(employeeId) {
        return this.getAll().filter(function(l){ return l.employeeId === employeeId; });
      },
      getBalance: function(employeeId) {
        var emp = DB.employees.getById(employeeId);
        if (!emp || !emp.leaveBalance) return { annual:0, sick:0, maternity:0, unpaid:0 };
        return emp.leaveBalance;
      },
      submit: function(data) {
        var list = this.getAll();
        var id = 'LV' + Date.now();
        var now = new Date().toISOString();
        var req = { id:id, employeeId:data.employeeId, leaveType:data.leaveType, leaveTypeName:data.leaveTypeName,
          startDate:data.startDate, endDate:data.endDate, totalDays:data.totalDays,
          status:'pending', reason:data.reason||'', approverId:null,
          approvedAt:null, rejectedAt:null, rejectReason:null, createdAt:now };
        list.push(req); save(K.leaveRequests, list);
        SB.upsert('leave_requests', { id:id, employee_id:data.employeeId, leave_type:data.leaveType,
          leave_type_name:data.leaveTypeName, start_date:data.startDate, end_date:data.endDate,
          total_days:data.totalDays, status:'pending', reason:data.reason||'', created_at:now });
        return req;
      },
      approve: function(id, approverId) {
        var list = this.getAll();
        var idx = list.findIndex(function(l){ return l.id === id; });
        if (idx === -1) return;
        var l = list[idx];
        var now = new Date().toISOString();
        l.status = 'approved'; l.approverId = approverId; l.approvedAt = now;
        save(K.leaveRequests, list);
        // Trừ số ngày phép tồn
        var emps = load(K.employees);
        var eidx = emps.findIndex(function(e){ return e.id === l.employeeId; });
        if (eidx !== -1 && emps[eidx].leaveBalance && emps[eidx].leaveBalance[l.leaveType] !== undefined) {
          emps[eidx].leaveBalance[l.leaveType] = Math.max(0, (emps[eidx].leaveBalance[l.leaveType]||0) - l.totalDays);
          save(K.employees, emps);
          SB.update('employees', { id: l.employeeId }, { leave_balance: emps[eidx].leaveBalance });
        }
        SB.update('leave_requests', { id:id }, { status:'approved', approver_id:approverId, approved_at:now });
      },
      reject: function(id, rejecterId, reason) {
        var list = this.getAll();
        var idx = list.findIndex(function(l){ return l.id === id; });
        if (idx === -1) return;
        var now = new Date().toISOString();
        list[idx].status = 'rejected'; list[idx].approverId = rejecterId;
        list[idx].rejectedAt = now; list[idx].rejectReason = reason || null;
        save(K.leaveRequests, list);
        SB.update('leave_requests', { id:id }, { status:'rejected', approver_id:rejecterId, rejected_at:now, reject_reason:reason||null });
      }
    },

    shifts: {
      getAll: function() { return load(K.shifts); },
      getById: function(id) { return this.getAll().find(function(s){ return s.id === id; }) || null; },
      create: function(data) {
        var list = this.getAll();
        var newId = 'SH' + String(list.length+1).padStart(3,'0');
        var sh = Object.assign({ id:newId }, data);
        list.push(sh);
        save(K.shifts, list);
        return sh;
      },
      update: function(id, data) {
        var list = this.getAll();
        var idx = list.findIndex(function(s){ return s.id === id; });
        if (idx === -1) return;
        list[idx] = Object.assign({}, list[idx], data);
        save(K.shifts, list);
      },
      assign: function(data) {
        var list = load(K.shiftAssignments);
        var newItem = Object.assign({ id:uid() }, data);
        list.push(newItem);
        save(K.shiftAssignments, list);
        SB.upsert('shift_assignments', { id: newItem.id, employee_id: newItem.employeeId, shift_id: newItem.shiftId, date: newItem.date });
      }
    },

    requests: {
      getAll: function() { return load(K.requests); },
      approve: function(id, approverId) {
        var list = this.getAll();
        var idx = list.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return;
        list[idx].status = 'approved'; list[idx].approverId = approverId;
        save(K.requests, list);
      },
      reject: function(id, rejecterId) {
        var list = this.getAll();
        var idx = list.findIndex(function(r){ return r.id === id; });
        if (idx === -1) return;
        list[idx].status = 'rejected'; list[idx].approverId = rejecterId;
        save(K.requests, list);
      }
    },

    salary: {
      getAll: function() { return load(K.salary); },
      getByEmployee: function(employeeId, year) {
        return this.getAll().filter(function(r){ return r.employeeId===employeeId && r.period.startsWith(String(year)); });
      },
      getRecord: function(employeeId, period) {
        return this.getAll().find(function(r){ return r.employeeId===employeeId && r.period===period; }) || null;
      }
    },

    messages: {
      getAll: function() { return load(K.messages); },
      getInbox: function(userId) { return this.getAll().filter(function(m){ return m.toId === userId && !m.deleted; }); },
      getSent:  function(userId) { return this.getAll().filter(function(m){ return m.fromId === userId && !m.deleted; }); },
      getById:  function(id)     { return this.getAll().find(function(m){ return m.id === id; }) || null; },
      markRead: function(id) {
        var list = this.getAll(), idx = list.findIndex(function(m){ return m.id === id; });
        if (idx !== -1) { list[idx].isRead = true; save(K.messages, list); SB.update('messages', { id: id }, { is_read: true }); }
      },
      markUnread: function(id) {
        var list = this.getAll(), idx = list.findIndex(function(m){ return m.id === id; });
        if (idx !== -1) { list[idx].isRead = false; save(K.messages, list); SB.update('messages', { id: id }, { is_read: false }); }
      },
      markImportant: function(id, val) {
        var list = this.getAll(), idx = list.findIndex(function(m){ return m.id === id; });
        if (idx !== -1) { list[idx].important = val; save(K.messages, list); }
        // SB.update chỉ chạy nếu cột important tồn tại trong Supabase
        // SB.update('messages', { id: id }, { important: val });
      },
      delete: function(id) {
        var list = this.getAll(), idx = list.findIndex(function(m){ return m.id === id; });
        if (idx !== -1) { list[idx].deleted = true; save(K.messages, list); }
        // SB.update chỉ chạy nếu cột deleted tồn tại trong Supabase
        // SB.update('messages', { id: id }, { deleted: true });
      },
      sendSystem: function(toId, subject, body, tagKey, actions) {
        var msg = this.send('SYSTEM', 'Hệ thống Humi', 'https://i.pravatar.cc/36?img=12', toId, subject, body, tagKey);
        if (msg && actions) { msg.actions = actions; var list = this.getAll(); var idx = list.findIndex(function(m){ return m.id === msg.id; }); if (idx !== -1) { list[idx].actions = actions; save(K.messages, list); } }
        return msg;
      },
      send: function(fromId, fromName, fromAvatar, toId, subject, body, tagKey) {
        var tagMap = { attendance:'Duyệt công', leave:'Nghỉ phép', salary:'Lương', shift:'Đổi ca', report:'Báo cáo', system:'Hệ thống', general:'Chung' };
        var clsMap = { attendance:'tag-orange', leave:'tag-blue', salary:'tag-green', shift:'tag-purple', report:'tag-green', system:'tag-gray', general:'tag-purple' };
        var id = 'msg_' + Date.now();
        var now = new Date().toISOString();
        var preview = body.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,120);
        var msg = { id:id, fromId:fromId, toId:toId, sender:fromName,
          avatar: fromAvatar || 'https://i.pravatar.cc/36?img=47',
          subject:subject, preview:preview, body:body,
          tag: tagMap[tagKey]||'Chung', tagClass: clsMap[tagKey]||'tag-purple',
          isRead:false, important:false, deleted:false, timestamp:now, actions:[] };
        var list = this.getAll(); list.push(msg); save(K.messages, list);
        SB.upsert('messages', { id:id, from_id:fromId, from_name:fromName, to_id:toId,
          subject:subject, body:body, preview:preview,
          tags: tagKey ? [tagKey] : [], is_read:false, created_at:now });
        return msg;
      }
    },

    settings: {
      get: function(userId) { try { return JSON.parse(localStorage.getItem('humi_user_settings_'+userId)||'{}'); } catch(e){ return {}; } },
      set: function(userId, data) { localStorage.setItem('humi_user_settings_'+userId, JSON.stringify(data)); }
    },

    announcements: {
      getAll: function() { return load(K.announcements); }
    },

    utils: {
      showToast: function(message, type) {
        var el = document.getElementById('toast');
        if (!el) return;
        el.textContent = message;
        el.className = 'toast show';
        el.style.background = (type === 'error') ? '#ef4444' : '#2A3547';
        clearTimeout(el._t);
        el._t = setTimeout(function(){ el.className = 'toast'; el.style.background = ''; }, 3000);
      },
      formatDate: function(iso) {
        if (!iso) return '—';
        var p = iso.split('-');
        if (p.length !== 3) return iso;
        return p[2]+'/'+p[1]+'/'+p[0];
      }
    }
  };

  // ==================== AUTO-POPULATE SIDEBAR / TOPBAR ====================
  // Runs on every page after DOM is ready. Replaces hardcoded "Tiểu Nhi" /
  // "Quản lý" placeholder text nodes and avatar images with the real session user.
  document.addEventListener('DOMContentLoaded', function() {
    var s = DB.auth.getSession();
    if (!s || !s.user) return;
    var u = s.user;
    var ROLE_LABEL = { manager:'Quản lý', employee:'Nhân viên', admin:'Quản trị' };
    var role = ROLE_LABEL[u.roleId] || 'Nhân viên';

    // Replace exact-text placeholder nodes
    document.querySelectorAll('p, span, a').forEach(function(el) {
      if (el.children.length > 0) return; // skip non-leaf nodes
      var t = el.textContent.trim();
      if (t === 'Tiểu Nhi')  { el.textContent = u.name; return; }
      // Only replace "Quản lý" when it stands alone (sidebar/topbar role label)
      if (t === 'Quản lý' || t === 'Nhân viên' || t === 'Quản trị') {
        // Ensure it's next to a "Tiểu Nhi"-type sibling (i.e., inside sidebar/topbar user card)
        var par = el.parentElement;
        if (par) {
          var siblings = Array.from(par.querySelectorAll('p,span'));
          var hasName = siblings.some(function(s){ return s !== el && s.children.length === 0 && s.textContent.trim() === u.name; });
          if (hasName) el.textContent = role;
        }
      }
    });

    // Replace sidebar/topbar avatar images (pravatar img=47 placeholder)
    if (u.avatar) {
      document.querySelectorAll('img[src*="pravatar.cc"][src*="img=47"]').forEach(function(img) {
        img.src = u.avatar;
      });
    }
  });

})();

// Sync từ Supabase sau khi IIFE chạy xong (không block trang)
setTimeout(syncFromSupabase, 500);

// Đăng xuất toàn cục — dùng được từ mọi trang
function doLogout() {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  DB.auth.logout();
  window.location.href = 'login.html';
}
