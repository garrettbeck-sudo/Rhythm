(() => {
  const form = document.querySelector("[data-event-form]");
  if (!form) return;

  const categorySelect = form.querySelector("[data-category-select]");
  const conditionalFields = Array.from(form.querySelectorAll("[data-category-field]"));
  const validationFields = ["title", "categoryId", "date", "startTime", "endTime"];

  function updateCategoryFields() {
    if (!categorySelect) return;
    const selectedOption = categorySelect.selectedOptions[0];
    const selectedCategory = selectedOption?.dataset.categoryName || "";

    for (const field of conditionalFields) {
      const visible = field.dataset.categoryField === selectedCategory;
      field.hidden = !visible;
      if (!visible) {
        const input = field.querySelector("input");
        if (input) input.value = "";
      }
    }
  }

  function timeInSeconds(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,6})?)?$/.exec(value);
    if (!match) return null;
    const fraction = match[4] ? Number(`0.${match[4]}`) : 0;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0) + fraction;
  }

  function validDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function collectErrors() {
    const title = form.elements.namedItem("title");
    const category = form.elements.namedItem("categoryId");
    const date = form.elements.namedItem("date");
    const startTime = form.elements.namedItem("startTime");
    const endTime = form.elements.namedItem("endTime");
    const errors = {};

    if (!title.value.trim()) errors.title = "Please add a title.";
    if (!category.value) errors.categoryId = "Please choose a category.";
    if (!date.value) errors.date = "Please choose a date.";
    else if (!validDate(date.value)) errors.date = "Please choose a valid date.";

    const startSeconds = startTime.value ? timeInSeconds(startTime.value) : null;
    const endSeconds = endTime.value ? timeInSeconds(endTime.value) : null;
    if (!startTime.value) errors.startTime = "Please add a start time.";
    else if (startSeconds === null) errors.startTime = "Please enter a valid start time.";
    if (!endTime.value) errors.endTime = "Please add an end time.";
    else if (endSeconds === null) errors.endTime = "Please enter a valid end time.";
    if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds) {
      errors.endTime = "End time must be after start time.";
    }

    return errors;
  }

  function showErrors(errors) {
    for (const name of validationFields) {
      const field = form.elements.namedItem(name);
      const message = errors[name] || "";
      const errorElement = form.querySelector(`[data-field-error="${name}"]`);
      if (!field || !errorElement) continue;

      errorElement.textContent = message;
      errorElement.hidden = !message;
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
  }

  let validationAttempted = validationFields.some((name) => {
    const errorElement = form.querySelector(`[data-field-error="${name}"]`);
    return errorElement && !errorElement.hidden && errorElement.textContent.trim();
  });

  form.addEventListener("invalid", (event) => {
    if (!validationFields.includes(event.target.name)) return;
    event.preventDefault();
    validationAttempted = true;
    showErrors(collectErrors());
  }, true);

  form.addEventListener("submit", (event) => {
    validationAttempted = true;
    const errors = collectErrors();
    showErrors(errors);
    if (Object.keys(errors).length) {
      event.preventDefault();
      const firstInvalid = validationFields.find((name) => errors[name]);
      if (firstInvalid) form.elements.namedItem(firstInvalid).focus();
    }
  });

  function refreshValidation() {
    if (validationAttempted) showErrors(collectErrors());
  }

  form.addEventListener("input", refreshValidation);
  form.addEventListener("change", (event) => {
    if (event.target === categorySelect) updateCategoryFields();
    refreshValidation();
  });

  updateCategoryFields();
})();
