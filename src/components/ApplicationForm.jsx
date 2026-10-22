import { useEffect, useRef, useState } from "react";
import { validateApplication } from "../utils/validation";

const initial = {
  company: "",
  role: "",
  interviewDate: "",
  preparationHours: "",
  experience: "Fresher",
  status: "Applied",
  jd: ""
};

export default function ApplicationForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData ? { ...initialData } : initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstInvalid = useRef(null);

  useEffect(() => {
    setForm(initialData ? { ...initialData } : initial);
    setErrors({});
  }, [initialData]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors = validateApplication(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const key = Object.keys(nextErrors)[0];
      firstInvalid.current?.querySelector(`[name="${key}"]`)?.focus();
      return;
    }

    setSaving(true);
    await Promise.resolve(onSave(form));
    setSaving(false);
  };

  return (
    <form className="form-card" onSubmit={submit} ref={firstInvalid} noValidate>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{initialData ? "Edit application" : "New application"}</span>
          <h2>{initialData ? "Update application" : "Add a job application"}</h2>
        </div>
        <p>Connect the role directly to your preparation plan.</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Company *</span>
          <input name="company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="e.g. Amazon" maxLength={100} />
          {errors.company && <small className="field-error">{errors.company}</small>}
        </label>
        <label className="field">
          <span>Job Role *</span>
          <input name="role" value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="e.g. Software Engineer" maxLength={120} />
          {errors.role && <small className="field-error">{errors.role}</small>}
        </label>
        <label className="field">
          <span>Interview Date *</span>
          <input name="interviewDate" type="date" value={form.interviewDate} onChange={(e) => update("interviewDate", e.target.value)} />
          {errors.interviewDate && <small className="field-error">{errors.interviewDate}</small>}
        </label>
        <label className="field">
          <span>Preparation Time (hours/day, max 24) *</span>
          <input name="preparationHours" type="number" min="0.5" max="24" step="0.5" value={form.preparationHours} onChange={(e) => update("preparationHours", e.target.value)} placeholder="e.g. 2" />
          {errors.preparationHours && <small className="field-error">{errors.preparationHours}</small>}
        </label>
        <label className="field">
          <span>Experience Level *</span>
          <select name="experience" value={form.experience} onChange={(e) => update("experience", e.target.value)}>
            <option>Fresher</option>
            <option>0–1 Years</option>
            <option>1–3 Years</option>
            <option>3+ Years</option>
          </select>
          {errors.experience && <small className="field-error">{errors.experience}</small>}
        </label>
        <label className="field">
          <span>Application Status *</span>
          <select name="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option>Applied</option>
            <option>Shortlisted</option>
            <option>Interview Scheduled</option>
            <option>Selected</option>
            <option>Rejected</option>
          </select>
          {errors.status && <small className="field-error">{errors.status}</small>}
        </label>
      </div>

      <label className="field">
        <span>Job Description *</span>
        <textarea name="jd" rows="8" maxLength={2000} value={form.jd} onChange={(e) => update("jd", e.target.value)} placeholder="Paste the job description, responsibilities, skills and requirements here..." />
        <div className="counter">{form.jd.length} / 2000 characters</div>
        {errors.jd && <small className="field-error">{errors.jd}</small>}
      </label>

      <div className="form-actions">
        {onCancel && <button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : initialData ? "Save Changes" : "Save Application"}
        </button>
      </div>
    </form>
  );
}