const assert = require("node:assert/strict");
const test = require("node:test");
const { renderEventFormPage, renderRoutineFormPage } = require("../views/pages");

const categories = [{ id: 1, name: "Workout", isFixed: false }];
const email = "rhythm-test@example.test";
const csrfToken = "test-csrf-token";

function optionsFor(html, fieldId) {
  const match = html.match(new RegExp(`<select id="${fieldId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  assert.ok(match, `${fieldId} should render as a select`);
  return match[1];
}

function eventPage(mode, event = {}) {
  return renderEventFormPage({
    mode,
    event,
    categories,
    email,
    csrfToken,
    errors: {},
  });
}

function routinePage(mode, routine = {}) {
  return renderRoutineFormPage({
    mode,
    routine,
    categories,
    email,
    csrfToken,
    errors: {},
  });
}

test("event forms use 15-minute dropdowns for add, edit, and unplanned flows", () => {
  for (const mode of ["create", "edit", "unplanned"]) {
    const html = eventPage(mode);
    const startOptions = optionsFor(html, "event-start");
    const endOptions = optionsFor(html, "event-end");

    assert.match(startOptions, /^<option value="">No time<\/option>/);
    assert.match(startOptions, /<option value="00:00"(?: selected)?>12:00 AM<\/option>/);
    assert.match(startOptions, /<option value="00:15"(?: selected)?>12:15 AM<\/option>/);
    assert.match(startOptions, /<option value="12:00"(?: selected)?>12:00 PM<\/option>/);
    assert.match(startOptions, /<option value="23:45"(?: selected)?>11:45 PM<\/option>/);
    assert.doesNotMatch(html, /<input id="event-(?:start|end)"[^>]*type="time"/);
    assert.ok(endOptions.includes('<option value="07:15">7:15 AM</option>'));
  }
});

test("routine forms use 15-minute dropdowns for add and edit", () => {
  for (const mode of ["create", "edit"]) {
    const html = routinePage(mode);

    assert.match(optionsFor(html, "routine-start"), /^<option value="">No time<\/option>/);
    assert.ok(optionsFor(html, "routine-start").includes('<option value="23:45">11:45 PM</option>'));
    assert.ok(optionsFor(html, "routine-end").includes('<option value="07:15">7:15 AM</option>'));
    assert.doesNotMatch(html, /<input id="routine-(?:start|end)"[^>]*type="time"/);
  }
});

test("editing preserves a saved off-grid time as a selected old-time option", () => {
  const eventHtml = eventPage("edit", {
    id: 8,
    title: "Tempo run",
    categoryId: 1,
    date: "2026-11-05",
    startTime: "07:07",
    endTime: "08:00",
  });
  const routineHtml = routinePage("edit", {
    id: 9,
    title: "Tempo run",
    categoryId: 1,
    dayOfWeek: 4,
    startTime: "07:07",
    endTime: "08:00",
  });

  assert.ok(optionsFor(eventHtml, "event-start").includes('<option value="07:07" selected>7:07 AM (old time)</option>'));
  assert.ok(optionsFor(routineHtml, "routine-start").includes('<option value="07:07" selected>7:07 AM (old time)</option>'));
});

test("event conflict choices remain available with the time dropdowns", () => {
  const html = renderEventFormPage({
    mode: "create",
    event: { title: "Tempo run", categoryId: 1, date: "2026-11-05", startTime: "07:15", endTime: "08:00" },
    categories,
    email,
    csrfToken,
    conflicts: [{ id: 17, title: "Class", startTime: "07:30", endTime: "08:15" }],
  });

  assert.ok(optionsFor(html, "event-start").includes('<option value="07:15" selected>7:15 AM</option>'));
  assert.match(html, /name="conflictAction" value="back"/);
  assert.match(html, /name="conflictAction" value="save"/);
});
