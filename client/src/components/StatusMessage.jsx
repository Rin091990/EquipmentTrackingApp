function StatusMessage({ children, tone = 'info', assertive = false }) {
  return (
    <p
      className={`status-message status-message-${tone}`}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
    >
      {children}
    </p>
  );
}

export default StatusMessage;
