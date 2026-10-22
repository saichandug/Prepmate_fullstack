import { useMemo, useState } from "react";
import ApplicationCard from "./ApplicationCard";
import ApplicationForm from "./ApplicationForm";
import EmptyState from "./EmptyState";
import Modal from "./Modal";

export default function Applications({ applications, onSave, onDelete, onAnalyze, getProgress, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("soonest");

  const filtered = useMemo(() => applications
    .filter((app) => `${app.company} ${app.role}`.toLowerCase().includes(search.toLowerCase()))
    .filter((app) => status === "All" || app.status === status)
    .sort((a, b) => sort === "soonest"
      ? new Date(a.interviewDate) - new Date(b.interviewDate)
      : new Date(b.interviewDate) - new Date(a.interviewDate)), [applications, search, status, sort]);

  const save = async (data) => {
    const duplicate = applications.find((item) =>
      item.id !== data.id &&
      item.company.trim().toLowerCase() === data.company.trim().toLowerCase() &&
      item.role.trim().toLowerCase() === data.role.trim().toLowerCase()
    );
    if (duplicate) {
      notify("An application for this company and role already exists.", "warning");
      return;
    }
    const saved = await onSave(data, Boolean(editing));
    if (saved === false) return;
    setShowForm(false);
    setEditing(null);
  };

  if (showForm) {
    return <ApplicationForm initialData={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />;
  }

  return (
    <div className="stack-xl">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Application tracker</span>
          <h2>Stay ahead of every opportunity.</h2>
          <p>Track applications and connect each role to preparation.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => setShowForm(true)}>＋ Add Application</button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <span>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or role..." aria-label="Search applications" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option>All</option><option>Applied</option><option>Shortlisted</option><option>Interview Scheduled</option><option>Selected</option><option>Rejected</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by interview date">
          <option value="soonest">Soonest interview</option>
          <option value="latest">Latest interview</option>
        </select>
      </div>

      {!filtered.length ? (
        <EmptyState icon="▣" title={applications.length ? "No matching applications found." : "You haven't added any applications yet."} message={applications.length ? "Change your search term or filters." : "Add your first application to turn a job description into a preparation plan."} actionLabel={applications.length ? undefined : "Add Application"} onAction={() => setShowForm(true)} />
      ) : (
        <div className="application-grid">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} progress={getProgress(app.id)} onView={setViewing} onEdit={(item) => { setEditing(item); setShowForm(true); }} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {viewing && (
        <Modal title={`${viewing.company} · ${viewing.role}`} onClose={() => setViewing(null)} actions={<button className="button button-primary" type="button" onClick={() => { onAnalyze(viewing.jd); setViewing(null); }}>Analyze JD</button>}>
          <div className="detail-list">
            <div><span>Status</span><strong>{viewing.status}</strong></div>
            <div><span>Interview</span><strong>{new Date(`${viewing.interviewDate}T00:00:00`).toLocaleDateString()}</strong></div>
            <div><span>Preparation</span><strong>{viewing.preparationHours} hours</strong></div>
          </div>
          <h3>Job Description</h3>
          <p className="long-copy">{viewing.jd}</p>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete application?" onClose={() => setDeleting(null)} actions={
          <>
            <button className="button button-secondary" type="button" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="button button-danger" type="button" onClick={() => { onDelete(deleting.id); setDeleting(null); }}>Delete</button>
          </>
        }>
          <p>This will remove the application and its saved roadmap from this browser. This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}