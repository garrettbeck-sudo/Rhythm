function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell({ title, content, bodyClass = "", scripts = [] }) {
  const scriptTags = scripts
    .map((src) => `<script src="${escapeHtml(src)}" defer></script>`)
    .join("\n    ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f6ef">
    <title>${escapeHtml(title)} · Rhythm</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body class="${bodyClass}">
    ${content}
    ${scriptTags}
  </body>
</html>`;
}

function brandMark() {
  return `<a class="brand" href="/week" aria-label="Rhythm home">
    <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
    <span class="brand-name">rhythm</span>
  </a>`;
}

function renderAuthPage({ mode, error, notice, csrfToken }) {
  const isSignup = mode === "signup";
  const action = isSignup ? "/signup" : "/login";
  const heading = isSignup ? "Make room for your life." : "Good to have you back.";
  const intro = isSignup
    ? "A little space to bring classes, work, movement, meals, and the small things that make a week feel like yours."
    : "Pick up where you left off, and take the week one day at a time.";
  const submitLabel = isSignup ? "Create your account" : "Log in";
  const switchCopy = isSignup ? "Already have an account?" : "New to Rhythm?";
  const switchLabel = isSignup ? "Log in" : "Create an account";
  const switchHref = isSignup ? "/login" : "/signup";
  const safeError = error ? escapeHtml(error) : "";
  const safeNotice = notice ? escapeHtml(notice) : "";
  const safeCsrf = escapeHtml(csrfToken);

  const content = `<main class="auth-shell">
    <section class="auth-story" aria-label="About Rhythm">
      <div class="story-top">${brandMark()}<span class="story-kicker">A softer way to plan</span></div>
      <div class="story-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> YOUR WEEK, YOUR PACE</span>
        <h1>${heading}</h1>
        <p>${intro}</p>
      </div>
      <div class="story-art" aria-hidden="true">
        <div class="art-orbit orbit-one"></div>
        <div class="art-orbit orbit-two"></div>
        <div class="art-sun"></div>
        <div class="art-leaf leaf-one"></div>
        <div class="art-leaf leaf-two"></div>
        <div class="art-line"></div>
        <span class="art-note">one thing<br>at a time</span>
      </div>
      <p class="story-footnote">A little structure. Plenty of breathing room.</p>
    </section>

    <section class="auth-panel">
      <div class="auth-panel-top">${brandMark()}<span class="panel-caption">A fresh start can be small.</span></div>
      <div class="auth-card">
        <div class="form-heading">
          <span class="eyebrow">${isSignup ? "START WITH THE BASICS" : "WELCOME BACK"}</span>
          <h2>${isSignup ? "Create your account" : "Log in to Rhythm"}</h2>
          <p>${isSignup ? "Your week is yours to shape." : "Your plans will be right where you left them."}</p>
        </div>
        ${safeNotice ? `<div class="message message-notice" role="status">${safeNotice}</div>` : ""}
        ${safeError ? `<div class="message message-error" role="alert">${safeError}</div>` : ""}
        <form class="auth-form" method="post" action="${action}">
          <input type="hidden" name="_csrf" value="${safeCsrf}">
          <label for="email">Email address</label>
          <input id="email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required>
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" minlength="${isSignup ? 8 : 1}" maxlength="128" placeholder="Enter your password" required>
          <button class="button button-primary" type="submit">${submitLabel}<span aria-hidden="true">↗</span></button>
        </form>
        <p class="auth-switch">${switchCopy} <a href="${switchHref}">${switchLabel}</a></p>
        <p class="privacy-note"><span class="privacy-mark" aria-hidden="true"></span>Your plans are personal. Your space stays yours.</p>
      </div>
      <footer class="auth-footer"><span>© Rhythm</span><span>Made for real-life weeks</span></footer>
    </section>
  </main>`;

  return shell({
    title: isSignup ? "Create an account" : "Log in",
    bodyClass: "page-auth",
    content,
  });
}

function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(value ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function formatCalendarTime(value) {
  const minutes = timeToMinutes(value);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function layoutCalendarEvents(events) {
  const sorted = events
    .map((event) => ({
      event,
      start: timeToMinutes(event.startTime),
      end: Math.max(timeToMinutes(event.endTime), timeToMinutes(event.startTime) + 30),
    }))
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const positioned = [];
  let cluster = [];
  let clusterEnd = -1;

  function finishCluster() {
    if (!cluster.length) return;
    const laneEnds = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      item.lane = lane;
    }
    const laneCount = laneEnds.length;
    for (const item of cluster) {
      const top = item.start;
      const height = Math.min(1440 - top, Math.max(30, item.end - item.start));
      positioned.push({
        event: item.event,
        top,
        height,
        left: (item.lane / laneCount) * 100,
        width: 100 / laneCount,
      });
    }
    cluster = [];
    clusterEnd = -1;
  }

  for (const item of sorted) {
    if (cluster.length && item.start >= clusterEnd) finishCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  finishCluster();
  return positioned;
}

function renderCalendarEvent(item, csrfToken) {
  const { event } = item;
  const color = safeCategoryColor(event.categoryColor);
  const isHealthyPlannedItem = event.planned === true && ["Workout", "Meal", "Habit"].includes(event.categoryName);
  const completionControl = isHealthyPlannedItem ? renderCompletionControl(event, csrfToken) : "";
  const completedClass = event.completed ? " event-completed" : "";
  const unplannedClass = event.planned === false ? " calendar-event-unplanned" : "";
  const style = `--event-color:${color};top:${item.top}px;height:${item.height}px;left:${item.left}%;width:${item.width}%;`;
  return `<article class="calendar-event${completedClass}${unplannedClass}" style="${style}" data-event-item data-event-title="${escapeHtml(event.title)}" data-completed="${Boolean(event.completed)}">
    <a class="calendar-event-link" href="/events/${encodeURIComponent(event.id)}" title="${escapeHtml(event.title)}">
      <span class="calendar-event-time">${formatCalendarTime(event.startTime)}–${formatCalendarTime(event.endTime)}</span>
      <span class="calendar-event-title">${escapeHtml(event.title)}</span>
      ${renderUnplannedLabel(event)}
    </a>
    ${completionControl ? `<span class="calendar-event-check">${completionControl}</span>` : ""}
  </article>`;
}

function formatCalendarHour(hour) {
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? "AM" : "PM"}`;
}

function renderWeekPage({ email, csrfToken, events = [], range }) {
  const eventsByDate = new Map(range.days.map((day) => [day.date, []]));
  for (const event of events) {
    if (eventsByDate.has(event.date)) eventsByDate.get(event.date).push(event);
  }
  const dayHeaders = range.days.map((day) => `<div class="calendar-day-header${day.isToday ? " calendar-today" : ""}" role="columnheader">
    <span>${escapeHtml(day.dayName)}</span><strong>${day.dayNumber}</strong>
  </div>`).join("");
  const timeLabels = Array.from({ length: 24 }, (_, hour) => `<span class="calendar-hour-label" style="top:${hour * 60 + 4}px">${formatCalendarHour(hour)}</span>`).join("");
  const dayColumns = range.days.map((day) => `<section class="calendar-day-column${day.isToday ? " calendar-today" : ""}" role="gridcell" aria-label="${escapeHtml(day.dayName)} ${day.date}">
    ${layoutCalendarEvents(eventsByDate.get(day.date)).map((item) => renderCalendarEvent(item, csrfToken)).join("")}
  </section>`).join("");
  const content = `<main class="week-shell event-shell calendar-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="calendar-intro">
      <div>
        <span class="eyebrow"><span class="eyebrow-dot"></span> YOUR WEEK, YOUR PACE</span>
        <h1>My Week<span class="title-period">.</span></h1>
        <p>Classes, work, movement, meals, and habits in one view.</p>
      </div>
      <nav class="calendar-week-nav" aria-label="Choose week">
        <a class="button button-secondary" href="/week?week=${encodeURIComponent(range.previousWeekStart)}" aria-label="Previous week">← <span>Previous</span></a>
        <strong aria-live="polite">${escapeHtml(range.label)}</strong>
        <a class="button button-secondary" href="/week?week=${encodeURIComponent(range.nextWeekStart)}" aria-label="Next week"><span>Next</span> →</a>
      </nav>
    </section>
    <section class="calendar-panel" aria-label="Sunday to Saturday calendar">
      <div class="calendar-scroll">
        <div class="calendar-grid" role="grid" aria-label="Weekly event calendar">
          <div class="calendar-grid-header" role="row">
            <div class="calendar-time-heading" role="columnheader">TIME</div>
            ${dayHeaders}
          </div>
          <div class="calendar-grid-body">
            <aside class="calendar-time-axis" aria-hidden="true">${timeLabels}</aside>
            <div class="calendar-day-columns">${dayColumns}</div>
          </div>
        </div>
      </div>
      ${events.length ? "" : '<p class="calendar-empty">No events are scheduled for this week.</p>'}
    </section>
    <footer class="week-footer"><a href="/events">Browse all events</a><span>One thing at a time.</span></footer>
  </main>`;
  return shell({
    title: "My Week",
    bodyClass: "page-events page-calendar",
    content,
    scripts: ["/assets/events.js"],
  });
}

function eventHeader({ email, csrfToken }) {
  return `<header class="week-header event-header">
    ${brandMark()}
    <nav class="event-nav" aria-label="Event navigation"><a href="/week">My Week</a><a href="/events">Events</a><a href="/starred">Starred</a><a href="/dashboard">Dashboard</a></nav>
    <div class="account-actions">
      <span class="account-email">${escapeHtml(email)}</span>
      <form method="post" action="/logout" class="logout-form">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <button class="button button-quiet" type="submit">Log out <span aria-hidden="true">↗</span></button>
      </form>
    </div>
  </header>`;
}

function renderDashboardPage({ email, csrfToken, stats, chartData, currentWeekLabel }) {
  const chartJson = escapeHtml(JSON.stringify(chartData));
  const content = `<main class="week-shell event-shell dashboard-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="dashboard-intro">
      <div>
        <span class="eyebrow"><span class="eyebrow-dot"></span> YOUR RECENT RHYTHM</span>
        <h1>Dashboard<span class="title-period">.</span></h1>
        <p>A quick look at the plans you made and what you completed.</p>
      </div>
      <div class="dashboard-week-label"><span>THIS WEEK</span><strong>${escapeHtml(currentWeekLabel)}</strong><small>Monday–Sunday</small></div>
    </section>

    <section class="dashboard-stats" aria-label="This week's stats">
      <article class="dashboard-stat-card">
        <span class="dashboard-stat-label">Completion rate</span>
        <strong class="dashboard-stat-value">${stats.completionRate}%</strong>
        <span class="dashboard-stat-detail">${stats.plannedCompleted} of ${stats.plannedTotal} planned items completed</span>
      </article>
      <article class="dashboard-stat-card">
        <span class="dashboard-stat-label">Workouts completed</span>
        <strong class="dashboard-stat-value">${stats.workoutsCompleted}</strong>
        <span class="dashboard-stat-detail">Planned or unplanned</span>
      </article>
      <article class="dashboard-stat-card">
        <span class="dashboard-stat-label">Unplanned events logged</span>
        <strong class="dashboard-stat-value">${stats.unplannedEventsLogged}</strong>
        <span class="dashboard-stat-detail">Events added outside your plan</span>
      </article>
    </section>

    <section class="dashboard-chart-panel" aria-labelledby="dashboard-chart-title">
      <div class="dashboard-chart-heading">
        <div>
          <span class="eyebrow">FOUR-WEEK VIEW</span>
          <h2 id="dashboard-chart-title">Planned and completed by category</h2>
          <p>Completed counts include unplanned events; the completion rate above excludes them.</p>
        </div>
      </div>
      <div class="dashboard-chart-wrap">
        <canvas id="dashboard-chart" data-chart="${chartJson}" role="img" aria-label="Bar chart of planned and completed events by category for the last four weeks">Your browser does not support charts.</canvas>
      </div>
    </section>
    <footer class="week-footer"><a href="/events">← Back to your events</a><span>One thing at a time.</span></footer>
  </main>`;
  return shell({
    title: "Dashboard",
    bodyClass: "page-events page-dashboard",
    content,
    scripts: ["/vendor/chart.js/chart.umd.js", "/assets/dashboard.js"],
  });
}

function formatEventDate(value) {
  const date = String(value ?? "");
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return escapeHtml(date);
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return escapeHtml(new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(parsed));
}

function safeCategoryColor(value) {
  const color = String(value ?? "");
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#638c6a";
}

function renderCompletionControl(event, csrfToken, withLabel = false) {
  const labelText = withLabel ? "<span class=\"event-completion-label\">Completed</span>" : "";
  if (!event.planned) {
    return event.completed
      ? `<span class="event-completion-control event-completion-static" aria-label="Completed"><span class="event-completion-mark" aria-hidden="true">✓</span>${labelText}</span>`
      : "";
  }

  const title = String(event.title ?? "event");
  const actionLabel = event.completed ? `Mark ${title} as not complete` : `Mark ${title} as complete`;
  return `<label class="event-completion-control">
    <input class="event-completion-input" type="checkbox" data-event-checkbox data-event-id="${escapeHtml(event.id)}" data-csrf-token="${escapeHtml(csrfToken)}" aria-label="${escapeHtml(actionLabel)}"${event.completed ? " checked" : ""}>
    <span class="event-completion-mark" aria-hidden="true">✓</span>${labelText}
  </label>`;
}

function renderUnplannedLabel(event) {
  return event.planned === false ? '<span class="event-status-label event-status-unplanned">Unplanned</span>' : "";
}

function renderStarControl(event, csrfToken, variant = "") {
  const isStarred = event.starId != null;
  const title = String(event.title ?? "event");
  const actionLabel = isStarred ? `Remove ${title} from Starred` : `Add ${title} to Starred`;
  const variantClass = variant ? ` ${variant}` : "";
  return `<button class="event-star-button${variantClass}${isStarred ? " is-starred" : ""}" type="button" data-star-toggle data-starred="${isStarred}" data-event-id="${escapeHtml(event.id)}" data-csrf-token="${escapeHtml(csrfToken)}" aria-label="${escapeHtml(actionLabel)}" aria-pressed="${isStarred}" title="${escapeHtml(actionLabel)}"><span aria-hidden="true">${isStarred ? "★" : "☆"}</span></button><span class="event-star-status" data-star-status role="status" aria-live="polite"></span>`;
}

function renderEventFilters(categories, filters = {}) {
  const categoryOptions = categories.map((category) => {
    const selected = String(category.id) === String(filters.category) ? " selected" : "";
    return `<option value="${escapeHtml(category.id)}"${selected}>${escapeHtml(category.name)}</option>`;
  }).join("");
  const selected = (field, value) => filters[field] === value ? " selected" : "";
  return `<form class="event-filters" method="get" action="/events" aria-label="Filter and sort events">
    <div class="event-filter-search">
      <label for="event-search">Search title or notes</label>
      <input id="event-search" type="search" name="q" maxlength="120" value="${escapeHtml(filters.query || "")}" placeholder="Search your events">
    </div>
    <div class="event-filter-grid">
      <div class="event-filter-field">
        <label for="event-filter-category">Category</label>
        <select id="event-filter-category" name="category"><option value="">All categories</option>${categoryOptions}</select>
      </div>
      <div class="event-filter-field">
        <label for="event-filter-planned">Plan</label>
        <select id="event-filter-planned" name="planned">
          <option value="">Any plan</option>
          <option value="planned"${selected("planned", "planned")}>Planned</option>
          <option value="unplanned"${selected("planned", "unplanned")}>Unplanned</option>
        </select>
      </div>
      <div class="event-filter-field">
        <label for="event-filter-completed">Completion</label>
        <select id="event-filter-completed" name="completed">
          <option value="">Any status</option>
          <option value="done"${selected("completed", "done")}>Done</option>
          <option value="not-done"${selected("completed", "not-done")}>Not done</option>
        </select>
      </div>
      <div class="event-filter-field">
        <label for="event-filter-sort">Sort by</label>
        <select id="event-filter-sort" name="sort">
          <option value="newest"${selected("sort", "newest")}>Newest date</option>
          <option value="oldest"${selected("sort", "oldest")}>Oldest date</option>
          <option value="category"${selected("sort", "category")}>Category A–Z</option>
        </select>
      </div>
    </div>
    <div class="event-filter-actions">
      <button class="button button-primary" type="submit">Apply</button>
      <a class="button button-secondary" href="/events">Clear all</a>
    </div>
  </form>`;
}

function renderEventListPage({ events = [], email, csrfToken, notice, isStarredPage = false, categories = [], filters = {} }) {
  const sortedEvents = [...events];
  const pageTitle = isStarredPage ? "Starred" : "Your events";
  const pageDescription = isStarredPage
    ? "The events you marked to find quickly."
    : "All the pieces you're making room for, in one place.";
  const hasActiveFilters = Boolean(filters.category || filters.planned || filters.completed || filters.query);
  const rows = sortedEvents.length
    ? `<div class="event-list" role="list">${sortedEvents.map((event) => {
      const color = safeCategoryColor(event.categoryColor);
      const completedClass = event.completed ? " event-completed" : "";
      const unplannedClass = event.planned === false ? " event-unplanned" : "";
      return `<div class="event-row${completedClass}${unplannedClass}" role="listitem" data-event-item data-event-title="${escapeHtml(event.title)}" data-completed="${Boolean(event.completed)}">
        ${renderCompletionControl(event, csrfToken)}
        <span class="event-color-mark" style="--event-color:${color}" aria-hidden="true"></span>
        <a class="event-row-main" href="/events/${encodeURIComponent(event.id)}">
          <span class="event-row-title">${escapeHtml(event.title)}</span>
          <span class="event-row-meta">${escapeHtml(event.categoryName || "Event")}${renderUnplannedLabel(event)}<span class="meta-divider">·</span>${formatEventDate(event.date)}</span>
        </a>
        <span class="event-row-time">${escapeHtml(event.startTime)} <span aria-hidden="true">→</span> ${escapeHtml(event.endTime)}</span>
        ${renderStarControl(event, csrfToken, "event-star-button-list")}
        <a class="event-row-arrow" href="/events/${encodeURIComponent(event.id)}" aria-label="Open ${escapeHtml(event.title)}">↗</a>
        <span class="event-toggle-status" data-event-toggle-status role="status" aria-live="polite"></span>
      </div>`;
    }).join("")}</div>`
    : isStarredPage
      ? `<div class="event-empty">
          <span class="event-empty-mark" aria-hidden="true"></span>
          <span class="eyebrow">A SHORTLIST FOR LATER</span>
          <h2>No starred events yet.</h2>
          <p>Star an event from its row or detail page and it will show up here.</p>
          <a class="button button-primary" href="/events">Browse your events <span aria-hidden="true">↗</span></a>
        </div>`
      : hasActiveFilters
        ? `<div class="event-empty">
            <span class="event-empty-mark" aria-hidden="true"></span>
            <span class="eyebrow">NOTHING MATCHED</span>
            <h2>No events match your search.</h2>
            <p>Try changing a filter or search term.</p>
            <a class="button button-primary" href="/events">Clear filters</a>
          </div>`
      : `<div class="event-empty">
        <span class="event-empty-mark" aria-hidden="true"></span>
        <span class="eyebrow">A LITTLE ROOM TO BEGIN</span>
        <h2>Your plans will find their rhythm here.</h2>
        <p>Add a class, a meal, or a moment for yourself. Your list will grow one good plan at a time.</p>
        <a class="button button-primary" href="/events/new">Create your first event <span aria-hidden="true">↗</span></a>
      </div>`;
  const actions = isStarredPage
    ? `<a class="button button-secondary event-create-button" href="/events">All events <span aria-hidden="true">↗</span></a>`
    : `<div class="event-create-actions">
        <a class="button button-secondary" href="/events/new/unplanned">Log unplanned <span aria-hidden="true">↗</span></a>
        <a class="button button-primary event-create-button" href="/events/new">Add an event <span aria-hidden="true">↗</span></a>
      </div>`;
  const content = `<main class="week-shell event-shell" data-starred-page="${isStarredPage}">
    ${eventHeader({ email, csrfToken })}
    <section class="event-page-intro">
      <div>
        <span class="eyebrow"><span class="eyebrow-dot"></span> ${isStarredPage ? "KEEP WHAT MATTERS CLOSE" : "THE SHAPE OF YOUR DAYS"}</span>
        <h1>${pageTitle}<span class="title-period">.</span></h1>
        <p>${pageDescription}</p>
      </div>
      ${actions}
    </section>
    ${notice && !isStarredPage ? `<div class="message message-notice event-notice" role="status">${escapeHtml(notice)}</div>` : ""}
    ${!isStarredPage ? renderEventFilters(categories, filters) : ""}
    <section class="event-list-panel" aria-label="${isStarredPage ? "Starred events" : "Your events"}">
      <div class="event-list-heading"><span>${isStarredPage ? "YOUR STARRED EVENTS" : "YOUR PLANS"}</span><span>${sortedEvents.length} ${sortedEvents.length === 1 ? "event" : "events"}</span></div>
      ${rows}
    </section>
    <footer class="week-footer"><a href="/week">← Back to My Week</a><span>One thing at a time.</span></footer>
  </main>`;
  return shell({ title: pageTitle, bodyClass: "page-events", content, scripts: ["/assets/events.js"] });
}

function renderEventFormPage({ mode, event = {}, categories = [], email, csrfToken, error, errors = {} }) {
  const isEdit = mode === "edit";
  const isUnplanned = mode === "unplanned";
  const isUnplannedEvent = isUnplanned || (isEdit && event.planned === false);
  const action = isEdit
    ? `/events/${encodeURIComponent(event.id)}/edit`
    : isUnplanned
      ? "/events/unplanned"
      : "/events";
  const safe = (value) => escapeHtml(value);
  const fieldError = (name) => {
    const message = typeof errors[name] === "string" ? errors[name] : "";
    return `<span class="field-error" id="event-${name}-error" data-field-error="${name}" role="status" aria-live="polite"${message ? "" : " hidden"}>${safe(message)}</span>`;
  };
  const describedBy = (name) => ` aria-describedby="event-${name}-error"${errors[name] ? ' aria-invalid="true"' : ""}`;
  const categoryOptions = categories.map((category) => {
    const selected = String(category.id) === String(event.categoryId) ? " selected" : "";
    return `<option value="${safe(category.id)}" data-category-name="${safe(category.name)}"${selected}>${safe(category.name)}${category.isFixed ? " · fixed commitment" : ""}</option>`;
  }).join("");
  const selectedCategoryName = categories.find((category) => String(category.id) === String(event.categoryId))?.name || event.categoryName || "";
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-form-layout">
      <div class="event-form-aside">
        <a class="back-link" href="${isEdit ? `/events/${encodeURIComponent(event.id)}` : "/events"}">← ${isEdit ? "Back to event" : "All events"}</a>
        <span class="eyebrow"><span class="eyebrow-dot"></span> ${isEdit ? "A SMALL ADJUSTMENT" : "MAKE A LITTLE SPACE"}</span>
        <h1>${isEdit ? "Shape your plan" : isUnplanned ? "Log what happened" : "Add to your week"}<span class="title-period">.</span></h1>
        <p>${isEdit ? "Plans can change. Give this one the shape it needs now." : isUnplanned ? "Capture something that happened outside your plan. It will be saved as completed." : "Give something that matters a place in your week."}</p>
        <div class="form-aside-note"><span class="reminder-dot"></span><span>Keep it simple. You can always revisit this.</span></div>
      </div>
      <section class="event-form-card${isUnplannedEvent ? " event-unplanned" : ""}" aria-label="${isEdit ? "Edit event" : isUnplanned ? "Log unplanned event" : "New event"}">
        <div class="event-form-card-heading"><span class="eyebrow">${isEdit ? "EDIT THE DETAILS" : isUnplanned ? "LOG AN UNPLANNED EVENT" : "START WITH THE DETAILS"}</span><h2>${isUnplannedEvent ? "What happened?" : isEdit ? "A plan in progress" : "What's on your mind?"}</h2>${isUnplannedEvent ? renderUnplannedLabel({ planned: false }) : ""}</div>
        ${error ? `<div class="message message-error" role="alert">${safe(error)}</div>` : ""}
        <form class="event-form" method="post" action="${action}" data-event-form>
          <input type="hidden" name="_csrf" value="${safe(csrfToken)}">
          <label for="event-title">Event title</label>
          <input id="event-title" name="title" type="text" maxlength="180" placeholder="e.g. Morning swim" value="${safe(event.title)}" required${describedBy("title")}>
          ${fieldError("title")}

          <label for="event-category">Category</label>
          <select id="event-category" name="categoryId" data-category-select required${describedBy("categoryId")}>
            <option value="">Choose a category</option>${categoryOptions}
          </select>
          ${fieldError("categoryId")}

          <label for="event-date">Date</label>
          <input id="event-date" name="date" type="date" value="${safe(event.date)}" required${describedBy("date")}>
          ${fieldError("date")}

          <div class="event-time-fields">
            <div><label for="event-start">Starts</label><input id="event-start" name="startTime" type="time" value="${safe(event.startTime)}" required${describedBy("startTime")}>${fieldError("startTime")}</div>
            <div><label for="event-end">Ends</label><input id="event-end" name="endTime" type="time" value="${safe(event.endTime)}" required${describedBy("endTime")}>${fieldError("endTime")}</div>
          </div>

          <div class="event-category-field" data-category-field="Workout" data-field-name="distanceMi"${selectedCategoryName === "Workout" ? "" : " hidden"}>
            <label for="event-distance">Distance <span class="field-unit">miles</span></label>
            <input id="event-distance" name="distanceMi" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Optional" value="${safe(event.distanceMi)}">
          </div>
          <div class="event-category-field" data-category-field="Meal" data-field-name="proteinG"${selectedCategoryName === "Meal" ? "" : " hidden"}>
            <label for="event-protein">Protein <span class="field-unit">grams</span></label>
            <input id="event-protein" name="proteinG" type="number" inputmode="decimal" min="0" step="1" placeholder="Optional" value="${safe(event.proteinG)}">
          </div>

          <label for="event-notes">Notes <span class="field-unit">optional</span></label>
          <textarea id="event-notes" name="notes" rows="4" maxlength="2000" placeholder="Anything you want to remember about this plan">${safe(event.notes)}</textarea>
          <div class="event-form-actions">
            <a class="button button-secondary" href="${isEdit ? `/events/${encodeURIComponent(event.id)}` : "/events"}">Cancel</a>
            <button class="button button-primary" type="submit">${isEdit ? "Save changes" : isUnplanned ? "Save unplanned event" : "Add event"} <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </section>
    </section>
    <footer class="week-footer"><span>Your plans are personal. Your space stays yours.</span><span>Rhythm</span></footer>
  </main>`;
  return shell({
    title: isEdit ? "Edit event" : isUnplanned ? "Log unplanned event" : "New event",
    bodyClass: "page-events",
    content,
    scripts: ["/assets/events.js"],
  });
}

function renderEventDetailPage({ event = {}, email, csrfToken }) {
  const color = safeCategoryColor(event.categoryColor);
  const completedClass = event.completed ? " event-completed" : "";
  const unplannedClass = event.planned === false ? " event-unplanned" : "";
  const completionControl = renderCompletionControl(event, csrfToken, true);
  const optionalDetails = [
    event.distanceMi != null && event.distanceMi !== "" ? `<div class="detail-extra"><span>Distance</span><strong>${escapeHtml(event.distanceMi)} mi</strong></div>` : "",
    event.proteinG != null && event.proteinG !== "" ? `<div class="detail-extra"><span>Protein</span><strong>${escapeHtml(event.proteinG)} g</strong></div>` : "",
  ].filter(Boolean).join("");
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-detail-wrap">
      <a class="back-link" href="/events">← All events</a>
      <article class="event-detail-card${completedClass}${unplannedClass}" data-event-item data-event-title="${escapeHtml(event.title)}" data-completed="${Boolean(event.completed)}">
        <div class="event-detail-top"><div class="event-detail-badges"><span class="category-pill" style="--event-color:${color}"><span></span>${escapeHtml(event.categoryName || "Event")}</span>${renderUnplannedLabel(event)}${renderStarControl(event, csrfToken, "event-star-button-detail")}</div><span class="event-detail-id">${event.planned === false ? `EVENT ${escapeHtml(event.id)}` : `PLAN ${escapeHtml(event.id)}`}</span></div>
        <h1>${escapeHtml(event.title)}<span class="title-period">.</span></h1>
        ${completionControl ? `<div class="event-detail-completion">${completionControl}<span class="event-toggle-status" data-event-toggle-status role="status" aria-live="polite"></span></div>` : ""}
        <div class="event-detail-schedule">
          <div class="schedule-icon" aria-hidden="true"></div>
          <div><span class="detail-label">WHEN</span><strong>${formatEventDate(event.date)}</strong><span class="detail-time">${escapeHtml(event.startTime)} <span aria-hidden="true">→</span> ${escapeHtml(event.endTime)}</span></div>
        </div>
        ${optionalDetails ? `<div class="event-detail-extras">${optionalDetails}</div>` : ""}
        ${event.notes ? `<div class="event-notes"><span class="detail-label">A NOTE TO YOURSELF</span><p>${escapeHtml(event.notes)}</p></div>` : ""}
        <div class="event-detail-actions">
          <a class="button button-primary" href="/events/${encodeURIComponent(event.id)}/edit">Edit event <span aria-hidden="true">↗</span></a>
          <a class="button button-danger-quiet" href="/events/${encodeURIComponent(event.id)}/delete">Delete</a>
        </div>
      </article>
      <p class="detail-footnote">Plans can change. Make this one yours.</p>
    </section>
    <footer class="week-footer"><span>Rhythm is here for the whole you.</span><span>One thing at a time.</span></footer>
  </main>`;
  return shell({ title: event.title || "Event details", bodyClass: "page-events", content, scripts: ["/assets/events.js"] });
}

function renderEventDeleteConfirmationPage({ event = {}, email, csrfToken }) {
  const unplannedClass = event.planned === false ? " event-unplanned" : "";
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-delete-wrap">
      <a class="back-link" href="/events/${encodeURIComponent(event.id)}">← Keep this event</a>
      <div class="event-delete-card">
        <span class="delete-mark" aria-hidden="true">!</span>
        <span class="eyebrow">A MOMENT BEFORE YOU LET GO</span>
        <h1>Are you sure?</h1>
        <p class="delete-copy">This will remove <strong>${escapeHtml(event.title)}</strong> from your plans. You won't be able to undo this.</p>
        <div class="delete-event-summary${unplannedClass}"><span class="event-color-mark" style="--event-color:${safeCategoryColor(event.categoryColor)}" aria-hidden="true"></span><span><strong>${escapeHtml(event.categoryName || "Event")}</strong><small>${formatEventDate(event.date)} · ${escapeHtml(event.startTime)}–${escapeHtml(event.endTime)}</small></span>${renderUnplannedLabel(event)}</div>
        <form method="post" action="/events/${encodeURIComponent(event.id)}/delete" class="delete-actions">
          <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
          <input type="hidden" name="confirmDelete" value="yes">
          <a class="button button-secondary" href="/events/${encodeURIComponent(event.id)}">Cancel, keep it</a>
          <button class="button button-danger" type="submit">Yes, delete event</button>
        </form>
      </div>
    </section>
    <footer class="week-footer"><span>Your plans are personal. Your space stays yours.</span><span>Rhythm</span></footer>
  </main>`;
  return shell({ title: "Delete event", bodyClass: "page-events", content });
}

module.exports = {
  renderAuthPage,
  renderDashboardPage,
  renderWeekPage,
  renderEventListPage,
  renderEventFormPage,
  renderEventDetailPage,
  renderEventDeleteConfirmationPage,
};
