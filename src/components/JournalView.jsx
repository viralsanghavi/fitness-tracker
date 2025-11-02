import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import useTrackerStore from '../store/useTrackerStore.js';
import {Button} from './ui/button.jsx';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card.jsx';
import {Textarea} from './ui/textarea.jsx';
import {Input} from './ui/input.jsx';
import {Badge} from './ui/badge.jsx';
import {formatDate} from '../utils/tracking.js';

const MOOD_OPTIONS = [
  {value: 'peaceful', label: 'Peaceful', icon: '😊'},
  {value: 'joyful', label: 'Joyful', icon: '😄'},
  {value: 'reflective', label: 'Reflective', icon: '🤔'},
  {value: 'grateful', label: 'Grateful', icon: '🙏'},
  {value: 'energetic', label: 'Energetic', icon: '⚡'},
  {value: 'calm', label: 'Calm', icon: '🧘'},
];

const JOURNAL_QUOTES = [
  {
    text: 'In the midst of movement and chaos, keep stillness inside of you.',
    author: 'Deepak Chopra',
  },
  {
    text: 'Your journal is a bridge between who you are and who you are becoming.',
    author: 'Unknown',
  },
  {
    text: 'Writing in a journal each day allows you to direct your focus to what you accomplished, what you are grateful for and what you are committed to doing better tomorrow.',
    author: 'Hal Elrod',
  },
  {
    text: 'The more light you allow within you, the brighter the world you live in will be.',
    author: 'Shakti Gawain',
  },
];

const getDisplayDate = (createdAt) => {
  if (!createdAt) return 'Just now';
  const date =
    typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const JournalView = () => {
  const addJournalEntry = useTrackerStore((state) => state.addJournalEntry);
  const journalEntries = useTrackerStore((state) => state.journalEntries);
  const journalLoading = useTrackerStore((state) => state.journalLoading);
  const [selectedMood, setSelectedMood] = useState(null);
  const [entryText, setEntryText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const quote = useMemo(
    () => JOURNAL_QUOTES[Math.floor(Math.random() * JOURNAL_QUOTES.length)],
    []
  );

  const weeklyMood = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const moodByDate = new Map();
    journalEntries.forEach((entry) => {
      const createdAt = entry.createdAt;
      if (!createdAt) return;
      const date =
        typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = formatDate(date);
      if (!moodByDate.has(key)) {
        moodByDate.set(key, {
          icon: entry.moodIcon || '',
          label: entry.moodLabel || '',
        });
      }
    });

    return Array.from({length: 7}).map((_, index) => {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const key = formatDate(current);
      const weekday = current.toLocaleDateString('en-US', {weekday: 'short'});
      const moodForDay = moodByDate.get(key);
      return {
        day: weekday,
        icon: moodForDay?.icon || '—',
        label: moodForDay?.label || 'No entry',
      };
    });
  }, [journalEntries]);

  const recentEntries = useMemo(
    () => journalEntries.slice(0, 3),
    [journalEntries]
  );

  const handleSave = async () => {
    setError('');
    if (!selectedMood) {
      setError('Pick a mood to anchor your reflection.');
      return;
    }
    if (!entryText.trim()) {
      setError('Let a few thoughts flow before saving.');
      return;
    }
    setSaving(true);
    const success = await addJournalEntry({
      mood: selectedMood.value,
      moodLabel: selectedMood.label,
      moodIcon: selectedMood.icon,
      content: entryText,
      tags: tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSaving(false);
    if (success) {
      setEntryText('');
      setTagsInput('');
      setSelectedMood(null);
    }
  };

  const handleClear = () => {
    setEntryText('');
    setTagsInput('');
    setSelectedMood(null);
    setError('');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-muted/60 bg-card/70 p-10 text-center shadow-soft backdrop-blur">
        <h1 className="text-4xl font-semibold text-foreground">Your Personal Sanctuary</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A peaceful space to reflect, grow, and cherish your journey.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <blockquote className="rounded-2xl border border-muted/60 bg-muted/20 p-6 text-left shadow-sm">
            <p className="text-lg italic text-muted-foreground">&quot;{quote.text}&quot;</p>
            <span className="mt-3 block text-sm text-muted-foreground">— {quote.author}</span>
          </blockquote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Today&apos;s Entry</CardTitle>
          <CardDescription>Capture how you feel and what is on your mind.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">How are you feeling?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((option) => {
                const isActive = selectedMood?.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedMood(option)}
                  >
                    <span className="text-lg">{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">What is on your mind?</p>
            <Textarea
              value={entryText}
              onChange={(event) => setEntryText(event.target.value)}
              placeholder="Let your thoughts flow freely..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Add tags (optional)</p>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="gratitude, nature, growth"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas to surface themes later.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" type="button" onClick={handleClear} disabled={saving}>
              Clear
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>This Week&apos;s Mood</CardTitle>
          <CardDescription>Track the emotional notes of the past seven days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {weeklyMood.map((day) => (
              <div
                key={day.day}
                className="flex flex-col items-center rounded-2xl border border-muted/60 bg-muted/10 px-4 py-5 text-center shadow-sm"
              >
                <span className="text-2xl">{day.icon}</span>
                <span className="mt-2 text-sm font-semibold text-foreground">{day.day}</span>
                <span className="mt-1 text-xs text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent Reflections</CardTitle>
            <CardDescription>Your latest entries at a glance.</CardDescription>
          </div>
          <Link
            to="/journal/entries"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {journalLoading ? (
            <p className="text-sm text-muted-foreground">Loading your reflections...</p>
          ) : recentEntries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-muted p-6 text-sm text-muted-foreground">
              Start your sanctuary journey with a fresh entry above.
            </p>
          ) : (
            recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="space-y-2 rounded-2xl border border-muted/60 bg-muted/10 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{entry.moodIcon || '📝'}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {entry.moodLabel || 'Reflection'}
                  </span>
                  <span className="text-xs text-muted-foreground">{getDisplayDate(entry.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{entry.content || 'Untitled reflection.'}</p>
                {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full px-3">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalView;
