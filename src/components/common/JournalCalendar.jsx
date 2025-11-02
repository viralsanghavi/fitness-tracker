import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Quote, Volume2 } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { formatDate } from '../../utils/tracking.js';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const mediaIconMap = {
  image: <ImageIcon className="h-4 w-4 text-primary" />,
  quote: <Quote className="h-4 w-4 text-primary" />,
  audio: <Volume2 className="h-4 w-4 text-primary" />,
  video: <Volume2 className="h-4 w-4 text-primary" />
};

const JournalCalendar = ({ trackingData = {}, id }) => {
  const todayKey = formatDate(new Date());
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => (trackingData[todayKey] ? todayKey : null));
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    if (selectedDate && trackingData[selectedDate]) {
      return;
    }
    if (trackingData[todayKey]) {
      setSelectedDate(todayKey);
    }
  }, [trackingData, selectedDate, todayKey]);

  const monthLabel = useMemo(
    () => viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [viewDate]
  );

  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();

    const result = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      result.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push(new Date(year, month, day));
    }
    while (result.length % 7 !== 0) {
      result.push(null);
    }
    return result;
  }, [viewDate]);

  const previewKey = hoveredDate ?? selectedDate;
  const previewEntry = previewKey ? trackingData[previewKey] : null;

  const renderMediaPreview = (entry) => {
    if (!entry?.mediaEntries?.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Saved Highlights</p>
        <div className="space-y-1.5">
          {entry.mediaEntries.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-0.5">{mediaIconMap[item.type] ?? mediaIconMap.audio}</span>
              <div className="space-y-1">
                <p className="font-medium capitalize text-muted-foreground">{item.type}</p>
                <p>{item.caption || item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewEntry) {
      return (
        <p className="text-sm text-muted-foreground">
          Hover or tap on any highlighted day to reveal your notes, gratitude, or media snippets.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {previewEntry.notes && (
          <div className="rounded-lg border border-muted/60 bg-muted/10 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Journal Note</p>
            <p className="mt-1 text-foreground">{previewEntry.notes}</p>
          </div>
        )}
        {previewEntry.gratitude && (
          <div className="rounded-lg border border-muted/60 bg-muted/10 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gratitude</p>
            <p className="mt-1 text-foreground">{previewEntry.gratitude}</p>
          </div>
        )}
        {renderMediaPreview(previewEntry)}
        {!previewEntry.notes && !previewEntry.gratitude && !previewEntry.mediaEntries?.length && (
          <p className="text-sm text-muted-foreground">No journal notes saved for this day yet.</p>
        )}
      </div>
    );
  };

  return (
    <div id={id} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Next month"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {dayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-14 rounded-lg border border-dashed border-muted/40" />;
          }

          const key = formatDate(date);
          const hasEntry = Boolean(trackingData[key]);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setHoveredDate(key)}
              onMouseLeave={() => setHoveredDate(null)}
              onFocus={() => setHoveredDate(key)}
              onBlur={() => setHoveredDate(null)}
              onClick={() => setSelectedDate(key)}
              className={`flex h-14 flex-col items-center justify-center rounded-lg border text-sm transition ${
                hasEntry
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-muted/40 bg-muted/5 text-muted-foreground'
              } ${isSelected ? 'ring-2 ring-primary' : ''} ${isToday ? 'font-semibold text-primary' : ''}`}
            >
              <span>{date.getDate()}</span>
              {hasEntry && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-muted/60 bg-background/90 p-4 shadow-sm">{renderPreview()}</div>
    </div>
  );
};

export default JournalCalendar;
