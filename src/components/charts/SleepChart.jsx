import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const SleepChart = ({ data = [] }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!data.length) return undefined;

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Sleep Hours',
            data: data.map((d) => d.sleep?.hours ?? 0),
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 12
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  if (!data.length) {
    return (
      <p className="rounded-md border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
        Track more days to see your sleep trend. 😴
      </p>
    );
  }

  return (
    <div className="relative h-[320px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SleepChart;
