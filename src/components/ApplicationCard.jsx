import ProgressBar from "./ProgressBar";

export default function ApplicationCard({ application, progress = 0, onView, onEdit, onDelete }) {
  return (
    <article className="application-card">
      <div className="application-top">
        <div className="company-avatar">{application.company.slice(0, 2).toUpperCase()}</div>
        <div className="grow">
          <h3>{application.company}</h3>
          <p>{application.role}</p>
        </div>
        <span className={`badge status-${application.status.toLowerCase().replaceAll(" ", "-")}`}>{application.status}</span>
      </div>
      <div className="application-meta">
        <span>◷ {new Date(`${application.interviewDate}T00:00:00`).toLocaleDateString()}</span>
        <span>⏱ {application.preparationHours}h prep</span>
      </div>
      <ProgressBar value={progress} label="Preparation" />
      <div className="card-actions">
        <button className="button button-ghost" type="button" onClick={() => onView(application)}>View</button>
        <button className="button button-ghost" type="button" onClick={() => onEdit(application)}>Edit</button>
        <button className="button button-danger" type="button" onClick={() => onDelete(application)}>Delete</button>
      </div>
    </article>
  );
}