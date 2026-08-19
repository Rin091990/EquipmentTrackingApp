import { accessoryTypeLabels } from '../constants';
import StatusMessage from './StatusMessage';

function AccessoryList({ items }) {
  if (items.length === 0) {
    return <StatusMessage>אין ציוד נלווה במשרד הזה.</StatusMessage>;
  }

  return (
    <div className="accessory-list">
      {items.map((item) => (
        <div className="accessory-item" key={item.id}>
          <div className="accessory-detail accessory-type">
            <span>סוג</span>
            <strong>{accessoryTypeLabels[item.type] || item.type}</strong>
          </div>

          <div className="accessory-detail">
            <span>יצרן</span>
            <strong>{item.manufacturer || '-'}</strong>
          </div>

          {item.type === 'printer' && (
            <div className="accessory-detail">
              <span>דגם</span>
              <strong>{item.model || '-'}</strong>
            </div>
          )}

          {item.type === 'monitor' && (
            <div className="accessory-detail">
              <span>גודל</span>
              <strong>{item.size ? `${item.size} אינץ׳` : '-'}</strong>
            </div>
          )}

          {(item.type === 'monitor' || item.type === 'dockingStation') && (
            <>
              <div className="accessory-detail">
                <span>סיריאל</span>
                <strong>{item.serial_number || '-'}</strong>
              </div>

              <div className="accessory-detail">
                <span>אינוונטר</span>
                <strong>{item.inventory_serial || '-'}</strong>
              </div>
            </>
          )}

          <div className="accessory-detail accessory-date">
            <span>תאריך</span>
            <strong>{new Date(item.created_at).toLocaleDateString('he-IL')}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AccessoryList;
