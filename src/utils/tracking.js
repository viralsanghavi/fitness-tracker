export const MOODS = ['😢', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '😃', '🤩'];

export const QUOTES = [
  'Small daily improvements are the key to staggering long-term results.',
  'Your health is an investment, not an expense.',
  "Take care of your body. It's the only place you have to live.",
  'The greatest wealth is health.',
  'Progress, not perfection.',
  'Every day is a chance to begin again.',
  'Your future self will thank you.',
  'Consistency is key to lasting change.',
  'Believe in yourself and all that you are.',
  'One day or day one. You decide.'
];

export const GOALS = [
  '• Water: 8 glasses daily',
  '• Sleep: 7-9 hours nightly',
  '• Exercise: 30 minutes, 3-4x weekly',
  '• Reading: 15 minutes daily',
  '• Meditation: 10 minutes daily'
];

export const formatDate = (date) => date.toISOString().split('T')[0];

export const createEmptyEntry = () => ({
  caffeine: 0,
  water: 0,
  exercise: { completed: false, type: 'Gym', duration: 30 },
  sleep: { sleepTime: '22:00', wakeTime: '06:00', quality: 0, hours: 0 },
  steps: 0,
  meals: [],
  mood: 0,
  stress: 5,
  meditation: 0,
  reading: 0,
  readingContent: '',
  productivity: 0,
  screenTime: 0,
  social: { connected: false, activity: '' },
  mealQuality: 0,
  gratitude: '',
  notes: '',
  mediaEntries: [],
  quickMetricUpdatedAt: {
    water: null,
    steps: null,
    caffeine: null,
    screenTime: null
  }
});

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const createEmptyMeal = (overrides = {}) => ({
  id: generateId(),
  name: '',
  quantity: '',
  unit: '',
  category: 'Meal',
  time: '',
  notes: '',
  ...overrides
});

export const normalizeMeals = (meals = []) =>
  meals
    .filter(Boolean)
    .map((meal) => {
      if (typeof meal !== 'object') return createEmptyMeal();
      return createEmptyMeal({ ...meal });
    });

const mergeNested = (defaults, source) =>
  Object.keys(defaults).reduce((acc, key) => {
    const defaultValue = defaults[key];
    const sourceValue = source?.[key];
    if (Array.isArray(defaultValue)) {
      if (key === 'meals') {
        acc[key] = normalizeMeals(sourceValue);
      } else {
        acc[key] = Array.isArray(sourceValue) ? sourceValue : defaultValue;
      }
    } else if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      acc[key] = mergeNested(defaultValue, sourceValue || {});
    } else {
      acc[key] = sourceValue ?? defaultValue;
    }
    return acc;
  }, {});

export const withEntryDefaults = (entry = {}) => {
  const merged = mergeNested(createEmptyEntry(), entry);
  merged.caffeine = toNumber(merged.caffeine);
  merged.water = toNumber(merged.water);
  merged.steps = toNumber(merged.steps);
  merged.sleep = {
    ...merged.sleep,
    hours: calculateSleepHours(merged.sleep.sleepTime, merged.sleep.wakeTime)
  };
  merged.mood = toNumber(merged.mood);
  merged.stress = toNumber(merged.stress);
  merged.meditation = toNumber(merged.meditation);
  merged.reading = toNumber(merged.reading);
  merged.productivity = toNumber(merged.productivity);
  merged.screenTime = toNumber(merged.screenTime);
  merged.mealQuality = toNumber(merged.mealQuality);
  const updatedAt = merged.quickMetricUpdatedAt || {};
  merged.quickMetricUpdatedAt = {
    water: updatedAt.water ?? null,
    steps: updatedAt.steps ?? null,
    caffeine: updatedAt.caffeine ?? null,
    screenTime: updatedAt.screenTime ?? null
  };
  return merged;
};

export const calculateSleepHours = (sleepTime, wakeTime) => {
  if (!sleepTime || !wakeTime) return 0;
  const sleep = new Date(`2000-01-01T${sleepTime}`);
  let wake = new Date(`2000-01-01T${wakeTime}`);
  if (wake < sleep) {
    wake = new Date(`2000-01-02T${wakeTime}`);
  }
  const diff = wake - sleep;
  return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
};

export const calculateStreak = (trackingData) => {
  const dates = Object.keys(trackingData)
    .map((d) => new Date(d))
    .sort((a, b) => b - a);
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < dates.length; i += 1) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (dates[i].getTime() === expected.getTime()) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

export const calculateWeekCompletion = (trackingData) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  let trackedDays = 0;

  for (let i = 0; i <= today.getDay(); i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = formatDate(date);
    if (trackingData[key]) {
      trackedDays += 1;
    }
  }

  if (today.getDay() === 0) {
    return trackedDays > 0 ? 100 : 0;
  }

  return Math.round((trackedDays / (today.getDay() + 1)) * 100);
};

export const getDataInRange = (trackingData, range) => {
  const today = new Date();
  const results = [];
  const days = range === 'all' ? 365 : parseInt(range, 10);

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDate(date);
    if (trackingData[key]) {
      results.unshift({ date: key, ...trackingData[key] });
    }
  }

  return results;
};

export const getWeeklyData = (trackingData) => getDataInRange(trackingData, '7');

export const getAchievements = (trackingData) => {
  const achievements = [];
  const streak = calculateStreak(trackingData);
  if (streak >= 3) {
    achievements.push(`🔥 ${streak} Day Streak!`);
  }

  const weekData = getWeeklyData(trackingData);
  const exerciseCount = weekData.filter((d) => d.exercise?.completed).length;
  if (exerciseCount >= 3) {
    achievements.push(`💪 ${exerciseCount} Workouts This Week!`);
  }

  const waterGoals = weekData.filter((d) => (d.water ?? 0) >= 8).length;
  if (waterGoals >= 5) {
    achievements.push('💧 Hydration Champion!');
  }

  return achievements;
};

export const getInsights = (data) => {
  if (data.length === 0) {
    return [];
  }

  const insights = [];
  const avgSleep = data.reduce((sum, d) => sum + toNumber(d.sleep?.hours), 0) / data.length;
  if (avgSleep < 7) {
    insights.push({
      type: 'warning',
      title: '🌙 Sleep Improvement',
      message: `Your sleep average is ${avgSleep.toFixed(1)} hours. Try going to bed 30 minutes earlier tonight!`
    });
  } else {
    insights.push({
      type: 'success',
      title: '✅ Great Sleep Habits',
      message: `Excellent! You're averaging ${avgSleep.toFixed(1)} hours per night.`
    });
  }

  const avgWater = data.reduce((sum, d) => sum + toNumber(d.water), 0) / data.length;
  if (avgWater < 8) {
    insights.push({
      type: 'warning',
      title: '💧 Hydration Boost',
      message: `You're at ${avgWater.toFixed(1)} glasses daily. Aim for 8+ for optimal health!`
    });
  } else {
    insights.push({
      type: 'success',
      title: '💧 Excellent Hydration',
      message: "You're hitting your water goals consistently!"
    });
  }

  const exerciseDays = data.filter((d) => d.exercise?.completed).length;
  if (exerciseDays >= 3) {
    insights.push({
      type: 'success',
      title: '🏋️ Amazing Activity',
      message: `You exercised ${exerciseDays} times this week! Keep it up! 🔥`
    });
  } else {
    insights.push({
      type: 'default',
      title: '🚶 Movement Matters',
      message: 'Try adding more movement. Even a 15-minute walk makes a difference!'
    });
  }

  return insights;
};

export const buildWeekCalendar = (trackingData) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const days = [];
  let trackedDays = 0;

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = formatDate(date);
    const data = trackingData[key];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const icons = [];

    if (data) {
      trackedDays += 1;
      if ((data.water ?? 0) >= 8) icons.push('💧');
      if (data.exercise?.completed) icons.push('🏋️');
      if ((data.reading ?? 0) > 0) icons.push('📚');
      if ((data.sleep?.hours ?? 0) >= 7) icons.push('😴');
      if ((data.mood ?? 0) >= 7) icons.push('😊');
    }

    days.push({
      date: key,
      label: dayName,
      dayOfMonth: date.getDate(),
      isToday: key === formatDate(today),
      icons: icons.join('') || '—'
    });
  }

  const completion = Math.round((trackedDays / 7) * 100);

  return { days, completion };
};

export const getWeekHighlights = (data) => {
  const highlights = [];
  const focus = [];

  const exerciseCount = data.filter((d) => d.exercise?.completed).length;
  if (exerciseCount >= 3) {
    highlights.push(`💪 Exercised ${exerciseCount} times`);
  } else {
    focus.push('🏋️ Increase exercise frequency');
  }

  const waterGoals = data.filter((d) => (d.water ?? 0) >= 8).length;
  if (waterGoals >= 5) {
    highlights.push('💧 Stayed well hydrated');
  } else {
    focus.push('💧 Drink more water daily');
  }

  if (data.length > 0) {
    const avgSleep = data.reduce((sum, d) => sum + (d.sleep?.hours ?? 0), 0) / data.length;
    if (avgSleep >= 7) {
      highlights.push('😴 Maintained good sleep schedule');
    } else {
      focus.push('😴 Improve sleep duration');
    }
  }

  return { highlights, focus };
};

const averageScore = (totals) => {
  if (totals.count === 0) return 0;
  return Math.round((totals.score / totals.count) * 100);
};

const accumulateScore = (totals, component) => {
  if (Number.isFinite(component)) {
    totals.score += component;
    totals.count += 1;
  }
};

export const computeWellnessDimensions = (entries = []) => {
  if (!entries.length) {
    return {
      physical: 0,
      mental: 0,
      emotional: 0,
      spiritual: 0
    };
  }

  const physicalTotals = { score: 0, count: 0 };
  const mentalTotals = { score: 0, count: 0 };
  const emotionalTotals = { score: 0, count: 0 };
  const spiritualTotals = { score: 0, count: 0 };

  entries.forEach((entry) => {
    const physicalComponents = [
      clamp01(toNumber(entry.sleep?.hours) / 8),
      clamp01(toNumber(entry.water) / 8),
      entry.exercise?.completed ? 1 : 0,
      clamp01(toNumber(entry.steps) / 8000)
    ];
    physicalComponents.forEach((component) => accumulateScore(physicalTotals, component));

    const mentalComponents = [
      1 - clamp01(toNumber(entry.stress) / 10),
      clamp01(toNumber(entry.productivity) / 10),
      clamp01(toNumber(entry.reading) / 20),
      1 - clamp01(toNumber(entry.screenTime) / 8)
    ];
    mentalComponents.forEach((component) => accumulateScore(mentalTotals, component));

    const emotionalComponents = [
      clamp01(toNumber(entry.mood) / 10),
      entry.social?.connected ? 1 : 0,
      entry.gratitude ? 1 : 0
    ];
    emotionalComponents.forEach((component) => accumulateScore(emotionalTotals, component));

    const spiritualComponents = [
      clamp01(toNumber(entry.meditation) / 15),
      entry.gratitude ? 1 : 0,
      entry.readingContent ? 1 : 0
    ];
    spiritualComponents.forEach((component) => accumulateScore(spiritualTotals, component));
  });

  return {
    physical: averageScore(physicalTotals),
    mental: averageScore(mentalTotals),
    emotional: averageScore(emotionalTotals),
    spiritual: averageScore(spiritualTotals)
  };
};

const average = (values) => {
  if (!values.length) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
};

const roundTo = (value, precision = 1) => Math.round(value / precision) * precision;

export const computePersonalBenchmarks = (entries = []) => {
  if (!entries.length) {
    return [
      {
        id: 'hydration',
        label: 'Hydration',
        current: 0,
        target: 8,
        status: 'upNext',
        message: 'Sip steadily through the day to hit 8 glasses.',
        unit: 'glasses'
      },
      {
        id: 'sleep',
        label: 'Sleep Rhythm',
        current: 0,
        target: 7.5,
        status: 'upNext',
        message: 'Aim for 7.5 hours tonight for a refreshed morning.',
        unit: 'hrs'
      },
      {
        id: 'steps',
        label: 'Steps',
        current: 0,
        target: 8000,
        status: 'upNext',
        message: 'Take a movement break to stack up your steps.',
        unit: 'steps'
      },
      {
        id: 'mindfulness',
        label: 'Mindfulness',
        current: 0,
        target: 10,
        status: 'upNext',
        message: 'Reserve 10 mindful minutes to reset your mind.',
        unit: 'mins'
      }
    ];
  }

  const hydrationAvg = average(entries.map((entry) => toNumber(entry.water)).filter((value) => value > 0));
  const sleepAvg = average(entries.map((entry) => toNumber(entry.sleep?.hours)).filter((value) => value > 0));
  const stepsAvg = average(entries.map((entry) => toNumber(entry.steps)).filter((value) => value > 0));
  const meditationAvg = average(entries.map((entry) => toNumber(entry.meditation)).filter((value) => value > 0));
  const stressAvg = average(entries.map((entry) => toNumber(entry.stress)).filter((value) => value > 0));
  const screenAvg = average(entries.map((entry) => toNumber(entry.screenTime)).filter((value) => value > 0));

  const computeTarget = (avg, baseline, increment, cap) => {
    if (!avg) return baseline;
    if (avg >= baseline) {
      return Math.min(cap, roundTo(avg + increment, increment));
    }
    return baseline;
  };

  const insights = [];

  const hydrationTarget = computeTarget(hydrationAvg, 8, 1, 12);
  insights.push({
    id: 'hydration',
    label: 'Hydration',
    current: roundTo(hydrationAvg || 0, 0.1),
    target: hydrationTarget,
    status: hydrationAvg >= hydrationTarget ? 'celebrate' : hydrationAvg >= 6 ? 'onTrack' : 'upNext',
    message:
      hydrationAvg >= hydrationTarget
        ? 'Hydration hero! Maintain this flow today.'
        : `You’re ${Math.max(0, roundTo(hydrationTarget - (hydrationAvg || 0), 0.5))} glasses away from your adaptive goal.`,
    unit: 'glasses'
  });

  const sleepTarget = computeTarget(sleepAvg, 7.5, 0.5, 9);
  insights.push({
    id: 'sleep',
    label: 'Sleep Rhythm',
    current: roundTo(sleepAvg || 0, 0.1),
    target: sleepTarget,
    status: sleepAvg >= sleepTarget ? 'celebrate' : sleepAvg >= 6.5 ? 'onTrack' : 'upNext',
    message:
      sleepAvg >= sleepTarget
        ? 'Dream team level sleep habits. Keep your wind-down ritual.'
        : 'Try a calming ritual tonight to inch closer to 7.5 hours.',
    unit: 'hrs'
  });

  const stepsTarget = computeTarget(stepsAvg, 8000, 1000, 15000);
  insights.push({
    id: 'steps',
    label: 'Steps',
    current: roundTo(stepsAvg || 0, 100),
    target: stepsTarget,
    status: stepsAvg >= stepsTarget ? 'celebrate' : stepsAvg >= 6000 ? 'onTrack' : 'upNext',
    message:
      stepsAvg >= stepsTarget
        ? 'Stride superstar! Your movement streak is thriving.'
        : 'Plan a movement snack (walk, stretch, dance) to stack up your steps.',
    unit: 'steps'
  });

  const meditationTarget = computeTarget(meditationAvg, 10, 2, 20);
  insights.push({
    id: 'mindfulness',
    label: 'Mindfulness',
    current: roundTo(meditationAvg || 0, 1),
    target: meditationTarget,
    status: meditationAvg >= meditationTarget ? 'celebrate' : meditationAvg >= 5 ? 'onTrack' : 'upNext',
    message:
      meditationAvg >= meditationTarget
        ? 'Centered and calm—your mindful minutes are paying off.'
        : 'Slip a short breathing or gratitude break into your day.',
    unit: 'mins'
  });

  if (stressAvg >= 7) {
    insights.push({
      id: 'stress-watch',
      label: 'Stress Watch',
      current: roundTo(stressAvg, 0.5),
      target: 5,
      status: 'warning',
      message: 'Stress is trending high—layer in extra rest or lighter commitments today.',
      unit: 'level'
    });
  }

  if (screenAvg >= 6) {
    insights.push({
      id: 'screen-break',
      label: 'Screen Time',
      current: roundTo(screenAvg, 0.5),
      target: 5,
      status: 'warning',
      message: 'Hit pause on screens—stand, stretch, or take a sunshine break.',
      unit: 'hrs'
    });
  }

  return insights;
};

export const buildReminderPrompts = (trackingData) => {
  const todayKey = formatDate(new Date());
  const todayEntry = trackingData[todayKey];
  const recentEntries = getDataInRange(trackingData, '7');
  const prompts = [];

  if (!todayEntry) {
    prompts.push({
      id: 'log-today',
      type: 'nudge',
      message: "Haven't logged today yet. Jot down a quick mood & win!",
      icon: '🗒️'
    });
  } else {
    if (toNumber(todayEntry.water) < 8) {
      const remaining = Math.max(0, 8 - toNumber(todayEntry.water));
      prompts.push({
        id: 'hydration-reminder',
        type: 'hydration',
        message: remaining > 0 ? `${remaining} glass${remaining === 1 ? '' : 'es'} away from hydration goal.` : 'Stay hydrated with a celebratory sip! 💧',
        icon: '💧'
      });
    }

    if (toNumber(todayEntry.steps) < 6000) {
      prompts.push({
        id: 'movement-reminder',
        type: 'movement',
        message: 'Mini movement break? A brisk walk will boost your step streak!',
        icon: '🦶'
      });
    }

    if ((todayEntry.gratitude ?? '').trim().length === 0) {
      prompts.push({
        id: 'gratitude-reminder',
        type: 'gratitude',
        message: 'Drop one gratitude highlight to seal the day with joy.',
        icon: '✨'
      });
    }

    const meals = Array.isArray(todayEntry.meals)
      ? todayEntry.meals.filter(Boolean)
      : [];
    if (meals.length === 0) {
      prompts.push({
        id: 'meal-log-reminder',
        type: 'diet',
        message: 'Log a meal to keep your nourishment timeline on track today.',
        icon: '🥗'
      });
    } else {
      const mealQualityScore = toNumber(todayEntry.mealQuality);
      if (mealQualityScore > 0 && mealQualityScore <= 6) {
        prompts.push({
          id: 'meal-quality-reminder',
          type: 'diet',
          message: 'Consider adding a colorful veggie or protein to level up meal quality.',
          icon: '🍽️'
        });
      }
    }

    const goalPrompts = [];
    if (!todayEntry.exercise?.completed) {
      goalPrompts.push({
        id: 'goal-movement-reminder',
        type: 'goal',
        message: "Plan a 30-minute movement session to hit today's exercise target.",
        icon: '🏃'
      });
    }
    if (toNumber(todayEntry.meditation) < 10) {
      goalPrompts.push({
        id: 'goal-meditation-reminder',
        type: 'goal',
        message: 'Take a mindful 10-minute pause to meet your meditation goal.',
        icon: '🧘‍♀️'
      });
    }
    if (toNumber(todayEntry.reading) < 15) {
      goalPrompts.push({
        id: 'goal-reading-reminder',
        type: 'goal',
        message: 'Spend 15 focused minutes with a book to stay on your reading streak.',
        icon: '📚'
      });
    }
    if (goalPrompts.length > 0) {
      prompts.push(goalPrompts[0]);
    }
  }

  if (recentEntries.length > 0) {
    const stressAvg = average(recentEntries.map((entry) => toNumber(entry.stress)).filter((value) => value > 0));
    if (stressAvg >= 7) {
      prompts.push({
        id: 'stress-reminder',
        type: 'stress',
        message: 'Stress trend is high—schedule a mindful breather soon.',
        icon: '🧘'
      });
    }

    const sleepAvg = average(recentEntries.map((entry) => toNumber(entry.sleep?.hours)).filter((value) => value > 0));
    if (sleepAvg < 7 && !prompts.some((prompt) => prompt.type === 'sleep')) {
      prompts.push({
        id: 'sleep-reminder',
        type: 'sleep',
        message: 'Wind-down window idea: dim lights and unplug 30 minutes earlier.',
        icon: '🌙'
      });
    }
  }

  return prompts.slice(0, 4);
};
