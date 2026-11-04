const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const eventScript = fs.readFileSync(path.join(__dirname, "events.js"), "utf8");

function submitEventForm({ startTime = "", endTime = "" } = {}) {
  const fieldNames = ["title", "categoryId", "date", "startTime", "endTime"];
  const fields = Object.fromEntries(fieldNames.map((name) => [
    name,
    {
      value: ({
        title: "Walk",
        categoryId: "3",
        date: "2026-11-03",
        startTime,
        endTime,
      })[name],
      setAttribute() {},
      removeAttribute() {},
      focus() {},
    },
  ]));
  const errors = Object.fromEntries(fieldNames.map((name) => [
    name,
    { hidden: true, textContent: "" },
  ]));
  const listeners = {};
  const form = {
    elements: { namedItem: (name) => fields[name] },
    querySelector(selector) {
      const match = selector.match(/data-field-error="([^"]+)"/);
      return match ? errors[match[1]] : null;
    },
    querySelectorAll: () => [],
    addEventListener(type, callback) { listeners[type] = callback; },
  };
  const document = {
    querySelector: (selector) => selector === "[data-event-form]" ? form : null,
    querySelectorAll: () => [],
  };

  vm.runInNewContext(eventScript, { document });
  let prevented = false;
  listeners.submit({ preventDefault() { prevented = true; } });
  return { prevented, errors };
}

test("event form accepts an empty time pair", () => {
  const result = submitEventForm();
  assert.equal(result.prevented, false);
});

test("event form rejects a partial time pair", () => {
  const result = submitEventForm({ startTime: "06:00" });
  assert.equal(result.prevented, true);
  assert.equal(result.errors.endTime.textContent, "Add both times, or leave both blank.");
});

test("event form accepts valid timed events and rejects reversed times", () => {
  assert.equal(submitEventForm({ startTime: "06:00", endTime: "07:00" }).prevented, false);
  assert.equal(submitEventForm({ startTime: "07:00", endTime: "06:00" }).prevented, true);
});
