import StatusMessage from './StatusMessage';
import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';

function LoginPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  loginForm,
  loginError,
  onLoginChange,
  onLoginSubmit,
}) {
  return (
    <div className="login-page">
      <GlobalFeedback notification={notification} onClose={onCloseNotification} />
      <DeleteConfirmDialog
        open={Boolean(deleteCandidateId)}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
      <section className="login-card">
        <h1>כניסה למערכת</h1>
        <p>ניהול ציוד עובדים במקום אחד</p>

        <form onSubmit={onLoginSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">שם משתמש:</label>
            <input
              id="login-username"
              type="text"
              name="username"
              value={loginForm.username}
              onChange={onLoginChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">סיסמה:</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={loginForm.password}
              onChange={onLoginChange}
              autoComplete="current-password"
              required
            />
          </div>

          {loginError && (
            <StatusMessage tone="error" assertive>
              {loginError}
            </StatusMessage>
          )}

          <button type="submit" className="btn btn-primary">
            התחבר
          </button>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
