import {useEffect, useMemo, useState} from "react";
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
    gradient: "linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(59,130,246,1) 100%)",
    accent: "from-indigo-500/30 to-sky-500/20",
  },
  tracking: {
    gradient: "linear-gradient(135deg, rgba(251,113,133,1) 0%, rgba(244,114,182,1) 100%)",
    accent: "from-rose-400/25 to-pink-500/20",
  },
  analytics: {
    gradient: "linear-gradient(135deg, rgba(34,211,238,1) 0%, rgba(59,130,246,1) 100%)",
    accent: "from-cyan-400/30 to-blue-500/20",
  },
  motivation: {
    gradient: "linear-gradient(135deg, rgba(251,191,36,1) 0%, rgba(253,224,71,1) 100%)",
    accent: "from-amber-300/25 to-yellow-300/10",
  },
  weekly: {
    gradient: "linear-gradient(135deg, rgba(167,139,250,1) 0%, rgba(251,191,36,1) 100%)",
    accent: "from-violet-400/30 to-amber-300/20",
  },
  meals: {
    gradient: "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(79,70,229,1) 100%)",
    accent: "from-emerald-400/30 to-indigo-500/20",
  },
  journal: {
    gradient: "linear-gradient(135deg, rgba(252,211,77,1) 0%, rgba(244,114,182,1) 100%)",
    accent: "from-amber-300/30 to-pink-400/20",
  },
  admin: {
    gradient: "linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(45,212,191,1) 100%)",
    accent: "from-indigo-500/25 to-teal-500/20",
  },
};

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
    if (typeof window === "undefined") return undefined;
    if (!("Notification" in window)) return undefined;

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

    const ensurePermissionAndSchedule = async () => {
      let permission = Notification.permission;
      if (permission === "default") {
        try {
          permission = await Notification.requestPermission();
        } catch (error) {
          console.warn("Notification permission request failed", error);
        }
      }
      if (permission === "granted") {
        scheduleReminder();
      }
    };

    ensurePermissionAndSchedule();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [trackingData, user]);

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
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => navigateToKey(item.key)}
        className={`wallet-pass ${isActive ? "wallet-pass-active" : ""}`}
        style={{ backgroundImage: theme.gradient }}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
              {item.emoji} {item.label}
            </span>
            <p className="max-w-[16rem] text-left text-lg font-semibold text-white">
              {item.description}
            </p>
          </div>
          <span className="wallet-pass-icon" aria-hidden>
            <Icon className="h-5 w-5 text-white" />
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
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              Sign in to start tracking your health journey. Admins can use email
              and password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAdminLogin ? (
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
                    {authLoading ? "Signing in…" : "Admin sign in"}
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
            ) : (
              <div className="space-y-3">
                <Button onClick={signInWithGoogle} disabled={authLoading}>
                  {authLoading ? "Opening Google…" : "Sign in with Google"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => {
                    setShowAdminLogin(true);
                    setAdminEmail("");
                    setAdminPassword("");
                  }}
                >
                  Admin? Sign in with email &amp; password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        {renderHeader()}
        {gatingContent ? (
          gatingContent
        ) : (
          <main className="flex flex-1 flex-col gap-6">
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
      <Route path="meals" element={<MealJournalView />} />
      <Route path="journal" element={<JournalView />} />
      <Route path="journal/entries" element={<JournalEntriesView />} />
      <Route path="admin" element={<AdminPanelView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
