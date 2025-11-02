import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Droplets, Smile, Brain, BookOpen, Bed, ArrowLeft, CalendarDays } from 'lucide-react';
import useTrackerStore from '../store/useTrackerStore.js';
import SleepChart from './charts/SleepChart.jsx';
import ActivityChart from './charts/ActivityChart.jsx';
import MetricsChart from './charts/MetricsChart.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Select } from './ui/select.jsx';
import { Badge } from './ui/badge.jsx';
import JournalCalendar from './common/JournalCalendar.jsx';

const analyticsCards = [
  { icon: Bed, label: 'Average Sleep', key: 'avgSleep' },
  { icon: TrendingUp, label: 'Exercise Frequency', key: 'exerciseFreq' },
  { icon: Droplets, label: 'Avg Water', key: 'avgWater' },
  { icon: Smile, label: 'Average Mood', key: 'avgMood' },
  { icon: Brain, label: 'Meditation Days', key: 'meditationDays' },
  { icon: BookOpen, label: 'Total Reading Time', key: 'readingTotal' }
];

const AnalyticsView = () => {
  const analyticsRange = useTrackerStore((state) => state.analyticsRange);
  const setAnalyticsRange = useTrackerStore((state) => state.setAnalyticsRange);
  const analyticsData = useTrackerStore((state) => state.getAnalyticsData());
  const analyticsFocus = useTrackerStore((state) => state.analyticsFocus);
  const setAnalyticsFocus = useTrackerStore((state) => state.setAnalyticsFocus);
  const trackingData = useTrackerStore((state) => state.trackingData);
  const navigate = useNavigate();

  useEffect(() => {
    if (!analyticsFocus || typeof document === 'undefined') return;
    const calendarElement = document.getElementById('analytics-journal-calendar');
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [analyticsFocus]);

  const focusMessages = {
    physical: {
      label: 'Physical Wellbeing',
      description: 'Review hydration, sleep, steps, and workout notes to spot momentum or dips.'
    },
    mental: {
      label: 'Mental Clarity',
      description: 'Check in on stress, screen time, and reading reflections to understand your headspace.'
    },
    emotional: {
      label: 'Emotional Balance',
      description: 'Look for gratitude, social sparks, and mood shifts noted on your calendar.'
    },
    spiritual: {
      label: 'Spiritual Grounding',
      description: 'Meditation minutes, reflective notes, and inspiring media live in your journal below.'
    }
  };
  const focusContent = analyticsFocus ? focusMessages[analyticsFocus] : null;

  const parseNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const stats = useMemo(() => {
    if (!analyticsData.length) {
      return {
        avgSleep: '0h',
        exerciseFreq: '0%',
        avgWater: '0',
        avgMood: '0.0',
        meditationDays: '0',
        readingTotal: '0m'
      };
    }

    let totalSleep = 0;
    let exerciseCount = 0;
    let totalWater = 0;
    let totalMood = 0;
    let meditationDays = 0;
    let totalReading = 0;

    analyticsData.forEach((entry) => {
      totalSleep += parseNumber(entry.sleep?.hours);
      if (entry.exercise?.completed) exerciseCount += 1;
      totalWater += parseNumber(entry.water);
      totalMood += parseNumber(entry.mood);
      if (parseNumber(entry.meditation) > 0) meditationDays += 1;
      totalReading += parseNumber(entry.reading);
    });

    const count = analyticsData.length;
    return {
      avgSleep: `${(totalSleep / count).toFixed(1)}h`,
      exerciseFreq: `${Math.round((exerciseCount / count) * 100)}%`,
        avgWater: Math.round(totalWater / count).toString(),
        avgMood: (totalMood / count || 0).toFixed(1),
      meditationDays: meditationDays.toString(),
      readingTotal: `${Math.round(totalReading)}m`
    };
  }, [analyticsData]);

  const mealTimeline = useMemo(() => {
    if (!analyticsData.length) return [];
    return analyticsData
      .map((entry) => {
        const meals = Array.isArray(entry.meals) ? entry.meals.filter(Boolean) : [];
        if (meals.length === 0) return null;
        let displayDate = entry.date;
        try {
          const parsed = new Date(`${entry.date}T00:00:00`);
          displayDate = parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } catch {
          // keep fallback formatted date string
        }
        return {
          date: entry.date,
          label: displayDate,
          meals
        };
      })
      .filter(Boolean);
  }, [analyticsData]);

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Progress Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Explore trends and insights based on your recent tracking data.
          </p>
          <Select
            id="dateRange"
            value={analyticsRange}
            onChange={(event) => setAnalyticsRange(event.target.value)}
            className="w-full max-w-xs"
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="all">All Time</option>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyticsCards.map(({ icon: Icon, label, key }) => (
          <Card key={key} className="bg-card/60">
            <CardContent className="flex items-center justify-between gap-4 py-6">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stats[key]}</p>
              </div>
              <Icon className="h-10 w-10 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg text-foreground">🗓️ Reflective Mini Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">Hover over tracked days to revisit your notes, gratitude, or media.</p>
            </div>
          </div>
          {focusContent && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{focusContent.label}</Badge>
              <Button variant="ghost" size="sm" type="button" onClick={() => setAnalyticsFocus(null)}>
                Clear focus
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {focusContent && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
              {focusContent.description}
            </p>
          )}
          <JournalCalendar trackingData={trackingData} id="analytics-journal-calendar" />
        </CardContent>
      </Card>

      <Card className="border-amber-200/40">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg text-foreground">🍽️ Meals Logged This Period</CardTitle>
          </div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {mealTimeline.length} day{mealTimeline.length === 1 ? '' : 's'} of meals captured
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mealTimeline.length === 0 ? (
            <p className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
              Log meals in Track Today to see your eating timeline here.
            </p>
          ) : (
            mealTimeline.map((day) => (
              <div
                key={day.date}
                className="space-y-3 rounded-2xl border border-muted/60 bg-muted/5 p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{day.label}</span>
                  <span className="text-xs font-medium text-muted-foreground">{day.meals.length} item(s)</span>
                </div>
                <div className="space-y-2">
                  {day.meals.map((meal, index) => {
                    const timeLabel = meal.time ? meal.time : '—';
                    const quantityLabel = meal.quantity
                      ? `${meal.quantity}${meal.unit ? ` ${meal.unit}` : ''}`
                      : '';
                    return (
                      <div
                        key={meal.id || `${day.date}-${index}`}
                        className="flex flex-col gap-1 rounded-xl border border-muted/40 bg-background/70 px-3 py-2 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                          <span className="font-semibold text-primary">{timeLabel}</span>
                          <span className="font-medium">
                            {meal.name || 'Untitled meal'}
                            {quantityLabel ? ` · ${quantityLabel}` : ''}
                          </span>
                        </div>
                        {meal.notes && <span className="text-xs text-muted-foreground sm:text-right">“{meal.notes}”</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">📈 Health Metrics Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <MetricsChart data={analyticsData} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Sleep Hours Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <SleepChart data={analyticsData} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Daily Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ActivityChart data={analyticsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsView;
