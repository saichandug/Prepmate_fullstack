import { useEffect, useState } from "react";
import EmptyState from "./EmptyState";
import ProgressBar from "./ProgressBar";
import { analyzeJD } from "../utils/jdAnalyzer";
import { validateJD } from "../utils/validation";
import { callGemini } from "../utils/ai";

export default function JDAnalyzer({ initialText = "", savedResult, onResult, onGenerateRoadmap, notify }) {
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState(savedResult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setText(initialText);
    setResult(savedResult);
  }, [initialText, savedResult]);

  const run = async () => {
    if (busy) return;
    const validation = validateJD(text);
    if (validation) {
      setError(validation);
      setResult(null);
      return;
    }

    setBusy(true);
    setError("");
    setAiError("");
    const local = analyzeJD(text);
    setResult(local);
    onResult(text, local);

    try {
      const ai = await callGemini("jd", { text });
      const aiSkills = Array.isArray(ai.skills) ? ai.skills.filter((skill) => skill?.name).slice(0, 12) : [];
      const merged = {
        ...local,
        status: aiSkills.length ? local.status : "unrelated",
        skills: aiSkills.length ? aiSkills : local.skills,
        categories: Array.isArray(ai.categories) && ai.categories.length ? ai.categories : local.categories,
        keywords: Array.isArray(ai.keywords) ? ai.keywords : local.keywords,
        ai,
      };
      setResult(merged);
      onResult(text, merged);
      notify("Job description analyzed with Gemini AI.", "success");
    } catch (err) {
      setAiError("Gemini is unavailable right now. Showing PrepMate's built-in analysis instead.");
      notify("AI analysis unavailable; built-in analysis is still available.", "warning");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="analyzer-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AI + rule-based analysis</span>
            <h2>What should you prepare?</h2>
          </div>
          <span className="badge badge-neutral">Gemini AI</span>
        </div>
        <label className="field">
          <span>Job Description</span>
          <textarea rows="15" value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} placeholder="Paste a software job description..." />
          <div className="counter">{text.length} / 4000 characters</div>
        </label>
        {error && <div className="inline-alert error">⚠️ {error}</div>}
        {aiError && <div className="inline-alert warning">{aiError}</div>}
        <button className="button button-primary button-wide" type="button" disabled={busy} onClick={run}>{busy ? "Analyzing with Gemini..." : "Analyze Job Description"}</button>
      </section>

      <section className="panel">
        {!result ? (
          <EmptyState icon="✦" title="Your analysis will appear here." message="Paste a valid job description and Gemini will identify the skills, requirements and preparation focus." />
        ) : result.status === "unrelated" ? (
          <EmptyState icon="⚠️" title="No Relevant Job Skills Found" message={result.message || result.ai?.summary || "Please enter a genuine job description containing relevant requirements or skills."} actionLabel="Try Again" onAction={() => setText("")} />
        ) : result.status === "short" || result.status === "empty" ? (
          <EmptyState icon="!" title={result.message} message="Add more relevant job requirements before generating a roadmap." />
        ) : (
          <div className="stack-lg">
            <div className="result-head">
              <div>
                <span className="eyebrow">Detected skills</span>
                <h2>{result.skills.length} skills found</h2>
              </div>
              <span className="badge badge-neutral">{result.ai ? "Gemini enhanced" : "Built-in"}</span>
            </div>
            {result.ai?.summary && <div className="inline-alert info">{result.ai.summary}</div>}
            {result.status === "limited" && <div className="inline-alert warning">Recommendations are based only on the detected information.</div>}
            <div className="skill-summary">
              {["HIGH", "MEDIUM", "LOW"].map((priority) => {
                const items = result.skills.filter((skill) => skill.priority === priority);
                return (
                  <div className="priority-box" key={priority}>
                    <span className={`priority priority-${priority.toLowerCase()}`}>{priority} PRIORITY</span>
                    <strong>{items.length}</strong>
                    <small>{items.map((item) => item.name).join(" · ") || "None detected"}</small>
                  </div>
                );
              })}
            </div>
            <div>
              <h3>Detected Skills</h3>
              <div className="tag-list">{result.skills.map((skill) => <span className={`tag tag-${String(skill.priority || "LOW").toLowerCase()}`} key={`${skill.name}-${skill.category}`}>{skill.name}</span>)}</div>
            </div>
            {result.ai?.education && <div><h3>Education</h3><p>{result.ai.education}</p></div>}
            {result.ai?.experience && <div><h3>Experience</h3><p>{result.ai.experience}</p></div>}
            {result.ai?.responsibilities?.length > 0 && <div><h3>Key Responsibilities</h3><ul className="clean-list">{result.ai.responsibilities.map((item) => <li key={item}>• {item}</li>)}</ul></div>}
            {result.ai?.missingSkillSuggestions?.length > 0 && <div><h3>Suggested Skills to Prepare</h3><div className="tag-list">{result.ai.missingSkillSuggestions.map((item) => <span className="tag tag-neutral" key={item}>{item}</span>)}</div></div>}
            <div>
              <h3>Skill Categories</h3>
              <div className="tag-list">{result.categories.map((category) => <span className="tag tag-neutral" key={category}>{category}</span>)}</div>
            </div>
            <div>
              <h3>Suggested Preparation Topics</h3>
              <ProgressBar value={Math.min(100, result.skills.length * 10)} label="Coverage snapshot" />
            </div>
            <button className="button button-primary button-wide" type="button" onClick={() => onGenerateRoadmap(result.skills)}>Generate Preparation Roadmap</button>
          </div>
        )}
      </section>
    </div>
  );
}
