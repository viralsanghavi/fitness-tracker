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

const MealJournalView = () => {
  const navigate = useNavigate();
  const trackingData = useTrackerStore((state) => state.trackingData);
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
      return {
        iso,
        date: dayDate,
        label: DAY_FORMAT.format(dayDate),
        entry,
        meals,
        isToday,
        isFuture,
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

  <div className="grid gap-4 lg:grid-cols-2">
    {weekMetadata.days.map((day) => (
      <Card
        key={day.iso}
        className={`border transition ${
          day.isToday ? "border-primary shadow-md" : "border-muted"
        }`}
      >
        <CardHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-foreground">
              {day.label}
            </CardTitle>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {day.isToday
                ? "Today"
                : day.isFuture
                ? "Upcoming"
                : day.entry
                ? "Logged"
                : "Not logged"}
            </span>
          </div>
          {day.entry && (
            <CardDescription>
              {day.meals.length > 0
                ? `${day.meals.length} meal${day.meals.length === 1 ? "" : "s"} tracked`
                : "No meals recorded yet"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {day.meals.length === 0 ? (
            <div className="space-y-3">
              <p className="rounded-md border border-dashed border-muted p-3 text-sm text-muted-foreground">
                {day.isFuture
                  ? "Future day. Add meals when the day arrives."
                  : day.entry
                  ? "Meals not logged for this day."
                  : "No entry saved for this day yet."}
              </p>
              {!day.isFuture && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(day.iso);
                    navigate("/track");
                  }}
                >
                  {day.entry ? "Edit this day in Track Today" : "Add this day in Track Today"}
                </Button>
              )}
            </div>
          ) : (
            <>
              {day.meals.map((meal, index) => {
                const timeLabel = meal.time || "—";
                const quantityLabel = meal.quantity
                  ? `${meal.quantity}${meal.unit ? ` ${meal.unit}` : ""}`
                  : "";
                return (
                  <div
                    key={meal.id || `${day.iso}-${index}`}
                    className="space-y-1 rounded-lg border border-muted/50 bg-background/80 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-primary">
                        {timeLabel}
                      </span>
                      <span className="font-medium text-foreground">
                        {meal.name || "Untitled meal"}
                        {quantityLabel ? ` · ${quantityLabel}` : ""}
                      </span>
                    </div>
                    {meal.notes && (
                      <p className="text-xs italic text-muted-foreground">
                        “{meal.notes}”
                      </p>
                    )}
                  </div>
                );
              })}
              {!day.isFuture && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setSelectedDate(day.iso);
                    navigate("/track");
                  }}
                >
                  Edit this day in Track Today →
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    ))}
  </div>

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
