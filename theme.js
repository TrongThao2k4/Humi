/**
 * theme.js — Humi HRM Theme System v2
 * Handles color palette + full dark / auto mode.
 * Strategy:
 *   1. CSS custom-property overrides for class-based rules
 *   2. JS inline-style rewriter for hardcoded inline colors
 *   3. MutationObserver to catch dynamically-rendered HTML
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1. COLOR PALETTES
  // ─────────────────────────────────────────────
  var COLORS = [
    { p: '#5D87FF', d: '#4570EA', rgb: '93,135,255'  },
    { p: '#2563eb', d: '#1d4ed8', rgb: '37,99,235'   },
    { p: '#16a34a', d: '#15803d', rgb: '22,163,74'   },
    { p: '#ea580c', d: '#c2410c', rgb: '234,88,12'   },
    { p: '#db2777', d: '#be185d', rgb: '219,39,119'  },
  ];

  function applyColor(idx) {
    var c = COLORS[Math.max(0, Math.min(idx, COLORS.length - 1))];
    var r = document.documentElement;
    r.style.setProperty('--primary',      c.p);
    r.style.setProperty('--primary-dark', c.d);
    r.style.setProperty('--primary-rgb',  c.rgb);
  }

  // ─────────────────────────────────────────────
  // 2. INLINE STYLE REWRITE MAPS
  // ─────────────────────────────────────────────
  // Normalise a color string for comparison
  function norm(s) { return (s || '').replace(/\s/g, '').toLowerCase(); }

  var BG_MAP = {
    'white'   : '#1e293b',  '#fff'    : '#1e293b',  '#ffffff' : '#1e293b',
    '#f2f6fa' : '#0f172a',  '#f0f2f8' : '#0f172a',  '#f9fafb' : '#0f172a',
    '#fafafa' : '#0f172a',
    '#eaeff4' : '#1e293b',  '#ecf2ff' : '#1e293b',  '#e8f0fe' : '#1e293b',
    '#dfe5ef' : '#334155',  '#e5eaef' : '#334155',  '#e5e7eb' : '#334155',
    '#f5f5f8' : '#1a2438',
    // Các màu badge/pill (xanh, đỏ, cam...) KHÔNG rewrite — giữ màu gốc
  };

  var TEXT_MAP = {
    '#2a3547': '#f1f5f9',
    '#5a6a85': '#94a3b8',
    '#7c8fac': '#64748b',
    '#1f2937': '#f1f5f9',
    '#111827': '#f1f5f9',
    '#374151': '#e2e8f0',
    '#6b7280': '#94a3b8',
    '#9ca3af': '#64748b',
  };

  var BORDER_COLORS = ['#e5eaef','#eaeff4','#e5e7eb','#dfe5ef','#f5f5f8'];
  var DARK_BORDER = '#334155';

  // ─────────────────────────────────────────────
  // 3. DARK MODE CSS  (class-based + structural)
  //    Light mode is NEVER touched here.
  // ─────────────────────────────────────────────

  /* Design tokens for dark mode
     --dk-body   : #0d1117   page background (deepest)
     --dk-surface: #161b27   cards, sidebar, topbar
     --dk-raised : #1c2333   slightly elevated (table header, inputs)
     --dk-border : #30394a   subtle dividers
     --dk-text   : #e6edf3   primary text
     --dk-text2  : #8b949e   secondary text
     --dk-text3  : #6e7681   muted / placeholder
  */
  var DARK_CSS = `
html[data-theme="dark"] {
  color-scheme: dark;
  --dk-body:    #0d1117;
  --dk-surface: #161b27;
  --dk-raised:  #1c2333;
  --dk-border:  #30394a;
  --dk-text:    #e6edf3;
  --dk-text2:   #8b949e;
  --dk-text3:   #6e7681;
}

/* ── BASE ─────────────────────────────────── */
[data-theme="dark"] body {
  background: var(--dk-body) !important;
  color: var(--dk-text) !important;
}

/* ── SIDEBAR ──────────────────────────────── */
[data-theme="dark"] .sidebar,
[data-theme="dark"] aside {
  background: var(--dk-surface) !important;
  border-right: 1px solid var(--dk-border) !important;
}
[data-theme="dark"] .sidebar-item {
  color: var(--dk-text2) !important;
  transition: background 0.15s, color 0.15s !important;
}
[data-theme="dark"] .sidebar-item:hover {
  background: rgba(255,255,255,0.05) !important;
  color: var(--dk-text) !important;
}
[data-theme="dark"] .sidebar-item.active {
  background: rgba(var(--primary-rgb),0.18) !important;
  color: var(--primary) !important;
  font-weight: 600 !important;
}
[data-theme="dark"] .sidebar-item.active svg {
  stroke: var(--primary) !important;
}

/* ── TOPBAR ───────────────────────────────── */
[data-theme="dark"] .topbar,
[data-theme="dark"] header {
  background: var(--dk-surface) !important;
  border-bottom: 1px solid var(--dk-border) !important;
  box-shadow: 0 1px 0 var(--dk-border) !important;
}

/* ── CARDS ────────────────────────────────── */
[data-theme="dark"] .card {
  background: var(--dk-surface) !important;
  border: 1px solid var(--dk-border) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
}
[data-theme="dark"] .card-head {
  background: var(--dk-surface) !important;
  border-bottom: 1px solid var(--dk-border) !important;
}
[data-theme="dark"] .card-body { background: var(--dk-surface) !important; }
[data-theme="dark"] .card-head-title { color: var(--dk-text)  !important; }
[data-theme="dark"] .card-head-sub   { color: var(--dk-text2) !important; }

/* ── SETTINGS NAV ─────────────────────────── */
[data-theme="dark"] .settings-nav {
  background: var(--dk-surface) !important;
  border-right: 1px solid var(--dk-border) !important;
}
[data-theme="dark"] .settings-body { background: var(--dk-body) !important; }
[data-theme="dark"] .set-nav-item  { color: var(--dk-text2) !important; }
[data-theme="dark"] .set-nav-item:hover {
  background: rgba(255,255,255,0.05) !important;
  color: var(--dk-text) !important;
}
[data-theme="dark"] .set-nav-item.active {
  background: rgba(var(--primary-rgb),0.18) !important;
  color: var(--primary) !important;
}
[data-theme="dark"] .set-nav-item.active svg { stroke: var(--primary) !important; }

/* ── FORMS & INPUTS ───────────────────────── */
[data-theme="dark"] .form-label { color: #adbac7 !important; font-weight: 600 !important; }
[data-theme="dark"] .form-error { color: #f87171 !important; }

[data-theme="dark"] .form-input,
[data-theme="dark"] .form-select,
[data-theme="dark"] input[type="text"],
[data-theme="dark"] input[type="search"],
[data-theme="dark"] input[type="email"],
[data-theme="dark"] input[type="password"],
[data-theme="dark"] input[type="tel"],
[data-theme="dark"] input[type="date"],
[data-theme="dark"] input[type="number"],
[data-theme="dark"] textarea,
[data-theme="dark"] select {
  background: var(--dk-raised) !important;
  border: 1px solid var(--dk-border) !important;
  color: var(--dk-text) !important;
}
[data-theme="dark"] .form-input::placeholder,
[data-theme="dark"] input::placeholder,
[data-theme="dark"] textarea::placeholder { color: var(--dk-text3) !important; }
[data-theme="dark"] .form-input[disabled],
[data-theme="dark"] .form-input:disabled,
[data-theme="dark"] input:disabled {
  background: rgba(255,255,255,0.03) !important;
  color: var(--dk-text3) !important;
  opacity: 0.6 !important;
}
[data-theme="dark"] .form-input:focus,
[data-theme="dark"] input:focus,
[data-theme="dark"] textarea:focus,
[data-theme="dark"] select:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb),0.2) !important;
  outline: none !important;
}
[data-theme="dark"] .form-input.valid  { border-color: #3fb950 !important; }
[data-theme="dark"] .form-input.invalid { border-color: #f87171 !important; }

/* ── BUTTONS ──────────────────────────────── */
[data-theme="dark"] .btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark)) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(var(--primary-rgb),0.3) !important;
}
[data-theme="dark"] .btn-outline {
  background: transparent !important;
  border: 1px solid var(--dk-border) !important;
  color: var(--dk-text) !important;
}
[data-theme="dark"] .btn-outline:hover {
  background: rgba(255,255,255,0.06) !important;
  border-color: #4a5568 !important;
}
[data-theme="dark"] .btn-danger {
  background: transparent !important;
  border: 1px solid rgba(248,113,113,0.4) !important;
  color: #f87171 !important;
}
[data-theme="dark"] .btn-danger:hover {
  background: rgba(248,113,113,0.1) !important;
  border-color: #f87171 !important;
}

/* ── TOGGLE SWITCHES ──────────────────────── */
[data-theme="dark"] .toggle-wrap {
  border-bottom-color: rgba(255,255,255,0.06) !important;
}
[data-theme="dark"] .toggle-info-title { color: var(--dk-text)  !important; }
[data-theme="dark"] .toggle-info-sub   { color: var(--dk-text3) !important; }
[data-theme="dark"] .toggle-slider     { background: #374151 !important; }
[data-theme="dark"] input:checked + .toggle-slider {
  background: var(--primary) !important;
}

/* ── TABLES ───────────────────────────────── */
[data-theme="dark"] table,
[data-theme="dark"] .table-container,
[data-theme="dark"] .tbl-wrap {
  background: var(--dk-surface) !important;
  border-color: var(--dk-border) !important;
}
[data-theme="dark"] thead tr,
[data-theme="dark"] .tbl-head {
  background: var(--dk-raised) !important;
}
[data-theme="dark"] thead th {
  background: var(--dk-raised) !important;
  color: var(--dk-text2) !important;
  border-color: var(--dk-border) !important;
  font-weight: 600 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  font-size: 11px !important;
}
[data-theme="dark"] tbody td {
  color: var(--dk-text) !important;
  border-color: rgba(255,255,255,0.04) !important;
}
[data-theme="dark"] tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.04) !important;
  transition: background 0.1s !important;
}
[data-theme="dark"] tbody tr:hover {
  background: rgba(255,255,255,0.04) !important;
}

/* ── BADGE / STATUS PILLS ─────────────────── */
/* Giữ nguyên màu badge/pill (xanh, đỏ, cam, tím...) như giao diện sáng.
   Chỉ đảm bảo text trên nền tối đọc được bằng cách không override gì. */

/* ── MODALS ───────────────────────────────── */
[data-theme="dark"] .modal-overlay {
  background: rgba(0,0,0,0.7) !important;
  backdrop-filter: blur(4px) !important;
}
[data-theme="dark"] .modal-box {
  background: var(--dk-surface) !important;
  border: 1px solid var(--dk-border) !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6) !important;
}
[data-theme="dark"] .modal-title { color: var(--dk-text)  !important; }
[data-theme="dark"] .modal-sub   { color: var(--dk-text2) !important; }

/* ── SETTINGS — THEME CARDS ───────────────── */
[data-theme="dark"] .theme-card {
  background: var(--dk-raised) !important;
  border: 2px solid var(--dk-border) !important;
}
[data-theme="dark"] .theme-card:hover {
  border-color: #4a5568 !important;
  background: var(--dk-surface) !important;
}
[data-theme="dark"] .theme-card.selected { border-color: var(--primary) !important; }
[data-theme="dark"] .theme-card-label { color: var(--dk-text)  !important; }
[data-theme="dark"] .theme-card-sub   { color: var(--dk-text3) !important; }

/* ── MISC ─────────────────────────────────── */
[data-theme="dark"] .danger-zone {
  background: rgba(127,29,29,0.15) !important;
  border: 1px solid rgba(248,113,113,0.3) !important;
}
[data-theme="dark"] .pwd-strength-bar { background: var(--dk-border) !important; }
[data-theme="dark"] .qr-placeholder {
  background: var(--dk-raised) !important;
  border-color: var(--dk-border) !important;
}
[data-theme="dark"] .toast {
  background: #1e293b !important;
  border: 1px solid var(--dk-border) !important;
  color: var(--dk-text) !important;
}

/* ── SCROLLBARS ───────────────────────────── */
[data-theme="dark"] ::-webkit-scrollbar-track { background: transparent !important; }
[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: #374151 !important;
  border-radius: 4px !important;
}
[data-theme="dark"] ::-webkit-scrollbar-thumb:hover { background: #4b5563 !important; }

/* ── INLINE TEXT COLOR OVERRIDES ──────────── */
[data-theme="dark"] [style*="color:#2A3547"],[data-theme="dark"] [style*="color: #2A3547"] { color: var(--dk-text)  !important; }
[data-theme="dark"] [style*="color:#5A6A85"],[data-theme="dark"] [style*="color: #5A6A85"] { color: var(--dk-text2) !important; }
[data-theme="dark"] [style*="color:#7C8FAC"],[data-theme="dark"] [style*="color: #7C8FAC"] { color: var(--dk-text3) !important; }

/* ── INLINE BACKGROUND OVERRIDES ─────────── */
[data-theme="dark"] [style*="background:white"],
[data-theme="dark"] [style*="background: white"],
[data-theme="dark"] [style*="background-color:white"],
[data-theme="dark"] [style*="background-color: white"]  { background: var(--dk-surface) !important; }

[data-theme="dark"] [style*="background:#F2F6FA"],
[data-theme="dark"] [style*="background: #F2F6FA"],
[data-theme="dark"] [style*="background:#f2f6fa"]        { background: var(--dk-body) !important; }

[data-theme="dark"] [style*="background:#EAEFF4"],
[data-theme="dark"] [style*="background: #EAEFF4"],
[data-theme="dark"] [style*="background:#ECF2FF"],
[data-theme="dark"] [style*="background: #ECF2FF"]       { background: var(--dk-raised) !important; }

[data-theme="dark"] [style*="background:#f5f5f8"],
[data-theme="dark"] [style*="background:#DFE5EF"],
[data-theme="dark"] [style*="background:#e5eaef"]        { background: var(--dk-border) !important; }

[data-theme="dark"] [style*="background:#fafafa"],
[data-theme="dark"] [style*="background: #fafafa"]       { background: var(--dk-body) !important; }

/* ── INLINE BORDER OVERRIDES ──────────────── */
[data-theme="dark"] [style*="border:1px solid #e5eaef"],
[data-theme="dark"] [style*="border: 1px solid #e5eaef"],
[data-theme="dark"] [style*="border-top:1px solid #e5eaef"],
[data-theme="dark"] [style*="border-bottom:1px solid #e5eaef"],
[data-theme="dark"] [style*="border-top:1px solid #EAEFF4"],
[data-theme="dark"] [style*="border-top:1px solid #f5f5f8"] { border-color: var(--dk-border) !important; }
`;

  var _darkStyleEl = null;

  function _injectDarkCSS() {
    if (_darkStyleEl) return;
    _darkStyleEl = document.createElement('style');
    _darkStyleEl.id = 'humi-dark-css';
    _darkStyleEl.textContent = DARK_CSS;
    document.head.appendChild(_darkStyleEl);
  }
  function _removeDarkCSS() {
    if (_darkStyleEl) { _darkStyleEl.remove(); _darkStyleEl = null; }
  }

  // ─────────────────────────────────────────────
  // 4. INLINE STYLE REWRITER
  // ─────────────────────────────────────────────
  var _origStyles = new WeakMap();   // el → { background, color, borderColor }
  var _observer = null;

  function _rewriteEl(el) {
    if (!el || !el.style) return;
    var s = el.style;
    var orig = _origStyles.get(el) || {};

    // --- BACKGROUND ---
    var bg = norm(s.background || s.backgroundColor || '');
    var darkBg = BG_MAP[bg];
    if (darkBg) {
      if (!orig.bg) orig.bg = s.background || s.backgroundColor;
      s.setProperty('background', darkBg, 'important');
    }

    // --- COLOR ---
    var col = norm(s.color || '');
    var darkCol = TEXT_MAP[col];
    if (darkCol) {
      if (!orig.color) orig.color = s.color;
      s.setProperty('color', darkCol, 'important');
    }

    // --- BORDER ---
    var brd = norm(s.borderColor || s.borderTopColor || '');
    if (BORDER_COLORS.indexOf(brd) !== -1) {
      if (!orig.borderColor) orig.borderColor = s.borderColor;
      s.setProperty('border-color', DARK_BORDER, 'important');
    }
    // inline border shorthand e.g. style="border:1px solid #e5eaef"
    if (s.border) {
      var brdNorm = norm(s.border);
      for (var bi = 0; bi < BORDER_COLORS.length; bi++) {
        if (brdNorm.indexOf(BORDER_COLORS[bi]) !== -1) {
          if (!orig.border) orig.border = s.border;
          el.style.setProperty('border-color', DARK_BORDER, 'important');
          break;
        }
      }
    }

    // --- BOX-SHADOW with light bg hints (e.g. box-shadow: 0 0 0 5px white) ---
    if (s.boxShadow && norm(s.boxShadow).indexOf('white') !== -1) {
      if (!orig.boxShadow) orig.boxShadow = s.boxShadow;
      el.style.setProperty('box-shadow', s.boxShadow.replace(/white/gi, '#1e293b'), 'important');
    }

    _origStyles.set(el, orig);
  }

  function _restoreEl(el) {
    if (!el || !el.style) return;
    var orig = _origStyles.get(el);
    if (!orig) return;
    var s = el.style;
    if (orig.bg        !== undefined) { s.removeProperty('background'); s.background = orig.bg; }
    if (orig.color     !== undefined) { s.removeProperty('color'); s.color = orig.color; }
    if (orig.borderColor!==undefined) { s.removeProperty('border-color'); s.borderColor = orig.borderColor; }
    if (orig.border    !== undefined) { s.removeProperty('border-color'); }
    if (orig.boxShadow !== undefined) { s.removeProperty('box-shadow'); s.boxShadow = orig.boxShadow; }
    _origStyles.delete(el);
  }

  function _rewriteAll() {
    var els = document.querySelectorAll('[style]');
    for (var i = 0; i < els.length; i++) _rewriteEl(els[i]);
  }

  function _restoreAll() {
    var els = document.querySelectorAll('[style]');
    for (var i = 0; i < els.length; i++) _restoreEl(els[i]);
  }

  function _startObserver() {
    if (_observer) return;
    _observer = new MutationObserver(function (mutations) {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (!isDark) return;
      for (var mi = 0; mi < mutations.length; mi++) {
        var m = mutations[mi];
        // Attribute change on existing element
        if (m.type === 'attributes' && m.attributeName === 'style') {
          _rewriteEl(m.target);
        }
        // New nodes added
        if (m.type === 'childList') {
          for (var ni = 0; ni < m.addedNodes.length; ni++) {
            var node = m.addedNodes[ni];
            if (node.nodeType !== 1) continue;
            // Rewrite the node itself
            _rewriteEl(node);
            // Rewrite its styled descendants
            var desc = node.querySelectorAll('[style]');
            for (var di = 0; di < desc.length; di++) _rewriteEl(desc[di]);
          }
        }
      }
    });
    _observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  function _stopObserver() {
    if (_observer) { _observer.disconnect(); _observer = null; }
  }

  // ─────────────────────────────────────────────
  // 5. APPLY / REMOVE DARK MODE
  // ─────────────────────────────────────────────
  function _enableDark() {
    _injectDarkCSS();
    document.documentElement.setAttribute('data-theme', 'dark');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        _rewriteAll();
        _startObserver();
      });
    } else {
      _rewriteAll();
      _startObserver();
    }
  }

  function _disableLight() {
    _stopObserver();
    _restoreAll();
    document.documentElement.removeAttribute('data-theme');
    _removeDarkCSS();
  }

  function applyTheme(mode) {
    var effective = getEffectiveTheme(mode);
    if (effective === 'dark') {
      _enableDark();
    } else {
      _disableLight();
    }
  }

  function getEffectiveTheme(mode) {
    if (mode === 'dark')  return 'dark';
    if (mode === 'light') return 'light';
    var h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'light' : 'dark';
  }

  // ─────────────────────────────────────────────
  // 6. AUTO MODE TIMER
  // ─────────────────────────────────────────────
  var _autoTimer = null;

  function _startAutoTimer() {
    if (_autoTimer) clearInterval(_autoTimer);
    _autoTimer = setInterval(function () {
      var saved = localStorage.getItem('humi_theme_mode') || 'light';
      if (saved === 'auto') {
        applyTheme('auto');
        window.dispatchEvent(new CustomEvent('humiThemeChanged', { detail: { mode: 'auto' } }));
      } else {
        clearInterval(_autoTimer); _autoTimer = null;
      }
    }, 60000);
  }

  // ─────────────────────────────────────────────
  // 7. PUBLIC API
  // ─────────────────────────────────────────────
  window.HumiTheme = {
    COLORS: COLORS,
    applyColor: applyColor,
    applyTheme: applyTheme,
    getEffectiveTheme: getEffectiveTheme,
    startAutoTimer: _startAutoTimer,

    setMode: function (mode) {
      localStorage.setItem('humi_theme_mode', mode);
      applyTheme(mode);
      if (mode === 'auto') {
        _startAutoTimer();
      } else {
        if (_autoTimer) { clearInterval(_autoTimer); _autoTimer = null; }
      }
    },

    setColor: function (idx) {
      localStorage.setItem('humi_theme_color', String(idx));
      applyColor(idx);
    },

    getSavedMode:  function () { return localStorage.getItem('humi_theme_mode')  || 'light'; },
    getSavedColor: function () { return parseInt(localStorage.getItem('humi_theme_color') || '0', 10); },
  };

  // ─────────────────────────────────────────────
  // 8. INIT (runs immediately, before page paint)
  // ─────────────────────────────────────────────
  try {
    var _ci = window.HumiTheme.getSavedColor();
    applyColor(isNaN(_ci) ? 0 : _ci);

    var _mode = window.HumiTheme.getSavedMode();
    applyTheme(_mode);
    if (_mode === 'auto') _startAutoTimer();
  } catch (e) {}

})();
