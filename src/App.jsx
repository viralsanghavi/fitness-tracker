import {useCallback, useEffect, useMemo, useState} from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  NotebookPen,
  BarChart3,
  Sparkles,
  CalendarDays,
  Utensils,
  ShieldCheck,
  BookOpenCheck,
  ChefHat,
  Check,
  HeartPulse,
  BellRing,
} from "lucide-react";
import DashboardView from "./components/DashboardView.jsx";
import TrackingView from "./components/TrackingView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import MotivationView from "./components/MotivationView.jsx";
import WeeklyView from "./components/WeeklyView.jsx";
import MealJournalView from "./components/MealJournalView.jsx";
import Toast from "./components/common/Toast.jsx";
import useTrackerStore from "./store/useTrackerStore.js";
import {Button} from "./components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card.jsx";
import ThemeToggle from "./components/ui/theme-toggle.jsx";
import {Input} from "./components/ui/input.jsx";
import {Label} from "./components/ui/label.jsx";
import {formatDate} from "./utils/tracking.js";
import AdminPanelView from "./components/AdminPanelView.jsx";
import JournalView from "./components/JournalView.jsx";
import JournalEntriesView from "./components/JournalEntriesView.jsx";
import DietLogView from "./components/DietLogView.jsx";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    emoji: "🌟",
    description: "Holistic overview & streaks",
  },
  {
    key: "tracking",
    label: "Track Today",
    path: "/track",
    icon: NotebookPen,
    emoji: "📝",
    description: "Log habits, wins, and reflections",
  },
  {
    key: "analytics",
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    emoji: "📈",
    description: "Trends, charts, and journal calendar",
  },
  {
    key: "motivation",
    label: "Motivation",
    path: "/motivation",
    icon: Sparkles,
    emoji: "💪",
    description: "Insights, achievements, and habits",
  },
  {
    key: "weekly",
    label: "Weekly Journal",
    path: "/weekly",
    icon: CalendarDays,
    emoji: "📆",
    description: "Cute calendar & digital diary",
  },
  {
    key: "diet",
    label: "Nutrition Log",
    path: "/diet",
    icon: ChefHat,
    emoji: "🥗",
    description: "Focused meal tracking space",
  },
  {
    key: "meals",
    label: "Meal Journal",
    path: "/meals",
    icon: Utensils,
    emoji: "🍽️",
    description: "Week-by-week meal timeline",
  },
  {
    key: "journal",
    label: "Journal",
    path: "/journal",
    icon: BookOpenCheck,
    emoji: "🧘",
    description: "Personal sanctuary & reflections",
  },
  {
    key: "admin",
    label: "Admin",
    path: "/admin",
    icon: ShieldCheck,
    emoji: "🛡️",
    description: "Manage groups & permissions",
    requiresAdmin: true,
  },
];

const CARD_THEMES = {
  dashboard: {
    gradient: "linear-gradient(135deg, rgba(18,53,91,1) 0%, rgba(46,144,247,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.52) 100%)",
    accent: "from-sky-500/35 to-indigo-500/25",
  },
  tracking: {
    gradient: "linear-gradient(135deg, rgba(255,94,58,1) 0%, rgba(255,166,0,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.46) 100%)",
    accent: "from-orange-400/35 to-amber-400/25",
  },
  analytics: {
    gradient: "linear-gradient(135deg, rgba(31,161,170,1) 0%, rgba(28,176,246,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.49) 100%)",
    accent: "from-cyan-400/35 to-sky-400/25",
  },
  motivation: {
    gradient: "linear-gradient(135deg, rgba(255,170,0,1) 0%, rgba(255,210,92,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.52) 100%)",
    accent: "from-amber-300/35 to-yellow-300/20",
  },
  weekly: {
    gradient: "linear-gradient(135deg, rgba(138,76,219,1) 0%, rgba(255,140,209,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.48) 100%)",
    accent: "from-violet-400/35 to-pink-300/25",
  },
  diet: {
    gradient: "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(59,130,246,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.52) 100%)",
    accent: "from-emerald-400/35 to-sky-400/25",
  },
  meals: {
    gradient: "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(56,189,248,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.5) 100%)",
    accent: "from-emerald-400/35 to-teal-300/25",
  },
  journal: {
    gradient: "linear-gradient(135deg, rgba(32,148,146,1) 0%, rgba(124,111,255,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.79) 0%, rgba(15,23,42,0.48) 100%)",
    accent: "from-teal-400/35 to-indigo-400/25",
  },
  admin: {
    gradient: "linear-gradient(135deg, rgba(30,64,175,1) 0%, rgba(13,148,136,1) 100%)",
    overlay: "linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.52) 100%)",
    accent: "from-indigo-600/30 to-teal-500/25",
  },
};

const LANDING_STATS = [
  { key: "entries", label: "Guided entries logged", value: "12k+" },
  { key: "streak", label: "Average streak length", value: "18 days" },
  { key: "rating", label: "Community rating", value: "4.9 / 5" },
];

const LANDING_PREVIEW = [
  {
    key: "digest",
    icon: LayoutDashboard,
    title: "Morning digest",
    description: "See the rituals, habits, and meals that anchor your day.",
  },
  {
    key: "weekly",
    icon: CalendarDays,
    title: "Weekly rhythm planner",
    description: "Plan workouts, reflection prompts, and focus themes in one canvas.",
  },
  {
    key: "admin",
    icon: ShieldCheck,
    title: "Coach & team controls",
    description: "Invite members, assign permissions, and keep every log organized.",
  },
];

const SOCIAL_PROOF_POINTS = [
  "12k+ guided check-ins completed",
  "4.9/5 rating from early members",
  "Trusted by 200+ wellness circles",
];

const LANDING_FEATURES = [
  {
    key: "reminders",
    icon: Sparkles,
    benefit: "A reminder rhythm to keep you logging",
    title: "Stay on track without thinking about it",
    summary:
      "We send three gentle nudges each day so your streak survives busy schedules.",
    support: "Reminders hit morning, midday, and night in the app and on your device.",
  },
  {
    key: "logging",
    icon: NotebookPen,
    benefit: "A guided ritual to capture the day fast",
    title: "Log meals, mood, and wins in under two minutes",
    summary:
      "Short prompts remove guesswork and make reflection feel easy.",
    support: "Answer once and the tracker stores habits, meals, and notes together.",
  },
  {
    key: "insights",
    icon: BarChart3,
    benefit: "A weekly view to show real progress",
    title: "See streaks and trends as soon as they change",
    summary:
      "Charts highlight what is working so you can adjust without waiting.",
    support: "Spot dips early with streak meters, meal trends, and mood cards.",
  },
];

const PRICING_FEATURES = [
  "Daily guided check-ins and reflections",
  "Meal & habit journaling workspace",
  "7-day streak and achievement dashboard",
  "Deep analytics with custom segments",
  "Adaptive reminder scheduling across devices",
  "Weekly intention & reflection templates",
  "Priority in-app and email support",
];

const PAIN_POINTS = [
  "Health logs live in too many apps.",
  "Reminders fire at the wrong time.",
  "Streaks break after one busy day.",
];

const SOLUTION_POINTS = [
  "Prompts land when you wake up, take a break, and wind down.",
  "Meals, habits, and notes stay in one simple timeline.",
  "Instant streak and trend cards show if you are ahead or slipping.",
];

const TRUST_SIGNALS = [
  {
    quote:
      "“I went from five tracking apps to one. The morning ping keeps me honest, and my gym streak is finally above 30 days.”",
    author: "Priya M., Product designer",
  },
  {
    quote:
      "“Logging dinner and mood takes one minute. The weekly recap shows me which habits actually move the needle.”",
    author: "Marcus L., Community coach",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Sign in",
    description: "Use Google to open your tracker.",
  },
  {
    step: "02",
    title: "Pick focus areas",
    description: "Choose habits, meals, or mood to follow.",
  },
  {
    step: "03",
    title: "Log in under 2 minutes",
    description: "Answer quick prompts and see streak cards grow.",
  },
];

const PRICING_PLANS = [
  {
    key: "monthly",
    name: "Monthly",
    price: "₹49",
    cadence: "per month",
    description: "Flexible access to every ritual, insight, and reminder the moment you need it.",
    isPopular: true,
    features: PRICING_FEATURES,
    ctaLabel: "Subscribe monthly",
    footnote: "Billed every month. Cancel anytime.",
  },
  {
    key: "yearly",
    name: "Yearly",
    price: "₹42",
    cadence: "per month (₹594 billed yearly)",
    description: "Lock in consistent momentum with a 15% annual savings and the same premium access.",
    isPopular: false,
    features: PRICING_FEATURES,
    ctaLabel: "Save with yearly",
    footnote: "₹594 charged once per year. 15% lower than paying monthly.",
  },
];

const getRouteKey = (pathname) => {
  if (!pathname) return "dashboard";
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const matched = NAV_ITEMS.find((item) => item.path === cleanPath);
  if (matched) return matched.key;
  const fallback = NAV_ITEMS.find(
    (item) => cleanPath.startsWith(item.path) && item.path !== "/"
  );
  return fallback ? fallback.key : "dashboard";
};

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initializeAuth = useTrackerStore((state) => state.initializeAuth);
  const authLoading = useTrackerStore((state) => state.authLoading);
  const isLoading = useTrackerStore((state) => state.isLoading);
  const user = useTrackerStore((state) => state.user);
  const signInWithGoogle = useTrackerStore((state) => state.signInWithGoogle);
  const signOut = useTrackerStore((state) => state.signOut);
  const setCurrentView = useTrackerStore((state) => state.setCurrentView);
  const reminders = useTrackerStore((state) => state.getReminderPrompts());
  const trackingData = useTrackerStore((state) => state.trackingData);
  const adminProfile = useTrackerStore((state) => state.adminProfile);
  const signInWithEmailPassword = useTrackerStore(
    (state) => state.signInWithEmailPassword
  );

  const [reminderIndex, setReminderIndex] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const activeKey = useMemo(
    () => getRouteKey(location.pathname),
    [location.pathname]
  );

  const isAdmin = useMemo(
    () => Boolean(adminProfile?.role),
    [adminProfile?.role]
  );

  const availableNavItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.requiresAdmin || isAdmin
      ),
    [isAdmin]
  );

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [initializeAuth]);

  useEffect(() => {
    setCurrentView(activeKey);
  }, [activeKey, setCurrentView]);

  useEffect(() => {
    if (user) {
      setShowAdminLogin(false);
      setAdminEmail("");
      setAdminPassword("");
    }
  }, [user]);

  const notificationsSupported =
    typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    if (!notificationsSupported) return;
    setNotificationPermission(Notification.permission);
  }, [notificationsSupported]);

  const requestNotificationPermission = useCallback(async () => {
    if (!notificationsSupported) return;
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
    } catch (error) {
      console.warn("Unable to request notification permission", error);
    }
  }, [notificationsSupported]);

  const reminderCount = reminders.length;

  useEffect(() => {
    setReminderIndex(0);
  }, [reminderCount]);

  useEffect(() => {
    if (!reminders.length) return undefined;
    const intervalId = setInterval(() => {
      setReminderIndex((prev) => (prev + 1) % reminders.length);
    }, 6500);
    return () => clearInterval(intervalId);
  }, [reminders]);

  useEffect(() => {
    if (!user) return undefined;
    if (!notificationsSupported) return undefined;
    if (notificationPermission !== "granted") return undefined;

    let timeoutId;

    const scheduleReminder = () => {
      const now = new Date();
      const target = new Date(now);
      target.setUTCHours(17, 0, 0, 0); // 22:30 IST
      if (target <= now) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      const delay = target.getTime() - now.getTime();
      timeoutId = window.setTimeout(async () => {
        const todayKey = formatDate(new Date());
        const hasLoggedToday = Boolean(trackingData[todayKey]);
        if (!hasLoggedToday) {
          const registration = await navigator.serviceWorker?.getRegistration();
          const options = {
            body: "Don’t forget to log today’s habits and meals before the day ends.",
            icon: "/icons/app-icon.svg",
            badge: "/icons/app-icon.svg",
            tag: "daily-log-reminder",
            renotify: false,
            data: { url: "/track" },
          };
          if (registration) {
            registration.showNotification("Friendly reminder to log today", options);
          } else if (Notification.permission === "granted") {
            new Notification("Friendly reminder to log today", options);
          }
        }
        scheduleReminder();
      }, delay);
    };

    scheduleReminder();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [trackingData, user, notificationsSupported, notificationPermission]);

  const activeReminder = reminders.length
    ? reminders[reminderIndex % reminders.length]
    : null;

  const navigateToKey = (key) => {
    const destination = availableNavItems.find((item) => item.key === key);
    if (destination) {
      navigate(destination.path);
    }
  };

  const renderHeader = () => (
    <header className="rounded-3xl border border-muted bg-card/80 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Health Wallet
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            All your daily rituals, one swipe away.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {user ? (
            <>
              <div className="flex items-center gap-3 text-left">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="h-12 w-12 rounded-full border border-primary/30 object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl">
                    👤
                  </span>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <ThemeToggle />
                <Button variant="secondary" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <ThemeToggle />
              <Button
                variant="secondary"
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />{" "}
                {authLoading ? "Opening Google…" : "Sign in with Google"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  const renderWalletCard = (item) => {
    const Icon = item.icon;
    const isActive = activeKey === item.key;
    const theme = CARD_THEMES[item.key] ?? CARD_THEMES.dashboard;
    const backgroundImage = theme.overlay
      ? `${theme.overlay}, ${theme.gradient}`
      : theme.gradient;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => navigateToKey(item.key)}
        className={`wallet-pass ${isActive ? "wallet-pass-active" : ""}`}
        style={{ backgroundImage }}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
              {item.emoji} {item.label}
            </span>
            <p className="max-w-[18rem] text-left text-lg font-semibold text-white drop-shadow-[0_10px_24px_rgba(15,23,42,0.6)]">
              {item.description}
            </p>
          </div>
          <span className="wallet-pass-icon" aria-hidden>
            <Icon className="h-5 w-5 text-white drop-shadow-[0_12px_22px_rgba(15,23,42,0.55)]" />
          </span>
        </div>
        <span className="wallet-pass-chevron" aria-hidden>
          →
        </span>
      </button>
    );
  };

  const gatingContent = (() => {
    if (authLoading) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Authenticating with Google…
          </CardContent>
        </Card>
      );
    }

    if (!user) {
      return (
        <div className="space-y-16">
          <section className="relative overflow-hidden rounded-[36px] border border-muted bg-card/85 p-8 shadow-soft backdrop-blur md:p-14">
            <div
              className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-muted/25 blur-3xl"
              aria-hidden
            />
            <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,26rem)] lg:items-start">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Daily health made simple
                  </span>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                      Keep your meals, moves, and mood on track in one place.
                    </h2>
                    <p className="text-base text-muted-foreground md:text-lg">
                      Fitness Tracker gives you guided prompts and smart nudges so you can build a habit streak without juggling five apps.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="gap-2"
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                  >
                    <LogIn className="h-4 w-4" />
                    {authLoading ? "Opening Google…" : "Start now for ₹49"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAdminLogin(true);
                      setAdminEmail("");
                      setAdminPassword("");
                    }}
                  >
                    Admin access
                  </Button>
                  <ThemeToggle />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Guided prompts • Nudges 3× daily • Works on any device
                </p>
                <dl className="grid gap-4 sm:grid-cols-3">
                  {LANDING_STATS.map(({ key, label, value }) => (
                    <div
                      key={key}
                      className="rounded-3xl border border-muted bg-background/85 p-4 text-left shadow-inner-soft"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-foreground">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="space-y-5">
                {showAdminLogin ? (
                  <Card className="border-muted bg-background/95 shadow-inner-soft">
                    <CardHeader className="space-y-2">
                      <CardTitle>Admin sign in</CardTitle>
                      <CardDescription>
                        Use your team credentials for shared dashboards, permissions, and exports.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          signInWithEmailPassword(adminEmail, adminPassword);
                        }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="adminEmail">Admin email</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            autoComplete="username"
                            value={adminEmail}
                            onChange={(event) => setAdminEmail(event.target.value)}
                            placeholder="admin@company.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adminPassword">Password</Label>
                          <Input
                            id="adminPassword"
                            type="password"
                            autoComplete="current-password"
                            value={adminPassword}
                            onChange={(event) => setAdminPassword(event.target.value)}
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button type="submit" disabled={authLoading}>
                            {authLoading ? "Signing in…" : "Access workspace"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowAdminLogin(false);
                              setAdminPassword("");
                            }}
                          >
                            Use Google instead
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-primary/30 bg-background/95 shadow-inner-soft">
                    <CardHeader className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold uppercase tracking-[0.2em] text-primary">
                        <Sparkles className="h-4 w-4" /> What you’ll see inside
                      </CardTitle>
                      <CardDescription>
                        Three views you’ll lean on from day one.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {LANDING_PREVIEW.map(({ key, icon: Icon, title, description }) => (
                        <div
                          key={key}
                          className="flex items-start gap-3 rounded-2xl border border-muted/60 bg-background/85 p-4 shadow-inner-soft"
                        >
                          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        New beta modules drop monthly—enable them from Settings when you’re ready.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-muted bg-card/80 p-6 shadow-soft backdrop-blur md:p-10">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {SOCIAL_PROOF_POINTS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-muted/60 bg-background/80 px-4 py-2 text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-8 rounded-[36px] border border-muted bg-card/80 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  The challenge
                </p>
                <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
                  Most people quit health tracking because the tools slow them down.
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {PAIN_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  What changes with Fitness Tracker
                </p>
                <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
                  A simple workflow that fits real schedules.
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {SOLUTION_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-8 rounded-[36px] border border-muted bg-card/70 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="mx-auto max-w-3xl text-center space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Value made obvious
              </p>
              <h3 className="text-3xl font-semibold text-foreground md:text-4xl">
                Three big wins you get from one small habit.
              </h3>
              <p className="text-base text-muted-foreground md:text-lg">
                Each benefit shows how the product works and why it pays off.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {LANDING_FEATURES.map(({ key, icon: Icon, benefit, title, summary, support }) => (
                <Card
                  key={key}
                  className="group border-muted bg-background/85 shadow-inner-soft transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        {benefit}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner-soft">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>{summary}</p>
                      <p className="text-xs text-muted-foreground">{support}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-10 rounded-[36px] border border-muted bg-card/80 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Proof it works
                </p>
                <h3 className="text-3xl font-semibold text-foreground md:text-4xl">
                  People stick with Fitness Tracker because it keeps things moving.
                </h3>
                <p className="text-base text-muted-foreground">
                  Join thousands of guided entries already keeping wellness circles and solo builders on track.
                </p>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-muted bg-background/80 p-4 shadow-inner-soft">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Guided entries
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-foreground">12k+</dd>
                  </div>
                  <div className="rounded-3xl border border-muted bg-background/80 p-4 shadow-inner-soft">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Avg. streak
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-foreground">18 days</dd>
                  </div>
                  <div className="rounded-3xl border border-muted bg-background/80 p-4 shadow-inner-soft">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Community rating
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-foreground">4.9 / 5</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-4">
                {TRUST_SIGNALS.map(({ quote, author }) => (
                  <Card key={author} className="border-muted bg-background/85 shadow-inner-soft">
                    <CardContent className="space-y-3 p-6">
                      <p className="text-sm text-foreground">{quote}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {author}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-8 rounded-[36px] border border-muted bg-card/70 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="mx-auto max-w-3xl text-center space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                How it works
              </p>
              <h3 className="text-3xl font-semibold text-foreground md:text-4xl">
                Get set up in minutes, not weeks.
              </h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS_STEPS.map(({ step, title, description }) => (
                <Card key={step} className="border-muted bg-background/85 shadow-inner-soft">
                  <CardContent className="space-y-3 p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                      {step}
                    </span>
                    <h4 className="text-lg font-semibold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-10 rounded-[36px] border border-muted bg-card/80 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="mx-auto max-w-3xl text-center space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Pick your plan
              </p>
              <h3 className="text-3xl font-semibold text-foreground md:text-4xl">
                Two simple options. Same tools. Choose the rhythm that fits.
              </h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {PRICING_PLANS.map(
                ({
                  key,
                  name,
                  price,
                  cadence,
                  description,
                  features,
                  ctaLabel,
                  isPopular,
                  footnote,
                }) => (
                  <Card
                    key={key}
                    className={`relative h-full border-muted bg-background/85 shadow-inner-soft transition hover:-translate-y-1 hover:shadow-soft ${
                      isPopular ? "border-primary shadow-lg" : ""
                    }`}
                  >
                    {isPopular ? (
                      <span className="absolute right-5 top-5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        Most popular
                      </span>
                    ) : null}
                    <CardHeader className="space-y-4 pb-0">
                      <div className="space-y-2">
                        <CardTitle className="text-2xl font-semibold text-foreground">
                          {name}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </div>
                      <div>
                        <p className="text-4xl font-semibold text-foreground">{price}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {cadence}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex h-full flex-col justify-between gap-6 pt-6">
                      <ul className="space-y-3 text-sm text-muted-foreground">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-full bg-primary/15 p-1 text-primary">
                              <Check className="h-4 w-4" />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-3">
                        <Button className="w-full" variant={isPopular ? "default" : "secondary"}>
                          {ctaLabel}
                        </Button>
                        <p className="text-xs text-muted-foreground">{footnote}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-[36px] border border-primary/40 bg-primary/10 p-8 shadow-soft backdrop-blur md:p-12">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-semibold text-foreground md:text-4xl">
                Ready to keep your streak alive?
              </h3>
              <p className="text-base text-muted-foreground md:text-lg">
                Sign in, set your focus, and let the reminders handle the rest.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                className="gap-2"
                onClick={signInWithGoogle}
                disabled={authLoading}
              >
                <LogIn className="h-4 w-4" />
                {authLoading ? "Opening Google…" : "Start now for ₹49"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAdminLogin(true);
                  setAdminEmail("");
                  setAdminPassword("");
                }}
              >
                Need team access?
              </Button>
            </div>
          </section>
        </div>
      );
    }

    if (isLoading) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading your entries from Firestore…
          </CardContent>
        </Card>
      );
    }

    return null;
  })();

  const reminderTicker =
    user && activeReminder ? (
      <div className="animate-reminder-slide w-full rounded-3xl border border-muted bg-card/70 px-4 py-3 text-sm font-medium text-muted-foreground shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="reminder-icon">{activeReminder.icon ?? "⏰"}</span>
          <span className="text-foreground">{activeReminder.message}</span>
        </div>
      </div>
    ) : null;

  const notificationBanner = (() => {
    if (!user || !notificationsSupported) return null;
    if (notificationPermission === "default") {
      return (
        <Card className="rounded-3xl border border-muted bg-card/70 shadow-soft backdrop-blur">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Enable daily reminders
              </p>
              <p className="text-sm text-muted-foreground">
                Allow notifications so we can nudge you to log your rituals throughout the day.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={requestNotificationPermission} className="gap-2">
                <BellRing className="h-4 w-4" />
                Allow notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (notificationPermission === "denied") {
      return (
        <Card className="rounded-3xl border border-destructive/40 bg-destructive/10 shadow-soft backdrop-blur">
          <CardContent className="p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">
                Notifications blocked
              </p>
              <p className="text-sm text-destructive/80">
                Notifications are disabled in your browser settings. Re-enable them for Fitness Tracker to receive reminders.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
        {renderHeader()}
        {gatingContent ? (
          gatingContent
        ) : (
          <main className="flex flex-1 flex-col gap-6">
            {notificationBanner}
            {reminderTicker}
            <section
              aria-label="Quick passes"
              className="wallet-pass-stack"
            >
              {availableNavItems.map((item) => renderWalletCard(item))}
            </section>
            <section
              aria-label="Selected view"
              className="rounded-[32px] border border-muted bg-card/80 p-1 shadow-soft backdrop-blur"
            >
              <div
                key={location.pathname}
                className="animate-view-enter rounded-[28px] bg-background/80 p-6 shadow-inner-soft"
              >
                <Outlet />
              </div>
            </section>
          </main>
        )}
        <Toast />
      </div>
    </div>
  );
};

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<DashboardView />} />
      <Route path="track" element={<TrackingView />} />
      <Route path="analytics" element={<AnalyticsView />} />
      <Route path="motivation" element={<MotivationView />} />
      <Route path="weekly" element={<WeeklyView />} />
      <Route path="diet" element={<DietLogView />} />
      <Route path="meals" element={<MealJournalView />} />
      <Route path="journal" element={<JournalView />} />
      <Route path="journal/entries" element={<JournalEntriesView />} />
      <Route path="admin" element={<AdminPanelView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
