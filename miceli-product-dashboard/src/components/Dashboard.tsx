// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { createSignalRConnection, getDailySummaryByGtin, getHourlyProduction } from '../services/apiService';
import type { DailyProductionGtinSummary, Scan, HourlyProductionSummary } from '../types';
import { ProductionSummaryContainer } from './ProductionSummaryContainer';
import { HourlyProductionChart } from './HourlyProductionChart';

function getProductionDate(date: Date): string {
    // Formats date to 'yyMMdd'
    return date.toLocaleDateString('fr-CA').replace(/-/g, '').substring(2);
}

const Dashboard: React.FC = () => {
    const [todaysSummary, setTodaysSummary] = useState<DailyProductionGtinSummary[]>([]);
    const [yesterdaysSummary, setYesterdaysSummary] = useState<DailyProductionGtinSummary[]>([]);
    const [hourlyData, setHourlyData] = useState<HourlyProductionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateTodaysSummary = (newScan: Scan) => {
        if (!newScan.gtin) return;

        setTodaysSummary(prevSummary => {
            const summaryIndex = prevSummary.findIndex(s => s.gtin === newScan.gtin);
            const newSummary = [...prevSummary];

            if (summaryIndex > -1) {
                const item = newSummary[summaryIndex];
                newSummary[summaryIndex] = {
                    ...item,
                    totalCases: item.totalCases + 1,
                    totalPounds: item.totalPounds + newScan.netWeight,
                };
            } else {
                newSummary.push({
                    gtin: newScan.gtin,
                    totalCases: 1,
                    totalPounds: newScan.netWeight,
                    itemCode: "N/A", // Add placeholder
                    applicationDescription: "Unknown Item" // Add placeholder
                });
            }
            return newSummary.sort((a, b) => a.applicationDescription.localeCompare(b.applicationDescription));
        });
    };

    const updateHourlyData = (newScan: Scan) => {
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
                    totalPounds: hourData.totalPounds + newScan.netWeight,
                };
            } else {
                // First scan for this hour, add it
                newData.push({
                    hour: currentLocalHour,
                    totalCases: 1,
                    totalPounds: newScan.netWeight,
                });
            }
            return newData;
        });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const todaysDateStr = getProductionDate(today);

                const [todaySummary, yesterdaySummary, hourlyProd] = await Promise.all([
                    getDailySummaryByGtin(todaysDateStr),
                    getDailySummaryByGtin(getProductionDate(yesterday)),
                    getHourlyProduction(todaysDateStr)
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
                setHourlyData(localHourlyData); // Pass the converted data to state
                setError(null);
            } catch (err) {
                console.error("Failed to fetch daily summary:", err);
                setError("Failed to load data. Is the API running?");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const connection = createSignalRConnection((newScan: Scan) => {
            console.log("New scan received via SignalR:", newScan);
            updateTodaysSummary(newScan);
            updateHourlyData(newScan); // Add this call to update the chart
        });

        connection.start()
            .then(() => console.log('SignalR Connected.'))
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
            {/* We will add the activity feed here in the next steps */}
        </div>
    );
};

export default Dashboard;