(() => {
  const dayColumns = document.querySelectorAll(".calendar-day-column");

  for (const dayColumn of dayColumns) {
    const eventElements = dayColumn.querySelectorAll("[data-calendar-event]");
    let positionsAreValid = true;

    for (const event of eventElements) {
      const top = Number(event.dataset.calendarTop);
      const height = Number(event.dataset.calendarHeight);
      const left = Number(event.dataset.calendarLeft);
      const width = Number(event.dataset.calendarWidth);
      const color = event.dataset.calendarColor || "";

      if (
        !Number.isFinite(top) ||
        !Number.isFinite(height) ||
        !Number.isFinite(left) ||
        !Number.isFinite(width) ||
        top < 0 ||
        height <= 0 ||
        left < 0 ||
        width <= 0 ||
        top + height > 1440.5 ||
        left + width > 100.5 ||
        !/^#[\da-f]{3,8}$/i.test(color)
      ) {
        positionsAreValid = false;
        continue;
      }

      event.style.top = `${top}px`;
      event.style.height = `${height}px`;
      event.style.left = `${left}%`;
      event.style.width = `${width}%`;
      event.style.setProperty("--event-color", color);
    }

    if (positionsAreValid) dayColumn.classList.add("calendar-positioned");
  }
})();
