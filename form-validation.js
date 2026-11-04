const TIME_INTERVAL_ERROR = "Times must be on the hour or at :15, :30, or :45.";

function parsePositiveId(value) {
  if ((typeof value !== "string" && typeof value !== "number") || !/^[1-9]\d*$/.test(String(value))) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function parseOptionalNumber(value) {
  if (value.trim() === "") return { valid: true, value: null };
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? { valid: true, value: parsed }
    : { valid: false, value: null };
}

function parseTimeInSeconds(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60;
}

function isQuarterHourTime(value) {
  return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(value);
}

function isValidEventDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateTimePair(startTime, endTime, errors) {
  if (Boolean(startTime) !== Boolean(endTime)) {
    if (!startTime) errors.startTime = "Add both times, or leave both blank.";
    if (!endTime) errors.endTime = "Add both times, or leave both blank.";
  }

  const startSeconds = startTime ? parseTimeInSeconds(startTime) : null;
  const endSeconds = endTime ? parseTimeInSeconds(endTime) : null;

  if (startTime && startSeconds === null) errors.startTime = "Please enter a valid start time.";
  if (endTime && endSeconds === null) errors.endTime = "Please enter a valid end time.";
  if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds) {
    errors.endTime = "End time must be after start time.";
  }
  if (startSeconds !== null && !isQuarterHourTime(startTime)) {
    errors.startTime = TIME_INTERVAL_ERROR;
  }
  if (endSeconds !== null && !isQuarterHourTime(endTime)) {
    errors.endTime = TIME_INTERVAL_ERROR;
  }
}

function parseEventForm(form, availableCategories) {
  const categoryId = parsePositiveId(form.categoryId);
  const category = availableCategories.find((item) => item.id === categoryId);
  const title = form.title.trim();
  const date = form.date.trim();
  const startTime = form.startTime.trim();
  const endTime = form.endTime.trim();
  const errors = {};

  if (!title) errors.title = "Please add a title.";
  if (!category) errors.categoryId = "Please choose a category.";
  if (!date) errors.date = "Please choose a date.";
  else if (!isValidEventDate(date)) errors.date = "Please choose a valid date.";
  validateTimePair(startTime, endTime, errors);

  if (Object.keys(errors).length) return { errors };

  const distance = category.name === "Workout"
    ? parseOptionalNumber(form.distanceMi)
    : { valid: true, value: null };
  const protein = category.name === "Meal"
    ? parseOptionalNumber(form.proteinG)
    : { valid: true, value: null };
  if (!distance.valid || !protein.valid) {
    return { error: "Enter a valid number for the event details." };
  }

  return {
    values: {
      title,
      categoryId,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      notes: form.notes.trim() || null,
      distanceMi: distance.value,
      proteinG: protein.value,
    },
  };
}

function parseRoutineForm(form, availableCategories) {
  const title = form.title.trim();
  const notes = form.notes.trim();
  const categoryId = parsePositiveId(form.categoryId);
  const category = availableCategories.find((item) => item.id === categoryId);
  const dayOfWeek = /^[0-6]$/.test(form.dayOfWeek) ? Number(form.dayOfWeek) : null;
  const startTime = form.startTime.trim();
  const endTime = form.endTime.trim();
  const errors = {};

  if (!title) errors.title = "Please add a title.";
  else if (title.length > 180) errors.title = "Please keep the title under 180 characters.";
  if (notes.length > 2000) errors.notes = "Please keep notes under 2,000 characters.";
  if (!category) errors.categoryId = "Please choose a category.";
  if (dayOfWeek === null) errors.dayOfWeek = "Please choose a day.";
  validateTimePair(startTime, endTime, errors);

  if (Object.keys(errors).length) return { errors };
  return {
    values: {
      title,
      notes: notes || null,
      categoryId,
      dayOfWeek,
      startTime: startTime || null,
      endTime: endTime || null,
      active: Boolean(form.active),
    },
  };
}

module.exports = {
  TIME_INTERVAL_ERROR,
  isQuarterHourTime,
  parseEventForm,
  parseRoutineForm,
};
