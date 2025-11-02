import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import useTrackerStore from '../store/useTrackerStore.js';
import {Button} from './ui/button.jsx';
import {Input} from './ui/input.jsx';
import {Badge} from './ui/badge.jsx';

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

const JournalEntriesView = () => {
  const navigate = useNavigate();
  const journalEntries = useTrackerStore((state) => state.journalEntries);
  const journalLoading = useTrackerStore((state) => state.journalLoading);
  const [query, setQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return journalEntries;
    return journalEntries.filter((entry) => {
      const content = [
        entry.content || '',
        entry.moodLabel || '',
        ...(Array.isArray(entry.tags) ? entry.tags : []),
      ]
        .join(' ')
        .toLowerCase();
      return content.includes(trimmed);
    });
  }, [journalEntries, query]);

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate(-1)}>
        &larr; Back to sanctuary
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">All Reflections</h1>
        <p className="text-sm text-muted-foreground">
          Revisit the thoughts, wins, and lessons that are shaping your journey.
        </p>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your entries..."
        className="max-w-xl"
      />

      <div className="space-y-4">
        {journalLoading ? (
          <p className="text-sm text-muted-foreground">Loading journal entries...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-muted p-6 text-sm text-muted-foreground">
            No reflections match that search yet. Try a different keyword or tag.
          </p>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="space-y-3 rounded-2xl border border-muted/60 bg-muted/10 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg">{entry.moodIcon || '📝'}</span>
                <span className="text-base font-semibold text-foreground">
                  {entry.moodLabel || 'Reflection'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getDisplayDate(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
              {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  );
};

export default JournalEntriesView;
