// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { getDailySummaryByGtin } from '../services/apiService';
import { createSignalRConnection } from '../services/apiService';
import type { DailyProductionGtinSummary, Scan } from '../types';

const Dashboard: React.FC = () => {
    const [dailySummary, setDailySummary] = useState<DailyProductionGtinSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const connection = createSignalRConnection();

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

        // Use an AbortController to clean up the fetch request if the component unmounts
        const abortController = new AbortController();
        fetchInitialData(abortController.signal);

        // Set up the handler for receiving SignalR messages
        connection.on("ReceiveScanUpdate", (newScan: Scan) => {
            console.log("New scan received:", newScan);
            // Logic to update summary state would go here
        });

        // Start the connection
        connection.start()
            .then(() => console.log("SignalR Connected."))
            .catch(err => {
                console.error("SignalR Connection Error: ", err);
                setError("Failed to connect to live updates.");
            });

        // This is the crucial cleanup function
        return () => {
            console.log("Cleaning up: stopping SignalR connection and aborting fetch.");
            abortController.abort(); // Abort the initial data fetch if it's still in progress
            connection.stop(); // Stop the SignalR connection
        };
    }, []); // The empty dependency array ensures this runs only on mount and unmount

    if (loading) return <div>Loading Dashboard...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Daily Production Summary</h1>
            {/* Your table and other UI elements go here */}
        </div>
    );
};

export default Dashboard;