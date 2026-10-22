import { useMemo } from "react";
import ProgressBar from "./ProgressBar";

export default function PreparationRoadmap({ roadmap, completion, onToggle, onStudyNext }) {
  const items = roadmap?.weeks?.flatMap((week) => week.items) || [];
  const completed = items.filter((item) => completion[item.id]).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
  const next = items.find((item) => !completion[item.id]);

  if (!roadmap) {
    return (
      <div className="empty-page">
        <div className="hero-card">
          <div>
            <span className="eyebrow">Personalized preparation</span>
            <h2>Your roadmap starts with a job description.</h2>
            <p>Analyze a JD to generate a focused plan based on the company, role, interview date, available time and detected skills.</p>
          </div>
          <div className="hero-icon">◈</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-xl">
      <div className="roadmap-banner">
        <div>
          <span className="eyebrow">{roadmap.meta.company} · {roadmap.meta.role}</span>
          <h2>Preparation Roadmap</h2>
          <p>{roadmap.meta.preparationHours} hours/day · Interview {new Date(`${roadmap.meta.interviewDate}T00:00:00`).toLocaleDateString()}</p>
        </div>
        <div className="roadmap-score"><strong>{percent}%</strong><span>complete</span></div>
      </div>

      {next && (
        <section className="study-next">
          <div>
            <span className="eyebrow">Study next</span>
            <h3>{next.topic}</h3>
            <p><span className={`priority priority-${next.priority.toLowerCase()}`}>{next.priority}</span> · {next.minutes} minutes</p>
          </div>
          <button className="button button-primary" type="button" onClick={() => onStudyNext(next)}>Start Learning</button>
        </section>
      )}

      <ProgressBar value={percent} label={`${completed} / ${items.length} topics completed`} />

      <div className="roadmap-grid">
        {roadmap.weeks.map((week) => (
          <section className="week-card" key={week.week}>
            <div className="week-head">
              <div><span>WEEK {week.week}</span><h3>{week.title}</h3></div>
              <span className="week-count">{week.items.filter((item) => completion[item.id]).length}/{week.items.length}</span>
            </div>
            <div className="roadmap-items">
              {week.items.map((item) => {
                const done = Boolean(completion[item.id]);
                return (
                  <label className={`roadmap-item ${done ? "done" : ""}`} key={item.id}>
                    <input type="checkbox" checked={done} onChange={() => onToggle(item)} />
                    <span className="checkmark">{done ? "✓" : ""}</span>
                    <span className="grow"><strong>{item.topic}</strong><small>{item.minutes} min · {item.priority}</small></span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}