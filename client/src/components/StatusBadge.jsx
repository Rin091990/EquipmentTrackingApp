import { equipmentStatusLabels } from '../constants';

function StatusBadge({ status }) {
  const normalizedStatus = status === 'scrapped' ? 'scrapped' : 'active';

  return (
    <span className={`status-badge status-badge-${normalizedStatus}`}>
      {equipmentStatusLabels[normalizedStatus]}
    </span>
  );
}

export default StatusBadge;
