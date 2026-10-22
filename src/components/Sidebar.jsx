const items = [
  ["dashboard", "⌂", "Dashboard"],
  ["applications", "▣", "Applications"],
  ["preparation", "◈", "Preparation"],
  ["coding", "</>", "Coding Practice"],
  ["mock", "◉", "Mock Interview"],
  ["streak", "🔥", "Daily Streak"],
];

export default function Sidebar({ active, onNavigate, open, onClose }) {
  return (
    <>
      {open && <button className="mobile-overlay" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : "sidebar-collapsed"}`}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <strong>PrepMate</strong>
            <span>Job ready, faster.</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {items.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${active === id ? "active" : ""}`}
              onClick={() => { onNavigate(id); }}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="mini-tip">
            <span>✦</span>
            <div>
              <strong>Prep tip</strong>
              <p>Complete 3 meaningful activities to maintain your streak.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}