// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { getDailySummaryByGtin } from '../services/apiService';
import { createSignalRConnection } from '../services/apiService';
// Remove 'Scan' from this import
import type { DailyProductionGtinSummary } from '../types';

const Dashboard: React.FC = () => {
    const [dailySummary, setDailySummary] = useState<DailyProductionGtinSummary[]>([]);
    const [yesterdaySummary, setYesterdaySummary] = useState<DailyProductionGtinSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [yesterdayLoading, setYesterdayLoading] = useState(false);
    const [yesterdayError, setYesterdayError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('today');

    useEffect(() => {
        const connection = createSignalRConnection();
        const abortController = new AbortController();

        const fetchInitialData = async (abortSignal: AbortSignal) => {
            try {
                const today = new Date().toLocaleDateString('fr-CA').replace(/-/g, '').substring(2);
                const summary = await getDailySummaryByGtin(today, { signal: abortSignal });
                setDailySummary(summary);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error("Failed to fetch daily summary:", err);
                    setError("Failed to load initial data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData(abortController.signal);

        // Remove the old "ReceiveScanUpdate" handler and replace it with the new one.
        connection.on("UpdateDailyGtinSummary", (updatedSummary: DailyProductionGtinSummary[]) => {
            console.log("Received updated daily GTIN summary:", updatedSummary);
            // Simply replace the old summary with the new one from the server.
            setDailySummary(updatedSummary);
        });

        // The server also sends hourly updates. For now, let's just log them.
        // We can build a new component to display this data later if you wish.
        connection.on("UpdateHourlyProduction", (hourlySummary: any[]) => {
            console.log("Received updated hourly production:", hourlySummary);
        });

        connection.start()
            .then(() => console.log("SignalR Connected."))
            .catch(err => {
                console.error("SignalR Connection Error: ", err);
                setError("Failed to connect to live updates.");
            });

        return () => {
            abortController.abort();
            connection.stop();
        };
    }, []);

    const fetchYesterdayData = async () => {
        if (yesterdaySummary.length > 0) return; // Don't refetch if we already have the data

        setYesterdayLoading(true);
        setYesterdayError(null);
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateString = yesterday.toLocaleDateString('fr-CA').replace(/-/g, '').substring(2);
            const summary = await getDailySummaryByGtin(dateString);
            setYesterdaySummary(summary);
        } catch (err) {
            console.error("Failed to fetch yesterday's summary:", err);
            setYesterdayError("Failed to load yesterday's data.");
        } finally {
            setYesterdayLoading(false);
        }
    };

    const handleTabClick = (tab: 'today' | 'yesterday') => {
        setActiveTab(tab);
        if (tab === 'yesterday') {
            fetchYesterdayData();
        }
    };

    const renderSummary = (data: DailyProductionGtinSummary[], isLoading: boolean, error: string | null, emptyMessage: string) => {
        if (isLoading) return <div>Loading...</div>;
        if (error) return <div>Error: {error}</div>;
        if (data.length === 0) return <p>{emptyMessage}</p>;

        return (
            <div className="summary-list">
                <div className="summary-header">
                    <span>GTIN</span>
                    <span>Total Cases</span>
                    <span>Total Pounds</span>
                </div>
                {data.map((item, index) => (
                    <div key={index} className="summary-row">
                        <span>{item.gtin}</span>
                        <span>{item.totalCases}</span>
                        <span>{item.totalPounds}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <h1>Daily Production Summary</h1>
            <div className="tabs">
                <button onClick={() => handleTabClick('today')} className={activeTab === 'today' ? 'active' : ''}>
                    Today
                </button>
                <button onClick={() => handleTabClick('yesterday')} className={activeTab === 'yesterday' ? 'active' : ''}>
                    Yesterday
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'today' ?
                    renderSummary(dailySummary, loading, error, "No production data available for today.") :
                    renderSummary(yesterdaySummary, yesterdayLoading, yesterdayError, "No production data available for yesterday.")
                }
            </div>
        </div>
    );
};

export default Dashboard;