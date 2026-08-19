import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';
import StatusMessage from './StatusMessage';
import BulkActions from './BulkActions';
import EquipmentTable from './EquipmentTable';
import DetailsPanel from './DetailsPanel';
import AccessoryForm from './AccessoryForm';
import AccessoryList from './AccessoryList';

function OfficeDetailsPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  selectedBuilding,
  selectedOffice,
  onBack,
  onLogout,
  selectedRowIds,
  onExportSelected,
  onClearSelectedRows,
  loading,
  rows,
  isAdmin,
  onToggleRow,
  onOpenOfficeDetails,
  detailsRow,
  onSelectDetails,
  detailsPanelProps,
  sortMode,
  onSortToggle,
  accessories,
  accessoryForm,
  onAccessoryChange,
  onAccessorySubmit,
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
        title={`משרד ${selectedOffice}`}
        subtitle={selectedBuilding ? `ציוד במבנה ${selectedBuilding}` : 'ציוד לפי משרד'}
        onBack={onBack}
        onLogout={onLogout}
      />

      <section className="table-section building-details-section">
        <div className="table-header">
          <h2 aria-live="polite">
            הציוד במשרד {selectedOffice} ({rows.length})
          </h2>
        </div>
        <BulkActions selectedRowIds={selectedRowIds} onExport={onExportSelected} onClear={onClearSelectedRows} />

        {loading ? (
          <StatusMessage>טוען נתונים...</StatusMessage>
        ) : rows.length === 0 ? (
          <StatusMessage>אין ציוד במשרד הזה.</StatusMessage>
        ) : (
          <EquipmentTable
            rows={rows}
            isAdmin={isAdmin}
            selectedRowIds={selectedRowIds}
            onToggleRow={onToggleRow}
            onOpenOfficeDetails={onOpenOfficeDetails}
            detailsRow={detailsRow}
            onSelectDetails={onSelectDetails}
            sortMode={sortMode}
            onSortToggle={onSortToggle}
          />
        )}
        <DetailsPanel detailsRow={detailsRow} isAdmin={isAdmin} {...detailsPanelProps} />
      </section>

      <section className="table-section accessory-section">
        <div className="table-header">
          <h2 aria-live="polite">
            ציוד נלווה במשרד {selectedOffice} ({accessories.length})
          </h2>
        </div>

        {isAdmin && (
          <AccessoryForm accessoryForm={accessoryForm} onChange={onAccessoryChange} onSubmit={onAccessorySubmit} />
        )}

        <AccessoryList items={accessories} />
      </section>
    </div>
  );
}

export default OfficeDetailsPage;
