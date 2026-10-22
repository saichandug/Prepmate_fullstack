import ProgressBar from "./ProgressBar";
import EmptyState from "./EmptyState";

export default function Dashboard({ applications, roadmap, roadmapCompletion, streak, onNavigate, getProgress }) {
  const interviews = applications.filter((app) => app.status === "Interview Scheduled" || app.status === "Shortlisted");
  const upcoming = [...applications].filter((app) => new Date(`${app.interviewDate}T23:59:59`) >= new Date()).sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))[0];
  const roadmapItems = roadmap?.weeks?.flatMap((w) => w.items) || [];
  const completed = roadmapItems.filter((item) => roadmapCompletion[item.id]).length;
  const progress = roadmapItems.length ? Math.round(completed / roadmapItems.length * 100) : 0;
  const next = roadmapItems.find((item) => !roadmapCompletion[item.id]);

  return (
    <div className="stack-xl">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Your preparation command center</span>
          <h2>Turn your job application into a preparation plan.</h2>
          <p>Track opportunities, extract skills, practice the right questions and walk into interviews prepared.</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => onNavigate("applications")}>＋ Add Application</button>
            <button className="button button-secondary" type="button" onClick={() => onNavigate("preparation")}>Analyze JD</button>
          </div>
        </div>
        <div className="hero-orbit"><div>✦</div><span>JOB<br/>READY</span></div>
      </section>

      <div className="stats-grid">
        <Stat icon="▣" label="Total Applications" value={applications.length} />
        <Stat icon="◷" label="Interviews" value={interviews.length} />
        <Stat icon="◈" label="Preparation Progress" value={`${progress}%`} />
        <Stat icon="🔥" label="Current Streak" value={`${streak.current || 0}d`} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading"><div><span className="eyebrow">Upcoming interview</span><h2>Next on your calendar</h2></div><button className="text-button" type="button" onClick={() => onNavigate("applications")}>View all →</button></div>
          {upcoming ? <div className="upcoming-card"><div className="date-block"><strong>{new Date(`${upcoming.interviewDate}T00:00:00`).getDate()}</strong><span>{new Date(`${upcoming.interviewDate}T00:00:00`).toLocaleDateString(undefined, { month: "short" })}</span></div><div><h3>{upcoming.company}</h3><p>{upcoming.role}</p><span className="badge badge-neutral">{upcoming.status}</span></div></div> : <EmptyState icon="◷" title="No upcoming interviews" message="Add an application with an interview date to see it here." actionLabel="Add Application" onAction={() => onNavigate("applications")} />}
        </section>

        <section className="panel study-next-panel">
          <div className="section-heading"><div><span className="eyebrow">Study next</span><h2>Keep momentum</h2></div></div>
          {next ? <div><div className="next-topic"><span className={`priority priority-${next.priority.toLowerCase()}`}>{next.priority}</span><h3>{next.topic}</h3><p>{next.minutes} minutes estimated</p></div><button className="button button-primary button-wide" type="button" onClick={() => onNavigate("preparation")}>Start Learning</button></div> : <EmptyState icon="✓" title="You're all caught up!" message="Analyze a job description to create your next roadmap." />}
        </section>
      </div>

      <section className="panel">
        <div className="section-heading"><div><span className="eyebrow">Recent applications</span><h2>Latest opportunities</h2></div><button className="text-button" type="button" onClick={() => onNavigate("applications")}>Manage →</button></div>
        {!applications.length ? <EmptyState icon="▣" title="You haven't added any applications yet." message="Start with a role you're currently applying for." actionLabel="Add Application" onAction={() => onNavigate("applications")} /> : <div className="recent-list">{applications.slice(-5).reverse().map((app) => <div className="recent-row" key={app.id}><div className="company-avatar">{app.company.slice(0, 2).toUpperCase()}</div><div className="grow"><strong>{app.company}</strong><span>{app.role}</span></div><span className="badge badge-neutral">{app.status}</span><div className="recent-progress"><ProgressBar value={getProgress(app.id)} /></div></div>)}</div>}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>;
}