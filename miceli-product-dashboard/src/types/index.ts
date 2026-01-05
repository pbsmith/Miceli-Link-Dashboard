export interface Scan {
    id: number;
    gtin: string | null;
    itemCode: string | null;
    serialNumber: string;
    productionDate: string; // Assuming YYYY-MM-DD format
    scanTimestamp: string; // ISO 8601 date string
    stationId: string;
    netWeight: number;
}

// ...existing code...
export interface Scan {
  gtin: string | null;
  netWeight: number;
}

// Type for the object received from SignalR for new scans
export interface ScanUpdate {
  gtin: string;
  itemCode: string;
  applicationDescription: string;
  totalCases: number;
  totalPounds: number;
}

// Type for the station status objects
export interface StationStatus {
  stationId: string;
  currentStatus: string;
  ipAddress: string | null;
  lastSeen: string;
}

// Type for the station diagnostics object
export interface StationDiagnostics {
  uptime_seconds: number;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  scans_since_boot: number;
}

export interface StringCheeseScan extends Scan {
    lotCode: string | null;
}

export interface BlockCheeseScan extends Scan {
    lotCode: string;
    numberOfPieces: number;
}

export interface DailyProductionGtinSummary {
    gtin: string | null;
    itemCode: string;
    applicationDescription: string;
    totalCases: number;
    totalPounds: number;
}

export interface HourlyProductionSummary {
    hour: number;
    totalCases: number;
    totalPounds: number;
}