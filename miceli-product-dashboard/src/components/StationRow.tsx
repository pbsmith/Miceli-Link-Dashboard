import type { StationStatus } from '../types';
import { useTimeAgo } from '../hooks/useTimeAgo';

interface StationRowProps {
  station: StationStatus;
}

export function StationRow({ station }: StationRowProps) {
  const timeAgo = useTimeAgo(station.lastSeen);

  return (
    <div className="status-table-row">
      <span>{station.stationId}</span>
      <td>
        <span className={`status-badge status-${station.currentStatus ? station.currentStatus.toLowerCase() : 'unknown'}`}>
          {station.currentStatus || 'Unknown'}
        </span>
      </td>
      <span>{station.ipAddress || 'N/A'}</span>
      <span className="text-right font-mono">
        {timeAgo}
      </span>
    </div>
  );
}