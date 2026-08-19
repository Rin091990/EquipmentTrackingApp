import StatusBadge from './StatusBadge';

function DetailsPanel({
  detailsRow,
  isAdmin,
  editingId,
  editForm,
  onEditChange,
  onClose,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onOpenHistory,
  onExportEmployee,
}) {
  if (!detailsRow) return null;

  const isDetailsEditing = editingId === detailsRow.id;
  const detailItems = [
    ['סטטוס', <StatusBadge status={detailsRow.status} />],
    ['מבנה', detailsRow.building],
    ['משרד', detailsRow.office],
    ['קטגוריה', detailsRow.category === 'computer' ? 'מחשב' : 'פלאפון'],
    ['יצרן', detailsRow.manufacturer],
    ['דגם', detailsRow.model],
    ['צבע', detailsRow.color],
    ['אחסון', detailsRow.storage],
    ['סיריאל', detailsRow.serial_number],
    ['אינוונטר', detailsRow.category === 'computer' ? detailsRow.inventory_serial : '-'],
    ['תאריך', detailsRow.created_at ? new Date(detailsRow.created_at).toLocaleDateString('he-IL') : '-'],
  ];

  return (
    <aside className="details-panel" aria-label="פרטי ציוד">
      <div className="details-panel-header">
        <div>
          <h3>פרטי ציוד</h3>
          <p>{detailsRow.name || '-'}</p>
        </div>
        <button
          type="button"
          className="details-panel-close"
          onClick={onClose}
          aria-label="סגור פרטי ציוד"
        >
          ×
        </button>
      </div>

      <dl className="details-list">
        {detailItems.map(([label, value]) => (
          <div className="details-item" key={label}>
            <dt>{label}</dt>
            <dd>{value || '-'}</dd>
          </div>
        ))}
      </dl>

      {isAdmin && isDetailsEditing && (
        <div className="details-edit-panel">
          <h4>עריכת פרטי שיוך</h4>
          <label htmlFor="edit-name">
            שם עובד
            <input
              id="edit-name"
              type="text"
              name="name"
              value={editForm.name}
              onChange={onEditChange}
            />
          </label>
          <label htmlFor="edit-email">
            דוא"ל
            <input
              id="edit-email"
              type="email"
              name="email"
              value={editForm.email}
              onChange={onEditChange}
            />
          </label>
          <label htmlFor="edit-building">
            מבנה
            <input
              id="edit-building"
              type="text"
              name="building"
              value={editForm.building}
              onChange={onEditChange}
            />
          </label>
          <label htmlFor="edit-office">
            משרד
            <input
              id="edit-office"
              type="text"
              name="office"
              value={editForm.office}
              onChange={onEditChange}
            />
          </label>
          <label htmlFor="edit-status">
            סטטוס
            <select id="edit-status" name="status" value={editForm.status} onChange={onEditChange}>
              <option value="active">פעיל</option>
              <option value="scrapped">נגרט</option>
            </select>
          </label>
        </div>
      )}

      <div className="details-panel-actions">
        {isAdmin && (
          <>
            {isDetailsEditing ? (
              <>
                <button type="button" className="btn btn-confirm" onClick={() => onSaveEdit(detailsRow.id)}>
                  אישור
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
                  ביטול
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-edit" onClick={() => onStartEdit(detailsRow)}>
                  עריכה
                </button>
                <button type="button" className="btn btn-delete" onClick={() => onDelete(detailsRow.id)}>
                  מחק
                </button>
              </>
            )}
          </>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => onOpenHistory(detailsRow)}>
          היסטוריה
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onExportEmployee(detailsRow)}
        >
          טופס ציוד לעובד
        </button>
      </div>
    </aside>
  );
}

export default DetailsPanel;
