import {memo, useMemo} from 'react';
import {shallow} from 'zustand/shallow';
import useTrackerStore from '../../store/useTrackerStore.js';
import {calculateSleepHours} from '../../utils/tracking.js';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.jsx';
import {Label} from '../ui/label.jsx';
import {Input} from '../ui/input.jsx';
import ToggleSwitch from '../common/ToggleSwitch.jsx';
import RatingSelector from '../common/RatingSelector.jsx';

const MoveRechargeCard = () => {
  const {
    exercise,
    sleep,
    updateExerciseField,
    toggleExercise,
    updateSleepField,
    updateSleepQuality,
  } = useTrackerStore(
    (state) => ({
      exercise: state.formData.exercise,
      sleep: state.formData.sleep,
      updateExerciseField: state.updateExerciseField,
      toggleExercise: state.toggleExercise,
      updateSleepField: state.updateSleepField,
      updateSleepQuality: state.updateSleepQuality,
    }),
    shallow
  );

  const sleepHours = useMemo(
    () => calculateSleepHours(sleep.sleepTime, sleep.wakeTime),
    [sleep.sleepTime, sleep.wakeTime]
  );

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">💪 Move &amp; Recharge</CardTitle>
        <CardDescription>Anchor your body rhythms — movement, exercise, and sleep.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label>🏋️ Exercise</Label>
            <ToggleSwitch value={exercise.completed} onChange={toggleExercise} />
            {exercise.completed && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exerciseType">Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Gym', 'Running', 'Yoga', 'Walking', 'Swimming', 'Other'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`quick-chip ${exercise.type === option ? 'quick-chip-active' : ''}`}
                        onClick={() => updateExerciseField('type', option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exerciseDuration">Duration (minutes)</Label>
                  <Input
                    id="exerciseDuration"
                    type="number"
                    min={0}
                    value={exercise.duration}
                    onChange={(event) => updateExerciseField('duration', Math.max(0, Number(event.target.value)))}
                  />
                  <div className="flex flex-wrap gap-2">
                    {[20, 30, 45].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="quick-chip"
                        onClick={() => updateExerciseField('duration', option)}
                      >
                        {option} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sleepTime">😴 Sleep Time</Label>
            <Input
              id="sleepTime"
              type="time"
              value={sleep.sleepTime}
              onChange={(event) => updateSleepField('sleepTime', event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wakeTime">Wake Time</Label>
            <Input
              id="wakeTime"
              type="time"
              value={sleep.wakeTime}
              onChange={(event) => updateSleepField('wakeTime', event.target.value)}
            />
          </div>
        </section>
        <div className="space-y-2">
          <Label>Sleep Quality (1-10)</Label>
          <RatingSelector value={sleep.quality} onChange={updateSleepQuality} />
          <p className="text-sm text-muted-foreground">Estimated sleep: {sleepHours} hours</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MoveRechargeCard);
