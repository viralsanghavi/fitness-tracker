import {useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {CalendarRange, ChefHat} from 'lucide-react';
import useTrackerStore from '../store/useTrackerStore.js';
import {formatDate} from '../utils/tracking.js';
import {Button} from './ui/button.jsx';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card.jsx';
import {Input} from './ui/input.jsx';
import {Label} from './ui/label.jsx';
import {Select} from './ui/select.jsx';

const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Treat', 'Meal'];
const QUICK_CATEGORY_PRESETS = [
  {label: 'Breakfast', icon: '🌅', category: 'Breakfast'},
  {label: 'Lunch', icon: '🍽️', category: 'Lunch'},
  {label: 'Dinner', icon: '🌙', category: 'Dinner'},
  {label: 'Snack', icon: '🥨', category: 'Snack'},
  {label: 'Drink', icon: '🥤', category: 'Beverage'},
];

function getCurrentTimeString() {
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
}

const DietLogView = () => {
  const {
    formData,
    selectedDate,
    setSelectedDate,
    addMeal,
    updateMeal,
    removeMeal,
    saveEntry,
    trackingData,
  } = useTrackerStore((state) => ({
    formData: state.formData,
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
    addMeal: state.addMeal,
    updateMeal: state.updateMeal,
    removeMeal: state.removeMeal,
    saveEntry: state.saveEntry,
    trackingData: state.trackingData,
  }));
  const mealSuggestions = useTrackerStore((state) => state.getMealSuggestions());

  const meals = formData.meals ?? [];
  const navigate = useNavigate();
  const quickNameRef = useRef(null);
  const [quickMealName, setQuickMealName] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('');
  const [quickUnit, setQuickUnit] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickCategory, setQuickCategory] = useState('Meal');
  const [quickTime, setQuickTime] = useState(() => getCurrentTimeString());
  const hasExistingEntry = Boolean(trackingData[selectedDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleAddMeal = () => {
    addMeal({time: getCurrentTimeString()});
  };

  const handleMealChange = (id, field, value) => {
    updateMeal(id, {[field]: value});
  };

  const handleUseSuggestion = (suggestion) => {
    addMeal({
      name: suggestion.name,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      category: suggestion.category || 'Meal',
      time: suggestion.time || getCurrentTimeString(),
    });
  };

  const handleQuickCategorySelect = (category) => {
    setQuickCategory(category);
    const presetTimes = {
      Breakfast: '08:00',
      Lunch: '13:00',
      Dinner: '19:30',
      Snack: getCurrentTimeString(),
      Beverage: getCurrentTimeString(),
      Treat: getCurrentTimeString(),
      Meal: getCurrentTimeString(),
    };
    setQuickTime(presetTimes[category] || getCurrentTimeString());
    quickNameRef.current?.focus();
  };

  const handleQuickAdd = () => {
    if (!quickMealName.trim()) return;
    addMeal({
      name: quickMealName.trim(),
      quantity: quickQuantity.trim(),
      unit: quickUnit.trim(),
      notes: quickNotes.trim(),
      category: quickCategory,
      time: quickTime,
    });
    setQuickMealName('');
    setQuickQuantity('');
    setQuickUnit('');
    setQuickNotes('');
    setQuickTime(getCurrentTimeString());
    quickNameRef.current?.focus();
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate('/track')}>
        ← Back to Track Today
      </Button>

      <Card className="border-emerald-400/40">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <ChefHat className="h-5 w-5 text-emerald-400" />
            <div>
              <CardTitle className="text-lg text-foreground">Nutrition Log</CardTitle>
              <CardDescription>
                Dedicated space just for meals. Perfect when you want to log nutrition without the rest of the daily ritual.
              </CardDescription>
            </div>
          </div>
          <div className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            {hasExistingEntry ? 'Existing entry' : 'Fresh day'}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-emerald-400/40 bg-emerald-500/5">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">Lightning fast logging</CardTitle>
            <CardDescription>Pick a meal type, jot the name, and hit enter — everything else is optional.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORY_PRESETS.map((preset) => (
              <button
                key={preset.category}
                type="button"
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                  quickCategory === preset.category
                    ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                    : 'border border-emerald-300/50 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20'
                }`}
                onClick={() => handleQuickCategorySelect(preset.category)}
              >
                <span className="mr-1">{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>
          <form
            className="grid gap-3 md:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr),minmax(0,1.6fr),auto]"
            onSubmit={(event) => {
              event.preventDefault();
              handleQuickAdd();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="quickMealName" className="text-xs uppercase tracking-wide text-muted-foreground">
                Meal name
              </Label>
              <Input
                id="quickMealName"
                ref={quickNameRef}
                value={quickMealName}
                onChange={(event) => setQuickMealName(event.target.value)}
                placeholder="E.g. Paneer wrap"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quickQuantity" className="text-xs uppercase tracking-wide text-muted-foreground">
                Qty
              </Label>
              <Input
                id="quickQuantity"
                value={quickQuantity}
                onChange={(event) => setQuickQuantity(event.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quickUnit" className="text-xs uppercase tracking-wide text-muted-foreground">
                Unit
              </Label>
              <Input
                id="quickUnit"
                value={quickUnit}
                onChange={(event) => setQuickUnit(event.target.value)}
                placeholder="bowl, cup…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quickTime" className="text-xs uppercase tracking-wide text-muted-foreground">
                Time
              </Label>
              <Input
                id="quickTime"
                type="time"
                value={quickTime}
                onChange={(event) => setQuickTime(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add
              </Button>
            </div>
          </form>
          <div className="space-y-1">
            <Label htmlFor="quickNotes" className="text-xs uppercase tracking-wide text-muted-foreground">
              Notes (optional)
            </Label>
            <Input
              id="quickNotes"
              value={quickNotes}
              onChange={(event) => setQuickNotes(event.target.value)}
              placeholder="Toppings, mood, portion swap…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarRange className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-foreground">Date you are logging</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="diet-log-date"
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
        {selectedDateLabel && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Logging meals for <span className="font-semibold text-foreground">{selectedDateLabel}</span>
            </p>
          </CardContent>
        )}
      </Card>

      <Card className="border-emerald-300/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Quick Suggestions</CardTitle>
          <CardDescription>
            Frequently logged meals show up here. Use them to pre-fill your plate and tweak the details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mealSuggestions.length === 0 ? (
            <p className="rounded-md border border-dashed border-muted p-4 text-sm text-muted-foreground">
              Once you start logging meals, shortcuts to your favourites will appear here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mealSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${suggestion.time || 'any'}-${index}`}
                  type="button"
                  className="rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-200 hover:bg-emerald-400/20"
                  onClick={() => handleUseSuggestion(suggestion)}
                >
                  {suggestion.name}
                  {suggestion.time ? ` · ${suggestion.time}` : ''}
                  {suggestion.count > 1 ? ` ×${suggestion.count}` : ''}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">Meals for the day</CardTitle>
            <CardDescription>Capture name, time, quantity, and any notes that help future-you understand the choices.</CardDescription>
          </div>
          <Button type="button" className="gap-2" onClick={handleAddMeal}>
            ➕ Add Meal
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {meals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted p-6 text-sm text-muted-foreground">
              No meals logged yet for this date. Add your first entry to paint the nourishment picture.
            </div>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="space-y-4 rounded-2xl border border-muted/60 bg-muted/5 p-4 shadow-sm transition">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr)]">
                    <div className="space-y-1">
                      <Label htmlFor={`meal-name-${meal.id}`} className="text-xs uppercase tracking-wide text-muted-foreground">
                        Meal name
                      </Label>
                      <Input
                        id={`meal-name-${meal.id}`}
                        value={meal.name}
                        onChange={(event) => handleMealChange(meal.id, 'name', event.target.value)}
                        placeholder="E.g. Veggie bowl"
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
                      >
                        {MEAL_CATEGORIES.map((option) => (
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => addMeal({category: 'Snack', time: getCurrentTimeString(), name: 'Fresh Fruit', quantity: '1', unit: 'bowl'})}>
              Quick Snack
            </Button>
            <Button type="button" variant="secondary" onClick={() => addMeal({category: 'Hydration', time: getCurrentTimeString(), name: 'Hydration Boost', quantity: '250', unit: 'ml'})}>
              Hydration Boost
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-400/40 bg-emerald-500/5">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-foreground">Ready to save?</CardTitle>
            <CardDescription>Meals are part of your daily entry. Saving will keep everything in sync across tracking and analytics.</CardDescription>
          </div>
          <Button type="button" className="min-w-[180px] animate-button-pop" onClick={saveEntry}>
            💾 Save Meals
          </Button>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/meals')}>
          View Weekly Meal Journal →
        </Button>
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default DietLogView;
