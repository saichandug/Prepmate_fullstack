import { getTodayActivities } from "../utils/streakManager";

export default function DailyStreak({ streak, onNavigate }) {
  const activities = getTodayActivities(streak);
  const types = [
    ["roadmap", "Roadmap topic", "preparation"],
    ["coding", "Coding question", "coding"],
    ["mock", "Mock interview", "mock"]
  ];
  return (
    <div className="stack-xl">
      <section className="streak-hero">
        <div className="streak-flame">🔥</div>
        <div><span className="eyebrow">Daily preparation</span><h2>{streak.current || 0} Day Streak</h2><p>Meaningful preparation beats simply opening the app.</p></div>
        <div className="best-streak"><span>Best streak</span><strong>{streak.best || 0} days</strong></div>
      </section>
      <section className="panel">
        <div className="section-heading"><div><span className="eyebrow">Today's progress</span><h2>{Math.min(3, activities.length)} / 3 activities</h2></div></div>
        <div className="activity-grid">
          {types.map(([id, label, destination]) => <button type="button" className={`activity-tile activity-button ${activities.includes(id) ? "done" : ""}`} key={id} onClick={() => onNavigate(destination)}><span>{activities.includes(id) ? "✓" : "○"}</span><strong>{label}</strong><small>{activities.includes(id) ? "Completed today · Open" : "Start now →"}</small></button>)}
        </div>
        {activities.length < 3 && <div className="inline-alert info">Complete one more meaningful activity to maintain your streak.</div>}
      </section>
      <section className="panel">
        <h3>How streaks work</h3>
        <p>Only completing a roadmap topic, coding question, or mock interview counts. Opening PrepMate does not increase the streak.</p>
      </section>
    </div>
  );
}