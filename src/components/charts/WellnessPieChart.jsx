import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const getCssColor = (variable, alpha = 1) => {
  if (typeof window === 'undefined') return `hsl(220 10% 40% / ${alpha})`;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  if (!raw) return `hsl(220 10% 40% / ${alpha})`;

  if (raw.includes('/')) {
    const [value] = raw.split('/');
    return `hsl(${value.trim()} / ${alpha})`;
  }

  return `hsl(${raw} / ${alpha})`;
};

const labels = ['Physical', 'Mental', 'Emotional', 'Spiritual'];

const WellnessPieChart = ({ data, onSliceSelect }) => {
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

    const totals = labels.map((label) => data?.[label.toLowerCase()] ?? 0);
    const totalSum = totals.reduce((sum, value) => sum + value, 0);

    if (totalSum === 0) return undefined;

    const colorPalette = ['--primary', '--secondary-foreground', '--accent-foreground', '--ring'].map((variable) => ({
      solid: getCssColor(variable, 1),
      fill: getCssColor(variable, 0.55)
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: totals,
            backgroundColor: colorPalette.map((color) => color.fill),
            borderColor: colorPalette.map((color) => color.solid),
            hoverOffset: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${Math.round(context.parsed)}%`
            }
          }
        },
        onClick: (_, elements) => {
          if (!elements?.length) return;
          const sliceIndex = elements[0].index;
          const key = labels[sliceIndex].toLowerCase();
          if (onSliceSelect) {
            onSliceSelect(key);
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
  }, [data, themeKey, onSliceSelect]);

  const totals = labels.map((label) => data?.[label.toLowerCase()] ?? 0);
  const totalSum = totals.reduce((sum, value) => sum + value, 0);

  if (totalSum === 0) {
    return (
      <p className="rounded-md border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
        Track a few days to see your holistic wellbeing snapshot.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,220px]">
      <div className="relative h-[260px] lg:h-[280px]">
        <canvas ref={canvasRef} />
      </div>
      <div className="space-y-3">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onSliceSelect?.(label.toLowerCase())}
            className="flex w-full items-center justify-between rounded-lg border border-transparent bg-muted/50 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/10"
          >
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-sm font-semibold text-muted-foreground">
              {Math.round(data?.[label.toLowerCase()] ?? 0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WellnessPieChart;
