import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, ListChecks, Target } from 'lucide-react';
import useTrackerStore from '../store/useTrackerStore.js';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card.jsx';
import JournalCalendar from './common/JournalCalendar.jsx';

const WeeklyView = () => {
  const navigate = useNavigate();
  const { calendar, highlights } = useTrackerStore((state) => state.getWeeklySummary());
  const trackingData = useTrackerStore((state) => state.trackingData);

  const days = calendar.days ?? [];
  const completion = calendar.completion ?? 0;
  const successItems = highlights.highlights ?? [];
  const focusItems = highlights.focus ?? [];

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>This Week&apos;s Overview</CardTitle>
            <CardDescription>Your daily consistency at a glance.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{completion}% of the week tracked so far.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((day) => (
          <Card
            key={day.date}
            className={`border border-dashed transition-all ${day.isToday ? 'border-primary shadow-lg' : 'border-border'}`}
          >
            <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="text-sm font-medium text-muted-foreground">{day.label}</span>
              <span className="text-3xl font-semibold text-foreground">{day.dayOfMonth}</span>
              <span className="text-xl">{day.icons || '—'}</span>
              {day.isToday && <span className="text-xs font-semibold uppercase text-primary">Today</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-emerald-500" />
          <div>
            <CardTitle>What Went Well</CardTitle>
            <CardDescription>Celebrate the habits you&apos;re nailing.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {successItems.length > 0 ? successItems.map((item) => <p key={item}>{item}</p>) : <p>Track more to see your highlights!</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          <div>
            <CardTitle>Focus Areas</CardTitle>
            <CardDescription>Gentle nudges to keep you growing.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {focusItems.length > 0 ? focusItems.map((item) => <p key={item}>{item}</p>) : <p>You&apos;re doing great! Keep it up! 🎉</p>}
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>📔 Digital Journal Calendar</CardTitle>
          <CardDescription>Peek back at gratitude, notes, and media from any day this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <JournalCalendar trackingData={trackingData} id="weekly-journal-calendar" />
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyView;
