import {memo} from 'react';
import {shallow} from 'zustand/shallow';
import useTrackerStore from '../../store/useTrackerStore.js';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.jsx';
import {Label} from '../ui/label.jsx';
import ToggleSwitch from '../common/ToggleSwitch.jsx';
import {Input} from '../ui/input.jsx';
import RatingSelector from '../common/RatingSelector.jsx';
import {Textarea} from '../ui/textarea.jsx';

const SOCIAL_SUGGESTIONS = ['Coffee catch-up', 'Family dinner', 'Walk with friend'];

const NourishCard = () => {
  const {
    social,
    mealQuality,
    gratitude,
    toggleSocial,
    updateSocialActivity,
    updateRating,
    updateFormField,
  } = useTrackerStore(
    (state) => ({
      social: state.formData.social,
      mealQuality: state.formData.mealQuality,
      gratitude: state.formData.gratitude,
      toggleSocial: state.toggleSocial,
      updateSocialActivity: state.updateSocialActivity,
      updateRating: state.updateRating,
      updateFormField: state.updateFormField,
    }),
    shallow
  );

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle className="text-lg">🌱 Nourish &amp; Connect</CardTitle>
        <CardDescription>Capture who you connected with and how you fueled yourself.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>👥 Social Connection</Label>
          <ToggleSwitch value={social.connected} onChange={toggleSocial} />
          {social.connected && (
            <div className="space-y-1.5">
              <Label htmlFor="socialActivity">Activity Description</Label>
              <Input
                id="socialActivity"
                type="text"
                value={social.activity}
                onChange={(event) => updateSocialActivity(event.target.value)}
                placeholder="What did you do?"
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {SOCIAL_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="quick-chip"
                    onClick={() => updateSocialActivity(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>🍽️ Meal Quality (1-10)</Label>
          <RatingSelector value={mealQuality} onChange={(value) => updateRating('mealQuality', value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gratitude">🙏 Gratitude</Label>
          <Textarea
            id="gratitude"
            value={gratitude}
            onChange={(event) => updateFormField('gratitude', event.target.value)}
            placeholder="Write something you're grateful for..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(NourishCard);
