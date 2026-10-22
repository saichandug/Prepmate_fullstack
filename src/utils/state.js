export const defaultProgress = {
  codingCompletion: {},
  roadmapCompletion: {},
  mockHistory: [],
  streak: {
    current: 0,
    best: 0,
    todayActivities: [],
    lastQualifiedDate: null,
    activityDates: {}
  },
  analyzer: {
    text: "",
    result: null
  },
  roadmap: null
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

// Shapes whatever the server returns into the state the UI expects.
export function buildState(applications, progress) {
  const raw = isObject(progress) ? progress : {};
  const streak = { ...defaultProgress.streak, ...(isObject(raw.streak) ? raw.streak : {}) };
  streak.todayActivities = Array.isArray(streak.todayActivities) ? streak.todayActivities : [];
  streak.activityDates = isObject(streak.activityDates) ? streak.activityDates : {};

  return {
    applications: Array.isArray(applications) ? applications : [],
    codingCompletion: isObject(raw.codingCompletion) ? raw.codingCompletion : {},
    roadmapCompletion: isObject(raw.roadmapCompletion) ? raw.roadmapCompletion : {},
    mockHistory: Array.isArray(raw.mockHistory) ? raw.mockHistory : [],
    streak,
    analyzer: { ...defaultProgress.analyzer, ...(isObject(raw.analyzer) ? raw.analyzer : {}) },
    roadmap: isObject(raw.roadmap) ? raw.roadmap : null
  };
}

// The part of the state that is saved through PUT /api/progress (applications have their own endpoints).
export function pickProgress(state) {
  const { codingCompletion, roadmapCompletion, mockHistory, streak, analyzer, roadmap } = state;
  return { codingCompletion, roadmapCompletion, mockHistory, streak, analyzer, roadmap };
}
