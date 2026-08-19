function PageHeader({ title, subtitle, backLabel, onBack, username, role, onLogout }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="user-panel">
        {onBack && (
          <button type="button" onClick={onBack} className="btn btn-secondary">
            {backLabel || 'חזרה'}
          </button>
        )}
        {username && <span>{username}</span>}
        {role && <strong>{role}</strong>}
        <button type="button" onClick={onLogout} className="btn btn-secondary">
          יציאה
        </button>
      </div>
    </header>
  );
}

export default PageHeader;
