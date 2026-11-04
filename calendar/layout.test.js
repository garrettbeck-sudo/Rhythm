const test = require("node:test");
const assert = require("node:assert/strict");
const { layoutCalendarEvents, timeToMinutes } = require("./layout");

test("calendar events map their start and duration to minute-based positions", () => {
  const layout = layoutCalendarEvents([
    { id: 1, startTime: "06:00", endTime: "07:00" },
    { id: 2, startTime: "09:30", endTime: "10:15" },
  ]);

  assert.deepEqual(layout.map(({ top, height, left, width }) => ({ top, height, left, width })), [
    { top: 360, height: 60, left: 0, width: 100 },
    { top: 570, height: 45, left: 0, width: 100 },
  ]);
});

test("overlapping events get separate horizontal lanes instead of covering each other", () => {
  const layout = layoutCalendarEvents([
    { id: 1, startTime: "08:00", endTime: "09:00" },
    { id: 2, startTime: "08:30", endTime: "09:30" },
    { id: 3, startTime: "10:00", endTime: "10:30" },
  ]);

  assert.deepEqual(layout.map(({ top, left, width }) => ({ top, left, width })), [
    { top: 480, left: 0, width: 50 },
    { top: 510, left: 50, width: 50 },
    { top: 600, left: 0, width: 100 },
  ]);
});

test("calendar time parsing maps midnight and noon to the correct hour positions", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("12:00"), 720);
  assert.equal(timeToMinutes("23:59"), 1439);
});
