import axios from 'axios';
import * as signalR from "@microsoft/signalr";
import type { DailyProductionGtinSummary, HourlyProductionSummary, Scan } from '../types';

const apiKey = "f1e2d3c4-b5a6-7b8c-9d0e-f1a2b3c4d5e6"; // <-- PLACE YOUR API KEY HERE

const api = axios.create({
    baseURL: '/api',
});

// Add a request interceptor to include the API key in every request
api.interceptors.request.use(config => {
    // Common header names for API keys are 'X-API-Key' or 'Authorization'
    // Please use the header name your API expects.
    config.headers['X-Api-Key'] = apiKey;
    return config;
}, error => {
    return Promise.reject(error);
});

// Correctly type the optional second argument
export const getDailySummaryByGtin = async (date: string, options?: { signal: AbortSignal }) => {
    const response = await api.get<DailyProductionGtinSummary[]>(`/dashboard/summary-by-gtin/${date}`, options);
    return response.data || [];
};

export const getHourlyProduction = async (productionDate: string): Promise<HourlyProductionSummary[]> => {
    const response = await api.get<HourlyProductionSummary[]>(`/dashboard/hourly-rate/${productionDate}`);
    return response.data || [];
};

export const createSignalRConnection = (onNewScan: (scan: Scan) => void) => {
    // Correct the Hub URL and add the apiKey to the query string
    const hubUrl = (import.meta.env.VITE_HUB_URL || "https://mdpc-app.mdpc.com/dashboardHub") + `?apiKey=${apiKey}`;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    // The server sends "ReceiveScanUpdate", so the client should listen for that
    connection.on("ReceiveScanUpdate", (scan) => {
        onNewScan(scan);
    });

    return connection;
};