import {memo} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.jsx';
import {Button} from '../ui/button.jsx';

const StarterPromptCard = ({hasExistingEntry, selectedDateLabel, onClear}) => {
  if (hasExistingEntry) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Editing saved entry for {selectedDateLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              Update any field below and hit save — everything will stay in sync across analytics and your meal journal.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClear}>
            Start fresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">First things first ✨</CardTitle>
        <CardDescription>Hit these three checkpoints to set today’s momentum.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="guided-step">
          <span className="guided-step-index">1</span>
          Log how you feel right now — Mood &amp; Stress
        </div>
        <div className="guided-step">
          <span className="guided-step-index">2</span>
          Add your first glass of water or step count
        </div>
        <div className="guided-step">
          <span className="guided-step-index">3</span>
          Capture a mini win or gratitude note
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StarterPromptCard);
