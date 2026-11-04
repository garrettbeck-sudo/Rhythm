const assert = require("node:assert/strict");
const test = require("node:test");
const {
  TIME_INTERVAL_ERROR,
  parseEventForm,
  parseRoutineForm,
} = require("../form-validation");

const categories = [{ id: 1, name: "Workout" }];

function eventForm(startTime, endTime) {
  return {
    title: "Tempo run",
    categoryId: "1",
    date: "2026-11-05",
    startTime,
    endTime,
    notes: "",
    distanceMi: "",
    proteinG: "",
  };
}

function routineForm(startTime, endTime) {
  return {
    title: "Tempo run",
    notes: "",
    categoryId: "1",
    dayOfWeek: "4",
    startTime,
    endTime,
    active: true,
  };
}

test("events reject a start time at 07:07", () => {
  const result = parseEventForm(eventForm("07:07", "08:00"), categories);

  assert.equal(result.errors.startTime, TIME_INTERVAL_ERROR);
});

test("events accept a start time at 07:15", () => {
  const result = parseEventForm(eventForm("07:15", "08:00"), categories);

  assert.equal(result.values.startTime, "07:15");
  assert.equal(result.values.endTime, "08:00");
});

test("events still accept both times blank", () => {
  const result = parseEventForm(eventForm("", ""), categories);

  assert.equal(result.values.startTime, null);
  assert.equal(result.values.endTime, null);
});

test("routines reject a start time at 07:07", () => {
  const result = parseRoutineForm(routineForm("07:07", "08:00"), categories);

  assert.equal(result.errors.startTime, TIME_INTERVAL_ERROR);
});

test("routines accept a start time at 07:15", () => {
  const result = parseRoutineForm(routineForm("07:15", "08:00"), categories);

  assert.equal(result.values.startTime, "07:15");
  assert.equal(result.values.endTime, "08:00");
});

test("routines still accept both times blank", () => {
  const result = parseRoutineForm(routineForm("", ""), categories);

  assert.equal(result.values.startTime, null);
  assert.equal(result.values.endTime, null);
});
