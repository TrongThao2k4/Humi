const _s = DB.auth.requireAuth(); if(!_s) throw 0;
  const currentUser = _s.user;

  // ─── Init user info in sidebar/topbar ───────────────────
  (function() {
    var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
    var name   = (emp && emp.name)     || currentUser.name || '—';
    var role   = (emp && emp.position) || currentUser.role || '—';
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

  // ─── State ───────────────────────────────────────────────
  var currentTab   = 'all';   // 'all' | 'unread' | 'important' | 'sent'
  var currentMsgId = null;
  var searchQuery  = '';
  var _replyToId   = null;    // used by reply to pre-select recipient

  function showToast(msg, type) { DB.utils.showToast(msg, type); }

  function fmtTimestamp(ts) {
    var d = new Date(ts), now = new Date();
    var diff = now - d;
    var hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
    if (diff < 86400000 && d.toDateString() === now.toDateString()) return hh+':'+mm;
    if (diff < 172800000) return 'Hôm qua';
    return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
  }

  function fmtDateFull(ts) {
    var d = new Date(ts);
    return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()
      +', '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }

  // ─── Get filtered message list ────────────────────────────
  function getFilteredList() {
    var list;
    if (currentTab === 'sent') {
      list = DB.messages.getSent(currentUser.id);
    } else {
      list = DB.messages.getInbox(currentUser.id);
      if (currentTab === 'unread')    list = list.filter(function(m){ return !m.isRead; });
      if (currentTab === 'important') list = list.filter(function(m){ return m.important; });
    }
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function(m){
        return (m.subject||'').toLowerCase().includes(q)
            || (m.sender||'').toLowerCase().includes(q)
            || (m.preview||'').toLowerCase().includes(q)
            || (m.body||'').toLowerCase().includes(q);
      });
    }
    // Date range filter from advanced search
    var fromEl = document.getElementById('filterFrom');
    var toEl   = document.getElementById('filterTo');
    if (fromEl && fromEl.value) {
      var fromTs = new Date(fromEl.value).getTime();
      list = list.filter(function(m){ return new Date(m.timestamp).getTime() >= fromTs; });
    }
    if (toEl && toEl.value) {
      var toTs = new Date(toEl.value).getTime() + 86399999; // include full day
      list = list.filter(function(m){ return new Date(m.timestamp).getTime() <= toTs; });
    }
    // newest first
    list = list.slice().sort(function(a,b){ return new Date(b.timestamp) - new Date(a.timestamp); });
    return list;
  }

  // ─── Render list panel ───────────────────────────────────
  function renderList() {
    var inbox  = DB.messages.getInbox(currentUser.id);
    var unread = inbox.filter(function(m){ return !m.isRead; }).length;

    // Badge on unread tab
    var badge = document.getElementById('unreadTabBadge');
    if (unread > 0) { badge.textContent = unread; badge.style.display = 'inline'; }
    else badge.style.display = 'none';

    // Top badge
    var topBadge = document.getElementById('unreadBadge');
    if (currentTab !== 'sent' && unread > 0) { topBadge.textContent = unread; topBadge.style.display = 'inline'; }
    else topBadge.style.display = 'none';

    // Notification dot
    document.getElementById('notifDot').style.display = unread > 0 ? 'block' : 'none';

    // Title
    var titles = { all:'Hộp thư đến', unread:'Chưa đọc', important:'Quan trọng', sent:'Đã gửi' };
    document.getElementById('listTitle').textContent = titles[currentTab];

    var list = getFilteredList();
    var el = document.getElementById('msgList');

    if (list.length === 0) {
      var emptyTxt = searchQuery ? 'Không tìm thấy kết quả' : (currentTab === 'sent' ? 'Chưa có tin nhắn đã gửi' : 'Không có tin nhắn');
      el.innerHTML = '<div style="padding:40px 20px;text-align:center;color:#7C8FAC;font-size:13px;">'+emptyTxt+'</div>';
      return;
    }

    el.innerHTML = list.map(function(m) {
      var isActive = m.id === currentMsgId;
      var isUnread = !m.isRead && currentTab !== 'sent';
      var starSvg = m.important
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DFE5EF" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      return '<div class="msg-item'+(isUnread?' unread':'')+(isActive?' active':'')+'" onclick="openMsg(\''+m.id+'\')">'+
        '<div style="display:flex;align-items:flex-start;gap:10px;">'+
        '<img src="'+m.avatar+'" alt="" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;margin-top:1px;object-fit:cover;">'+
        '<div style="flex:1;overflow:hidden;">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">'+
        '<span class="msg-sender">'+(currentTab==='sent'?'Gửi đến: '+getRecipientName(m.toId):m.sender)+'</span>'+
        '<div style="display:flex;align-items:center;gap:5px;">'+
        '<span class="msg-time">'+fmtTimestamp(m.timestamp)+'</span>'+
        '<button class="star-btn'+(m.important?' starred':'')+'" onclick="event.stopPropagation();toggleImportant(\''+m.id+'\','+(!m.important)+')" title="Đánh dấu quan trọng">'+starSvg+'</button>'+
        '</div></div>'+
        '<p class="msg-subject">'+m.subject+'</p>'+
        '<p class="msg-preview">'+m.preview+'</p>'+
        '</div></div>'+
        '<div style="margin-top:6px;padding-left:46px;display:flex;gap:4px;">'+
        '<span class="tag '+m.tagClass+'">'+m.tag+'</span>'+
        '</div>'+
        '</div>';
    }).join('');
  }

  function getRecipientName(toId) {
    var emps = DB.employees.getAll()||[];
    var e = emps.find(function(x){ return x.id === toId; });
    return e ? e.name : toId;
  }

  // ─── Tab switch ──────────────────────────────────────────
  function switchTab(tab) {
    currentTab = tab;
    currentMsgId = null;
    document.querySelectorAll('.tab').forEach(function(t){
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.getElementById('detailEmpty').style.display = 'flex';
    document.getElementById('msgContentPanel').style.display = 'none';
    renderList();
  }

  // ─── Search ──────────────────────────────────────────────
  function onSearch() {
    searchQuery = document.getElementById('searchInput').value.trim();
    renderList();
  }

  // ─── Toggle important ────────────────────────────────────
  function toggleImportant(id, val) {
    DB.messages.markImportant(id, val);
    renderList();
    // If currently viewing this message, re-render detail
    if (currentMsgId === id) openMsg(id);
    showToast(val ? 'Đã đánh dấu là quan trọng' : 'Đã bỏ đánh dấu quan trọng');
  }

  // ─── Open message ────────────────────────────────────────
  function openMsg(id) {
    var m = DB.messages.getById(id);
    if (!m) return;
    currentMsgId = id;

    if (!m.isRead && currentTab !== 'sent') {
      DB.messages.markRead(id);
      m.isRead = true;
    }

    renderList();

    document.getElementById('detailEmpty').style.display = 'none';
    var panel = document.getElementById('msgContentPanel');
    panel.style.display = 'block';

    var isSentView = (currentTab === 'sent');

    // Built-in actions (reply, sent items have no reply)
    var actionsHtml = '';
    if (!isSentView) {
      actionsHtml += '<button class="btn-outline" style="font-size:12.5px;" onclick="replyMsg(\''+id+'\')">'
        +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>Trả lời</button>';
    }
    // Message's own action buttons (navigate links etc)
    var msgActions = (m.actions||[]).filter(function(a){ return a.label !== 'Trả lời'; });
    actionsHtml += msgActions.map(function(a) {
      var styleStr = a.primary
        ? 'background:linear-gradient(135deg,'+(a.color||'var(--primary)')+','+(a.color||'var(--primary-dark)')+');border:none;color:white;'
        : 'background:white;border:1px solid #e5eaef;color:'+(a.color||'#2A3547')+';';
      var handler = a.href
        ? 'onclick="location.href=\''+a.href+'\'"'
        : 'onclick="handleMsgAction(\''+m.id+'\',\''+a.label.replace(/'/g,"\\'")+'\')"';
      return '<button class="'+(a.primary?'btn-primary':'btn-outline')+'" style="'+styleStr+'font-size:12.5px;" '+handler+'>'+a.label+'</button>';
    }).join('');

    var fromLabel = isSentView ? 'Đến: <strong>'+getRecipientName(m.toId)+'</strong>' : 'Gửi đến: <strong>'+currentUser.name+'</strong>';

    panel.innerHTML =
      '<div style="background:white;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.06);overflow:hidden;">'+
      '<div style="padding:20px 24px;border-bottom:1px solid #EAEFF4;">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">'+
      '<div style="flex:1;overflow:hidden;">'+
      '<h2 style="font-size:16px;font-weight:800;color:#2A3547;margin:0 0 8px;">'+m.subject+'</h2>'+
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
      '<span class="tag '+m.tagClass+'">'+m.tag+'</span>'+
      '<span style="font-size:12px;color:#7C8FAC;">'+fmtDateFull(m.timestamp)+'</span>'+
      '</div></div>'+
      '<div style="display:flex;gap:6px;flex-shrink:0;">'+
      // Star button
      '<button class="btn-outline'+(m.important?' starred':'')+'" style="padding:6px 10px;font-size:12px;color:'+(m.important?'#f59e0b':'#2A3547')+';" title="'+(m.important?'Bỏ đánh dấu':'Đánh dấu quan trọng')+'" onclick="toggleImportant(\''+id+'\','+(!m.important)+')">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="'+(m.important?'#f59e0b':'none')+'" stroke="'+(m.important?'#f59e0b':'currentColor')+'" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'+
      '</button>'+
      // Mark unread
      (!isSentView && m.isRead ? '<button class="btn-outline" style="padding:6px 10px;font-size:12px;" title="Đánh dấu chưa đọc" onclick="markUnread(\''+id+'\')">'
        +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>'
        +'</button>' : '')+
      // Delete
      '<button class="btn-outline" style="padding:6px 10px;font-size:12px;color:#dc2626;" title="Xóa tin nhắn" onclick="deleteMsg(\''+id+'\')">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>'+
      '</button>'+
      '</div></div>'+
      // Sender info
      '<div style="display:flex;align-items:center;gap:10px;margin-top:14px;">'+
      '<img src="'+m.avatar+'" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">'+
      '<div>'+
      '<p style="font-size:13px;font-weight:700;color:#2A3547;margin:0;">'+m.sender+'</p>'+
      '<p style="font-size:12px;color:#7C8FAC;margin:2px 0 0;">'+fromLabel+'</p>'+
      '</div></div>'+
      '</div>'+
      // Body
      '<div style="padding:20px 24px;font-size:13.5px;color:#2A3547;line-height:1.75;">'+
        (m.body || '<p style="color:#7C8FAC;">'+m.preview+'</p>')+
      '</div>'+
      // Actions
      (actionsHtml ? '<div style="padding:14px 24px;border-top:1px solid #EAEFF4;display:flex;gap:8px;flex-wrap:wrap;">'+actionsHtml+'</div>' : '')+
      '</div>';
  }

  // ─── Mark unread ─────────────────────────────────────────
  function markUnread(id) {
    DB.messages.markUnread(id);
    currentMsgId = null;
    document.getElementById('detailEmpty').style.display = 'flex';
    document.getElementById('msgContentPanel').style.display = 'none';
    renderList();
    showToast('Đã đánh dấu là chưa đọc');
  }

  // ─── Delete ──────────────────────────────────────────────
  function deleteMsg(id) {
    DB.messages.delete(id);
    currentMsgId = null;
    document.getElementById('detailEmpty').style.display = 'flex';
    document.getElementById('msgContentPanel').style.display = 'none';
    renderList();
    showToast('Đã xóa tin nhắn');
  }

  // ─── Compose modal ───────────────────────────────────────
  function populateRecipients(preselect) {
    var sel = document.getElementById('composeToId');
    var emps = (DB.employees.getAll()||[]).filter(function(e){ return e.status !== 'inactive'; });
    sel.innerHTML = '<option value="">— Chọn người nhận —</option>'
      + emps.map(function(e){
          var selected = e.id === preselect ? ' selected' : '';
          return '<option value="'+e.id+'"'+selected+'>'+e.name+' ('+e.position+')</option>';
        }).join('');
  }

  function openCompose(opts) {
    opts = opts || {};
    _replyToId = opts.replyToId || null;
    document.getElementById('composeToId').value    = '';
    document.getElementById('composeSubject').value = opts.subject || '';
    document.getElementById('composeBody').value    = opts.body || '';
    document.getElementById('composeTag').value     = opts.tag || 'general';
    populateRecipients(opts.replyToId || null);
    if (opts.replyToId) document.getElementById('composeToId').value = opts.replyToId;
    document.getElementById('composeModal').style.display = 'flex';
    setTimeout(function(){ document.getElementById('composeSubject').focus(); }, 80);
  }

  function closeCompose() {
    document.getElementById('composeModal').style.display = 'none';
  }

  function replyMsg(id) {
    var m = DB.messages.getById(id);
    if (!m) return;
    openCompose({
      replyToId: m.fromId,
      subject: m.subject.startsWith('Re: ') ? m.subject : 'Re: '+m.subject,
      body: '\n\n---\nTrả lời tin nhắn từ '+m.sender+':\n'+m.preview,
      tag: 'general'
    });
  }

  function sendMessage() {
    var toId    = document.getElementById('composeToId').value.trim();
    var subject = document.getElementById('composeSubject').value.trim();
    var body    = document.getElementById('composeBody').value.trim();
    var tagKey  = document.getElementById('composeTag').value;

    if (!toId)    { showToast('Vui lòng chọn người nhận', 'error'); return; }
    if (!subject) { showToast('Vui lòng nhập chủ đề', 'error'); return; }
    if (!body)    { showToast('Vui lòng nhập nội dung', 'error'); return; }

    var emp = (DB.employees.getAll()||[]).find(function(e){ return e.id === currentUser.id; });
    var fromName   = (emp && emp.name)   || currentUser.name || 'Nhân viên';
    var fromAvatar = (emp && emp.avatar) || 'https://i.pravatar.cc/36?img=47';

    DB.messages.send(currentUser.id, fromName, fromAvatar, toId, subject, body, tagKey);
    closeCompose();
    showToast('Đã gửi tin nhắn thành công');

    // If in sent tab, refresh
    if (currentTab === 'sent') renderList();
    else { renderList(); }
  }

  // ─── Init ────────────────────────────────────────────────
  renderList();

  // Auto-open first message in inbox on load
  var firstInbox = DB.messages.getInbox(currentUser.id);
  if (firstInbox.length > 0) {
    var sorted = firstInbox.slice().sort(function(a,b){ return new Date(b.timestamp)-new Date(a.timestamp); });
    openMsg(sorted[0].id);
  }

  // Refresh after Supabase sync
  window.addEventListener('humi_synced', function() {
    renderList();
    if (currentMsgId) openMsg(currentMsgId);
  });

  // Poll localStorage mỗi 5 giây — bắt tin nhắn mới từ cùng thiết bị
  function _getSignature() {
    var all = DB.messages.getAll();
    return all.length + '|' + (all.reduce(function(max, m) {
      return m.timestamp > max ? m.timestamp : max;
    }, ''));
  }
  var _lastSig = _getSignature();
  setInterval(function() {
    var sig = _getSignature();
    if (sig !== _lastSig) {
      _lastSig = sig;
      renderList();
      if (currentMsgId) openMsg(currentMsgId);
    }
  }, 5000);

  // Poll Supabase mỗi 30 giây — bắt tin nhắn mới từ thiết bị khác
  setInterval(function() {
    if (typeof syncFromSupabase === 'function') {
      // Đánh dấu đã sync để tránh reload
      sessionStorage.setItem('humi_synced_once', '1');
      syncFromSupabase();
    }
  }, 30000);

  // ─── Xử lý action button không có href ───────────────────
  // Suy luận trang đích từ nội dung label, fallback: đánh dấu đã xử lý
  function handleMsgAction(msgId, label) {
    var lbl = (label || '').toLowerCase();

    // Bảng suy luận: keyword → trang đích (cùng thư mục pages/)
    var PAGE_MAP = [
      { keys: ['bảng lương', 'thu nhập', 'lương', 'phiếu lương'],  page: 'xem-thu-nhap.html' },
      { keys: ['duyệt công', 'chấm công', 'điểm danh'],            page: 'duyet-cong.html' },
      { keys: ['duyệt phép', 'phiếu nghỉ', 'đơn nghỉ', 'phép'],   page: 'danh-sach-phieu-nghi.html' },
      { keys: ['nhân viên', 'hồ sơ nhân'],                         page: 'danh-sach-nhan-vien.html' },
      { keys: ['chia ca', 'ca làm', 'lịch ca', 'đăng ký ca'],      page: 'chia-ca.html' },
      { keys: ['thiết lập ca', 'cấu hình ca'],                     page: 'thiet-lap-chia-ca.html' },
      { keys: ['lịch làm việc', 'lịch công'],                      page: 'lich-lam-viec.html' },
      { keys: ['yêu cầu', 'đơn từ'],                               page: 'duyet-yeu-cau.html' },
      { keys: ['phép tồn', 'số ngày phép'],                        page: 'xem-phep-ton.html' },
      { keys: ['hộp thư', 'tin nhắn', 'inbox'],                    page: 'hop-thu.html' },
      { keys: ['cài đặt', 'thiết lập tài khoản'],                  page: 'cai-dat.html' },
    ];

    for (var i = 0; i < PAGE_MAP.length; i++) {
      var entry = PAGE_MAP[i];
      if (entry.keys.some(function(k) { return lbl.includes(k); })) {
        location.href = entry.page;
        return;
      }
    }

    // Không suy luận được → đánh dấu tin đã đọc + xác nhận
    DB.messages.markRead(msgId);
    renderList();
    showToast('Đã xử lý: ' + label);
  }

// ==================== ADVANCED SEARCH ====================
function toggleAdvSearch() {
  var panel = document.getElementById('advSearchPanel');
  var btn   = document.getElementById('advSearchToggle');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (btn) btn.style.background = open ? 'transparent' : '#e8e3fd';
}

function clearAdvSearch() {
  var fromEl = document.getElementById('filterFrom');
  var toEl   = document.getElementById('filterTo');
  var typeEl = document.getElementById('filterMsgType');
  if (fromEl) fromEl.value = '';
  if (toEl)   toEl.value   = '';
  if (typeEl) typeEl.value = '';
  renderList();
}

function applyMsgTypeFilter() {
  var typeEl = document.getElementById('filterMsgType');
  if (!typeEl) return;
  var val = typeEl.value;
  if (val === 'sent')  { switchTab('sent'); }
  else if (val === 'inbox') { switchTab('all'); }
  else renderList();
}

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

function doLogout() { DB.auth.logout(); window.location.href = '../login.html'; }

function topbarSearchHandle(q) {
  searchQuery = q;
  renderList();
}
