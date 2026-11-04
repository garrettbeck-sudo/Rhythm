const test = require("node:test");
const assert = require("node:assert/strict");
const { getCalendarWeekRange } = require("../calendar/week");
const { renderEventFormPage, renderRoutineFormPage, renderWeekPage } = require("./pages");

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

test("event form permits both times to be left blank", () => {
  const html = renderEventFormPage({
    mode: "create",
    event: { startTime: null, endTime: null },
    categories: [],
    email: "user@example.test",
    csrfToken: "csrf",
  });

  assert.match(html, /Leave both blank to place this event in the Any Time row/);
  assert.doesNotMatch(html, /id="event-start"[^>]*required/);
  assert.doesNotMatch(html, /id="event-end"[^>]*required/);
  assert.match(html, /src="\/assets\/events\.js\?v=3"/);
});

test("event conflict warning names conflicts and offers explicit choices", () => {
  const html = renderEventFormPage({
    mode: "create",
    event: { title: "Morning run", startTime: "07:00", endTime: "08:00" },
    categories: [{ id: 1, name: "Workout" }],
    email: "user@example.test",
    csrfToken: "csrf",
    conflicts: [
      { id: 42, title: "Team meeting", startTime: "07:30", endTime: "08:30" },
    ],
  });

  assert.match(html, /Team meeting/);
  assert.match(html, /Team meeting<\/strong><span>07:30/);
  assert.match(html, /name="conflictAction" value="save"/);
  assert.match(html, /name="conflictAction" value="back"/);
  assert.match(html, /name="confirmedConflictIds" value="42"/);
  assert.match(html, /Saving anyway will remove the conflicting event listed here/);
});
