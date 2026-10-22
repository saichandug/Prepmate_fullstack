import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ active, onNavigate, title, subtitle, children }) {
  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={onNavigate} open={true} />
      <div className="main-shell">
        <Header title={title} subtitle={subtitle} sidebarOpen={true} onMenu={() => {}} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}