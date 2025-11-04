// src/services/apiService.ts
import axios from 'axios';
import { HubConnectionBuilder } from '@microsoft/signalr';
import type { DailyProductionGtinSummary } from '../types';

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
    return response.data;
};

export const createSignalRConnection = () => {
    // Append the API key as a query string parameter to the URL.
    return new HubConnectionBuilder()
        .withUrl(`/dashboardHub?apiKey=${apiKey}`)
        .withAutomaticReconnect()
        .build();
};