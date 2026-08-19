import StatusMessage from './StatusMessage';

function GlobalFeedback({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="global-feedback">
      <StatusMessage tone={notification.tone} assertive={notification.tone === 'error'}>
        {notification.message}
      </StatusMessage>
      <button type="button" className="feedback-close" onClick={onClose} aria-label="סגור הודעה">
        ×
      </button>
    </div>
  );
}

export default GlobalFeedback;
