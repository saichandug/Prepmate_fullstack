import { useState } from "react";
import { evaluateAnswer, evaluateInterview } from "../utils/interviewEvaluator";
import { callGemini } from "../utils/ai";


const KNOWN_COMPANIES = new Set([
  "amazon", "google", "microsoft", "apple", "meta", "netflix", "adobe",
  "ibm", "oracle", "salesforce", "intel", "nvidia", "accenture", "tcs",
  "infosys", "wipro", "hcl", "capgemini", "cognizant", "deloitte", "ey",
  "pwc", "kpmg", "zoho", "paypal", "uber", "airbnb", "linkedin",
  "openai", "flipkart", "swiggy", "zomato", "ola", "qualcomm", "cisco",
]);

const COMPANY_SUFFIXES = /\b(inc|incorporated|llc|ltd|limited|corp|corporation|technologies|technology|solutions|systems|software|labs|group|services|industries|pvt|private)\b/i;
const ROLE_TERMS = /\b(engineer|developer|analyst|designer|manager|scientist|intern|consultant|architect|administrator|tester|qa|devops|data|software|web|frontend|backend|full[- ]?stack|product|security|cloud|machine learning|ai|database|technical|business)\b/i;

function validCompanyName(value) {
  const text = value.trim();
  if (text.length < 2 || text.length > 100) return false;
  if (!/^[A-Za-z0-9&.,'()\-\s]+$/.test(text)) return false;
  const compact = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (KNOWN_COMPANIES.has(compact)) return true;
  if (COMPANY_SUFFIXES.test(text)) return true;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every((word) => /[A-Za-z]{2,}/.test(word));
}

function validRole(value) {
  const text = value.trim();
  if (text.length < 2 || text.length > 120) return false;
  if (!/^[A-Za-z0-9&.,'()\-\s]+$/.test(text)) return false;
  return ROLE_TERMS.test(text);
}

function normalizeQuestion(item, index) {
  return {
    id: item.id || `ai-${Date.now()}-${index}`,
    company: item.company || "AI Generated",
    question: item.question,
    topic: item.topic || "Technical Interview",
    difficulty: item.difficulty || "Medium",
    concepts: Array.isArray(item.concepts) && item.concepts.length ? item.concepts : [item.topic || "core concept"],
  };
}

export default function MockInterview({ questions, history, onFinish, notify }) {
  const [setup, setSetup] = useState(true);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [session, setSession] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const pickFallbackSession = () => {
    const wantedCompany = company.trim().toLowerCase();
    const roleWords = role.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const companyPool = wantedCompany ? questions.filter((q) => q.company.toLowerCase() === wantedCompany) : [];
    const rolePool = questions.filter((q) => roleWords.some((word) => `${q.topic} ${q.question}`.toLowerCase().includes(word)));
    const difficultyPool = questions.filter((q) => difficulty === "All" || q.difficulty === difficulty);
    const source = [...companyPool, ...rolePool, ...difficultyPool, ...questions];
    const unique = [];
    source.sort(() => Math.random() - 0.5).forEach((item) => {
      if (!unique.some((q) => q.id === item.id)) unique.push(item);
    });
    return unique.slice(0, Math.min(10, Math.max(5, unique.length))).map(normalizeQuestion);
  };

  const start = async () => {
    if (!company.trim()) { notify("Company name is required.", "warning"); return; }
    if (!validCompanyName(company)) { notify("Enter a valid company/organization name, such as Google, Amazon, OpenAI, or Acme Technologies.", "warning"); return; }
    if (!role.trim()) { notify("Job role is required.", "warning"); return; }
    if (!validRole(role)) { notify("Enter a valid job role, such as Software Engineer, Data Analyst, or Frontend Developer.", "warning"); return; }

    setBusy(true);
    try {
      const ai = await callGemini("questions", { company: company.trim(), role: role.trim(), difficulty });
      const generated = Array.isArray(ai?.questions) ? ai.questions.filter((q) => q?.question).map(normalizeQuestion) : [];
      if (generated.length >= 5) {
        setSession(generated.slice(0, 10));
        setAiUsed(true);
        notify("Gemini generated a fresh interview set for this role.", "success");
      } else {
        throw new Error("Not enough AI questions returned.");
      }
    } catch (error) {
      setSession(pickFallbackSession());
      setAiUsed(false);
      notify(`Gemini unavailable: ${error?.message || "request failed"}. Using PrepMate's varied question bank instead.`, "warning");
    } finally {
      setAnswers([]);
      setIndex(0);
      setAnswer("");
      setSubmitted(null);
      setResult(null);
      setSetup(false);
      setBusy(false);
    }
  };

  const submit = async () => {
    if (submitted || busy) return;
    if (!answer.trim()) { notify("Please enter an answer before continuing.", "warning"); return; }

    setBusy(true);
    try {
      const ai = await callGemini("evaluate", {
        question: session[index].question,
        answer: answer.trim(),
        concepts: session[index].concepts,
      });
      const evaluation = {
        score: Math.max(0, Math.min(100, Number(ai?.score) || 0)),
        matched: Array.isArray(ai?.matchedConcepts) ? ai.matchedConcepts : [],
        strong: Number(ai?.score) >= 70,
        strengths: Array.isArray(ai?.strengths) ? ai.strengths : [],
        weaknesses: Array.isArray(ai?.weaknesses) ? ai.weaknesses : [],
        feedback: ai?.feedback || "",
      };
      setSubmitted(evaluation);
      setAiUsed(true);
    } catch {
      const fallback = evaluateAnswer(answer, session[index].concepts);
      setSubmitted(fallback);
      notify("AI evaluation unavailable; using rule-based scoring for this answer.", "warning");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!submitted) { notify("Submit your answer before continuing.", "warning"); return; }
    const current = {
      questionId: session[index].id,
      question: session[index].question,
      answer,
      concepts: session[index].concepts,
      score: submitted.score,
      aiEvaluation: submitted,
    };
    const all = [...answers, current];
    if (index === session.length - 1) {
      const evaluated = evaluateInterview(all);
      const aiStrengths = all.flatMap((item) => item.aiEvaluation?.strengths || []).filter(Boolean);
      const aiWeaknesses = all.flatMap((item) => item.aiEvaluation?.weaknesses || []).filter(Boolean);
      const finalResult = {
        ...evaluated,
        strengths: [...new Set(aiStrengths)].slice(0, 4).length ? [...new Set(aiStrengths)].slice(0, 4) : evaluated.strengths,
        weaknesses: [...new Set(aiWeaknesses)].slice(0, 4).length ? [...new Set(aiWeaknesses)].slice(0, 4) : evaluated.weaknesses,
      };
      const record = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        date: new Date().toISOString(),
        company: company.trim(),
        role: role.trim(),
        score: finalResult.score,
        strengths: finalResult.strengths,
        weaknesses: finalResult.weaknesses,
        aiPowered: aiUsed,
      };
      setResult(finalResult);
      onFinish(record);
      return;
    }
    setAnswers(all);
    setIndex((value) => value + 1);
    setAnswer("");
    setSubmitted(null);
  };

  if (setup) {
    return (
      <div className="mock-layout">
        <section className="hero-card mock-hero">
          <div>
            <span className="eyebrow">Gemini AI interview</span>
            <h2>Practice under real interview pressure.</h2>
            <p>Enter any company and role. Gemini creates a fresh, varied interview set and evaluates each answer. If AI is unavailable, PrepMate automatically falls back to its built-in question bank and scoring.</p>
          </div>
          <div className="hero-icon">◉</div>
        </section>
        <section className="panel">
          <div className="form-grid">
            <label className="field"><span>Company *</span><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google, Microsoft, Startup ABC" maxLength={100} /></label>
            <label className="field"><span>Role *</span><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" maxLength={120} /></label>
            <label className="field"><span>Difficulty</span><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option><option>All</option></select></label>
          </div>
          <div className="inline-alert info">Questions are generated from the company and role context, but are not claimed to be official company interview questions.</div>
          <button className="button button-primary button-wide" type="button" disabled={busy} onClick={start}>{busy ? "Creating AI Interview..." : "Start AI Mock Interview · 7 Questions"}</button>
        </section>
        {history.length > 0 && <History history={history} />}
      </div>
    );
  }

  if (result) {
    return (
      <div className="stack-xl">
        <section className="result-hero"><span className="eyebrow">Interview readiness</span><div className="readiness-score">{result.score}<small>/100</small></div><p>{aiUsed ? "Gemini-assisted interview evaluation" : "PrepMate rule-based interview evaluation"}</p></section>
        <div className="result-grid"><div className="stat-card"><strong>{result.answered}</strong><span>Questions Answered</span></div><div className="stat-card"><strong>{result.strongCount}</strong><span>Strong Answers</span></div><div className="stat-card"><strong>{result.weakCount}</strong><span>Needs Improvement</span></div></div>
        <div className="panel"><div className="two-col"><div><h3>Strengths</h3><ul className="clean-list">{result.strengths.map((x) => <li key={x}>✓ {x}</li>)}</ul></div><div><h3>Needs Improvement</h3><ul className="clean-list">{result.weaknesses.map((x) => <li key={x}>• {x}</li>)}</ul></div></div><div className="recommendation"><strong>Recommended Next Step</strong><p>Practice {result.weaknesses.slice(0, 2).join(" and ")} questions.</p></div><button className="button button-primary" type="button" onClick={() => { setSetup(true); setAnswers([]); setResult(null); }}>Start Another Interview</button></div>
      </div>
    );
  }

  const current = session[index];
  return (
    <div className="mock-layout">
      <div className="question-progress"><span>Question {index + 1} of {session.length}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${((index + 1) / session.length) * 100}%` }} /></div></div>
      <section className="panel interview-question">
        <div className="question-meta"><span className="tag tag-neutral">{company}</span><span className={`difficulty difficulty-${current.difficulty.toLowerCase()}`}>{current.difficulty}</span><span>{current.topic}</span></div>
        <h2>{current.question}</h2>
        <label className="field"><span>Your Answer</span><textarea rows="10" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Explain your approach clearly. Include examples and important concepts..." /></label>
        {submitted && <div className={`evaluation ${submitted.strong ? "good" : "needs-work"}`}><strong>{aiUsed ? "Gemini score" : "Rule-based score"}: {submitted.score}/100</strong><p>Matched concepts: {submitted.matched.length ? submitted.matched.join(", ") : "None yet"}</p>{submitted.feedback && <p>{submitted.feedback}</p>}</div>}
        <div className="form-actions"><button className="button button-primary" type="button" onClick={submit} disabled={Boolean(submitted) || busy}>{busy ? "Evaluating..." : "Submit Answer"}</button><button className="button button-secondary" type="button" onClick={next}>Next Question</button></div>
      </section>
    </div>
  );
}

function History({ history }) {
  return <section className="panel"><div className="section-heading"><div><span className="eyebrow">Previous attempts</span><h2>Mock interview history</h2></div></div><div className="history-list">{history.slice(0, 6).map((item) => <div className="history-row" key={item.id}><div><strong>{item.company}</strong><span>{item.role} · {new Date(item.date).toLocaleDateString()}</span></div><strong>{item.score}/100</strong></div>)}</div></section>;
}
