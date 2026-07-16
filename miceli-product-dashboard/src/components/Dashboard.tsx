// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { createSignalRConnection, getDailySummaryByGtin, getHourlyProduction } from '../services/apiService';
import type { DailyProductionGtinSummary, HourlyProductionSummary, ScanUpdate } from '../types';
import { ProductionSummaryContainer } from './ProductionSummaryContainer';
import { HourlyProductionChart } from './HourlyProductionChart';

function getProductionDate(date: Date): string {
    // Formats date to 'yyMMdd'
    return date.toLocaleDateString('fr-CA').replace(/-/g, '').substring(2);
}

const Dashboard: React.FC = () => {
    // We will keep a circular buffer of 7 days
    const NUM_DAYS = 7;
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

    // Data for the entire week
    const [weekSummaryData, setWeekSummaryData] = useState<Record<number, DailyProductionGtinSummary[]>>({});
    const [weekHourlyData, setWeekHourlyData] = useState<Record<number, HourlyProductionSummary[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateTodaysSummary = (newScan: ScanUpdate) => {
        if (!newScan.gtin) return;
        const gtin = newScan.gtin;

        setWeekSummaryData(prev => {
            const todaySummary = prev[0] || [];
            const summaryIndex = todaySummary.findIndex(s => s.gtin === newScan.gtin);
            const newSummary = [...todaySummary];

            if (summaryIndex > -1) {
                // GTIN exists, update it
                const item = newSummary[summaryIndex];
                newSummary[summaryIndex] = {
                    ...item,
                    totalCases: item.totalCases + 1,
                    totalPounds: item.totalPounds + newScan.totalPounds,
                };
            } else {
                newSummary.push({
                    gtin: gtin,
                    totalCases: 1,
                    totalPounds: newScan.totalPounds,
                    itemCode: newScan.itemCode || "N/A",
                    applicationDescription: newScan.applicationDescription || "Unknown Item"
                });
            }
            newSummary.sort((a, b) => a.applicationDescription.localeCompare(b.applicationDescription));
            
            return {
                ...prev,
                0: newSummary
            };
        });
    };

    const updateHourlyData = (newScan: ScanUpdate) => {
        const currentLocalHour = new Date().getHours();
        setWeekHourlyData(prev => {
            const todayHourly = prev[0] || [];
            const newData = [...todayHourly];
            const hourIndex = newData.findIndex(d => d.hour === currentLocalHour);

            if (hourIndex > -1) {
                const hourData = newData[hourIndex];
                newData[hourIndex] = {
                    ...hourData,
                    totalCases: hourData.totalCases + 1,
                    totalPounds: hourData.totalPounds + newScan.totalPounds,
                };
            } else {
                newData.push({
                    hour: currentLocalHour,
                    totalCases: 1,
                    totalPounds: newScan.totalPounds,
                });
            }
            
            return {
                ...prev,
                0: newData
            };
        });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                
                // Build array of last 7 dates
                const dates: Date[] = [];
                for (let i = 0; i < NUM_DAYS; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dates.push(d);
                }
                setAvailableDates(dates);

                const getSummaryPromises = dates.map(d => getDailySummaryByGtin(getProductionDate(d)));
                const getHourlyPromises = dates.map(d => getHourlyProduction(getProductionDate(d)));

                const summariesResponses = await Promise.all(getSummaryPromises);
                const hourlyResponses = await Promise.all(getHourlyPromises);

                const newWeekSummary: Record<number, DailyProductionGtinSummary[]> = {};
                const newWeekHourly: Record<number, HourlyProductionSummary[]> = {};

                for (let i = 0; i < NUM_DAYS; i++) {
                    const d = dates[i];
                    const safeSummary = Array.isArray(summariesResponses[i]) ? summariesResponses[i] : [];
                    newWeekSummary[i] = safeSummary;

                    const hourlyProd = hourlyResponses[i];
                    const safeHourlyProd = Array.isArray(hourlyProd) ? hourlyProd : [];
                    
                    const localHourlyData = safeHourlyProd.map(item => {
                        const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
                        utcDate.setUTCHours(item.hour);
                        const localHour = utcDate.getHours();
                        return { ...item, hour: localHour };
                    });
                    newWeekHourly[i] = localHourlyData;
                }

                setWeekSummaryData(newWeekSummary);
                setWeekHourlyData(newWeekHourly);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Connection-Error");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const connection = createSignalRConnection(
            (newScan: ScanUpdate) => {
                updateTodaysSummary(newScan);
                updateHourlyData(newScan);
            }
        );

        connection.start()
            .catch(err => console.error('SignalR Connection Error: ', err));

        // Cleanup on component unmount
        return () => {
            connection.stop();
        };
    }, []);

    // Idle rotation effect
    useEffect(() => {
        const checkIdleAndRotate = setInterval(() => {
            const now = Date.now();
            const timeSinceLastInteraction = now - lastInteractionTime;
            const twoMinutes = 2 * 60 * 1000;
            
            // If the user has been idle for exactly/more than 2 minutes
            if (timeSinceLastInteraction >= twoMinutes) {
                // Rotate to the next date index
                setSelectedDateIndex(prevIndex => (prevIndex + 1) % NUM_DAYS);
                // Reset the interaction timer so it waits another 2 minutes before rotating again
                setLastInteractionTime(Date.now());
            }
        }, 1000); // check roughly every second

        return () => clearInterval(checkIdleAndRotate);
    }, [lastInteractionTime, NUM_DAYS]);

    // Update interaction time on user mouse or keyboard activity
    useEffect(() => {
        const handleInteraction = () => setLastInteractionTime(Date.now());

        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    if (loading) return <div>Loading dashboard...</div>;
    
    if (error === "Connection-Error") {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: '#f8f9fa',
                color: '#343a40',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{
                    padding: '2.5rem',
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    maxWidth: '32rem'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '4rem', height: '4rem', margin: '0 auto 1.5rem' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Connection Unsuccessful</h2>
                    <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        The dashboard is currently unable to communicate with the Miceli Link API. This may be due to a server restart or network latency.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.375rem',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }
    
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="dashboard-container">
            <h1>Production Dashboard</h1>
            <div className="dashboard-grid">
                <ProductionSummaryContainer 
                    summaryData={weekSummaryData[selectedDateIndex] || []} 
                    selectedDateIndex={selectedDateIndex}
                    availableDates={availableDates}
                    onDateChange={(index) => {
                        setSelectedDateIndex(index);
                        setLastInteractionTime(Date.now());
                    }} 
                />
                <HourlyProductionChart 
                    chartData={weekHourlyData[selectedDateIndex] || []} 
                    chartTitle={`Pounds Produced per Hour - ${selectedDateIndex === 0 ? 'Today' : selectedDateIndex === 1 ? 'Yesterday' : availableDates[selectedDateIndex]?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`}
                />
            </div>
        </div>
    );
};

export default Dashboard;