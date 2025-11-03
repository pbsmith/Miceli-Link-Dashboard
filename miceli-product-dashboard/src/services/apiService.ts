// src/services/apiService.ts
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import type { DailyProductionGtinSummary, HourlyProductionSummary, Scan } from '../types';

const API_BASE_URL = 'https://localhost:7256';
const API_KEY = 'f1e2d3c4-b5a6-7b8c-9d0e-f1a2b3c4d5e6'; 

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
    }
});

export const getDailySummaryByGtin = async (date: string): Promise<DailyProductionGtinSummary[]> => {
    const response = await apiClient.get(`/api/dashboard/summary-by-gtin/${date}`);
    return response.data;
};

export const getHourlyRate = async (date: string): Promise<HourlyProductionSummary[]> => {
    const response = await apiClient.get(`/api/dashboard/hourly-rate/${date}`);
    return response.data;
};

// This function now creates and returns the connection, but does not start it.
export const createSignalRConnection = () => {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/dashboardHub`, {
            headers: { 'X-Api-Key': API_KEY }
        })
        .withAutomaticReconnect()
        .build();

    return connection;
};