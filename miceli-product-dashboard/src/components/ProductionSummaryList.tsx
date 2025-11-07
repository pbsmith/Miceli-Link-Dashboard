import { useEffect, useRef } from 'react';
import type { DailyProductionGtinSummary } from '../types';
import './ProductionSummary.css';

interface ProductionSummaryListProps {
  summaryData: DailyProductionGtinSummary[];
}

export function ProductionSummaryList({ summaryData }: ProductionSummaryListProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom when data changes
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [summaryData]);

  return (
    <div className="summary-list-wrapper">
      <div className="summary-table-container">
        <div className="summary-table">
          {/* Header */}
          <div className="summary-table-header">
            <span>Product</span>
            <span>Units</span>
            <span className="text-right">Total Pounds</span>
          </div>
          
          {/* Body */}
          <div className="summary-table-body" ref={bodyRef}>
            {summaryData.length === 0 ? (
              <div className="no-data-message">
                No production data for this day.
              </div>
            ) : (
              summaryData
                .sort((a, b) => a.applicationDescription.localeCompare(b.applicationDescription))
                .map((item) => (
                  <div className="summary-table-row" key={item.gtin}>
                    <span className="truncate" title={item.applicationDescription}>{item.applicationDescription}</span>
                    <span>{item.totalCases}</span>
                    <span className="text-right font-mono">{item.totalPounds.toFixed(2)}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}