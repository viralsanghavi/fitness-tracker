import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import useTrackerStore from "../store/useTrackerStore.js";
import {formatDate} from "../utils/tracking.js";
import {cn} from "../lib/utils.js";
import {Button} from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card.jsx";

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const MONDAY_INDEX = 1;

const getMonday = (baseDate) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : MONDAY_INDEX - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const formatRangeLabel = (startDate) => {
  const start = DAY_FORMAT.format(startDate);
  const end = DAY_FORMAT.format(addDays(startDate, 6));
  return `${start} → ${end}`;
};

const formatHourLabel = (hour24) => {
  const normalized = hour24 % 24;
  const period = normalized >= 12 ? "pm" : "am";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}:00 ${period}`;
};

const HOURLY_SLOTS = Array.from({length: 20}, (_, index) => 5 + index);

const SCHEDULE_SLOTS = [
  ...HOURLY_SLOTS.map((hour) => ({
    label: formatHourLabel(hour),
    minutes: hour === 24 ? 24 * 60 : hour * 60,
  })),
  {label: "Anytime", minutes: null},
];

const ANYTIME_SLOT_INDEX = SCHEDULE_SLOTS.length - 1;

const parseTimeToMinutes = (timeString) => {
  if (!timeString) return null;
  const trimmed = `${timeString}`.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i
  );
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const meridian = match[3]?.toLowerCase();

  if (meridian) {
    if (hour === 12) {
      hour = meridian === "am" ? 0 : 12;
    } else if (meridian === "pm") {
      hour += 12;
    }
  }

  if (!meridian && hour === 24) {
    hour = 0;
  }

  return hour * 60 + minute;
};

const resolveSlotIndex = (timeString) => {
  const minutes = parseTimeToMinutes(timeString);
  if (minutes === null) return ANYTIME_SLOT_INDEX;

  let closestIndex = 0;
  let closestDiff = Number.POSITIVE_INFINITY;

  SCHEDULE_SLOTS.forEach((slot, index) => {
    if (slot.minutes === null) return;
    const diff = Math.abs(slot.minutes - minutes);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const formatMealTime = (timeString) => {
  const minutes = parseTimeToMinutes(timeString);
  if (minutes === null) return "Anytime";
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

const MealJournalView = () => {
  const navigate = useNavigate();
  const trackingData = useTrackerStore((state) => state.trackingData);
  const setSelectedDate = useTrackerStore((state) => state.setSelectedDate);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekMetadata = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const start = getMonday(base);
    const days = Array.from({length: 7}).map((_, index) => {
      const dayDate = addDays(start, index);
      const iso = formatDate(dayDate);
      const entry = trackingData[iso];
      const meals = Array.isArray(entry?.meals) ? entry.meals.filter(Boolean) : [];
      const isToday =
        dayDate.toDateString() === new Date().toDateString();
      const isFuture = dayDate > new Date();
      const slotBuckets = SCHEDULE_SLOTS.map(() => []);
      meals.forEach((meal) => {
        const slotIndex = resolveSlotIndex(meal.time);
        slotBuckets[slotIndex].push(meal);
      });
      slotBuckets.forEach((bucket) => {
        bucket.sort((a, b) => {
          const timeDiff =
            (parseTimeToMinutes(a.time) ?? Number.POSITIVE_INFINITY) -
            (parseTimeToMinutes(b.time) ?? Number.POSITIVE_INFINITY);
          if (timeDiff !== 0) return timeDiff;
          return (a.name || "").localeCompare(b.name || "");
        });
      });
      return {
        iso,
        date: dayDate,
        label: DAY_FORMAT.format(dayDate),
        entry,
        meals,
        isToday,
        isFuture,
        slotBuckets,
      };
    });
    return {
      start,
      days,
      label: formatRangeLabel(start),
    };
  }, [trackingData, weekOffset]);

  const summary = useMemo(() => {
    const loggedDays = weekMetadata.days.filter(
      (day) => day.entry && day.meals.length > 0,
    );
    const missingMeals = weekMetadata.days.filter(
      (day) =>
        !day.isFuture &&
        day.entry &&
        day.meals.length === 0,
    );
    const notLogged = weekMetadata.days.filter(
      (day) => !day.isFuture && !day.entry,
    );

    return {
      loggedDays,
      missingMeals,
      notLogged,
    };
  }, [weekMetadata]);

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="px-0" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card className="border-primary/40">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarRange className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg text-foreground">
                {weekMetadata.label}
              </CardTitle>
              <CardDescription>
                Week starts on Monday. Hop back and forth to review your meal
                streak.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setWeekOffset((value) => value - 1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="ghost"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset(0)}
            >
              Current Week
            </Button>
            <Button
              variant="secondary"
              onClick={() => setWeekOffset((value) => value + 1)}
              disabled={weekOffset >= 0}
              className="gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-muted/60">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-foreground">
            Weekly Meal Schedule
          </CardTitle>
          <CardDescription>
            Spreadsheet view—scan meals against hourly slots. Click any day to log or update.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border-b border-r border-muted bg-muted/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Time
                  </th>
                  {weekMetadata.days.map((day) => {
                    const status = day.isToday
                      ? "Today"
                      : day.isFuture
                      ? "Upcoming"
                      : day.entry
                      ? `${day.meals.length || "No"} meal${day.meals.length === 1 ? "" : "s"}`
                      : "Not logged";
                    return (
                      <th
                        key={day.iso}
                        className={cn(
                          "min-w-[160px] border-b border-muted px-4 py-3 text-left align-bottom transition",
                          day.isToday ? "bg-primary/10" : "bg-muted/30"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.iso);
                            navigate("/diet");
                          }}
                          className={cn(
                            "w-full text-left transition",
                            day.isToday ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {day.label}
                          </span>
                          <span className="mt-1 block text-xs uppercase tracking-wide">
                            {status}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_SLOTS.map((slot, slotIndex) => (
                  <tr key={slot.label}>
                    <th
                      scope="row"
                      className={cn(
                        "border-r border-muted/70 bg-muted/20 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground align-top",
                        slotIndex === ANYTIME_SLOT_INDEX && "bg-muted/30"
                      )}
                    >
                      {slot.label}
                    </th>
                    {weekMetadata.days.map((day) => {
                      const meals = day.slotBuckets[slotIndex];
                      return (
                        <td
                          key={`${day.iso}-${slot.label}`}
                          className={cn(
                            "border border-muted/50 px-3 py-3 align-top",
                            day.isToday ? "bg-primary/5" : "bg-background/80"
                          )}
                        >
                          {meals.length === 0 ? (
                            slotIndex === ANYTIME_SLOT_INDEX ? (
                              <p className="text-xs text-muted-foreground">
                                {day.isFuture
                                  ? "Awaiting future notes."
                                  : day.entry
                                  ? "No extra notes logged."
                                  : "No entry saved yet."}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground opacity-60">
                                —
                              </p>
                            )
                          ) : (
                            <div className="space-y-2">
                              {meals.map((meal, index) => {
                                const quantity = meal.quantity
                                  ? `${meal.quantity}${meal.unit ? ` ${meal.unit}` : ""}`
                                  : "";
                                return (
                                  <div
                                    key={meal.id || `${day.iso}-${slot.label}-${index}`}
                                    className="space-y-1 rounded-lg border border-muted/60 bg-card/90 px-3 py-2 shadow-sm"
                                  >
                                    <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                      <span>{formatMealTime(meal.time)}</span>
                                      {quantity && <span>{quantity}</span>}
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                      {meal.name || "Untitled meal"}
                                    </p>
                                    {meal.notes && (
                                      <p className="text-xs italic text-muted-foreground">
                                        “{meal.notes}”
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-300/40">
        <CardHeader className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div>
            <CardTitle>Weekly Meal Insights</CardTitle>
            <CardDescription>
              Quick highlights to spot unlogged days and gentle nudges to stay
              consistent.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Logged meals on{" "}
            <span className="font-semibold text-foreground">
              {summary.loggedDays.length}
            </span>{" "}
            day{summary.loggedDays.length === 1 ? "" : "s"} this week.
          </p>
          {summary.missingMeals.length > 0 ? (
            <p>
              Meals missing on{" "}
              <span className="font-semibold text-amber-500">
                {summary.missingMeals.length}
              </span>{" "}
              day{summary.missingMeals.length === 1 ? "" : "s"} even though the
              day was logged. Consider adding a quick note so future-you sees
              the full picture.
            </p>
          ) : (
            <p className="text-emerald-600">
              Every logged day includes meals—great consistency!
            </p>
          )}
          {summary.notLogged.length > 0 && (
            <div>
              <p className="font-medium text-foreground">
                Days without any entry:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {summary.notLogged.map((day) => (
                  <li key={day.iso}>{day.label}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MealJournalView;
