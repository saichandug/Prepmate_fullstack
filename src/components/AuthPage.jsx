import { useState } from "react";
import { api } from "../utils/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type: "error" | "info", text }
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const switchMode = (next, info = null) => {
    setMode(next);
    setErrors({});
    setBanner(info ? { type: "info", text: info } : null);
    setForm((current) => ({ ...current, password: "", confirm: "" }));
  };

  const validate = () => {
    const next = {};
    if (isSignup && form.name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = isSignup ? "Choose a password." : "Enter your password.";
    else if (isSignup && form.password.length < 8) next.password = "Use at least 8 characters.";
    if (isSignup && form.confirm !== form.password) next.confirm = "Passwords don't match.";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBanner(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const payload = { email: form.email.trim(), password: form.password };
      const { user } = isSignup
        ? await api.signup({ ...payload, name: form.name.trim() })
        : await api.login(payload);
      onAuthenticated(user);
    } catch (error) {
      if (error.code === "ACCOUNT_NOT_FOUND") {
        switchMode("signup", "No account found for this email. Create one to get started.");
      } else if (error.code === "ACCOUNT_EXISTS") {
        switchMode("login", "An account with this email already exists. Sign in instead.");
      } else {
        if (error.fields) setErrors(error.fields);
        setBanner({ type: "error", text: error.message });
      }
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <strong>PrepMate</strong>
            <span>Job ready, faster.</span>
          </div>
        </div>
        <div className="auth-aside-copy">
          <h2>From job description to job ready.</h2>
          <p>Track every application, turn a job description into a study plan, and practise until the interview feels familiar.</p>
        </div>
        <ul className="auth-points">
          <li>Applications and progress saved to your account</li>
          <li>Roadmaps built from the roles you apply for</li>
          <li>Mock interviews with instant feedback</li>
        </ul>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? "active" : ""} onClick={() => switchMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button>
          </div>

          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="auth-lead">
            {isSignup ? "It takes a few seconds. Your data stays private to you." : "Sign in with your email and password to continue."}
          </p>

          {banner && <div className={`auth-banner auth-banner-${banner.type}`} role={banner.type === "error" ? "alert" : "status"}>{banner.text}</div>}

          {isSignup && (
            <label className="field">
              <span>Name</span>
              <input name="name" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={60} placeholder="Your full name" autoFocus />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={254} placeholder="you@example.com" autoFocus={!isSignup} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-wrap">
              <input name="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} value={form.password} onChange={(e) => update("password", e.target.value)} maxLength={128} placeholder={isSignup ? "At least 8 characters" : "Your password"} />
              <button type="button" className="text-button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          {isSignup && (
            <label className="field">
              <span>Confirm password</span>
              <input name="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} maxLength={128} placeholder="Repeat your password" />
              {errors.confirm && <small className="field-error">{errors.confirm}</small>}
            </label>
          )}

          <button className="button button-primary button-wide auth-submit" type="submit" disabled={busy}>
            {busy ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
          </button>

          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New to PrepMate?"}{" "}
            <button type="button" className="text-button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
