import {memo} from 'react';
import {shallow} from 'zustand/shallow';
import useTrackerStore from '../../store/useTrackerStore.js';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.jsx';
import {Label} from '../ui/label.jsx';
import MoodSelector from '../common/MoodSelector.jsx';
import {Input} from '../ui/input.jsx';

const MindsetCard = () => {
  const {mood, stress, meditation, updateMood, updateFormField} = useTrackerStore(
    (state) => ({
      mood: state.formData.mood,
      stress: state.formData.stress,
      meditation: state.formData.meditation,
      updateMood: state.updateMood,
      updateFormField: state.updateFormField,
    }),
    shallow
  );

  return (
    <Card className="border-secondary/40">
      <CardHeader>
        <CardTitle className="text-lg">🧠 Mindset Tune-In</CardTitle>
        <CardDescription>Quick pulse checks on mood, stress, and your calm rituals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Mood</Label>
          <MoodSelector value={mood} onChange={updateMood} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
          <div className="flex items-center gap-4">
            <input
              id="stressLevel"
              type="range"
              min={1}
              max={10}
              value={stress}
              onChange={(event) => updateFormField('stress', Number(event.target.value))}
              className="w-full"
            />
            <span className="w-8 text-center text-sm font-semibold text-muted-foreground">{stress}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meditation">🧘 Meditation Duration (minutes)</Label>
          <Input
            id="meditation"
            type="number"
            min={0}
            value={meditation}
            onChange={(event) => updateFormField('meditation', Math.max(0, Number(event.target.value)))}
          />
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15].map((option) => (
              <button
                key={option}
                type="button"
                className="quick-chip"
                onClick={() => updateFormField('meditation', option)}
              >
                {option} min
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MindsetCard);
