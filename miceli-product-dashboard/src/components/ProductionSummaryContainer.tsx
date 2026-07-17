import type { DailyProductionGtinSummary } from '../types';
import { ProductionSummaryList } from './ProductionSummaryList';
import './ProductionSummary.css';

interface ProductionSummaryContainerProps {
  summaryData: DailyProductionGtinSummary[];
  selectedDateIndex: number;
  availableDates: Date[];
  onDateChange: (index: number) => void;
  isIdle?: boolean;
}

export function ProductionSummaryContainer({ summaryData, selectedDateIndex, availableDates, onDateChange, isIdle = false }: ProductionSummaryContainerProps) {
  return (
    <div className="production-summary-container">
      <div className="tab-header" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {availableDates.map((date, index) => (
          <button
            key={index}
            className={`tab-button ${selectedDateIndex === index ? 'active' : ''}`}
            onClick={() => onDateChange(index)}
          >
            {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>
      <ProductionSummaryList summaryData={summaryData} isIdle={isIdle} />
    </div>
  );
}