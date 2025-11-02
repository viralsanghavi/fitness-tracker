import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Calendar} from 'lucide-react';
import useTrackerStore from '../store/useTrackerStore.js';
import {formatDate} from '../utils/tracking.js';
import StarterPromptCard from './tracking/StarterPromptCard.jsx';
import QuickMetricsBoard from './tracking/QuickMetricsBoard.jsx';
import MoveRechargeCard from './tracking/MoveRechargeCard.jsx';
import MindsetCard from './tracking/MindsetCard.jsx';
import GrowthCard from './tracking/GrowthCard.jsx';
import NourishCard from './tracking/NourishCard.jsx';
import {Button} from './ui/button.jsx';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card.jsx';
import {Input} from './ui/input.jsx';
import {Label} from './ui/label.jsx';
import {Select} from './ui/select.jsx';
import {Textarea} from './ui/textarea.jsx';

const TrackingView = () => {
  const {
    formData,
    selectedDate,
    setSelectedDate,
    updateFormField,
    saveEntry,
    clearForm,
    addMediaEntry,
    removeMediaEntry,
    addMeal,
    updateMeal,
    removeMeal,
    trackingData
  } = useTrackerStore((state) => ({
    formData: state.formData,
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
    updateFormField: state.updateFormField,
    saveEntry: state.saveEntry,
    clearForm: state.clearForm,
    addMediaEntry: state.addMediaEntry,
    removeMediaEntry: state.removeMediaEntry,
    addMeal: state.addMeal,
    updateMeal: state.updateMeal,
    removeMeal: state.removeMeal,
    trackingData: state.trackingData
  }));
  const mealSuggestions = useTrackerStore((state) => state.getMealSuggestions());

  const [mediaType, setMediaType] = useState('image');
  const [mediaContent, setMediaContent] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const mediaEntries = formData.mediaEntries ?? [];
  const meals = formData.meals ?? [];
  const navigate = useNavigate();
  const hasExistingEntry = Boolean(trackingData[selectedDate]);
  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const getCurrentTimeString = () => {
    const now = new Date();
    let hours = now.getHours();
    const rounded = Math.round(now.getMinutes() / 5) * 5;
    let minutes = rounded;
    if (rounded === 60) {
      hours = (hours + 1) % 24;
      minutes = 0;
    }
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    return `${hoursString}:${minutesString}`;
  };

  const createMediaId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  const handleAddMedia = () => {
    const content = mediaContent.trim();
    const caption = mediaCaption.trim();
    if (!content) return;
    addMediaEntry({
      id: createMediaId(),
      type: mediaType,
      content,
      caption
    });
    setMediaContent('');
    setMediaCaption('');
  };

  const handleRemoveMedia = (id) => {
    removeMediaEntry(id);
  };

  const handleMediaSubmit = (event) => {
    event.preventDefault();
    handleAddMedia();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      clearForm();
    }
  };

  const handleAddMeal = () => {
    addMeal({ time: getCurrentTimeString() });
  };

  const handleMealChange = (id, field, value) => {
    updateMeal(id, { [field]: value });
  };

  const handleUseSuggestion = (suggestion) => {
    addMeal({
      name: suggestion.name,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      category: suggestion.category || 'Meal',
      time: suggestion.time || getCurrentTimeString()
    });
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </Button>

      <StarterPromptCard
        hasExistingEntry={hasExistingEntry}
        selectedDateLabel={selectedDateLabel}
        onClear={handleClear}
      />

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-foreground">Select a date to track</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="trackingDate"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="max-w-[180px]"
            />
            <Button type="button" variant="secondary" onClick={() => setSelectedDate(formatDate(new Date()))}>
              Today
            </Button>
          </div>
        </CardHeader>
      </Card>

      <QuickMetricsBoard />

      <div className="grid gap-6 xl:grid-cols-2">
        <MoveRechargeCard />
        <MindsetCard />
        <GrowthCard />
        <NourishCard />
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">🎉 Little Wins &amp; Media</CardTitle>
          <CardDescription>Capture memorable snippets, inspiration, or snapshots from today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="grid gap-4 md:grid-cols-[160px,1fr] md:items-end" onSubmit={handleMediaSubmit}>
            <div className="space-y-2">
              <Label htmlFor="mediaType">Type</Label>
              <Select id="mediaType" value={mediaType} onChange={(event) => setMediaType(event.target.value)}>
                <option value="image">Image URL</option>
                <option value="quote">Quote or Text</option>
                <option value="audio">Audio or Podcast Link</option>
                <option value="video">Video Link</option>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr,180px]">
              <div className="space-y-2">
                <Label htmlFor="mediaContent">
                  {mediaType === 'image' ? 'Link to your moment' : 'What would you like to remember?'}
                </Label>
                <Input
                  id="mediaContent"
                  value={mediaContent}
                  onChange={(event) => setMediaContent(event.target.value)}
                  placeholder={
                    mediaType === 'image'
                      ? 'https://…'
                      : mediaType === 'quote'
                      ? 'A line that lit you up today'
                      : 'Paste the link you want to revisit'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mediaCaption">Caption (optional)</Label>
                <Input
                  id="mediaCaption"
                  value={mediaCaption}
                  onChange={(event) => setMediaCaption(event.target.value)}
                  placeholder="Add a tiny description"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={!mediaContent.trim()} className="animate-button-pop">
                ➕ Add to Today&apos;s Highlights
              </Button>
            </div>
          </form>

          {mediaEntries.length === 0 ? (
            <p className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
              Add a quick snapshot, quote, or link to build a gallery of daily wins.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mediaEntries.map((media) => (
                <div key={media.id} className="space-y-3 rounded-xl border border-muted/60 bg-muted/5 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{media.type}</span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => handleRemoveMedia(media.id)}>
                      Remove
                    </Button>
                  </div>
                  {media.type === 'image' && (
                    <div className="overflow-hidden rounded-lg border border-muted/40 bg-background">
                      <img src={media.content} alt={media.caption || 'Uploaded highlight'} className="h-40 w-full object-cover" />
                    </div>
                  )}
                  {media.type === 'quote' && (
                    <p className="text-sm italic text-muted-foreground">“{media.content}”</p>
                  )}
                  {media.type !== 'image' && media.type !== 'quote' && (
                    <a
                      href={media.content}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4"
                    >
                      Visit saved link ↗
                    </a>
                  )}
                  {media.caption && <p className="text-sm text-foreground">{media.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-400/40">
        <CardHeader>
          <CardTitle className="text-lg">🍽️ Meals &amp; Eating Window</CardTitle>
          <CardDescription>
            Log what you ate, when you ate it, and the quantity. Tap a suggestion to auto-fill from your past favourites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Suggestions</Label>
            {mealSuggestions.length === 0 ? (
              <p className="rounded-md border border-dashed border-muted p-3 text-sm text-muted-foreground">
                Once you log a few meals, we&apos;ll surface your most common go-tos here for speedy tracking.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mealSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${suggestion.time || 'any'}-${index}`}
                    type="button"
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    {suggestion.name}
                    {suggestion.time ? ` · ${suggestion.time}` : ''}
                    {suggestion.count > 1 ? ` ×${suggestion.count}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {meals.length === 0 ? (
              <p className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
                No meals logged yet. Add your first meal to build a tailored eating timeline.
              </p>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="space-y-4 rounded-2xl border border-muted/60 bg-muted/5 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`meal-name-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                          Meal name
                        </Label>
                        <Input
                          id={`meal-name-${meal.id}`}
                          value={meal.name}
                          onChange={(event) => handleMealChange(meal.id, 'name', event.target.value)}
                          placeholder="E.g. Overnight oats"
                          className="w-56"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`meal-category-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                          Category
                        </Label>
                        <Select
                          id={`meal-category-${meal.id}`}
                          value={meal.category || 'Meal'}
                          onChange={(event) => handleMealChange(meal.id, 'category', event.target.value)}
                          className="w-40"
                        >
                          {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Treat', 'Meal'].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`meal-time-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                          Time
                        </Label>
                        <Input
                          id={`meal-time-${meal.id}`}
                          type="time"
                          value={meal.time}
                          onChange={(event) => handleMealChange(meal.id, 'time', event.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="self-start text-xs uppercase tracking-wide text-muted-foreground transition hover:text-destructive"
                      onClick={() => removeMeal(meal.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr)]">
                    <div className="space-y-1">
                      <Label htmlFor={`meal-quantity-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                        Quantity
                      </Label>
                      <Input
                        id={`meal-quantity-${meal.id}`}
                        value={meal.quantity}
                        onChange={(event) => handleMealChange(meal.id, 'quantity', event.target.value)}
                        placeholder="e.g. 1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`meal-unit-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                        Unit
                      </Label>
                      <Input
                        id={`meal-unit-${meal.id}`}
                        value={meal.unit}
                        onChange={(event) => handleMealChange(meal.id, 'unit', event.target.value)}
                        placeholder="Cup, grams, bowl…"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`meal-notes-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                        Notes (optional)
                      </Label>
                      <Input
                        id={`meal-notes-${meal.id}`}
                        value={meal.notes}
                        onChange={(event) => handleMealChange(meal.id, 'notes', event.target.value)}
                        placeholder="Add toppings, mood, appetite…"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleAddMeal} className="animate-button-pop">
              ➕ Add Meal
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                addMeal({
                  category: 'Snack',
                  time: getCurrentTimeString(),
                  name: 'Fresh Fruit',
                  quantity: '1',
                  unit: 'bowl'
                })
              }
            >
              Quick Snack
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📝 Daily Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(event) => updateFormField('notes', event.target.value)}
            placeholder="Any reflections or highlights from today?"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button className="flex-1 min-w-[180px] animate-button-pop" type="button" onClick={saveEntry}>
          💾 Save Today&apos;s Data
        </Button>
        <Button variant="secondary" className="min-w-[140px] animate-button-pop" type="button" onClick={handleClear}>
          🗑️ Clear All
        </Button>
      </div>
    </div>
  );
};

export default TrackingView;
