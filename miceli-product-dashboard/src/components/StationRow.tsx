import type { StationStatus, StationDiagnostics } from '../types';
import { useTimeAgo } from '../hooks/useTimeAgo';

interface StationRowProps {
  station: StationStatus;
  diagnostics: StationDiagnostics | undefined;
}

const formatUptime = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined) return 'N/A';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

export function StationRow({ station, diagnostics }: StationRowProps) {
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
      <span className="text-right font-mono">{formatUptime(diagnostics?.uptime_seconds)}</span>
      <span className="text-right font-mono">{diagnostics ? `${diagnostics.cpu_usage_percent.toFixed(1)}%` : 'N/A'}</span>
      <span className="text-right font-mono">{diagnostics ? `${diagnostics.memory_usage_mb.toFixed(1)}MB` : 'N/A'}</span>
      <span className="text-right font-mono">{diagnostics?.scans_since_boot ?? 'N/A'}</span>
      <span className="text-right font-mono">
        {timeAgo}
      </span>
    </div>
  );
}