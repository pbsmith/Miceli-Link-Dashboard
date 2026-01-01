import type { StationStatus } from '../types';
import { StationRow } from './StationRow';
import './StationStatus.css';

interface StationStatusListProps {
  stations: StationStatus[];
}

export function StationStatusList({ stations }: StationStatusListProps) {
  return (
    <div className="status-list-wrapper">
      <div className="status-list-header">
        <h2 className="status-list-title">Station Monitor</h2>
      </div>
      <div className="status-table-container">
        <div className="status-table">
          {/* Header */}
          <div className="status-table-header">
            <span>Station ID</span>
            <span>Status</span>
            <span>IP Address</span>
            <span className="text-right">Last Seen</span>
          </div>
          {/* Body */}
          <div className="status-table-body">
            {stations.length === 0 ? (
              <div className="no-data-message">
                No stations are currently being monitored.
              </div>
            ) : (
              stations
                .sort((a, b) => a.stationId.localeCompare(b.stationId))
                .map((station) => (
                  <StationRow key={station.stationId} station={station} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}