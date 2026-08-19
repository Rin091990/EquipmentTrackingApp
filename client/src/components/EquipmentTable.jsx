function isInteractiveTarget(target) {
  return Boolean(target.closest('button, input, select, a, textarea, label'));
}

function EquipmentTable({
  rows,
  isAdmin,
  selectedRowIds,
  onToggleRow,
  onOpenOfficeDetails,
  detailsRow,
  onSelectDetails,
  buildingFallback = '-',
  sortMode,
  onSortToggle,
}) {
  const openDetailsPanel = (row, event) => {
    if (event && isInteractiveTarget(event.target)) return;
    onSelectDetails(row);
  };

  const renderSortableHeader = (label, mode) => (
    <button
      type="button"
      className={`sortable-header ${sortMode === mode ? 'active' : ''}`}
      onClick={() => onSortToggle(mode)}
    >
      {label}
    </button>
  );

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {isAdmin && <th scope="col" className="select-column"></th>}
            <th scope="col">{renderSortableHeader('שם עובד', 'name')}</th>
            <th scope="col">דוא"ל</th>
            <th scope="col">{renderSortableHeader('מבנה', 'building')}</th>
            <th scope="col">משרד</th>
            <th scope="col">תאריך</th>
            <th scope="col" className="details-action-column">פרטים</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`data-row ${detailsRow?.id === row.id ? 'data-row-selected' : ''}`}
              onClick={(event) => openDetailsPanel(row, event)}
            >
              {isAdmin && (
                <td className="select-column">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.includes(row.id)}
                    onChange={() => onToggleRow(row.id)}
                    className="row-action-checkbox"
                    aria-label="בחר רשומה"
                  />
                </td>
              )}
              <td className="name-cell" title={row.name || ''}>
                {row.name || '-'}
              </td>
              <td className="email-cell" title={row.email || ''}>
                <span className="email-cell-content">{row.email || '-'}</span>
              </td>
              <td>{row.building || buildingFallback}</td>
              <td>
                {row.office ? (
                  <button
                    type="button"
                    className="office-link-button"
                    onClick={() => onOpenOfficeDetails(row)}
                  >
                    {row.office}
                  </button>
                ) : (
                  '-'
                )}
              </td>
              <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
              <td className="details-action-cell">
                <button
                  type="button"
                  className="details-row-button"
                  onClick={() => onSelectDetails(row)}
                  aria-label={`הצג פרטים עבור ${row.name || 'רשומה'}`}
                >
                  פרטים
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentTable;
