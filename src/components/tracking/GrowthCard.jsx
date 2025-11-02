import {memo} from 'react';
import {shallow} from 'zustand/shallow';
import useTrackerStore from '../../store/useTrackerStore.js';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.jsx';
import {Label} from '../ui/label.jsx';
import {Input} from '../ui/input.jsx';
import RatingSelector from '../common/RatingSelector.jsx';

const GrowthCard = () => {
  const {reading, readingContent, productivity, updateFormField, updateRating} = useTrackerStore(
    (state) => ({
      reading: state.formData.reading,
      readingContent: state.formData.readingContent,
      productivity: state.formData.productivity,
      updateFormField: state.updateFormField,
      updateRating: state.updateRating,
    }),
    shallow
  );

  return (
    <Card className="border-accent/40">
      <CardHeader>
        <CardTitle className="text-lg">📚 Growth Moments</CardTitle>
        <CardDescription>Note the inputs that sharpened you — reading, focus, or screen time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reading">📖 Reading Duration (minutes)</Label>
          <Input
            id="reading"
            type="number"
            min={0}
            value={reading}
            onChange={(event) => updateFormField('reading', Math.max(0, Number(event.target.value)))}
          />
          <div className="flex flex-wrap gap-2">
            {[15, 25, 40].map((option) => (
              <button
                key={option}
                type="button"
                className="quick-chip"
                onClick={() => updateFormField('reading', option)}
              >
                {option} min
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="readingContent">What are you reading?</Label>
          <Input
            id="readingContent"
            type="text"
            value={readingContent}
            onChange={(event) => updateFormField('readingContent', event.target.value)}
            placeholder="Book or content name"
          />
        </div>
        <div className="space-y-2">
          <Label>⚡ Productivity (1-10)</Label>
          <RatingSelector value={productivity} onChange={(value) => updateRating('productivity', value)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(GrowthCard);
