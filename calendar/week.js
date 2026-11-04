function formatDateOnly(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateOnly(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (!isValidDateOnly(value)) {
    throw new TypeError("Calendar dates must be valid Date objects or YYYY-MM-DD strings.");
  }
  return value;
}

function addDays(value, amount) {
  const [year, month, day] = normalizeDate(value).split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return formatDateOnly(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate());
}

function dateParts(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    date,
    year: date.getUTCFullYear(),
    month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
    day: date.getUTCDate(),
  };
}

function formatWeekLabel(startDate, endDate) {
  const start = dateParts(startDate);
  const end = dateParts(endDate);
  if (start.year !== end.year) {
    return `${start.month} ${start.day}, ${start.year}–${end.month} ${end.day}, ${end.year}`;
  }
  if (start.month === end.month) {
    return `${start.month} ${start.day}–${end.day}, ${end.year}`;
  }
  return `${start.month} ${start.day}–${end.month} ${end.day}, ${end.year}`;
}

function getCalendarWeekRange(referenceDate = new Date(), today = new Date()) {
  const selectedDate = normalizeDate(referenceDate);
  const todayDate = normalizeDate(today);
  const [year, month, day] = selectedDate.split("-").map(Number);
  const selected = new Date(Date.UTC(year, month - 1, day));
  const weekStart = addDays(selectedDate, -selected.getUTCDay());
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return {
      date,
      dayName: new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(parsed),
      dayNumber: parsed.getUTCDate(),
      isToday: date === todayDate,
    };
  });

  return {
    weekStart,
    weekEnd,
    previousWeekStart: addDays(weekStart, -7),
    nextWeekStart: addDays(weekStart, 7),
    label: formatWeekLabel(weekStart, weekEnd),
    days,
  };
}

module.exports = { getCalendarWeekRange, isValidDateOnly };
