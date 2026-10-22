function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function recordActivity(streak, type) {
  const today = dateKey();
  const next = {
    ...streak,
    activityDates: { ...(streak.activityDates || {}) },
    todayActivities: Array.isArray(streak.todayActivities) ? [...streak.todayActivities] : []
  };

  if (!next.activityDates[today]) next.activityDates[today] = [];
  if (!next.activityDates[today].includes(type)) next.activityDates[today].push(type);
  next.todayActivities = next.activityDates[today];

  if (next.todayActivities.length >= 3 && next.lastQualifiedDate !== today) {
    if (next.lastQualifiedDate === yesterdayKey()) {
      next.current = (next.current || 0) + 1;
    } else {
      next.current = 1;
    }
    next.best = Math.max(next.best || 0, next.current);
    next.lastQualifiedDate = today;
  }

  return next;
}

export function getTodayActivities(streak) {
  return streak.activityDates?.[dateKey()] || [];
}

export { dateKey };