import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';
import StatusMessage from './StatusMessage';

function BuildingsPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  onBack,
  onLogout,
  loading,
  buildings,
  onSelectBuilding,
}) {
  return (
    <div className="app-container">
      <GlobalFeedback notification={notification} onClose={onCloseNotification} />
      <DeleteConfirmDialog
        open={Boolean(deleteCandidateId)}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
      <PageHeader title="מבנים" subtitle="ניהול מבנים" onBack={onBack} onLogout={onLogout} />

      <section className="placeholder-section">
        <h2>מבנים</h2>
        {loading ? (
          <StatusMessage>טוען מבנים...</StatusMessage>
        ) : buildings.length === 0 ? (
          <StatusMessage>אין מבנים עדיין.</StatusMessage>
        ) : (
          <div className="buildings-grid">
            {buildings.map((building) => (
              <button
                type="button"
                className="building-button"
                key={building}
                onClick={() => onSelectBuilding(building)}
              >
                {building}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="placeholder-section legacy-placeholder">
        <h2>מבנים</h2>
        <p>כאן נוסיף את ניהול המבנים בהמשך.</p>
      </section>
    </div>
  );
}

export default BuildingsPage;
