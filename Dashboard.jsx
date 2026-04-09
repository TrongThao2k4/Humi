import { useState, useEffect } from "react";

// ===================== ICONS =====================
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 2, ...extra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...extra}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ===================== SIDEBAR =====================
const menuItems = [
  { label: "Trang chủ", active: true, icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { label: "Duyệt công", icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { label: "Duyệt phép", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
  { label: "Nhân viên", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
  { label: "Lịch làm việc", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4z M8 2v4 M16 2v4 M3 10h18" },
  { label: "Đăng ký ca", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2z M12 6v6l4 2" },
];

const bottomItems = [
  { label: "Xem phép tồn", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 7a4 4 0 100 8 4 4 0 000-8z M16 11l2 2 4-4" },
  { label: "Xem thu nhập", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { label: "Hộp thư", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
];

function Sidebar() {
  return (
    <aside className="flex flex-col bg-white h-screen" style={{ borderRight: "1px solid #f0f0f5", width: 240 }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid #f5f5f8" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#111827" }}>Humi</span>
      </div>

      {/* User */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid #f5f5f8" }}>
        <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer" style={{ transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div className="relative">
            <img src="https://i.pravatar.cc/40?img=47" alt="avatar" className="rounded-full object-cover" style={{ width: 40, height: 40, border: "2px solid #ede9fe" }} />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#34d399", width: 10, height: 10 }}></div>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Tiểu Nhi</p>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>Quản lý</p>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 12px 8px" }}>Menu</p>
        {menuItems.map(item => (
          <SidebarItem key={item.label} {...item} />
        ))}
        <div style={{ margin: "8px 4px", borderTop: "1px solid #f3f4f6" }}></div>
        {bottomItems.map(item => (
          <SidebarItem key={item.label} {...item} />
        ))}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid #f5f5f8", paddingTop: 12 }}>
        <SidebarItem label="Cài đặt" icon="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </div>
    </aside>
  );
}

function SidebarItem({ label, icon, active }) {
  const [hovered, setHovered] = useState(false);
  const bg = active ? "rgba(124,58,237,0.1)" : hovered ? "#f9fafb" : "transparent";
  const color = active ? "#7C3AED" : "#4b5563";
  return (
    <a href="#"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: bg, color, fontWeight: active ? 600 : 500, fontSize: 13, textDecoration: "none", transition: "all 0.15s", marginBottom: 2 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
      </svg>
      {label}
    </a>
  );
}

// ===================== TOPBAR =====================
function Topbar() {
  return (
    <header className="flex items-center justify-between px-6 bg-white" style={{ height: 64, borderBottom: "1px solid #f0f0f5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ flex: 1, maxWidth: 480 }}>
        <div className="flex items-center gap-2.5" style={{ background: "#f9fafb", border: "1px solid #f0f0f5", borderRadius: 12, padding: "9px 16px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Tìm kiếm..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#374151", flex: 1 }} />
          <kbd style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", borderRadius: 5, padding: "2px 6px", fontFamily: "monospace" }}>⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-3" style={{ marginLeft: 16 }}>
        <button className="relative" style={{ padding: "10px", borderRadius: 12, background: "transparent", border: "none", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid white" }}></span>
        </button>
        <div style={{ width: 1, height: 32, background: "#f0f0f5" }}></div>
        <div className="flex items-center gap-2" style={{ cursor: "pointer", padding: "6px 10px", borderRadius: 12 }}>
          <img src="https://i.pravatar.cc/32?img=47" alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #ede9fe" }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>Tiểu Nhi</p>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>Quản lý</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginLeft: 4 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  );
}

// ===================== BANNER =====================
function Banner() {
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", height: 200, position: "relative", background: "linear-gradient(135deg, #0a0a2e 0%, #0d1b4b 25%, #0f2460 40%, #1a1078 55%, #3b0f8c 70%, #1a3a8f 85%, #0f4fa8 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.5) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 60%, rgba(139,92,246,0.3) 0%, transparent 60%)" }}></div>
      <svg style={{ position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)", width: "160%", opacity: 0.35 }} viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0"/>
            <stop offset="50%" stopColor="#c084fc" stopOpacity="1"/>
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[
          "M0,200 C100,160 200,240 300,200 C400,160 500,240 600,200 C700,160 800,240 900,200 C1000,160 1100,240 1200,200",
          "M0,220 C120,180 240,260 360,220 C480,180 600,260 720,220 C840,180 960,260 1080,220 C1200,180 1200,220 1200,220",
          "M0,240 C80,200 160,280 240,240 C320,200 400,280 480,240 C560,200 640,280 720,240 C800,200 880,280 960,240 C1040,200 1120,280 1200,240",
          "M0,260 C150,220 300,300 450,260 C600,220 750,300 900,260 C1050,220 1150,270 1200,260",
          "M0,280 C100,240 200,320 300,280 C400,240 500,320 600,280 C700,240 800,320 900,280 C1000,240 1100,320 1200,280",
          "M0,300 C200,260 400,340 600,300 C800,260 1000,340 1200,300",
          "M0,320 C100,280 200,360 300,320 C400,280 500,360 600,320 C700,280 800,360 900,320 C1000,280 1100,360 1200,320",
        ].map((d, i) => <path key={i} d={d} fill="none" stroke="url(#wg1)" strokeWidth={i === 0 ? 1.5 : i === 5 ? 1.5 : 1} />)}
        <path d="M0,280 C200,220 400,340 600,270 C800,200 1000,330 1200,260" fill="none" stroke="white" strokeWidth="2" opacity="0.12" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", zIndex: 10 }}>
        <button style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "5px", textTransform: "uppercase", marginBottom: 4 }}>Abstract</p>
          <p style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, letterSpacing: "10px", textTransform: "uppercase" }}>Background</p>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 10 }}>
        <div style={{ width: 20, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.7)" }}></div>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.3)" }}></div>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.3)" }}></div>
      </div>
    </div>
  );
}

// ===================== ANNOUNCEMENT CARD =====================
const announcements = [
  {
    dept: "Phòng hành chính nhân sự",
    title: "THÔNG BÁO NGHỈ TẾT ÂM LỊCH NĂM 2026",
    desc: "Phòng Hành chính Nhân sự trân trọng thông báo lịch nghỉ Tết Âm Lịch 2026 tới toàn thể CBNV như sau:",
    creator: "Nguyễn Hoàng Kim Phụng",
    approver: "Cao Thị Hà Như",
    status: "active",
    statusLabel: "Đang hiệu lực",
    dateFrom: "05/02/2026",
    dateTo: "25/02/2026",
  },
  {
    dept: "Phòng hành chính nhân sự",
    title: "THÔNG BÁO TỔ CHỨC TIỆC TẤT NIÊN (YEAR END PARTY) 2025",
    desc: "Ban Tổ chức trân trọng kính mời toàn thể CBNV tham dự buổi tiệc tất niên năm 2025...",
    creator: "Nguyễn Hoàng Kim Phụng",
    approver: "Võ Lê Hoàng Văn",
    status: "expired",
    statusLabel: "Đã kết thúc",
    dateFrom: "01/01/2026",
    dateTo: "31/01/2026",
  },
];

function AnnouncementCard() {
  return (
    <div className="bg-white" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f5f5f8" }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Thông báo công ty</h2>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      {announcements.map((a, i) => (
        <div key={i} style={{ padding: "16px 20px", borderBottom: i < announcements.length - 1 ? "1px solid #f9fafb" : "none" }}>
          <div className="flex gap-4">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#7C3AED", background: "#f5f3ff", padding: "2px 8px", borderRadius: 6, display: "inline-block", marginBottom: 6 }}>{a.dept}</span>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{a.title}</h3>
              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.desc}</p>
            </div>
            <div style={{ minWidth: 190, textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Người tạo:</span>
                <a href="#" style={{ fontSize: 11, fontWeight: 500, color: "#7C3AED", textDecoration: "none" }}>{a.creator}</a>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20, ...(a.status === "active" ? { background: "#d1fae5", color: "#065f46" } : { background: "#f3f4f6", color: "#6b7280" }) }}>{a.statusLabel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Người duyệt:</span>
                <a href="#" style={{ fontSize: 11, fontWeight: 500, color: "#7C3AED", textDecoration: "none" }}>{a.approver}</a>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                </svg>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>Hiệu lực từ {a.dateFrom} – {a.dateTo}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding: "10px 20px", borderTop: "1px solid #f9fafb", display: "flex", justifyContent: "flex-end" }}>
        <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Xem tất cả
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  );
}

// ===================== INBOX CARD =====================
const inboxOther = [
  { sender: "Cao Thị Hà Như", title: "P.HCNS THÔNG BÁO VỀ VIỆC DUYỆT CÔNG CHI TRẢ...", date: "01/01/2026", views: "45/50", initials: "CH", color: "#ede9fe", textColor: "#6d28d9" },
];

function InboxCard() {
  const [tab, setTab] = useState("unread");
  return (
    <div className="bg-white" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid #f5f5f8" }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Thư mới từ đồng nghiệp</h2>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["unread", "other"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 500, color: tab === t ? "#7C3AED" : "#6b7280", borderBottom: tab === t ? "2px solid #7C3AED" : "2px solid transparent", transition: "all 0.2s" }}>
              {t === "unread" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>}
              {t === "unread" ? "Chưa đọc" : "Thư Khác"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state for unread */}
      <div style={{ padding: "20px", textAlign: "center", borderBottom: "1px solid #f9fafb" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Tuyệt quá! Bạn đã đọc tất cả thư trong hộp thư đến của mình.</p>
      </div>

      {/* Thư Khác section */}
      <div style={{ padding: "14px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Thư Khác</span>
        </div>
      </div>

      {inboxOther.map((msg, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer", borderTop: "1px solid #f9fafb", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: msg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: msg.textColor }}>{msg.initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{msg.sender}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{msg.date}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{msg.title}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{msg.views}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding: "10px 20px", borderTop: "1px solid #f9fafb", display: "flex", justifyContent: "flex-end" }}>
        <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          Xem tất cả
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  );
}

// ===================== TIME CARD =====================
function TimeCard() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const h = String(time.getHours()).padStart(2, "0");
  const m = String(time.getMinutes()).padStart(2, "0");
  const s = String(time.getSeconds()).padStart(2, "0");
  const dayName = days[time.getDay()];
  const dateStr = `${String(time.getDate()).padStart(2, "0")}/${String(time.getMonth() + 1).padStart(2, "0")}/${time.getFullYear()}`;

  return (
    <div className="bg-white" style={{ borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #2563eb 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>
          {h}:{m}:{s}
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>{dayName}, Ngày {dateStr}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Công ty X</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Ca sáng (08:00 - 17:00)</span>
        </div>
      </div>

      <textarea placeholder="Ghi chú (tùy chọn)" rows={2} style={{ width: "100%", fontSize: 13, color: "#374151", background: "#f9fafb", border: "1px solid #f0f0f5", borderRadius: 12, padding: "10px 12px", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }} />

      <button style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", cursor: "pointer", color: "white", fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)", boxShadow: "0 4px 14px rgba(99,60,236,0.35)", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,60,236,0.45)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,60,236,0.35)"; }}>
        Chấm công
      </button>
    </div>
  );
}

// ===================== QUICK ACTIONS =====================
const quickActions = [
  { label: "Tạo nghỉ phép", icon: "M17.5 21H9a7 7 0 117-7v1 M21 3l-9 9 M15 3h6v6" },
  { label: "Thư nội bộ", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
  { label: "Duyệt công", icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
];

function QuickActions() {
  return (
    <div className="bg-white" style={{ borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Truy cập nhanh</h3>
        <button style={{ background: "none", border: "none", fontSize: 12, color: "#7C3AED", fontWeight: 500, cursor: "pointer" }}>+ Thêm mới</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {quickActions.map((action, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1.5px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {action.icon.split(" M").map((p, j) => <path key={j} d={j === 0 ? p : "M" + p} />)}
              </svg>
            </div>
            <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== MINI STATS =====================
function MiniStats() {
  return (
    <div className="bg-white" style={{ borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Thống kê tháng này</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Ngày công", value: "22/22", color: "#34d399" },
          { label: "Tăng ca", value: "5 giờ", color: "#60a5fa" },
          { label: "Phép còn lại", value: "8 ngày", color: "#fbbf24" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }}></div>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f5f5f8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Hoàn thành công</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED" }}>100%</span>
        </div>
        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", borderRadius: 3, background: "linear-gradient(90deg, #7C3AED, #4F46E5, #2563EB)" }}></div>
        </div>
      </div>
    </div>
  );
}

// ===================== RIGHT PANEL =====================
function RightPanel() {
  return (
    <aside style={{ background: "#F0F2F8", borderLeft: "1px solid #e8eaf0", overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <TimeCard />
      <QuickActions />
      <MiniStats />
    </aside>
  );
}

// ===================== DASHBOARD =====================
export default function Dashboard() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", gridTemplateRows: "64px 1fr", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F0F2F8" }}>
      {/* Sidebar spans full height */}
      <div style={{ gridColumn: 1, gridRow: "1 / 3" }}>
        <Sidebar />
      </div>

      {/* Topbar */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <Topbar />
      </div>

      {/* Main content */}
      <main style={{ gridColumn: 2, gridRow: 2, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Banner />
        <AnnouncementCard />
        <InboxCard />
      </main>

      {/* Right panel spans full height */}
      <div style={{ gridColumn: 3, gridRow: "1 / 3" }}>
        <RightPanel />
      </div>
    </div>
  );
}
