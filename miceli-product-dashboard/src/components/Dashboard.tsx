// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { createSignalRConnection, getDailySummaryByGtin, getHourlyProduction, getStationStatuses } from '../services/apiService';
import type { DailyProductionGtinSummary, HourlyProductionSummary, ScanUpdate, StationStatus, StationDiagnostics } from '../types';
import { ProductionSummaryContainer } from './ProductionSummaryContainer';
import { HourlyProductionChart } from './HourlyProductionChart';
import { StationStatusList } from './StationStatusList';

function getProductionDate(date: Date): string {
    // Formats date to 'yyMMdd'
    return date.toLocaleDateString('fr-CA').replace(/-/g, '').substring(2);
}

const Dashboard: React.FC = () => {
    const [todaysSummary, setTodaysSummary] = useState<DailyProductionGtinSummary[]>([]);
    const [yesterdaysSummary, setYesterdaysSummary] = useState<DailyProductionGtinSummary[]>([]);
    const [hourlyData, setHourlyData] = useState<HourlyProductionSummary[]>([]);
    const [stationStatuses, setStationStatuses] = useState<StationStatus[]>([]);
    const [stationDiagnostics, setStationDiagnostics] = useState<{ [key: string]: StationDiagnostics }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateTodaysSummary = (newScan: ScanUpdate) => {
        if (!newScan.gtin) return;

        const gtin = newScan.gtin;

        setTodaysSummary(prevSummary => {
            const summaryIndex = prevSummary.findIndex(s => s.gtin === newScan.gtin);
            const newSummary = [...prevSummary];

            if (summaryIndex > -1) {
                // GTIN exists, update it
                const item = newSummary[summaryIndex];
                newSummary[summaryIndex] = {
                    ...item,
                    totalCases: item.totalCases + 1,
                    // Use totalPounds from the new scan object, not netWeight
                    totalPounds: item.totalPounds + newScan.totalPounds,
                };
            } else {
                // New GTIN, add it
                newSummary.push({
                    gtin: gtin,
                    totalCases: 1,
                    // Use totalPounds from the new scan object, not netWeight
                    totalPounds: newScan.totalPounds,
                    itemCode: newScan.itemCode || "N/A",
                    applicationDescription: newScan.applicationDescription || "Unknown Item"
                });
            }
            // Sort the list any time it's updated
            return newSummary.sort((a, b) => a.applicationDescription.localeCompare(b.applicationDescription));
        });
    };

    const updateHourlyData = (newScan: ScanUpdate) => {
        const currentLocalHour = new Date().getHours();
        setHourlyData(prevData => {
            const newData = [...prevData];
            const hourIndex = newData.findIndex(d => d.hour === currentLocalHour);

            if (hourIndex > -1) {
                // Hour exists, update it
                const hourData = newData[hourIndex];
                newData[hourIndex] = {
                    ...hourData,
                    totalCases: hourData.totalCases + 1,
                    // Use totalPounds from the new scan object, not netWeight
                    totalPounds: hourData.totalPounds + newScan.totalPounds,
                };
            } else {
                // First scan for this hour, add it
                newData.push({
                    hour: currentLocalHour,
                    totalCases: 1,
                    // Use totalPounds from the new scan object, not netWeight
                    totalPounds: newScan.totalPounds,
                });
            }
            return newData;
        });
    };

    const updateStationStatus = (statusUpdate: StationStatus) => {
        setStationStatuses(prevStatuses => {
            const newStatuses = [...prevStatuses];
            const stationIndex = newStatuses.findIndex(s => s.stationId === statusUpdate.stationId);

            if (stationIndex > -1) {
                // Update existing station
                newStatuses[stationIndex] = statusUpdate;
            } else {
                // Add new station
                newStatuses.push(statusUpdate);
            }
            return newStatuses;
        });
    };

    const updateStationDiagnostics = (stationId: string, diagInfo: StationDiagnostics) => {
        setStationDiagnostics(prev => ({
            ...prev,
            [stationId]: diagInfo
        }));
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const todaysDateStr = getProductionDate(today);

                const [todaySummary, yesterdaySummary, hourlyProd, stations] = await Promise.all([
                    getDailySummaryByGtin(todaysDateStr),
                    getDailySummaryByGtin(getProductionDate(yesterday)),
                    getHourlyProduction(todaysDateStr),
                    getStationStatuses()
                ]);

                // Convert UTC hour from API to client's local hour
                const localHourlyData = hourlyProd.map(item => {
                    // Create a date object for today in UTC, then set the hour from the API data
                    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                    utcDate.setUTCHours(item.hour);

                    // getHours() automatically converts the UTC date to the browser's local time zone
                    const localHour = utcDate.getHours();

                    return { ...item, hour: localHour };
                });

                setTodaysSummary(todaySummary);
                setYesterdaysSummary(yesterdaySummary);
                setHourlyData(localHourlyData);
                setStationStatuses(stations);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Failed to load data. Is the API running?");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const connection = createSignalRConnection(
            (newScan: ScanUpdate) => {
                updateTodaysSummary(newScan);
                updateHourlyData(newScan);
            },
            (statusUpdate: StationStatus) => {
                updateStationStatus(statusUpdate);
            },
            (stationId: string, diagInfo: StationDiagnostics) => {
                updateStationDiagnostics(stationId, diagInfo);
            }
        );

        connection.start()
            .catch(err => console.error('SignalR Connection Error: ', err));

        // Cleanup on component unmount
        return () => {
            connection.stop();
        };
    }, []);

    if (loading) return <div>Loading dashboard...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="dashboard-container">
            <h1>Production Dashboard</h1>
            <div className="dashboard-grid">
                <ProductionSummaryContainer todaysData={todaysSummary} yesterdaysData={yesterdaysSummary} />
                <HourlyProductionChart chartData={hourlyData} />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
                <StationStatusList stations={stationStatuses} diagnostics={stationDiagnostics} />
            </div>
        </div>
    );
};

export default Dashboard;