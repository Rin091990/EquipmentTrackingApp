import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';

function MenuPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  username,
  role,
  onLogout,
  onSelectSection,
}) {
  return (
    <div className="app-container">
      <GlobalFeedback notification={notification} onClose={onCloseNotification} />
      <DeleteConfirmDialog
        open={Boolean(deleteCandidateId)}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
      <PageHeader
        title="מרכז עבודה"
        subtitle="בחר את האזור שבו תרצה לעבוד"
        username={username}
        role={role}
        onLogout={onLogout}
      />

      <section className="section-menu">
        <button type="button" className="section-button" onClick={() => onSelectSection('newEquipment')}>
          ציוד חדש
        </button>
        <button type="button" className="section-button" onClick={() => onSelectSection('buildings')}>
          מבנים
        </button>
        <button type="button" className="section-button" onClick={() => onSelectSection('general')}>
          כללי
        </button>
      </section>
    </div>
  );
}

export default MenuPage;
