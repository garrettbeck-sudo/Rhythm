const test = require("node:test");
const assert = require("node:assert/strict");
const { getCalendarWeekRange, isValidDateOnly } = require("./week");

test("weekly calendar uses Sunday through Saturday and provides adjacent weeks", () => {
  const range = getCalendarWeekRange("2026-11-04", "2026-11-04");

  assert.equal(range.weekStart, "2026-11-01");
  assert.equal(range.weekEnd, "2026-11-07");
  assert.equal(range.previousWeekStart, "2026-10-25");
  assert.equal(range.nextWeekStart, "2026-11-08");
  assert.equal(range.label, "Nov 1–7, 2026");
  assert.deepEqual(range.days.map((day) => day.dayName), [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ]);
  assert.equal(range.days[3].isToday, true);
});

test("date validation rejects malformed and impossible calendar dates", () => {
  assert.equal(isValidDateOnly("2024-02-29"), true);
  assert.equal(isValidDateOnly("2026-02-29"), false);
  assert.equal(isValidDateOnly("2026-2-09"), false);
  assert.equal(isValidDateOnly("not-a-date"), false);
});

test("a Saturday selection stays in its Sunday-starting week", () => {
  const range = getCalendarWeekRange("2026-11-07");

  assert.equal(range.weekStart, "2026-11-01");
  assert.equal(range.weekEnd, "2026-11-07");
});
