import {memo, useMemo, useCallback} from 'react';
import {shallow} from 'zustand/shallow';
import useTrackerStore from '../../store/useTrackerStore.js';
import {Button} from '../ui/button.jsx';

const QUICK_METRIC_SUGGESTIONS = {
  water: [4, 8, 12],
  steps: [5000, 8000, 10000],
  caffeine: [0, 2, 4],
  screenTime: [3, 5, 7],
};

const formatUpdatedLabel = (isoString) => {
  if (!isoString) return 'Not logged yet';
  const updatedDate = new Date(isoString);
  if (Number.isNaN(updatedDate.getTime())) return 'Not logged yet';
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();
  if (diffMs < 60000) return 'Just now';
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return updatedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const QuickMetricsBoard = () => {
  const {metrics, quickMetricUpdatedAt} = useTrackerStore(
    (state) => ({
      metrics: {
        water: state.formData.water ?? 0,
        steps: state.formData.steps ?? 0,
        caffeine: state.formData.caffeine ?? 0,
        screenTime: state.formData.screenTime ?? 0,
      },
      quickMetricUpdatedAt: state.formData.quickMetricUpdatedAt ?? {},
    }),
    shallow
  );
  const stepField = useTrackerStore((state) => state.stepField);
  const updateFormField = useTrackerStore((state) => state.updateFormField);

  const screenWarning = metrics.screenTime > 6
    ? 'Consider taking breaks to reduce screen time today.'
    : '';

  const handleSetValue = useCallback(
    (field, value) => {
      updateFormField(field, value);
    },
    [updateFormField]
  );

  const cards = useMemo(
    () => [
      {
        key: 'water',
        label: 'Hydration',
        hint: 'Target 8 cups',
        icon: '💧',
        value: metrics.water,
        min: 0,
        max: 15,
        step: 1,
        gradient:
          'linear-gradient(145deg, rgba(56,189,248,0.95) 0%, rgba(59,130,246,0.9) 100%)',
        unit: 'cups',
        formatValue: (value) => value,
      },
      {
        key: 'steps',
        label: 'Steps',
        hint: 'Aim for 8k+',
        icon: '🦶',
        value: metrics.steps,
        min: 0,
        max: 50000,
        step: 500,
        gradient:
          'linear-gradient(145deg, rgba(251,191,36,0.92) 0%, rgba(248,113,113,0.9) 100%)',
        unit: 'steps',
        formatValue: (value) => Number(value).toLocaleString('en-US'),
      },
      {
        key: 'caffeine',
        label: 'Caffeine',
        hint: 'Keep it steady',
        icon: '☕',
        value: metrics.caffeine,
        min: 0,
        max: 10,
        step: 1,
        gradient:
          'linear-gradient(145deg, rgba(248,113,113,0.92) 0%, rgba(139,92,246,0.9) 100%)',
        unit: 'cups',
        formatValue: (value) => value,
      },
      {
        key: 'screenTime',
        label: 'Screen Time',
        hint: 'Balance breaks',
        icon: '📱',
        value: metrics.screenTime,
        min: 0,
        max: 16,
        step: 0.5,
        gradient:
          'linear-gradient(145deg, rgba(129,140,248,0.95) 0%, rgba(244,114,182,0.9) 100%)',
        unit: 'hrs',
        formatValue: (value) => {
          const formatted = Number(value).toFixed(1);
          return formatted.endsWith('.0') ? Number(value).toFixed(0) : formatted;
        },
      },
    ],
    [metrics]
  );

  return (
    <>
      <section aria-label="Quick metrics" className="wallet-pass-stack">
        {cards.map((metric) => (
          <article
            key={metric.key}
            className="wallet-pass quick-metric-card"
            style={{backgroundImage: metric.gradient}}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                  {metric.icon} {metric.label}
                </span>
                <p className="text-sm font-medium text-white/80">{metric.hint}</p>
              </div>
              <span className="quick-metric-value">
                {metric.formatValue(metric.value)}
                <span>{metric.unit}</span>
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  type="button"
                  variant="secondary"
                  className="quick-action-button"
                  onClick={() => stepField(metric.key, -metric.step, metric.min, metric.max)}
                >
                  −
                </Button>
                <Button
                  size="icon"
                  type="button"
                  variant="secondary"
                  className="quick-action-button"
                  onClick={() => stepField(metric.key, metric.step, metric.min, metric.max)}
                >
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_METRIC_SUGGESTIONS[metric.key]?.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="quick-chip"
                    onClick={() => handleSetValue(metric.key, suggestion)}
                  >
                    {suggestion} {metric.unit}
                  </button>
                ))}
              </div>
              <p className="quick-metric-updated">
                {formatUpdatedLabel(quickMetricUpdatedAt[metric.key])}
              </p>
            </div>
          </article>
        ))}
      </section>
      {screenWarning ? (
        <p className="text-sm font-medium text-amber-600 dark:text-amber-300">{screenWarning}</p>
      ) : null}
    </>
  );
};

export default memo(QuickMetricsBoard);
