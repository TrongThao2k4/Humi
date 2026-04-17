// ====== AUTH ======
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


  // ====== SETTINGS STORAGE ======
  const SETTINGS_KEY = 'humi_user_settings_' + (currentUser?.id || 'default');
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
  }
  function saveSettings(patch) {
    const s = getSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({...s, ...patch}));
  }

  // ====== PANEL SWITCHING ======
  function switchPanel(id, el) {
    document.querySelectorAll('.set-nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
  }

  function showToast(msg) { DB.utils.showToast(msg); }

  // ====== MODAL ======
  function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  }
  function closeModalOnBg(e, id) {
    if (e.target === document.getElementById(id)) closeModal(id);
  }

  // ====== TAB 1: HỒ SƠ CÁ NHÂN ======
  let _origProfile = {};

  function loadProfile() {
    // Set max date for birthdate = today
    document.getElementById('profBirth').max = new Date().toISOString().split('T')[0];

    const emp = DB.employees.getById(currentUser.id);
    if (!emp) return;
    _origProfile = { name: emp.name||'', email: emp.email||'', phone: emp.phone||'', birth: emp.dob||'' };
    document.getElementById('profName').value = emp.name || '';
    document.getElementById('profCode').value = emp.code || '';
    document.getElementById('profEmail').value = emp.email || '';
    document.getElementById('profPhone').value = (emp.phone||'').replace(/\D/g,'');
    document.getElementById('profPosition').value = emp.position || '';
    document.getElementById('profBranch').value = emp.unit || '';
    document.getElementById('profBirth').value = emp.dob || '';
    const dn = document.getElementById('profDisplayName');
    if (dn && emp.name) dn.textContent = emp.name;
    const ROLE_LABEL = { manager:'Quản lý', employee:'Nhân viên', admin:'Quản trị viên' };
    const sl = document.getElementById('profSubline');
    if (sl) sl.textContent = (ROLE_LABEL[emp.roleId] || 'Nhân viên') + ' · ' + (emp.unit || '');
    // Update avatar: ưu tiên ảnh đã lưu trong cài đặt nếu có
    const avatarImg = document.getElementById('avatarImg');
    const savedAvatar = getSettings().avatar || emp.avatar || '';
    if (avatarImg && savedAvatar) avatarImg.src = savedAvatar;
  }

  function resetProfile() {
    document.getElementById('profName').value = _origProfile.name;
    document.getElementById('profEmail').value = _origProfile.email;
    document.getElementById('profPhone').value = _origProfile.phone;
    document.getElementById('profBirth').value = _origProfile.birth;
    ['profEmail','profPhone','profBirth'].forEach(id => {
      document.getElementById(id).classList.remove('invalid','valid');
    });
    ['errEmail','errPhone','errBirth'].forEach(id => {
      document.getElementById(id).classList.remove('show');
    });
    DB.utils.showToast('Đã hủy thay đổi');
  }

  function validateEmail(input) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.classList.toggle('invalid', !ok && input.value.length > 0);
    input.classList.toggle('valid', ok);
    document.getElementById('errEmail').classList.toggle('show', !ok && input.value.length > 0);
    return ok || input.value.length === 0;
  }

  function validatePhone(input) {
    const ok = /^\d{9,11}$/.test(input.value);
    input.classList.toggle('invalid', !ok && input.value.length > 0);
    input.classList.toggle('valid', ok);
    document.getElementById('errPhone').classList.toggle('show', !ok && input.value.length > 0);
    return ok || input.value.length === 0;
  }

  function validateBirthDate(input) {
    const val = input.value;
    const ok = !val || new Date(val) <= new Date();
    input.classList.toggle('invalid', !ok);
    document.getElementById('errBirth').classList.toggle('show', !ok);
    return ok;
  }

  function saveProfile() {
    const name = document.getElementById('profName').value.trim();
    const email = document.getElementById('profEmail').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const birth = document.getElementById('profBirth').value;
    const avatar = getSettings().avatar || '';

    if (!name) { DB.utils.showToast('Vui lòng nhập họ tên', 'error'); return; }
    if (email && !validateEmail(document.getElementById('profEmail'))) {
      DB.utils.showToast('Email không đúng định dạng', 'error'); return;
    }
    if (phone && !validatePhone(document.getElementById('profPhone'))) {
      DB.utils.showToast('Số điện thoại không hợp lệ', 'error'); return;
    }
    if (birth && new Date(birth) > new Date()) {
      DB.utils.showToast('Ngày sinh không hợp lệ', 'error'); return;
    }

    const btn = document.getElementById('btnSaveProfile');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
      var payload = { name, email, phone, dob: birth };
      if (avatar) payload.avatar = avatar;
      DB.employees.update(currentUser.id, payload);
      _origProfile = { name, email, phone, birth };
      const dn = document.getElementById('profDisplayName');
      if (dn) dn.textContent = name.split(' ').slice(-1)[0] || name;
      btn.classList.remove('loading'); btn.disabled = false;
      DB.utils.showToast('Đã lưu thay đổi thành công!');
    }, 600);
  }

  // ====== AVATAR ======
  function triggerAvatarUpload() {
    document.getElementById('avatarFileInput').click();
  }

  function handleAvatarChange(input) {
    const file = input.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      DB.utils.showToast('Chỉ hỗ trợ ảnh JPG, PNG, WebP', 'error'); return;
    }
    if (file.size > 2 * 1024 * 1024) { DB.utils.showToast('Ảnh tối đa 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const b64 = e.target.result;
      ['avatarImg','sidebarAvatar','topbarAvatar'].forEach(id => {
        const el = document.getElementById(id); if (el) el.src = b64;
      });
      saveSettings({ avatar: b64 });
      DB.employees.update(currentUser.id, { avatar: b64 });
      DB.utils.showToast('Đã cập nhật ảnh đại diện!');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function loadAvatar() {
    const s = getSettings();
    if (!s.avatar) return;
    ['avatarImg','sidebarAvatar','topbarAvatar'].forEach(id => {
      const el = document.getElementById(id); if (el) el.src = s.avatar;
    });
  }

  // ====== TAB 2: BẢO MẬT & MẬT KHẨU ======
  function checkPwdStrength(val) {
    const wrap = document.getElementById('pwdStrengthWrap');
    const fill = document.getElementById('pwdStrengthFill');
    const label = document.getElementById('pwdStrengthLabel');
    if (!val) { wrap.style.display='none'; return 0; }
    wrap.style.display = 'block';
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum   = /[0-9]/.test(val);
    const hasSpec  = /[^A-Za-z0-9]/.test(val);
    const score = [val.length >= 8, hasUpper, hasLower, hasNum, hasSpec].filter(Boolean).length;
    wrap.className = 'pwd-strength-wrap';
    if (score <= 2) { wrap.classList.add('strength-weak'); label.textContent = 'Yếu'; return 1; }
    if (score <= 3) { wrap.classList.add('strength-medium'); label.textContent = 'Trung bình'; return 2; }
    wrap.classList.add('strength-strong'); label.textContent = 'Mạnh'; return 3;
  }

  function validatePwdForm() {
    const cur = document.getElementById('pwdCurrent').value;
    const nw  = document.getElementById('pwdNew').value;
    const cf  = document.getElementById('pwdConfirm').value;
    const btn = document.getElementById('btnChangePwd');

    // Validate new password
    const pwdOk = nw.length >= 8 && /[A-Z]/.test(nw) && /[a-z]/.test(nw) && /[0-9]/.test(nw);
    document.getElementById('errPwdNew').classList.toggle('show', nw.length > 0 && !pwdOk);
    document.getElementById('pwdNew').classList.toggle('invalid', nw.length > 0 && !pwdOk);
    document.getElementById('pwdNew').classList.toggle('valid', pwdOk);

    // Validate confirm
    const cfOk = cf === nw;
    document.getElementById('errPwdConfirm').classList.toggle('show', cf.length > 0 && !cfOk);
    document.getElementById('pwdConfirm').classList.toggle('invalid', cf.length > 0 && !cfOk);
    document.getElementById('pwdConfirm').classList.toggle('valid', cf.length > 0 && cfOk);

    btn.disabled = !(cur && pwdOk && cfOk);
  }

  function changePassword() {
    const oldPwd = document.getElementById('pwdCurrent').value;
    const newPwd = document.getElementById('pwdNew').value;
    const btn = document.getElementById('btnChangePwd');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(() => {
      const res = DB.auth.changePassword(oldPwd, newPwd);
      btn.classList.remove('loading');
      if (res.ok) {
        DB.utils.showToast('Mật khẩu đã được thay đổi!');
        ['pwdCurrent','pwdNew','pwdConfirm'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('pwdStrengthWrap').style.display = 'none';
        ['pwdNew','pwdConfirm'].forEach(id => document.getElementById(id).classList.remove('valid','invalid'));
        btn.disabled = true;
      } else {
        DB.utils.showToast(res.error || 'Mật khẩu hiện tại không đúng', 'error');
        btn.disabled = false;
      }
    }, 600);
  }

  // 2FA
  function on2FAToggle(checkbox) {
    const info = document.getElementById('twoFactorInfo');
    if (checkbox.checked) {
      info.style.display = 'block';
      // Generate and send OTP
      sendOTP();
      openModal('modal2fa');
    } else {
      info.style.display = 'none';
      saveSettings({ twoFA: false });
      DB.utils.showToast('Đã tắt xác thực 2 bước');
    }
  }

  function sendOTP() {
    // Generate random 6-digit OTP
    var otp = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    // Store in session (for this demo)
    sessionStorage.setItem('humi_otp_sent', otp);
    // In production, this would send via SMS or email
    console.log('OTP sent:', otp);
    DB.utils.showToast('Mã OTP đã được gửi (demo: ' + otp + ')');
  }

  function confirm2FA() {
    const otp = document.getElementById('otpInput').value;
    if (otp.length !== 6) { 
      DB.utils.showToast('Vui lòng nhập đủ 6 chữ số OTP', 'error'); 
      return; 
    }
    
    // Verify OTP
    var sent = sessionStorage.getItem('humi_otp_sent');
    if (!sent) {
      DB.utils.showToast('Chưa gửi OTP, vui lòng thử lại', 'error');
      return;
    }
    
    if (otp === sent) {
      // OTP correct
      saveSettings({ twoFA: true });
      sessionStorage.removeItem('humi_otp_sent');
      closeModal('modal2fa');
      document.getElementById('twoFactorInfo').style.display = 'block';
      document.getElementById('otpInput').value = '';
      DB.utils.showToast('Xác thực 2 bước đã được bật!');
    } else {
      // OTP incorrect
      DB.utils.showToast('Mã OTP không chính xác', 'error');
    }
  }

  // ====== TAB 3: THÔNG BÁO ======
  const NOTIFY_IDS = ['notify_attendance','notify_leave','notify_payroll','notify_shift','notify_inbox','notify_weekly','notify_urgent'];

  function loadNotifySettings() {
    const s = getSettings();
    if (!s.notify) return;
    NOTIFY_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && s.notify[id] !== undefined) el.checked = s.notify[id];
    });
  }

  function saveNotifySettings() {
    const notify = {};
    NOTIFY_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) notify[id] = el.checked;
    });
    saveSettings({ notify });
    DB.utils.showToast('Đã lưu cài đặt thông báo!');
  }

  // ====== TAB 4: GIAO DIỆN ======
  function loadAppearance() {
    // Restore color
    const colorIdx = HumiTheme.getSavedColor();
    _applyColorUI(isNaN(colorIdx) ? 0 : colorIdx);
    // Restore theme mode
    const mode = HumiTheme.getSavedMode();
    _updateThemeCards(mode);
  }

  function _updateThemeCards(mode) {
    ['themeLight','themeDark','themeAuto'].forEach(id => {
      document.getElementById(id)?.classList.remove('selected');
    });
    const idMap = { light:'themeLight', dark:'themeDark', auto:'themeAuto' };
    document.getElementById(idMap[mode] || 'themeLight')?.classList.add('selected');

    // Update subtitles
    const effective = HumiTheme.getEffectiveTheme(mode);
    const h = new Date().getHours();
    document.getElementById('themeSubLight').textContent = mode === 'light' ? 'Đang dùng' : 'Nền trắng';
    document.getElementById('themeSubDark').textContent  = mode === 'dark'  ? 'Đang dùng' : 'Nền tối';
    document.getElementById('themeSubAuto').textContent  = mode === 'auto'  ? 'Đang dùng' : 'Theo giờ';

    // Auto note
    const note = document.getElementById('themeAutoNote');
    if (mode === 'auto') {
      const nextSwitch = effective === 'light'
        ? 'Sẽ chuyển sang tối lúc 18:00'
        : 'Sẽ chuyển sang sáng lúc 06:00';
      note.textContent = `Chế độ tự động đang bật — ${nextSwitch} (hiện tại ${h}:${String(new Date().getMinutes()).padStart(2,'0')})`;
    } else {
      note.textContent = 'Chế độ tự động: Sáng 06:00–18:00 · Tối 18:00–06:00';
    }
  }

  function selectTheme(mode) {
    HumiTheme.setMode(mode);
    _updateThemeCards(mode);
    saveSettings({ themeMode: mode });
    const labels = { light: 'Chủ đề Sáng', dark: 'Chủ đề Tối', auto: 'Chế độ Tự động' };
    DB.utils.showToast('Đã áp dụng ' + (labels[mode] || mode) + '!');
  }

  function _applyColorUI(idx) {
    HumiTheme.applyColor(idx);
    const c = HumiTheme.COLORS[idx] || HumiTheme.COLORS[0];
    document.querySelectorAll('.color-swatch').forEach((el, i) => {
      el.style.boxShadow = i === idx
        ? `0 0 0 3px white, 0 0 0 5px ${c.p}`
        : 'none';
    });
  }

  function selectColor(idx, doSave) {
    _applyColorUI(idx);
    if (doSave) {
      HumiTheme.setColor(idx);
      saveSettings({ colorIdx: idx });
      const names = ['tím xanh','xanh dương','xanh lá','cam','hồng'];
      DB.utils.showToast('Đã áp dụng màu ' + (names[idx] || '') + '!');
    }
  }

  // Listen for auto-timer theme change event
  window.addEventListener('humiThemeChanged', function(e) {
    _updateThemeCards(e.detail.mode);
  });

  // ====== TAB 5: NGÔN NGỮ & VÙNG ======
  function loadLanguageSettings() {
    const s = getSettings();
    if (!s.lang) return;
    ['langSelect','tzSelect','dateFmtSelect','timeFmtSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el && s.lang[id] !== undefined) el.selectedIndex = s.lang[id];
    });
  }

  function saveLanguageSettings() {
    const lang = {};
    ['langSelect','tzSelect','dateFmtSelect','timeFmtSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) lang[id] = el.selectedIndex;
    });
    saveSettings({ lang });
    DB.utils.showToast('Đã lưu cài đặt ngôn ngữ!');
  }

  // ====== TAB 6: THÔNG TIN ỨNG DỤNG ======
  function exportPersonalData() {
    const btn = document.getElementById('btnExport');
    const lbl = document.getElementById('exportLabel');
    btn.disabled = true;
    lbl.textContent = 'Đang chuẩn bị dữ liệu...';

    setTimeout(() => {
      const emp = DB.employees.getById(currentUser.id) || {};
      const data = {
        profile: {
          name: emp.name, code: emp.code, email: emp.email, phone: emp.phone,
          position: emp.position, department: emp.department,
          branch: emp.branch, startDate: emp.startDate, birthDate: emp.birthDate
        },
        settings: getSettings(),
        exportedAt: new Date().toISOString(),
        system: 'Humi HRM v2.4.1'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'humi-ca-nhan-' + (emp.code || currentUser.id) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btn.disabled = false;
      lbl.textContent = 'Tải xuống dữ liệu cá nhân';
      DB.utils.showToast('Đã tải xuống dữ liệu cá nhân!');
    }, 1200);
  }

  function validateDeleteInput() {
    const txt = document.getElementById('deleteConfirmText').value;
    const pwd = document.getElementById('deletePwd').value;
    document.getElementById('btnConfirmDelete').disabled = !(txt === 'XOA' && pwd.length >= 1);
  }

  function confirmDelete() {
    const pwd = document.getElementById('deletePwd').value;
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true; btn.textContent = 'Đang xử lý...';
    setTimeout(() => {
      // Verify password before deleting
      const session = DB.auth.getSession();
      const accounts = DB.accounts ? DB.accounts.getAll() : [];
      const account = accounts.find(function(a) { return a.employeeId === (session && session.user && session.user.id); });
      if (account && account.password && account.password !== pwd) {
        DB.utils.showToast('Mật khẩu không đúng, không thể xóa tài khoản', 'error');
        btn.disabled = false; btn.textContent = 'Xóa tài khoản';
        return;
      }
      // Clear user-specific settings
      const userId = session && session.user ? session.user.id : '';
      if (userId) {
        localStorage.removeItem('humi_user_settings_' + userId);
      }
      // Logout and redirect
      DB.auth.logout();
      closeModal('modalDelete');
      DB.utils.showToast('Tài khoản đã được xóa. Đang chuyển hướng...');
      setTimeout(function() {
        var inPages = window.location.pathname.indexOf('/pages/') !== -1;
        window.location.href = inPages ? '../login.html' : 'login.html';
      }, 1500);
    }, 1000);
  }

  // ====== INIT ======
  loadProfile();
  loadAvatar();
  loadNotifySettings();
  loadLanguageSettings();
  loadAppearance();

  // Restore 2FA state
  const _savedSettings = getSettings();
  if (_savedSettings.twoFA) {
    document.getElementById('toggle2FA').checked = true;
    document.getElementById('twoFactorInfo').style.display = 'block';
  }

  // Restore saved theme mode from either settings or HumiTheme
  (function() {
    const savedMode = _savedSettings.themeMode || HumiTheme.getSavedMode();
    if (savedMode && savedMode !== 'light') {
      localStorage.setItem('humi_theme_mode', savedMode);
      HumiTheme.setMode(savedMode);
    }
  })();

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
