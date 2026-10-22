export default function ProgressBar({ value = 0, label, showValue = true }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-wrap">
      {(label || showValue) && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && <strong>{safe}%</strong>}
        </div>
      )}
      <div className="progress-track" aria-label={`${safe}% complete`}>
        <div className="progress-fill" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}