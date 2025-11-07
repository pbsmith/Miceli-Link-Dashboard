import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { HourlyProductionSummary } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HourlyProductionChartProps {
  chartData: HourlyProductionSummary[];
}

// Helper to format hour from 24-hour format to 12-hour AM/PM
const formatHour = (hour: number) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export function HourlyProductionChart({ chartData }: HourlyProductionChartProps) {
  // Create a map for all 24 hours initialized to zero
  const hourlyMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0);
  }

  // Populate the map with data from the API, aggregating pounds for each hour
  if (Array.isArray(chartData)) {
    chartData.forEach(item => {
      const existingPounds = hourlyMap.get(item.hour) || 0;
      hourlyMap.set(item.hour, existingPounds + item.totalPounds);
    });
  }

  // Generate labels and data for all 24 hours
  const labels: string[] = [];
  const dataPoints: number[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = i;
    labels.push(formatHour(hour));
    dataPoints.push(hourlyMap.get(hour) || 0);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Pounds Produced',
        data: dataPoints,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Pounds Produced per Hour (Last 12 Hours)',
        font: {
          size: 18,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
            display: true,
            text: 'Total Pounds'
        }
      },
    },
  };

  return (
    <div style={{ height: '400px', backgroundColor: '#fff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
      <Bar options={options} data={data} />
    </div>
  );
}