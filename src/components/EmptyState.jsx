export default function EmptyState({ icon = "◌", title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && <button className="button button-primary" type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}