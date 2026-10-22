import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Applications from "./components/Applications";
import JDAnalyzer from "./components/JDAnalyzer";
import PreparationRoadmap from "./components/PreparationRoadmap";
import CodingPractice from "./components/CodingPractice";
import MockInterview from "./components/MockInterview";
import DailyStreak from "./components/DailyStreak";
import Notification from "./components/Notification";
import LoadingState from "./components/LoadingState";
import { questions } from "./data/questions";
import { api } from "./utils/api";
import { buildState, pickProgress } from "./utils/state";
import { analyzeJD } from "./utils/jdAnalyzer";
import { generateRoadmap } from "./utils/roadmapGenerator";
import { recordActivity } from "./utils/streakManager";

const pageMeta = {
  dashboard: ["Dashboard", "A focused view of your applications and preparation."],
  applications: ["Applications", "Track roles, interviews and preparation progress."],
  preparation: ["JD Analyzer", "Extract relevant skills and turn them into a roadmap."],
  coding: ["Coding Practice", "Curated questions for coding and technical interviews."],
  mock: ["Mock Interview", "Practice one question at a time with rule-based evaluation."],
  streak: ["Daily Streak", "Build consistency through meaningful preparation."],
};

export default function Workspace({ user, onLogout }) {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [active, setActive] = useState(() => {
    try {
      const saved = sessionStorage.getItem("prepmate-active-section");
      return saved && pageMeta[saved] ? saved : "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    try {
      return window.innerWidth <= 820;
    } catch {
      return false;
    }
  });
  const [notification, setNotification] = useState(null);
  const lastSaved = useRef("");

  // Load this user's applications and progress from MongoDB.
  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    api.loadData()
      .then(({ applications, progress }) => {
        if (cancelled) return;
        const next = buildState(applications, progress);
        lastSaved.current = JSON.stringify(pickProgress(next));
        setState(next);
      })
      .catch((error) => {
        if (!cancelled && error.status !== 401) setLoadError(error.message);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Save progress (streaks, roadmap, mock history, etc.) a moment after it changes.
  const progressJson = state ? JSON.stringify(pickProgress(state)) : null;
  useEffect(() => {
    if (progressJson === null || progressJson === lastSaved.current) return;
    const timer = setTimeout(() => {
      api.saveProgress(JSON.parse(progressJson))
        .then(() => { lastSaved.current = progressJson; })
        .catch((error) => { if (error.status !== 401) setNotification({ message: `Could not save your progress: ${error.message}`, type: "error" }); });
    }, 700);
    return () => clearTimeout(timer);
  }, [progressJson]);

  // Send any pending change if the tab is closed or hidden before the timer fires.
  useEffect(() => {
    const flush = () => {
      if (progressJson === null || progressJson === lastSaved.current || document.visibilityState === "visible") return;
      api.saveProgress(JSON.parse(progressJson), { keepalive: true })
        .then(() => { lastSaved.current = progressJson; })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [progressJson]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  const notify = (message, type = "info") => setNotification({ message, type });

  const updateState = (updater) => setState((current) => typeof updater === "function" ? updater(current) : updater);

  // Returns true on success so the form only closes when the save really worked.
  const saveApplication = async (data, editing) => {
    try {
      const { application } = editing
        ? await api.updateApplication(data.id, data)
        : await api.createApplication(data);
      updateState((current) => ({
        ...current,
        applications: editing
          ? current.applications.map((item) => item.id === application.id ? application : item)
          : [...current.applications, application]
      }));
      notify(editing ? "Application updated." : "Application saved successfully.", "success");
      return true;
    } catch (error) {
      notify(error.message, error.code === "DUPLICATE" ? "warning" : "error");
      return false;
    }
  };

  const deleteApplication = async (id) => {
    try {
      await api.deleteApplication(id);
      updateState((current) => ({
        ...current,
        applications: current.applications.filter((item) => item.id !== id)
      }));
      notify("Application deleted.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const analyzeAndSave = (text, result) => {
    updateState((current) => ({ ...current, analyzer: { text, result } }));
  };

  const generateForSkills = (skills) => {
    const first = state.applications[0];
    const source = first || {
      company: "Your Target Company",
      role: "Software Engineer",
      experience: "Fresher",
      interviewDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      preparationHours: 2
    };
    const roadmap = generateRoadmap({ ...source, skills });
    updateState((current) => ({ ...current, roadmap }));
    setActive("preparation");
    notify("Personalized roadmap generated.", "success");
  };

  const getProgress = (appId) => {
    const app = state.applications.find((item) => item.id === appId);
    if (!app) return 0;
    const result = app.id === state.analyzer?.applicationId ? state.analyzer.result : (app.jd ? analyzeJD(app.jd) : null);
    const skillCount = result?.skills?.length || 0;
    const completed = Object.values(state.roadmapCompletion).filter(Boolean).length;
    return skillCount ? Math.min(100, Math.round((completed / Math.max(skillCount, 1)) * 100)) : 0;
  };

  const toggleRoadmap = (item) => {
    const wasDone = Boolean(state.roadmapCompletion[item.id]);
    updateState((current) => {
      const completion = { ...current.roadmapCompletion, [item.id]: !wasDone };
      const nextStreak = !wasDone ? recordActivity(current.streak, "roadmap") : current.streak;
      return { ...current, roadmapCompletion: completion, streak: nextStreak };
    });
    if (!wasDone) notify("Roadmap topic completed.", "success");
  };

  const completeCoding = (id) => {
    updateState((current) => ({
      ...current,
      codingCompletion: { ...current.codingCompletion, [id]: true },
      streak: recordActivity(current.streak, "coding")
    }));
  };

  const finishMock = (record) => {
    updateState((current) => ({
      ...current,
      mockHistory: [record, ...current.mockHistory],
      streak: recordActivity(current.streak, "mock")
    }));
    notify("Mock interview completed and saved.", "success");
  };

  const nav = (id) => {
    setActive(id);
    // On small screens the navigation drawer closes after selecting a section.
    // On desktop it remains open unless the hamburger is explicitly toggled.
    try {
      if (window.innerWidth <= 820) setSidebarHidden(true);
      sessionStorage.setItem("prepmate-active-section", id);
    } catch {}
  };

  if (!state) {
    return (
      <div className="boot-screen">
        {loadError ? (
          <div className="boot-card" role="alert">
            <h2>Could not load your workspace</h2>
            <p>{loadError}</p>
            <div className="boot-actions">
              <button className="button button-primary" type="button" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
              <button className="button button-secondary" type="button" onClick={onLogout}>Sign out</button>
            </div>
          </div>
        ) : <LoadingState message="Loading your workspace..." />}
      </div>
    );
  }

  const content = {
    dashboard: <Dashboard applications={state.applications} roadmap={state.roadmap} roadmapCompletion={state.roadmapCompletion} streak={state.streak} onNavigate={nav} getProgress={getProgress} />,
    applications: <Applications applications={state.applications} onSave={saveApplication} onDelete={deleteApplication} onAnalyze={(jd) => { setState((current) => ({ ...current, analyzer: { ...current.analyzer, text: jd, result: analyzeJD(jd) } })); setActive("preparation"); }} getProgress={getProgress} notify={notify} />,
    preparation: active === "preparation" && state.roadmap ? (
      <div className="stack-xl">
        <JDAnalyzer initialText={state.analyzer.text || state.applications[0]?.jd || ""} savedResult={state.analyzer.result} onResult={analyzeAndSave} onGenerateRoadmap={generateForSkills} notify={notify} />
        <PreparationRoadmap roadmap={state.roadmap} completion={state.roadmapCompletion} onToggle={toggleRoadmap} onStudyNext={() => notify("Start with the highest-priority topic above.", "info")} />
      </div>
    ) : <JDAnalyzer initialText={state.analyzer.text || state.applications[0]?.jd || ""} savedResult={state.analyzer.result} onResult={analyzeAndSave} onGenerateRoadmap={generateForSkills} notify={notify} />,
    coding: <CodingPractice questions={questions} completion={state.codingCompletion} onComplete={completeCoding} notify={notify} />,
    mock: <MockInterview questions={questions} history={state.mockHistory} onFinish={finishMock} notify={notify} />,
    streak: <DailyStreak streak={state.streak} onNavigate={nav} />,
  }[active];

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={nav}
        open={!sidebarHidden}
        onClose={() => setSidebarHidden(true)}
      />
      <div className="main-shell">
        <Header title={pageMeta[active][0]} subtitle={pageMeta[active][1]} sidebarOpen={!sidebarHidden} onMenu={() => setSidebarHidden((current) => !current)} user={user} onLogout={onLogout} />
        <main className="page-content">{content}</main>
      </div>
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}