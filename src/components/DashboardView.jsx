import { useNavigate } from 'react-router-dom';
import { Flame, LineChart, CalendarDays, Sparkles, Target } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import useTrackerStore from '../store/useTrackerStore.js';
import WellnessPieChart from './charts/WellnessPieChart.jsx';

const DashboardView = () => {
  const stats = useTrackerStore((state) => state.getDashboardStats());
  const wellnessScores = useTrackerStore((state) => state.getWellnessBreakdown());
  const personalBenchmarks = useTrackerStore((state) => state.getPersonalBenchmarks());
  const setAnalyticsFocus = useTrackerStore((state) => state.setAnalyticsFocus);
  const navigate = useNavigate();

  const handleNavigateToAnalytics = (focusKey) => {
    setAnalyticsFocus(focusKey);
    navigate('/analytics');
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Day Streak</CardTitle>
            <Flame className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.streak}</div>
            <p className="mt-1 text-sm text-muted-foreground">Keep the momentum going!</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/40 to-secondary/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Week Completion</CardTitle>
            <LineChart className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.weekCompletion}%</div>
            <p className="mt-1 text-sm text-muted-foreground">Progress for the current week</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/40 to-accent/10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Days Tracked</CardTitle>
            <CalendarDays className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDays}</div>
            <p className="mt-1 text-sm text-muted-foreground">Each day adds to your story</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/track')}>📝 Track Today</Button>
        <Button variant="secondary" onClick={() => navigate('/analytics')}>
          📈 View Analytics
        </Button>
        <Button variant="secondary" onClick={() => navigate('/motivation')}>
          💪 Motivational Insights
        </Button>
        <Button variant="secondary" onClick={() => navigate('/meals')}>
          🍽️ Meal Journal
        </Button>
        <Button variant="secondary" onClick={() => navigate('/weekly')}>
          📆 Weekly Summary
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr),minmax(0,5fr)]">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Holistic Wellness Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hover or tap a segment to jump into deeper analytics and explore your reflective calendar.
            </p>
            <WellnessPieChart data={wellnessScores} onSliceSelect={handleNavigateToAnalytics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Start by tracking today&apos;s activities.</p>
            <p>• Consistency beats perfection every time.</p>
            <p>• Dive into analytics to understand your patterns.</p>
            <p>• Your data is a reflection of your growth.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-secondary/40">
        <CardHeader className="flex items-center gap-2">
          <Target className="h-5 w-5 text-secondary-foreground" />
          <CardTitle className="text-lg">Adaptive Personal Benchmarks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {personalBenchmarks.map((benchmark) => {
            const progress = (() => {
              if (benchmark.status === 'warning') {
                if (!benchmark.current || !benchmark.target) return 0;
                return Math.min(100, Math.round(((benchmark.target ?? 0) / (benchmark.current || 1)) * 100));
              }
              return benchmark.target > 0
                ? Math.min(100, Math.round(((benchmark.current ?? 0) / benchmark.target) * 100))
                : 0;
            })();
            const statusTone =
              benchmark.status === 'celebrate'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                : benchmark.status === 'warning'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100'
                : 'bg-primary/10 text-primary';
            const statusLabel = {
              celebrate: 'Crushing it',
              onTrack: 'On track',
              upNext: 'Up next',
              warning: 'Tune in'
            }[benchmark.status] ?? 'Check-in';

            return (
              <div
                key={benchmark.id}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/20 bg-background/70 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-[0_20px_60px_-24px_hsla(var(--primary),0.55)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{benchmark.label}</p>
                    <p className="text-base font-bold text-foreground">
                      {benchmark.current}
                      <span className="text-xs font-medium text-muted-foreground"> / {benchmark.target} {benchmark.unit}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone}`}>{statusLabel}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full animate-progress-glow rounded-full bg-gradient-to-r from-primary via-secondary-foreground to-primary/70"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{benchmark.message}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardView;
