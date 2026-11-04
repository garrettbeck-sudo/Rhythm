const test = require("node:test");
const assert = require("node:assert/strict");
const { getCalendarWeekRange } = require("../calendar/week");
const { renderRoutineFormPage, renderWeekPage } = require("./pages");

test("untimed routine events render above the hourly grid without a time label", () => {
  const html = renderWeekPage({
    email: "user@example.test",
    csrfToken: "csrf",
    range: getCalendarWeekRange("2026-11-04"),
    events: [
      {
        id: 101,
        title: "Sunday stretch",
        categoryName: "Habit",
        categoryColor: "#6688bf",
        date: "2026-11-01",
        startTime: null,
        endTime: null,
        planned: true,
        completed: false,
      },
      {
        id: 102,
        title: "Timed workout",
        categoryName: "Workout",
        categoryColor: "#648b68",
        date: "2026-11-03",
        startTime: "06:00",
        endTime: "06:30",
        planned: true,
        completed: false,
      },
    ],
  });

  const allDayRowPosition = html.indexOf("calendar-all-day-row");
  const hourlyGridPosition = html.indexOf("calendar-grid-body");
  assert.ok(allDayRowPosition >= 0 && allDayRowPosition < hourlyGridPosition);
  const allDayCard = html.slice(html.indexOf("calendar-all-day-event"), html.indexOf("</article>", html.indexOf("calendar-all-day-event")) + 10);
  assert.match(allDayCard, /Sunday stretch/);
  assert.match(allDayCard, /href="\/events\/101"/);
  assert.match(allDayCard, /data-event-checkbox/);
  assert.doesNotMatch(allDayCard, /calendar-event-time/);
  assert.match(html, /6:00 AM–6:30 AM/);
});

test("routine form shows and preserves routine notes", () => {
  const html = renderRoutineFormPage({
    mode: "edit",
    routine: {
      id: 12,
      title: "Evening walk",
      notes: "Bring a water bottle",
      categoryId: 3,
      dayOfWeek: 2,
      startTime: null,
      endTime: null,
      active: true,
    },
    categories: [{ id: 3, name: "Habit" }],
    email: "user@example.test",
    csrfToken: "csrf",
  });

  assert.match(html, /name="notes"/);
  assert.match(html, /Bring a water bottle/);
});
