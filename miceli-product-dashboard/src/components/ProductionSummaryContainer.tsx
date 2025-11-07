import { useState } from 'react';
import type { DailyProductionGtinSummary } from '../types';
import { ProductionSummaryList } from './ProductionSummaryList';
import './ProductionSummary.css';

interface ProductionSummaryContainerProps {
  todaysData: DailyProductionGtinSummary[];
  yesterdaysData: DailyProductionGtinSummary[];
}

type Tab = 'today' | 'yesterday';

export function ProductionSummaryContainer({ todaysData, yesterdaysData }: ProductionSummaryContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  const summaryData = activeTab === 'today' ? todaysData : yesterdaysData;

  return (
    <div className="production-summary-container">
      <div className="tab-header">
        <button
          className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button
          className={`tab-button ${activeTab === 'yesterday' ? 'active' : ''}`}
          onClick={() => setActiveTab('yesterday')}
        >
          Yesterday
        </button>
      </div>
      <ProductionSummaryList summaryData={summaryData} />
    </div>
  );
}