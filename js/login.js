// ═══════════════════════════════════════════════════════════
// EMAILJS CONFIG
// ═══════════════════════════════════════════════════════════
var EMAILJS_SERVICE_ID  = 'service_ri6ho74';
var EMAILJS_TEMPLATE_ID = 'template_9qlygld';
var EMAILJS_PUBLIC_KEY  = '0dfSpIx0a7yiAJjIK';

// Redirect nếu đã đăng nhập
if (DB.auth.getSession()) location.href = 'index.html';

// Khởi tạo EmailJS
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✅ EmailJS init OK');
} catch(e) { console.error('❌ EmailJS init lỗi:', e); }

// ── State ──────────────────────────────────────────────────
var _otp = { code: null, expiry: null, countdown: null, resend: null };
var _resetOtp = { code: null, expiry: null, countdown: null, resend: null, empId: null, user: null };
var _pendingEmpId = null;
var _pendingPwd   = null;
var _pendingUser  = null;

// ── EmailJS gửi OTP ───────────────────────────────────────
function sendOtpEmail(toEmail, toName, otp) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: toEmail,
    to_name:  toName,
    otp_code: otp,
    app_name: 'Humi HRM'
  }).catch(function(err) {
    console.error('❌ EmailJS lỗi:', JSON.stringify(err));
  });
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '***';
  var p = email.split('@');
  var n = p[0];
  return n.slice(0,2) + '***' + (n.length > 3 ? n.slice(-1) : '') + '@' + p[1];
}

// ── Helpers UI ─────────────────────────────────────────────
function showStep(id) {
  document.querySelectorAll('.step').forEach(function(el) { el.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
}

function showErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideErr(id) {
  var el = document.getElementById(id); if (el) el.classList.remove('show');
}

function togglePwd(inputId, iconId) {
  var i = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  if (i.type === 'password') {
    i.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    i.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// ── Countdown & Resend ─────────────────────────────────────
function startCountdown(otpState, countdownId, seconds, onExpire) {
  clearInterval(otpState.countdown);
  var el = document.getElementById(countdownId);
  var s = seconds;
  function tick() {
    if (s <= 0) {
      clearInterval(otpState.countdown);
      if (el) { el.textContent = 'Hết hạn'; el.style.color = '#ef4444'; }
      if (onExpire) onExpire();
      return;
    }
    var m = Math.floor(s / 60);
    if (el) { el.textContent = m + ':' + String(s % 60).padStart(2, '0'); el.style.color = ''; }
    s--;
  }
  tick();
  otpState.countdown = setInterval(tick, 1000);
}

function disableOtpArea(boxesId, btnId) {
  document.querySelectorAll('#' + boxesId + ' .otp-digit').forEach(function(b) {
    b.disabled = true;
    b.style.background = '#f5f5f5';
    b.style.borderColor = '#e5e7eb';
    b.style.color = '#b0bec8';
  });
  var btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; }
}

function startResend(otpState, btnId, timerId, seconds) {
  clearInterval(otpState.resend);
  var btn = document.getElementById(btnId);
  var timerEl = document.getElementById(timerId);
  if (btn) btn.disabled = true;
  var s = seconds;
  function tick() {
    if (s <= 0) { clearInterval(otpState.resend); if (btn) btn.disabled = false; if (timerEl) timerEl.textContent = ''; return; }
    if (timerEl) timerEl.textContent = ' (' + s + 's)';
    s--;
  }
  tick();
  otpState.resend = setInterval(tick, 1000);
}

// ── OTP digit boxes ─────────────────────────────────────────
function initBoxes(containerId, onComplete) {
  var boxes = document.querySelectorAll('#' + containerId + ' .otp-digit');
  boxes.forEach(function(box, i) {
    box.value = ''; box.disabled = false;
    box.classList.remove('filled');
    box.style.borderColor = ''; box.style.background = '';
    // Remove old listeners by cloning
    var clone = box.cloneNode(true);
    box.parentNode.replaceChild(clone, box);
  });
  // Re-query after clone
  boxes = document.querySelectorAll('#' + containerId + ' .otp-digit');
  boxes.forEach(function(box, i) {
    box.addEventListener('input', function() {
      var v = this.value.replace(/\D/g,'');
      this.value = v ? v[0] : '';
      this.classList.toggle('filled', !!this.value);
      if (this.value && i < boxes.length - 1) boxes[i+1].focus();
      if (getBoxValue(containerId).length === 6) onComplete();
    });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !this.value && i > 0) boxes[i-1].focus();
    });
    box.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
      boxes.forEach(function(b, j) { b.value = text[j]||''; b.classList.toggle('filled', !!b.value); });
      if (text.length >= 6) onComplete();
    });
  });
  boxes[0].focus();
}

function getBoxValue(containerId) {
  var val = '';
  document.querySelectorAll('#' + containerId + ' .otp-digit').forEach(function(b) { val += b.value||''; });
  return val;
}

function shakeBoxes(containerId) {
  document.querySelectorAll('#' + containerId + ' .otp-digit').forEach(function(b) {
    b.style.borderColor = '#dc2626'; b.style.background = '#fef2f2';
    setTimeout(function() { b.style.borderColor = ''; b.style.background = ''; }, 800);
  });
}

// ══════════════════════════════════════════════════════════
// BƯỚC 1 – ĐĂNG NHẬP
// ══════════════════════════════════════════════════════════
function doLogin(e) {
  e.preventDefault();
  var btn   = document.getElementById('loginBtn');
  var loginId = document.getElementById('empId').value.trim();
  var pwd   = document.getElementById('pwd').value;

  hideErr('errMsg');
  if (!loginId) { showErr('errMsg', 'Vui lòng nhập mã nhân viên hoặc email'); return; }
  if (!pwd)   { showErr('errMsg', 'Vui lòng nhập mật khẩu'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Đang xác thực...';

  setTimeout(function() {
    var res = DB.auth.verifyCredentials(loginId, pwd);
    if (!res.ok) {
      showErr('errMsg', res.error);
      btn.disabled = false; btn.textContent = 'Đăng nhập';
      return;
    }

    // Kiểm tra xem người dùng có bật xác thực email không
    var settings = {};
    try { settings = JSON.parse(localStorage.getItem('humi_user_settings_' + res.user.id)) || {}; } catch(ex) {}
    var emailAuthOn = settings.emailAuth === true;

    if (!emailAuthOn) {
      // Đăng nhập thẳng
      DB.auth.login(res.user.id, pwd);
      location.href = 'index.html';
      return;
    }

    // Bật 2FA email → gửi OTP
    _pendingEmpId = res.user.id;
    _pendingPwd   = pwd;
    _pendingUser  = res.user;

    _otp.code   = generateOTP();
    _otp.expiry = Date.now() + 5 * 60 * 1000;

    btn.innerHTML = '<span class="spinner"></span>Đang gửi OTP...';
    sendOtpEmail(res.user.email, res.user.name, _otp.code).then(function() {
      showOtpStep(res.user.email);
      btn.disabled = false; btn.textContent = 'Đăng nhập';
    });
  }, 500);
}

function showOtpStep(email) {
  document.getElementById('otpEmailDisplay').textContent = maskEmail(email);
  showStep('stepOtp');
  initBoxes('otpBoxes', doVerifyOtp);
  startCountdown(_otp, 'otpCountdown', 300, function() { disableOtpArea('otpBoxes', 'otpBtn'); });
  startResend(_otp, 'resendBtn', 'resendTimer', 60);
}

function goBackToLogin() {
  clearInterval(_otp.countdown); clearInterval(_otp.resend);
  _otp.code = null; _pendingEmpId = null; _pendingPwd = null; _pendingUser = null;
  showStep('stepLogin');
  hideErr('otpErr');
}

// ── Xác nhận OTP đăng nhập ─────────────────────────────────
function doVerifyOtp() {
  var entered = getBoxValue('otpBoxes');
  hideErr('otpErr');
  if (entered.length < 6) { showErr('otpErr', 'Vui lòng nhập đủ 6 chữ số'); return; }
  if (!_otp.code)          { showErr('otpErr', 'Phiên OTP hết hạn, vui lòng đăng nhập lại'); return; }
  if (Date.now() > _otp.expiry) { showErr('otpErr', 'Mã OTP đã hết hạn, nhấn "Gửi lại"'); return; }
  if (entered !== _otp.code)    { showErr('otpErr', 'Mã OTP không đúng'); shakeBoxes('otpBoxes'); return; }

  clearInterval(_otp.countdown); clearInterval(_otp.resend);
  var btn = document.getElementById('otpBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Đang đăng nhập...';
  DB.auth.login(_pendingEmpId, _pendingPwd);
  setTimeout(function() { location.href = 'index.html'; }, 400);
}

function resendOtp() {
  if (!_pendingUser) return;
  _otp.code   = generateOTP();
  _otp.expiry = Date.now() + 5 * 60 * 1000;
  initBoxes('otpBoxes', doVerifyOtp);
  document.getElementById('otpBtn').disabled = false;
  hideErr('otpErr');
  startCountdown(_otp, 'otpCountdown', 300, function() { disableOtpArea('otpBoxes', 'otpBtn'); });
  startResend(_otp, 'resendBtn', 'resendTimer', 60);
  sendOtpEmail(_pendingUser.email, _pendingUser.name, _otp.code);
}

// ══════════════════════════════════════════════════════════
// BƯỚC 3+4 – QUÊN MẬT KHẨU
// ══════════════════════════════════════════════════════════
function goForgot() {
  showStep('stepForgot');
  hideErr('errForgot');
  var typed = document.getElementById('empId').value.trim();
  document.getElementById('forgotEmpId').value = typed;
}

function doForgotSend() {
  var loginId = document.getElementById('forgotEmpId').value.trim();
  hideErr('errForgot');
  if (!loginId) { showErr('errForgot', 'Vui lòng nhập mã nhân viên hoặc email'); return; }

  var searchStr = loginId.toLowerCase();
  var emp = DB.employees.getAll().find(function(e) { 
    return (e.id && e.id.toLowerCase() === searchStr) || 
           (e.email && e.email.toLowerCase() === searchStr); 
  });
  if (!emp) { showErr('errForgot', 'Không tìm thấy nhân viên với thông tin này'); return; }
  if (!emp.email) { showErr('errForgot', 'Tài khoản này chưa có email đăng ký'); return; }

  var btn = document.getElementById('forgotBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Đang gửi OTP...';

  _resetOtp.empId  = emp.id;
  _resetOtp.user   = emp;
  _resetOtp.code   = generateOTP();
  _resetOtp.expiry = Date.now() + 5 * 60 * 1000;

  sendOtpEmail(emp.email, emp.name, _resetOtp.code).then(function() {
    showResetStep(emp.email);
    btn.disabled = false; btn.textContent = 'Gửi mã OTP';
  });
}

function showResetStep(email) {
  document.getElementById('resetEmailDisplay').textContent = maskEmail(email);
  showStep('stepReset');
  initBoxes('resetOtpBoxes', function() {});
  startCountdown(_resetOtp, 'resetCountdown', 300, function() { disableOtpArea('resetOtpBoxes', 'resetBtn'); });
  startResend(_resetOtp, 'resetResendBtn', 'resetResendTimer', 60);
}

function checkResetPwd() {
  // placeholder – strength indicator có thể thêm sau
}

function doResetPassword() {
  var entered    = getBoxValue('resetOtpBoxes');
  var newPwd     = document.getElementById('newPwd').value;
  var confirmPwd = document.getElementById('confirmPwd').value;
  hideErr('errReset');

  if (entered.length < 6)  { showErr('errReset', 'Vui lòng nhập đủ 6 chữ số OTP'); return; }
  if (!_resetOtp.code)      { showErr('errReset', 'Phiên OTP hết hạn, vui lòng thử lại'); return; }
  if (Date.now() > _resetOtp.expiry) { showErr('errReset', 'Mã OTP đã hết hạn, nhấn "Gửi lại"'); return; }
  if (entered !== _resetOtp.code)    { showErr('errReset', 'Mã OTP không đúng'); shakeBoxes('resetOtpBoxes'); return; }
  if (!newPwd || newPwd.length < 6)  { showErr('errReset', 'Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
  if (newPwd !== confirmPwd)         { showErr('errReset', 'Mật khẩu xác nhận không khớp'); return; }

  // Lưu mật khẩu mới vào accounts
  var accounts = JSON.parse(localStorage.getItem('humi_accounts') || '[]');
  var idx = accounts.findIndex(function(a) { return a.employeeId === _resetOtp.empId; });
  if (idx !== -1) {
    accounts[idx].password = newPwd;
    localStorage.setItem('humi_accounts', JSON.stringify(accounts));
    SB.update('accounts', { employee_id: _resetOtp.empId }, { password: newPwd });
  }

  clearInterval(_resetOtp.countdown); clearInterval(_resetOtp.resend);

  var btn = document.getElementById('resetBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Đang lưu...';

  setTimeout(function() {
    DB.utils.showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
    setTimeout(function() {
      showStep('stepLogin');
      btn.disabled = false; btn.textContent = 'Đặt lại mật khẩu';
    }, 1200);
  }, 600);
}

function resendResetOtp() {
  if (!_resetOtp.user) return;
  _resetOtp.code   = generateOTP();
  _resetOtp.expiry = Date.now() + 5 * 60 * 1000;
  initBoxes('resetOtpBoxes', function() {});
  document.getElementById('resetBtn').disabled = false;
  hideErr('errReset');
  startCountdown(_resetOtp, 'resetCountdown', 300, function() { disableOtpArea('resetOtpBoxes', 'resetBtn'); });
  startResend(_resetOtp, 'resetResendBtn', 'resetResendTimer', 60);
  sendOtpEmail(_resetOtp.user.email, _resetOtp.user.name, _resetOtp.code);
}

// ── Enter key ──────────────────────────────────────────────
document.getElementById('empId').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('pwd').focus();
});
