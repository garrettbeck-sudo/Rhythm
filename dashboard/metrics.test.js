const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildWeeklyChartData,
  calculateCurrentWeekStats,
  getDashboardDateRanges,
} = require("./metrics");

test("dashboard ranges cover the current Monday-Sunday week and three weeks before it", () => {
  const ranges = getDashboardDateRanges("2026-11-04");

  assert.equal(ranges.currentWeekStart, "2026-11-02");
  assert.equal(ranges.currentWeekEnd, "2026-11-08");
  assert.equal(ranges.chartStart, "2026-10-12");
  assert.deepEqual(
    ranges.weeks.map(({ startDate, endDate }) => [startDate, endDate]),
    [
      ["2026-10-12", "2026-10-18"],
      ["2026-10-19", "2026-10-25"],
      ["2026-10-26", "2026-11-01"],
      ["2026-11-02", "2026-11-08"],
    ],
  );
});

test("Sunday dates remain in the Monday-Sunday week that is ending", () => {
  const ranges = getDashboardDateRanges("2026-11-08");

  assert.equal(ranges.currentWeekStart, "2026-11-02");
  assert.equal(ranges.currentWeekEnd, "2026-11-08");
});

test("current-week completion rate excludes unplanned items while workout and unplanned stats include them", () => {
  const ranges = getDashboardDateRanges("2026-11-04");
  const events = [
    { date: "2026-11-02", categoryName: "Workout", planned: true, completed: true },
    { date: "2026-11-03", categoryName: "Meal", planned: true, completed: true },
    { date: "2026-11-04", categoryName: "Workout", planned: true, completed: false },
    { date: "2026-11-05", categoryName: "Workout", planned: false, completed: true },
    { date: "2026-11-06", categoryName: "Meal", planned: false, completed: true },
    { date: "2026-11-09", categoryName: "Workout", planned: true, completed: true },
  ];

  assert.deepEqual(calculateCurrentWeekStats(events, ranges), {
    completionRate: 67,
    plannedCompleted: 2,
    plannedTotal: 3,
    workoutsCompleted: 2,
    unplannedEventsLogged: 2,
  });
});

test("weekly chart data separates planned and completed counts by category", () => {
  const ranges = getDashboardDateRanges("2026-11-04");
  const events = [
    { date: "2026-10-12", categoryId: 1, planned: true, completed: false },
    { date: "2026-10-13", categoryId: 1, planned: true, completed: true },
    { date: "2026-10-13", categoryId: 1, planned: false, completed: true },
    { date: "2026-11-08", categoryId: 2, planned: true, completed: false },
    { date: "2026-11-09", categoryId: 1, planned: true, completed: true },
  ];
  const categories = [
    { id: 1, name: "Workout", color: "#718f72" },
    { id: 2, name: "Meal", color: "#d99b70" },
  ];
  const chart = buildWeeklyChartData(events, categories, ranges.weeks);

  assert.equal(chart.labels.length, 4);
  assert.deepEqual(chart.datasets[0].data, [2, 0, 0, 0]);
  assert.deepEqual(chart.datasets[1].data, [2, 0, 0, 0]);
  assert.equal(chart.datasets[1].stack, "completed");
  assert.deepEqual(chart.datasets[2].data, [0, 0, 0, 1]);
});

test("a week with no planned items has a zero completion rate", () => {
  const ranges = getDashboardDateRanges("2026-11-04");

  assert.equal(
    calculateCurrentWeekStats([
      { date: "2026-11-05", categoryName: "Workout", planned: false, completed: true },
    ], ranges).completionRate,
    0,
  );
});
