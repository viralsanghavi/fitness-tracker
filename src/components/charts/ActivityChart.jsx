import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ActivityChart = ({ data = [] }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!data.length) return undefined;

    const exerciseCount = data.filter((d) => d.exercise?.completed).length;
    const meditationCount = data.filter((d) => (d.meditation ?? 0) > 0).length;
    const readingCount = data.filter((d) => (d.reading ?? 0) > 0).length;
    const socialCount = data.filter((d) => d.social?.connected).length;

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: ['Exercise', 'Meditation', 'Reading', 'Social'],
        datasets: [
          {
            label: 'Days Completed',
            data: [exerciseCount, meditationCount, readingCount, socialCount],
            backgroundColor: ['#4A90E2', '#9B59B6', '#E67E22', '#27AE60']
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
            beginAtZero: true
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
        Complete some activities to unlock this chart. 💪
      </p>
    );
  }

  return (
    <div className="relative h-[320px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ActivityChart;
