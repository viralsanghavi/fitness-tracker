import {create} from "zustand";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {auth, firestore, googleProvider} from "../services/firebase.js";
import {
  GOALS,
  QUOTES,
  buildWeekCalendar,
  calculateSleepHours,
  calculateStreak,
  calculateWeekCompletion,
  createEmptyEntry,
  formatDate,
  getAchievements as computeAchievements,
  getDataInRange,
  getInsights as computeInsights,
  getWeekHighlights as computeWeekHighlights,
  getWeeklyData,
  withEntryDefaults,
  computeWellnessDimensions,
  computePersonalBenchmarks,
  buildReminderPrompts,
  createEmptyMeal,
  normalizeMeals,
} from "../utils/tracking.js";
import {
  ensureAdminMetadataEntry as ensureAdminMetadataEntryService,
  createGroup as createGroupService,
  assignGroupAdmin as assignGroupAdminService,
  removeGroupAdmin as removeGroupAdminService,
  assignGroupMember as assignGroupMemberService,
  removeGroupMember as removeGroupMemberService,
  subscribeToUserEntries as subscribeToUserEntriesService,
  subscribeToGroups as subscribeToGroupsService,
  fetchUserEntriesOnce,
} from "../services/adminService.js";

const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

const createDeepCopy = (value) => JSON.parse(JSON.stringify(value));

const DATA_COLLECTION = import.meta.env.VITE_FIRESTORE_COLLECTION || "users";
const ADMIN_METADATA_COLLECTION = "admin_metadata";
const GROUPS_COLLECTION = "groups";
const JOURNAL_COLLECTION = "journalEntries";

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : "");

const QUICK_METRIC_FIELDS = new Set([
  "water",
  "steps",
  "caffeine",
  "screenTime",
]);
const nowISOString = () => new Date().toISOString();

let unsubscribeAdminMeta = null;
let unsubscribeGroups = null;
let unsubscribeAdminDirectory = null;
let unsubscribeUserDirectory = null;
let unsubscribeAdminUserEntries = null;
let unsubscribeEntries = null;
let unsubscribeJournalEntries = null;
let authUnsubscribe = null;
let authInitialized = false;
const adminEntriesCache = new Map();
const ENTRY_CACHE_TTL = 1000 * 60 * 5;

const useTrackerStore = create((set, get) => {
  const cleanupAdminResources = () => {
    if (unsubscribeAdminMeta) {
      unsubscribeAdminMeta();
      unsubscribeAdminMeta = null;
    }
    if (unsubscribeGroups) {
      unsubscribeGroups();
      unsubscribeGroups = null;
    }
    if (unsubscribeAdminDirectory) {
      unsubscribeAdminDirectory();
      unsubscribeAdminDirectory = null;
    }
    if (unsubscribeUserDirectory) {
      unsubscribeUserDirectory();
      unsubscribeUserDirectory = null;
    }
    if (unsubscribeAdminUserEntries) {
      unsubscribeAdminUserEntries();
      unsubscribeAdminUserEntries = null;
    }
    if (unsubscribeJournalEntries) {
      unsubscribeJournalEntries();
      unsubscribeJournalEntries = null;
    }
    set({
      adminProfile: null,
      adminGroups: [],
      adminDirectory: [],
      userDirectory: [],
      adminViewedEntries: [],
      adminViewedUserEmail: null,
      adminViewedUserId: null,
      adminViewedLoading: false,
    adminLoading: false,
    });
  };

  const ensureDirectoryMetadata = (users) => {
    const profile = get().adminProfile;
    if (!profile || profile.role !== "super_admin") return;
    users.forEach((user) => {
      ensureAdminMetadataEntryService(firestore, {
        email: user.email,
        displayName: user.displayName || "",
        defaultRole: "user",
      });
    });
  };

  const subscribeToGroups = (profile) => {
    if (unsubscribeGroups) {
      unsubscribeGroups();
      unsubscribeGroups = null;
    }

    if (!profile) {
      set({adminGroups: [], adminLoading: false});
      return;
    }

    const normalizedEmail = normalizeEmail(profile.email);
    unsubscribeGroups = subscribeToGroupsService(
      firestore,
      (snapshot) => {
        const groups = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const admins = (data.admins || []).map(normalizeEmail);
          const includeGroup =
            profile.role === "super_admin" || admins.includes(normalizedEmail);
          if (!includeGroup) return;
          groups.push({
            id: docSnap.id,
            name: data.name || "Untitled group",
            description: data.description || "",
            admins: data.admins || [],
            members: data.members || [],
            createdAt: data.createdAt || null,
            createdBy: data.createdBy || null,
          });
        });
        set({adminGroups: groups, adminLoading: false});
      },
      (error) => {
        console.error("Firestore groups error:", error);
        set({
          toast: "⚠️ Unable to load groups for admin panel.",
          adminGroups: [],
          adminLoading: false,
        });
      }
    );
  };

  const subscribeToAdminDirectory = (shouldSubscribe) => {
    if (unsubscribeAdminDirectory) {
      unsubscribeAdminDirectory();
      unsubscribeAdminDirectory = null;
    }
    if (!shouldSubscribe) {
      set({adminDirectory: []});
      return;
    }
    const adminCollectionRef = collection(firestore, ADMIN_METADATA_COLLECTION);
    unsubscribeAdminDirectory = onSnapshot(
      adminCollectionRef,
      (snapshot) => {
        const admins = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          return {
            email: docSnap.id,
            role: data.role || null,
            displayName: data.displayName || "",
          };
        });
        set({adminDirectory: admins});
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.error("Firestore admin directory error:", error);
          set({toast: "⚠️ Unable to load admin directory."});
        }
        set({adminDirectory: []});
      }
    );
  };

  const subscribeToUserDirectory = (shouldSubscribe) => {
    if (unsubscribeUserDirectory) {
      unsubscribeUserDirectory();
      unsubscribeUserDirectory = null;
    }
    if (!shouldSubscribe) {
      set({userDirectory: []});
      return;
    }
    const usersRef = collection(firestore, DATA_COLLECTION);
    unsubscribeUserDirectory = onSnapshot(
      usersRef,
      (snapshot) => {
        const users = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() || {};
            return {
              uid: docSnap.id,
              email: data.email || "",
              displayName: data.displayName || "",
            };
          })
          .filter((user) => Boolean(user.email));
        set({userDirectory: users});
        ensureDirectoryMetadata(users);
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.error("Firestore user directory error:", error);
          set({toast: "⚠️ Unable to load user directory."});
        }
        set({userDirectory: []});
      }
    );
  };

  const subscribeToAdminMetadata = (firebaseUser) => {
    if (!firebaseUser) {
      cleanupAdminResources();
      return;
    }

    const email = normalizeEmail(firebaseUser.email);
    if (!email) {
      cleanupAdminResources();
      return;
    }

    const adminDocRef = doc(firestore, ADMIN_METADATA_COLLECTION, email);
    set({adminLoading: true});

    unsubscribeAdminMeta = onSnapshot(
      adminDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          set({adminProfile: null, adminLoading: false});
          subscribeToGroups(null);
          subscribeToAdminDirectory(false);
          subscribeToUserDirectory(false);
          return;
        }

        const data = docSnap.data() || {};
        const profile = {
          ...data,
          email,
          uid: firebaseUser.uid,
          role: data.role || null,
        };
        set({adminProfile: profile});
        subscribeToGroups(profile);
        const isSuperAdmin = profile.role === "super_admin";
        subscribeToAdminDirectory(isSuperAdmin);
        subscribeToUserDirectory(isSuperAdmin);
        const defaultRole = isSuperAdmin ? "super_admin" : profile.role || "group_admin";
        ensureAdminMetadataEntryService(firestore, {
          email,
          displayName: firebaseUser.displayName || "",
          defaultRole,
        });
      },
      (error) => {
        console.error("Firestore admin metadata error:", error);
        set({
          adminProfile: null,
          adminGroups: [],
          adminDirectory: [],
          userDirectory: [],
          adminLoading: false,
          toast: "⚠️ Unable to load admin permissions.",
        });
        subscribeToGroups(null);
        subscribeToAdminDirectory(false);
        subscribeToUserDirectory(false);
      }
    );
  };

  return {
    currentView: "dashboard",
    trackingData: {},
    selectedDate: formatDate(new Date()),
    formData: createEmptyEntry(),
    toast: "",
    analyticsRange: "7",
    quote: randomQuote(),
    goals: GOALS,
    isLoading: false,
    authLoading: true,
    user: null,
    journalEntries: [],
    journalLoading: false,
    analyticsFocus: null,
    adminProfile: null,
    adminGroups: [],
    adminDirectory: [],
    userDirectory: [],
    adminLoading: false,
    adminViewedEntries: [],
    adminViewedUserEmail: null,
    adminViewedUserId: null,
    adminViewedLoading: false,

    // Derived helpers exposed via selectors
    getDashboardStats: () => {
      const {trackingData} = get();
      return {
        streak: calculateStreak(trackingData),
        weekCompletion: calculateWeekCompletion(trackingData),
        totalDays: Object.keys(trackingData).length,
      };
    },

    getAnalyticsData: () => {
      const {trackingData, analyticsRange} = get();
      return getDataInRange(trackingData, analyticsRange);
    },

    getWeeklySummary: () => {
      const {trackingData} = get();
      const weeklyData = getWeeklyData(trackingData);
      const calendar = buildWeekCalendar(trackingData);
      const highlights = computeWeekHighlights(weeklyData);
      return {weeklyData, calendar, highlights};
    },

    getWellnessBreakdown: () => {
      const {trackingData} = get();
      const weeklyData = getWeeklyData(trackingData);
      const source =
        weeklyData.length > 0 ? weeklyData : Object.values(trackingData);
      return computeWellnessDimensions(source);
    },

    getPersonalBenchmarks: () => {
      const {trackingData} = get();
      const recentEntries = getDataInRange(trackingData, "14");
      return computePersonalBenchmarks(recentEntries);
    },

    getAchievements: () => {
      const {trackingData} = get();
      return computeAchievements(trackingData);
    },

    getInsights: (data) => computeInsights(data),

    getReminderPrompts: () => {
      const {trackingData} = get();
      return buildReminderPrompts(trackingData);
    },

    initializeAuth: () => {
      if (authInitialized) return () => {};
      authInitialized = true;

      set({authLoading: true});

      const subscribeToEntries = (userId) => {
        if (unsubscribeEntries) {
          unsubscribeEntries();
          unsubscribeEntries = null;
        }
        if (unsubscribeJournalEntries) {
          unsubscribeJournalEntries();
          unsubscribeJournalEntries = null;
        }

        set({isLoading: true, journalLoading: true});
        const entriesRef = collection(
          firestore,
          DATA_COLLECTION,
          userId,
          "entries"
        );
        unsubscribeEntries = onSnapshot(
          entriesRef,
          (snapshot) => {
            const nextData = {};
            snapshot.forEach((docSnap) => {
              nextData[docSnap.id] = withEntryDefaults(docSnap.data());
            });

            set((state) => {
              const existing = nextData[state.selectedDate];
              return {
                trackingData: nextData,
                formData: existing
                  ? withEntryDefaults(createDeepCopy(existing))
                  : state.formData,
                isLoading: false,
              };
            });
          },
          (error) => {
            console.error("Firestore subscription error:", error);
            set({
              isLoading: false,
              toast: "⚠️ Unable to load data from Firestore.",
            });
          }
        );

        const journalRef = collection(
          firestore,
          DATA_COLLECTION,
          userId,
          JOURNAL_COLLECTION
        );
        const journalQuery = query(journalRef, orderBy("createdAt", "desc"));
        unsubscribeJournalEntries = onSnapshot(
          journalQuery,
          (snapshot) => {
            const journalEntries = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() || {};
              return {
                id: docSnap.id,
                ...data,
              };
            });
            set({
              journalEntries,
              journalLoading: false,
            });
          },
          (error) => {
            console.error("Firestore journal subscription error:", error);
            set({
              journalEntries: [],
              journalLoading: false,
              toast: "⚠️ Unable to load journal entries.",
            });
          }
        );
      };

      authUnsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (unsubscribeEntries) {
            unsubscribeEntries();
            unsubscribeEntries = null;
          }
          cleanupAdminResources();

          if (firebaseUser) {
            const {uid, displayName, email, photoURL} = firebaseUser;
            if (email) {
              const userDocRef = doc(firestore, DATA_COLLECTION, uid);
              setDoc(
                userDocRef,
                {
                  email: normalizeEmail(email),
                  displayName: displayName || "",
                  photoURL: photoURL || "",
                  lastLoginAt: serverTimestamp(),
                },
                {merge: true}
              ).catch((error) => {
                console.error("Failed to update user directory entry:", error);
              });
            }
            set({
              user: {
                uid,
                displayName: displayName || "Anonymous",
                email: email || "",
                photoURL: photoURL || "",
              },
              authLoading: false,
              currentView: "dashboard",
            });
            set({analyticsFocus: null});
            subscribeToEntries(firebaseUser.uid);
            subscribeToAdminMetadata(firebaseUser);
          } else {
            set({
              user: null,
              trackingData: {},
              formData: createEmptyEntry(),
              journalEntries: [],
              journalLoading: false,
              authLoading: false,
              isLoading: false,
              currentView: "dashboard",
              analyticsFocus: null,
              adminProfile: null,
              adminGroups: [],
              adminDirectory: [],
              userDirectory: [],
              adminLoading: false,
            });
          }
        },
        (error) => {
          console.error("Firebase auth error:", error);
          set({
            authLoading: false,
            toast: "⚠️ Unable to authenticate with Google.",
          });
        }
      );

      return () => {
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        if (unsubscribeEntries) {
          unsubscribeEntries();
          unsubscribeEntries = null;
        }
        cleanupAdminResources();
        authInitialized = false;
      };
    },

    signInWithGoogle: async () => {
      set({authLoading: true});
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error("Google sign-in error:", error);
        set({
          authLoading: false,
          toast: "⚠️ Google sign-in cancelled or failed.",
        });
      }
    },

    signInWithEmailPassword: async (email, password) => {
      if (!email || !password) {
        set({toast: "⚠️ Email and password are required for admin sign in."});
        return;
      }
      set({authLoading: true});
      try {
        await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      } catch (error) {
        console.error("Email sign-in error:", error);
        let message = "⚠️ Unable to sign in with email and password.";
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password"
        ) {
          message = "⚠️ Invalid admin credentials.";
        } else if (error.code === "auth/user-not-found") {
          message = "⚠️ No admin account found for that email.";
        }
        set({authLoading: false, toast: message});
      }
    },

    signOut: async () => {
      try {
      await firebaseSignOut(auth);
      cleanupAdminResources();
      } catch (error) {
        console.error("Google sign-out error:", error);
        set({toast: "⚠️ Unable to sign out right now."});
      }
    },

    setToast: (toast) => set({toast}),
    clearToast: () => set({toast: ""}),

    setAnalyticsRange: (range) => set({analyticsRange: range}),

    setCurrentView: (view) =>
      set({
        currentView: view,
        quote: view === "motivation" ? randomQuote() : get().quote,
        analyticsFocus: view === "analytics" ? get().analyticsFocus : null,
      }),

    setAnalyticsFocus: (focus) => set({analyticsFocus: focus}),

    setSelectedDate: (date) => {
      const {trackingData} = get();
      const existing = trackingData[date];
      set({
        selectedDate: date,
        formData: existing
          ? withEntryDefaults(createDeepCopy(existing))
          : createEmptyEntry(),
      });
    },

    updateFormField: (field, value) =>
      set((state) => {
        const timestamp = QUICK_METRIC_FIELDS.has(field)
          ? nowISOString()
          : null;
        return {
          formData: {
            ...state.formData,
            [field]: value,
            quickMetricUpdatedAt: QUICK_METRIC_FIELDS.has(field)
              ? {
                  ...state.formData.quickMetricUpdatedAt,
                  [field]: timestamp,
                }
              : state.formData.quickMetricUpdatedAt,
          },
        };
      }),

    stepField: (field, delta, min, max) =>
      set((state) => {
        const current = state.formData[field] ?? 0;
        const nextValue = Math.min(max, Math.max(min, current + delta));
        const isQuickMetric = QUICK_METRIC_FIELDS.has(field);
        return {
          formData: {
            ...state.formData,
            [field]: nextValue,
            quickMetricUpdatedAt: isQuickMetric
              ? {
                  ...state.formData.quickMetricUpdatedAt,
                  [field]: nowISOString(),
                }
              : state.formData.quickMetricUpdatedAt,
          },
        };
      }),

    toggleExercise: (completed) =>
      set((state) => ({
        formData: {
          ...state.formData,
          exercise: {
            ...state.formData.exercise,
            completed,
          },
        },
      })),

    updateExerciseField: (field, value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          exercise: {
            ...state.formData.exercise,
            [field]: value,
          },
        },
      })),

    updateSleepField: (field, value) =>
      set((state) => {
        const updatedSleep = {
          ...state.formData.sleep,
          [field]: value,
        };
        const hours = calculateSleepHours(
          updatedSleep.sleepTime,
          updatedSleep.wakeTime
        );
        return {
          formData: {
            ...state.formData,
            sleep: {
              ...updatedSleep,
              hours,
            },
          },
        };
      }),

    updateSleepQuality: (value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          sleep: {
            ...state.formData.sleep,
            quality: value,
          },
        },
      })),

    updateRating: (field, value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          [field]: value,
        },
      })),

    updateMood: (value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          mood: value,
        },
      })),

    toggleSocial: (connected) =>
      set((state) => ({
        formData: {
          ...state.formData,
          social: {
            ...state.formData.social,
            connected,
          },
        },
      })),

    updateSocialActivity: (activity) =>
      set((state) => ({
        formData: {
          ...state.formData,
          social: {
            ...state.formData.social,
            activity,
          },
        },
      })),

    saveEntry: async () => {
      const {formData, selectedDate, trackingData, user} = get();
      if (!user) {
        set({toast: "⚠️ Please sign in to save your progress."});
        return;
      }
      const entry = {
        ...withEntryDefaults(formData),
        exercise: {...formData.exercise},
        sleep: {
          ...formData.sleep,
          hours: calculateSleepHours(
            formData.sleep.sleepTime,
            formData.sleep.wakeTime
          ),
        },
        social: {...formData.social},
        mediaEntries: Array.isArray(formData.mediaEntries)
          ? formData.mediaEntries.map((item) => ({...item}))
          : [],
      };

      const updatedTracking = {
        ...trackingData,
        [selectedDate]: entry,
      };

      const previousAchievements = computeAchievements(trackingData);
      const nextAchievements = computeAchievements(updatedTracking);
      const newAchievement = nextAchievements.find(
        (achievement) => !previousAchievements.includes(achievement)
      );

      const streak = calculateStreak(updatedTracking);
      const celebratoryMoments = [];
      if ((entry.water ?? 0) >= 8) {
        celebratoryMoments.push("💧 Hydration goal smashed today!");
      }
      if ((entry.steps ?? 0) >= 8000) {
        celebratoryMoments.push("🦶 Way to move! 8k+ steps logged.");
      }
      if (entry.exercise?.completed) {
        celebratoryMoments.push("🏋️ Workout locked in — nice!");
      }
      if ((entry.mood ?? 0) >= 7) {
        celebratoryMoments.push("😊 Strong mood check-in.");
      }

      let toastMessage = "✅ Data saved successfully!";
      if (newAchievement) {
        toastMessage = `✅ Saved! ${newAchievement}`;
      } else if (streak === 7) {
        toastMessage = "🎉 Amazing! 7 day streak achieved!";
      } else if (streak === 30) {
        toastMessage = "🏆 Incredible! 30 day streak! You're a champion!";
      } else if (celebratoryMoments.length > 0) {
        [toastMessage] = celebratoryMoments;
      }

      try {
        const entryRef = doc(
          firestore,
          DATA_COLLECTION,
          user.uid,
          "entries",
          selectedDate
        );
        await setDoc(entryRef, entry, {merge: true});
        set({
          trackingData: updatedTracking,
          formData: entry,
          toast: toastMessage,
        });
      } catch (error) {
        console.error("Firestore save error:", error);
        set({toast: "⚠️ Unable to save data to Firestore."});
      }
    },

    addJournalEntry: async ({mood, moodLabel, moodIcon, content, tags}) => {
      const {user} = get();
      if (!user) {
        set({toast: "⚠️ Please sign in to save your journal."});
        return false;
      }
      const sanitizedTags = Array.isArray(tags)
        ? tags
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter(Boolean)
        : [];
      const payload = {
        mood: mood || null,
        moodLabel: moodLabel || null,
        moodIcon: moodIcon || null,
        content: content?.trim() || "",
        tags: sanitizedTags,
        createdAt: serverTimestamp(),
      };
      try {
        await addDoc(
          collection(firestore, DATA_COLLECTION, user.uid, JOURNAL_COLLECTION),
          payload
        );
        return true;
      } catch (error) {
        console.error("Firestore journal save error:", error);
        set({toast: "⚠️ Unable to save journal entry right now."});
        return false;
      }
    },

    addMediaEntry: (entry) =>
      set((state) => ({
        formData: {
          ...state.formData,
          mediaEntries: [...(state.formData.mediaEntries ?? []), entry],
        },
      })),

    updateMediaEntry: (id, updates) =>
      set((state) => ({
        formData: {
          ...state.formData,
          mediaEntries: (state.formData.mediaEntries ?? []).map((item) =>
            item.id === id ? {...item, ...updates} : item
          ),
        },
      })),

    removeMediaEntry: (id) =>
      set((state) => ({
        formData: {
          ...state.formData,
          mediaEntries: (state.formData.mediaEntries ?? []).filter(
            (item) => item.id !== id
          ),
        },
      })),

    addMeal: (preset) =>
      set((state) => ({
        formData: {
          ...state.formData,
          meals: [...(state.formData.meals ?? []), createEmptyMeal(preset)],
        },
      })),

    updateMeal: (id, updates) =>
      set((state) => ({
        formData: {
          ...state.formData,
          meals: (state.formData.meals ?? []).map((meal) =>
            meal.id === id ? {...meal, ...updates} : meal
          ),
        },
      })),

    removeMeal: (id) =>
      set((state) => ({
        formData: {
          ...state.formData,
          meals: (state.formData.meals ?? []).filter((meal) => meal.id !== id),
        },
      })),

    createGroup: async ({name, description}) => {
      const profile = get().adminProfile;
      if (!profile || profile.role !== "super_admin") {
        set({toast: "⚠️ Only super admins can create groups."});
        return;
      }

      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        set({toast: "⚠️ Please provide a group name."});
        return;
      }

      const result = await createGroupService(firestore, {
        actorUid: profile.uid,
        name: trimmedName,
        description: (description || "").trim(),
      });

      if (!result.ok) {
        console.error("Create group error:", result.error);
        set({toast: "⚠️ Unable to create group right now."});
        return;
      }

      set({toast: "✅ Group created successfully."});
    },

    addGroupAdmin: async (groupId, adminEmail) => {
      const profile = get().adminProfile;
      if (!profile) {
        set({toast: "⚠️ Admin privileges required."});
        return;
      }
      const group = get().adminGroups.find((item) => item.id === groupId);
      const currentAdmins = (group?.admins || []).map(normalizeEmail);
      const normalizedProfileEmail = normalizeEmail(profile.email);
      const isSuperAdmin = profile.role === "super_admin";
      const hasGroupAuthority =
        currentAdmins.includes(normalizedProfileEmail) || isSuperAdmin;
      if (!hasGroupAuthority) {
        set({toast: "⚠️ You do not have permission to manage this group."});
        return;
      }

      const normalized = normalizeEmail(adminEmail);
      if (!normalized) {
        set({toast: "⚠️ Enter a valid admin email."});
        return;
      }

      const result = await assignGroupAdminService(firestore, {
        groupId,
        adminEmail: normalized,
      });

      if (!result.ok) {
        console.error("Add group admin error:", result.error);
        set({toast: "⚠️ Unable to add group admin."});
        return;
      }

      set({toast: "✅ Group admin added."});
    },

    removeGroupAdmin: async (groupId, adminEmail) => {
      const profile = get().adminProfile;
      if (!profile) {
        set({toast: "⚠️ Admin privileges required."});
        return;
      }
      const group = get().adminGroups.find((item) => item.id === groupId);
      const currentAdmins = (group?.admins || []).map(normalizeEmail);
      const normalizedProfileEmail = normalizeEmail(profile.email);
      const isSuperAdmin = profile.role === "super_admin";
      const hasGroupAuthority =
        currentAdmins.includes(normalizedProfileEmail) || isSuperAdmin;
      if (!hasGroupAuthority) {
        set({toast: "⚠️ You do not have permission to manage this group."});
        return;
      }

      const normalized = normalizeEmail(adminEmail);
      if (!normalized) {
        set({toast: "⚠️ Enter a valid admin email."});
        return;
      }

      const result = await removeGroupAdminService(firestore, {
        groupId,
        adminEmail: normalized,
      });

      if (!result.ok) {
        console.error("Remove group admin error:", result.error);
        set({toast: "⚠️ Unable to remove group admin."});
        return;
      }

      set({toast: "✅ Group admin removed."});
    },

  addGroupMember: async (groupId, memberEmail) => {
      const profile = get().adminProfile;
      if (!profile) {
        set({toast: "⚠️ Admin privileges required."});
        return;
      }
      const group = get().adminGroups.find((item) => item.id === groupId);
      const currentAdmins = (group?.admins || []).map(normalizeEmail);
      const normalizedProfileEmail = normalizeEmail(profile.email);
      const isSuperAdmin = profile.role === "super_admin";
      const hasGroupAuthority =
        currentAdmins.includes(normalizedProfileEmail) || isSuperAdmin;
      if (!hasGroupAuthority) {
        set({toast: "⚠️ You do not have permission to manage this group."});
        return;
      }

      const normalized = normalizeEmail(memberEmail);
      if (!normalized) {
        set({toast: "⚠️ Enter a valid user email."});
        return;
      }

      const result = await assignGroupMemberService(firestore, {
        groupId,
        memberEmail: normalized,
      });

      if (!result.ok) {
        console.error("Add group member error:", result.error);
        set({toast: "⚠️ Unable to assign user to group."});
        return;
      }

      set({toast: "✅ User assigned to group."});
    },

  removeGroupMember: async (groupId, memberEmail) => {
      const profile = get().adminProfile;
      if (!profile) {
        set({toast: "⚠️ Admin privileges required."});
        return;
      }
      const group = get().adminGroups.find((item) => item.id === groupId);
      const currentAdmins = (group?.admins || []).map(normalizeEmail);
      const normalizedProfileEmail = normalizeEmail(profile.email);
      const isSuperAdmin = profile.role === "super_admin";
      const hasGroupAuthority =
        currentAdmins.includes(normalizedProfileEmail) || isSuperAdmin;
      if (!hasGroupAuthority) {
        set({toast: "⚠️ You do not have permission to manage this group."});
        return;
      }

      const normalized = normalizeEmail(memberEmail);
      if (!normalized) {
        set({toast: "⚠️ Enter a valid user email."});
        return;
      }

      const result = await removeGroupMemberService(firestore, {
        groupId,
        memberEmail: normalized,
      });

      if (!result.ok) {
        console.error("Remove group member error:", result.error);
        set({toast: "⚠️ Unable to remove user from group."});
        return;
      }

      set({toast: "✅ User removed from group."});
    },

  adminSubscribeToUserEntries: async (userEmail) => {
    const profile = get().adminProfile;
    if (!profile) {
      set({toast: "⚠️ Admin privileges required."});
      return;
    }
    const normalized = normalizeEmail(userEmail);
    const directory = get().userDirectory;
    const target = directory.find((user) => normalizeEmail(user.email) === normalized);
    if (!target) {
      set({toast: "⚠️ Unknown user."});
      return;
    }

    const adminCanViewAll = profile.role === "super_admin";
    const groups = get().adminGroups;
    const assignedEmails = new Set();
    groups.forEach((group) => {
      (group.admins || []).forEach((email) => assignedEmails.add(normalizeEmail(email)));
      (group.members || []).forEach((email) => assignedEmails.add(normalizeEmail(email)));
    });
    if (!adminCanViewAll && !assignedEmails.has(normalized)) {
      set({toast: "⚠️ You do not manage this user."});
      return;
    }

    if (unsubscribeAdminUserEntries) {
      unsubscribeAdminUserEntries();
      unsubscribeAdminUserEntries = null;
    }

    const cacheKey = target.uid;
    const cached = adminEntriesCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < ENTRY_CACHE_TTL) {
      set({
        adminViewedEntries: cached.entries,
        adminViewedLoading: false,
        adminViewedUserEmail: userEmail,
        adminViewedUserId: target.uid,
      });
      return;
    }

    set({adminViewedLoading: true, adminViewedUserEmail: userEmail, adminViewedUserId: target.uid});
    try {
      const entries = await fetchUserEntriesOnce(firestore, target.uid);
      adminEntriesCache.set(cacheKey, {entries, timestamp: now});
      set({adminViewedEntries: entries, adminViewedLoading: false});
    } catch (error) {
      console.error("Admin user entries error:", error);
      set({toast: "⚠️ Unable to load user entries.", adminViewedEntries: [], adminViewedLoading: false});
    }
  },

  saveDietNote: async ({userEmail, date, note}) => {
    const profile = get().adminProfile;
    if (!profile) {
      set({toast: "⚠️ Admin privileges required."});
      return;
    }
    const normalized = normalizeEmail(userEmail);
    const directory = get().userDirectory;
    const target = directory.find((user) => normalizeEmail(user.email) === normalized);
    if (!target) {
      set({toast: "⚠️ Unknown user."});
      return;
    }

    const noteTrimmed = (note || "").trim();
    if (!noteTrimmed) {
      set({toast: "⚠️ Enter a note before saving."});
      return;
    }

    const entryRef = doc(firestore, DATA_COLLECTION, target.uid, "entries", date);
    try {
      await setDoc(entryRef, {}, {merge: true});
      await updateDoc(entryRef, {
        dietNotes: arrayUnion({
          note: noteTrimmed,
          author: profile.email,
          authorName: profile.displayName || "",
          createdAt: serverTimestamp(),
        }),
      });

      const newNote = {
        note: noteTrimmed,
        author: profile.email,
        authorName: profile.displayName || "",
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        if (state.adminViewedUserId !== target.uid) {
          return state;
        }
        const nextEntries = state.adminViewedEntries.map((entry) => {
          if (entry.date !== date) return entry;
          const existingNotes = Array.isArray(entry.dietNotes) ? entry.dietNotes : [];
          return {
            ...entry,
            dietNotes: [...existingNotes, newNote],
          };
        });
        return {adminViewedEntries: nextEntries};
      });

      const cacheKey = target.uid;
      const cached = adminEntriesCache.get(cacheKey);
      if (cached) {
        const updatedEntries = cached.entries.map((entry) => {
          if (entry.date !== date) return entry;
          const existingNotes = Array.isArray(entry.dietNotes) ? entry.dietNotes : [];
          return {
            ...entry,
            dietNotes: [...existingNotes, newNote],
          };
        });
        adminEntriesCache.set(cacheKey, {entries: updatedEntries, timestamp: Date.now()});
      }

      set({toast: "✅ Note saved."});
    } catch (error) {
      console.error("Save diet note error:", error);
      set({toast: "⚠️ Unable to save note right now."});
    }
  },

    getMealSuggestions: () => {
      const {trackingData} = get();
      const suggestionsMap = {};
      Object.values(trackingData).forEach((entry) => {
        normalizeMeals(entry?.meals ?? []).forEach((meal) => {
          const key = meal.name.toLowerCase();
          if (!key) return;
          if (!suggestionsMap[key]) {
            suggestionsMap[key] = {
              name: meal.name,
              unit: meal.unit,
              quantity: meal.quantity,
              category: meal.category,
              time: meal.time,
              count: 0,
            };
          }
          suggestionsMap[key].count += 1;
        });
      });
      return Object.values(suggestionsMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },

    clearForm: () => set({formData: createEmptyEntry()}),
  };
});

export default useTrackerStore;
