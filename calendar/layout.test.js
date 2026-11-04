const test = require("node:test");
const assert = require("node:assert/strict");
const { layoutCalendarEvents, timeToMinutes } = require("./layout");

test("calendar events map their start and duration to minute-based positions", () => {
  const layout = layoutCalendarEvents([
    { id: 1, startTime: "06:00", endTime: "07:00" },
    { id: 2, startTime: "09:30", endTime: "10:15" },
  ]);

  assert.deepEqual(layout.map(({ top, height, left, width }) => ({ top, height, left, width })), [
    { top: 60, height: 60, left: 0, width: 100 },
    { top: 270, height: 45, left: 0, width: 100 },
  ]);
});

test("overlapping events get separate horizontal lanes instead of covering each other", () => {
  const layout = layoutCalendarEvents([
    { id: 1, startTime: "08:00", endTime: "09:00" },
    { id: 2, startTime: "08:30", endTime: "09:30" },
    { id: 3, startTime: "10:00", endTime: "10:30" },
  ]);

  assert.deepEqual(layout.map(({ top, left, width }) => ({ top, left, width })), [
    { top: 180, left: 0, width: 50 },
    { top: 210, left: 50, width: 50 },
    { top: 300, left: 0, width: 100 },
  ]);
});

test("calendar time parsing maps midnight and noon to the correct hour positions", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("12:00"), 720);
  assert.equal(timeToMinutes("23:59"), 1439);
});

test("the calendar day runs from 5 AM to midnight and omits earlier events", () => {
  const layout = layoutCalendarEvents([
    { id: 1, startTime: "05:00", endTime: "06:00" },
    { id: 2, startTime: "06:30", endTime: "07:00" },
    { id: 3, startTime: "23:00", endTime: "23:30" },
    { id: 4, startTime: "23:45", endTime: "23:59" },
    { id: 5, startTime: "04:00", endTime: "04:30" },
  ]);

  assert.deepEqual(layout.map(({ event, top, height }) => [event.id, top, height]), [
    [1, 0, 60],
    [2, 90, 30],
    [3, 1080, 30],
    [4, 1125, 15],
  ]);
  assert.equal(layout.some(({ event }) => event.id === 5), false);
});

test("untimed events are kept out of the hourly time grid", () => {
  assert.deepEqual(layoutCalendarEvents([
    { id: 1, startTime: null, endTime: null },
  ]), []);
});
