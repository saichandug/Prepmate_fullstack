export default function Header({ title, subtitle, onMenu, sidebarOpen, user, onLogout }) {
  return (
    <header className="header">
      <button className="menu-button icon-button" type="button" onClick={onMenu} aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} title={sidebarOpen ? "Close navigation" : "Open navigation"}>☰</button>
      <div>
        <p className="eyebrow">PrepMate</p>
        <h1>{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      <div className="header-spacer" />
      {user && (
        <div className="user-menu">
          <div className="user-chip" title={user.email}>
            <span className="user-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
          </div>
          <button className="button button-secondary" type="button" onClick={onLogout}>Sign out</button>
        </div>
      )}
    </header>
  );
}
