const test = require("node:test");
const assert = require("node:assert/strict");
const { buildRoutineEventValues } = require("./generation");
const { getCalendarWeekRange } = require("../calendar/week");

test("active routines create planned events only on their matching weekdays", () => {
  const week = getCalendarWeekRange("2026-11-04").days;
  const generated = buildRoutineEventValues(41, [
    { id: 7, categoryId: 1, title: "Tuesday intervals", notes: "Bring a towel", dayOfWeek: 2, startTime: "06:00", endTime: "06:45", active: true },
    { id: 8, categoryId: 2, title: "Paused meal prep", dayOfWeek: 2, startTime: "07:00", endTime: "07:30", active: false },
    { id: 9, categoryId: 3, title: "Saturday walk", dayOfWeek: 6, startTime: "09:00", endTime: "10:00", active: true },
    { id: 10, categoryId: 3, title: "Sunday stretch", dayOfWeek: 0, startTime: null, endTime: null, active: true },
  ], week);

  assert.deepEqual(generated.map(({ routineId, date, title }) => ({ routineId, date, title })), [
    { routineId: 10, date: "2026-11-01", title: "Sunday stretch" },
    { routineId: 7, date: "2026-11-03", title: "Tuesday intervals" },
    { routineId: 9, date: "2026-11-07", title: "Saturday walk" },
  ]);
  assert.ok(generated.every((event) => event.userId === 41 && event.planned && !event.completed));
  assert.equal(generated.find((event) => event.routineId === 7).notes, "Bring a towel");
  const untimed = generated.find((event) => event.routineId === 10);
  assert.equal(untimed.startTime, null);
  assert.equal(untimed.endTime, null);
});
