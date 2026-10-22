import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";
import ProgressBar from "./ProgressBar";

export default function CodingPractice({ questions, completion, onComplete, notify }) {
  const [company, setCompany] = useState("All");
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [state, setState] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const topics = [...new Set(questions.map((item) => item.topic))].sort();
  const companies = [...new Set(questions.map((item) => item.company))].sort();

  const filtered = useMemo(() => questions.filter((item) =>
    (company === "All" || item.company === company) &&
    (topic === "All" || item.topic === topic) &&
    (difficulty === "All" || item.difficulty === difficulty) &&
    (state === "All" || (state === "Completed" ? completion[item.id] : !completion[item.id])) &&
    `${item.question} ${item.topic} ${item.company}`.toLowerCase().includes(query.toLowerCase())
  ), [questions, company, topic, difficulty, state, completion, query]);

  const doneCount = questions.filter((item) => completion[item.id]).length;
  const mark = (item) => {
    if (completion[item.id]) return;
    onComplete(item.id);
    notify("Question marked complete.", "success");
  };

  return (
    <div className="stack-xl">
      <div className="page-title-row">
        <div><span className="eyebrow">Practice lab</span><h2>Build interview muscle.</h2><p>Curated preparation material plus general interview questions.</p></div>
      </div>
      <div className="stat-card compact-progress">
        <div><div><strong>{doneCount} / {questions.length}</strong><span>Completed</span></div><strong>{Math.round(doneCount / Math.max(questions.length, 1) * 100)}%</strong></div>
        <ProgressBar value={doneCount / Math.max(questions.length, 1) * 100} showValue={false} />
      </div>
      <div className="toolbar filters">
        <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions..." /></label>
        <select value={company} onChange={(e) => setCompany(e.target.value)}><option>All</option>{companies.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}><option>All</option>{topics.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
        <select value={state} onChange={(e) => setState(e.target.value)}><option>All</option><option>Completed</option><option>Not Completed</option></select>
      </div>
      {!filtered.length ? <EmptyState icon="⌕" title="No questions found." message="Change your search term or filters." /> : (
        <div className="question-list">
          {filtered.map((item, index) => {
            const done = Boolean(completion[item.id]);
            return (
              <article className={`question-card ${done ? "question-done" : ""}`} key={item.id}>
                <div className="question-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="grow">
                  <div className="question-meta"><span className="tag tag-neutral">{item.company}</span><span className={`difficulty difficulty-${item.difficulty.toLowerCase()}`}>{item.difficulty}</span><span>{item.topic}</span></div>
                  <h3>{item.question}</h3>
                  {open === item.id && <div className="answer-box"><strong>Answer / Explanation</strong><p>{item.answer}</p><strong>Important concepts</strong><div className="tag-list">{item.concepts.map((c) => <span className="tag tag-neutral" key={c}>{c}</span>)}</div></div>}
                  <div className="card-actions">
                    <button className="button button-ghost" type="button" onClick={() => setOpen(open === item.id ? null : item.id)}>{open === item.id ? "Hide Answer" : "View Answer"}</button>
                    <button className={`button ${done ? "button-complete" : "button-secondary"}`} type="button" disabled={done} onClick={() => mark(item)}>{done ? "✓ Completed" : "Mark Completed"}</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}