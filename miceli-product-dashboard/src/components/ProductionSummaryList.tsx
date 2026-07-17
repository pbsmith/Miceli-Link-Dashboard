import { useEffect, useRef } from 'react';
import type { DailyProductionGtinSummary } from '../types';
import './ProductionSummary.css';

interface ProductionSummaryListProps {
  summaryData: DailyProductionGtinSummary[];
  isIdle?: boolean;
}

export function ProductionSummaryList({ summaryData, isIdle = false }: ProductionSummaryListProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Auto-scroll to the top when data changes or when date tab switches
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [summaryData]);

  // Handle the automatic smooth scrolling when idle
  useEffect(() => {
    // Cleanup any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Only engage autoscroll if the user has been idle
    if (isIdle && bodyRef.current) {
      const el = bodyRef.current;
      
      // Let's set up a subtle smooth scrolling interval (runs frequently to look smooth)
      scrollIntervalRef.current = window.setInterval(() => {
        // If we hit the bottom, instantly jump back to the top to start over
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          el.scrollTop = 0;
        } else {
          // Slowly trickle downwards
          el.scrollTop += 1;
        }
      }, 50); // Speed: scrolls 1 pixel every 50ms
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isIdle, summaryData]);

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