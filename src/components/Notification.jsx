export default function Notification({ notification, onClose }) {
  if (!notification) return null;
  return (
    <div className={`notification notification-${notification.type || "info"}`} role="status">
      <span>{notification.type === "success" ? "✓" : notification.type === "error" ? "!" : "i"}</span>
      <p>{notification.message}</p>
      <button type="button" className="icon-button" onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
}