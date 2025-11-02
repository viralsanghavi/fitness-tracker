import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Lightbulb, Target, Repeat } from 'lucide-react';
import useTrackerStore from '../store/useTrackerStore.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card.jsx';

const MotivationView = () => {
  const navigate = useNavigate();
  const quote = useTrackerStore((state) => state.quote);
  const goals = useTrackerStore((state) => state.goals);
  const achievements = useTrackerStore((state) => state.getAchievements());
  const { weeklyData } = useTrackerStore((state) => state.getWeeklySummary());
  const getInsights = useTrackerStore((state) => state.getInsights);
  const dashboardStats = useTrackerStore((state) => state.getDashboardStats());

  const insights = useMemo(() => getInsights(weeklyData), [getInsights, weeklyData]);

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card className="border-primary/40">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="max-w-2xl text-lg font-medium text-muted-foreground">{quote}</p>
          <span className="text-sm uppercase tracking-wide text-primary">Daily Motivation</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Achievements &amp; Streaks</CardTitle>
            <CardDescription>Celebrate milestones unlocked through your consistency.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <Badge key={achievement} variant="secondary" className="text-sm">
                {achievement}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Start tracking to unlock achievements! 🎯</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Personalised Insights</CardTitle>
            <CardDescription>Actionable feedback based on the last week of activity.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <p className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
              Track more days to see personalised insights! 📊
            </p>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-lg border p-4 text-sm shadow-sm ${
                  insight.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                    : insight.type === 'warning'
                    ? 'border-amber-200 bg-amber-50/70 text-amber-800'
                    : 'border-primary/20'
                }`}
              >
                <h4 className="text-base font-semibold">{insight.title}</h4>
                <p className="mt-1 text-sm">{insight.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>The Power of Habit</CardTitle>
            <CardDescription>Rituals, not willpower, make your progress feel effortless.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {dashboardStats.streak > 0
              ? `You’re riding a ${dashboardStats.streak}-day streak—keep anchoring your day with one tiny habit you can’t skip.`
              : 'Pick one tiny habit you can’t skip—maybe hydration or a two-minute stretch. Let it anchor your day.'}
          </p>
          <p>• Stack your new habit on an existing one, like reflecting right after brushing your teeth.</p>
          <p>• Celebrate the repeat, not the result—consistency compounds faster than intensity.</p>
          <p>• Use the daily highlights gallery to capture proof that the routine is becoming part of you.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Goal Suggestions</CardTitle>
            <CardDescription>Small objectives to keep you inspired every day.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {goals.map((goal) => (
            <p key={goal}>{goal}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MotivationView;
