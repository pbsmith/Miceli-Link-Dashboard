export enum CaseStatus {
    Staged,
    Released,
    OnHold,
}

export interface Scan {
    id: number;
    gtin: string | null;
    itemCode: string | null;
    serialNumber: string;
    productionDate: string; // Assuming YYYY-MM-DD format
    scanTimestamp: string; // ISO 8601 date string
    stationId: string;
    status: CaseStatus;
    netWeight: number;
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
    totalCases: number;
    totalPounds: number;
}

export interface HourlyProductionSummary {
    hour: number;
    totalCases: number;
}