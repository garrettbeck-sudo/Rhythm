const WEEKS_TO_SHOW = 4;

function formatDateOnly(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateOnly(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Dashboard dates must be valid Date objects or YYYY-MM-DD strings.");
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new TypeError("Dashboard dates must be valid calendar dates.");
  }
  return value;
}

function addDays(dateValue, days) {
  const [year, month, day] = normalizeDate(dateValue).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function formatWeekLabel(startDate, endDate) {
  const parts = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return {
      year: date.getUTCFullYear(),
      month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      day: date.getUTCDate(),
    };
  };
  const start = parts(startDate);
  const end = parts(endDate);
  const startLabel = `${start.month} ${start.day}`;
  const endLabel = start.month === end.month && start.year === end.year
    ? String(end.day)
    : `${end.month} ${end.day}`;
  return `${startLabel}–${endLabel}`;
}

function getDashboardDateRanges(today = new Date()) {
  const todayDate = normalizeDate(today);
  const [year, month, day] = todayDate.split("-").map(Number);
  const parsedToday = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (parsedToday.getUTCDay() + 6) % 7;
  const currentWeekStart = addDays(todayDate, -daysSinceMonday);
  const currentWeekEnd = addDays(currentWeekStart, 6);
  const chartStart = addDays(currentWeekStart, -7 * (WEEKS_TO_SHOW - 1));
  const weeks = Array.from({ length: WEEKS_TO_SHOW }, (_, index) => {
    const startDate = addDays(chartStart, index * 7);
    const endDate = addDays(startDate, 6);
    return { startDate, endDate, label: formatWeekLabel(startDate, endDate) };
  });

  return {
    chartStart,
    currentWeekStart,
    currentWeekEnd,
    weeks,
  };
}

function eventFallsWithinWeek(event, week) {
  return event.date >= week.startDate && event.date <= week.endDate;
}

function buildWeeklyChartData(events, categories, weeks) {
  const sourceEvents = Array.isArray(events) ? events : [];
  return {
    labels: weeks.map((week) => week.label),
    datasets: categories.flatMap((category) => [
      {
        label: `${category.name} · Planned`,
        categoryId: category.id,
        categoryName: category.name,
        metric: "planned",
        stack: "planned",
        color: category.color,
        data: weeks.map((week) => sourceEvents.filter((event) =>
          event.categoryId === category.id &&
          event.planned === true &&
          eventFallsWithinWeek(event, week)
        ).length),
      },
      {
        label: `${category.name} · Completed`,
        categoryId: category.id,
        categoryName: category.name,
        metric: "completed",
        stack: "completed",
        color: category.color,
        data: weeks.map((week) => sourceEvents.filter((event) =>
          event.categoryId === category.id &&
          event.completed === true &&
          eventFallsWithinWeek(event, week)
        ).length),
      },
    ]),
  };
}

function calculateCurrentWeekStats(events, ranges) {
  const currentWeekEvents = events.filter((event) =>
    event.date >= ranges.currentWeekStart && event.date <= ranges.currentWeekEnd
  );
  const plannedEvents = currentWeekEvents.filter((event) => event.planned === true);
  const plannedCompleted = plannedEvents.filter((event) => event.completed === true);
  const workoutsCompleted = currentWeekEvents.filter((event) =>
    event.categoryName === "Workout" && event.completed === true
  ).length;
  const unplannedEventsLogged = currentWeekEvents.filter((event) => event.planned === false).length;

  return {
    completionRate: plannedEvents.length === 0 ? 0 : Math.round((plannedCompleted.length / plannedEvents.length) * 100),
    plannedCompleted: plannedCompleted.length,
    plannedTotal: plannedEvents.length,
    workoutsCompleted,
    unplannedEventsLogged,
  };
}

module.exports = {
  buildWeeklyChartData,
  calculateCurrentWeekStats,
  getDashboardDateRanges,
};
