import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';
import StatusMessage from './StatusMessage';
import StatusBadge from './StatusBadge';

function getHistoryDisplayRows(historyRows, historyItem) {
  const updatedRows = historyRows.map((row) => ({
    ...row,
    displayId: `${row.id}-updated`,
    rowType: 'updated',
  }));

  const oldestChange = historyRows[historyRows.length - 1];
  if (!oldestChange) return updatedRows;

  return [
    ...updatedRows,
    {
      ...oldestChange,
      displayId: `${oldestChange.id}-original`,
      name: oldestChange.previous_name || historyItem?.name,
      email: oldestChange.previous_email || historyItem?.email,
      building: oldestChange.previous_building || historyItem?.building,
      office: oldestChange.previous_office || historyItem?.office,
      category: oldestChange.previous_category || historyItem?.category,
      status: oldestChange.previous_status || historyItem?.status,
      manufacturer: oldestChange.previous_manufacturer || historyItem?.manufacturer,
      model: oldestChange.previous_model || historyItem?.model,
      color: oldestChange.previous_color || historyItem?.color,
      storage: oldestChange.previous_storage || historyItem?.storage,
      serial_number: oldestChange.previous_serial_number || oldestChange.serial_number,
      inventory_serial: oldestChange.previous_inventory_serial || oldestChange.inventory_serial,
      rowType: 'original',
    },
  ];
}

function ItemHistoryPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  historyItem,
  historyRows,
  historyLoading,
  onBack,
  onLogout,
}) {
  const displayRows = getHistoryDisplayRows(historyRows, historyItem);

  return (
    <div className="app-container">
      <GlobalFeedback notification={notification} onClose={onCloseNotification} />
      <DeleteConfirmDialog
        open={Boolean(deleteCandidateId)}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
      <PageHeader
        title="היסטוריית פריט"
        subtitle={
          <>
            סיריאל: {historyItem?.serial_number || '-'} | אינוונטר: {historyItem?.inventory_serial || '-'}
          </>
        }
        onBack={onBack}
        onLogout={onLogout}
      />

      <section className="table-section">
        <div className="table-header">
          <h2 aria-live="polite">שינויים בפריט ({historyRows.length})</h2>
        </div>

        {historyLoading ? (
          <StatusMessage>טוען היסטוריה...</StatusMessage>
        ) : historyRows.length === 0 ? (
          <StatusMessage>אין היסטוריה לפריט הזה עדיין.</StatusMessage>
        ) : (
          <div className="table-wrapper history-table-wrapper">
            <table className="history-table">
              <colgroup>
                <col className="history-date-col" />
                <col className="history-name-col" />
                <col className="history-email-col" />
                <col className="history-building-col" />
                <col className="history-office-col" />
                <col className="history-category-col" />
                <col className="history-status-col" />
                <col className="history-manufacturer-col" />
                <col className="history-model-col" />
                <col className="history-color-col" />
                <col className="history-storage-col" />
                <col className="history-serial-col" />
                <col className="history-inventory-col" />
                <col className="history-user-col" />
              </colgroup>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>שם עובד</th>
                  <th>דוא"ל</th>
                  <th>מבנה</th>
                  <th>משרד</th>
                  <th>קטגוריה</th>
                  <th>סטטוס</th>
                  <th>יצרן</th>
                  <th>דגם</th>
                  <th>צבע</th>
                  <th>אחסון</th>
                  <th>סיריאל</th>
                  <th>אינוונטר</th>
                  <th>בוצע ע"י</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.displayId}>
                    <td>{new Date(row.created_at).toLocaleString('he-IL')}</td>
                    <td className="history-name-cell">{row.name || historyItem?.name || '-'}</td>
                    <td className="history-email-cell" title={row.email || historyItem?.email || ''}>
                      <span className="email-cell-content">{row.email || historyItem?.email || '-'}</span>
                    </td>
                    <td>{row.building || historyItem?.building || '-'}</td>
                    <td>{row.office || historyItem?.office || '-'}</td>
                    <td>
                      {(row.category || historyItem?.category) === 'computer'
                        ? 'מחשב'
                        : (row.category || historyItem?.category) === 'phone'
                          ? 'פלאפון'
                          : '-'}
                    </td>
                    <td>
                      <StatusBadge status={row.status || historyItem?.status} />
                    </td>
                    <td>{row.manufacturer || historyItem?.manufacturer || '-'}</td>
                    <td>{row.model || historyItem?.model || '-'}</td>
                    <td>{row.color || historyItem?.color || '-'}</td>
                    <td>{row.storage || historyItem?.storage || '-'}</td>
                    <td>{row.serial_number || '-'}</td>
                    <td>{row.inventory_serial || '-'}</td>
                    <td>{row.changed_by || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ItemHistoryPage;
