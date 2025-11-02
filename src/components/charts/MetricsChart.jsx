import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const getCssColor = (variable) => {
  if (typeof window === 'undefined') return '#000000';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `hsl(${value})` : '#000000';
};

const MetricsChart = ({ data = [] }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [themeKey, setThemeKey] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const observer = new MutationObserver(() => {
      setThemeKey(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!data.length) return undefined;

    const labels = data.map((entry) => new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const waterSeries = data.map((entry) => entry.water ?? 0);
    const moodSeries = data.map((entry) => entry.mood ?? 0);
    const productivitySeries = data.map((entry) => entry.productivity ?? 0);

    const primary = getCssColor('--primary');
    const secondary = getCssColor('--secondary-foreground');
    const accent = getCssColor('--accent-foreground');

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Water (glasses)',
            data: waterSeries,
            borderColor: primary,
            backgroundColor: `${primary}33`,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Mood (1-10)',
            data: moodSeries,
            borderColor: secondary,
            backgroundColor: `${secondary}33`,
            tension: 0.4,
            fill: false,
            yAxisID: 'y1'
          },
          {
            label: 'Productivity (1-10)',
            data: productivitySeries,
            borderColor: accent,
            backgroundColor: `${accent}33`,
            tension: 0.4,
            fill: false,
            borderDash: [6, 6],
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: getCssColor('--muted-foreground')
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: getCssColor('--muted')
            },
            ticks: {
              color: getCssColor('--muted-foreground')
            }
          },
          y: {
            position: 'left',
            beginAtZero: true,
            suggestedMax: 12,
            grid: {
              color: getCssColor('--muted')
            },
            ticks: {
              color: getCssColor('--muted-foreground')
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            suggestedMax: 10,
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: getCssColor('--muted-foreground')
            }
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
  }, [data, themeKey]);

  if (!data.length) {
    return (
      <p className="rounded-md border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
        Track more days to visualise your health metrics. 🌟
      </p>
    );
  }

  return (
    <div className="relative h-[320px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default MetricsChart;
