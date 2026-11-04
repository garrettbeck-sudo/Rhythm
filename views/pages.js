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

function renderWeekPage({ email, csrfToken }) {
  const safeEmail = escapeHtml(email);
  const safeCsrf = escapeHtml(csrfToken);
  const content = `<main class="week-shell">
    <header class="week-header">
      ${brandMark()}
      <div class="account-actions">
        <span class="account-email">${safeEmail}</span>
        <form method="post" action="/logout" class="logout-form">
          <input type="hidden" name="_csrf" value="${safeCsrf}">
          <button class="button button-quiet" type="submit">Log out <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </header>

    <section class="week-intro">
      <div class="intro-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> YOUR SPACE, JUST FOR YOU</span>
        <h1>My Week<span class="title-period">.</span></h1>
        <p>Make room for what matters, and let the rest find its place.</p>
        <a class="week-events-link" href="/events">Browse your events <span aria-hidden="true">↗</span></a>
      </div>
      <div class="intro-orbit" aria-hidden="true">
        <div class="intro-orbit-ring"></div>
        <div class="intro-orbit-core"></div>
        <span class="orbit-spark spark-a"></span>
        <span class="orbit-spark spark-b"></span>
        <span class="orbit-spark spark-c"></span>
      </div>
    </section>

    <section class="week-canvas" aria-labelledby="canvas-title">
      <div class="canvas-topline"><span> A NOTE TO BEGIN</span><span class="canvas-rule"></span><span>01</span></div>
      <div class="canvas-content">
        <div class="canvas-illustration" aria-hidden="true">
          <div class="paper-shadow"></div>
          <div class="paper">
            <span class="paper-sun"></span>
            <span class="paper-stroke stroke-one"></span>
            <span class="paper-stroke stroke-two"></span>
            <span class="paper-stroke stroke-three"></span>
            <span class="paper-leaf"></span>
          </div>
        </div>
        <div class="canvas-message">
          <span class="eyebrow">A GENTLE PLACE TO START</span>
          <h2 id="canvas-title">Your week is<br>still full of possibility.</h2>
          <p>Classes, work, a nourishing meal, a little movement, a moment to reset. There’s room for all of it here, at a pace that feels right to you.</p>
          <div class="soft-reminder"><span class="reminder-dot"></span><span>Start small. You can always make more room.</span></div>
        </div>
      </div>
      <div class="canvas-footer"><span>Make the week yours</span><span class="footer-flourish" aria-hidden="true">〰</span></div>
    </section>

    <footer class="week-footer">
      <span>Rhythm is here for the whole you.</span>
      <span class="footer-heart" aria-hidden="true"></span>
    </footer>
  </main>`;

  return shell({ title: "My week", bodyClass: "page-week", content });
}

function eventHeader({ email, csrfToken }) {
  return `<header class="week-header event-header">
    ${brandMark()}
    <nav class="event-nav" aria-label="Event navigation"><a href="/week">My Week</a><a href="/events">Events</a></nav>
    <div class="account-actions">
      <span class="account-email">${escapeHtml(email)}</span>
      <form method="post" action="/logout" class="logout-form">
        <input type="hidden" name="_csrf" value="${escapeHtml(csrfToken)}">
        <button class="button button-quiet" type="submit">Log out <span aria-hidden="true">↗</span></button>
      </form>
    </div>
  </header>`;
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

function renderEventListPage({ events = [], email, csrfToken, notice }) {
  const sortedEvents = [...events].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
  const rows = sortedEvents.length
    ? `<div class="event-list" role="list">${sortedEvents.map((event) => {
      const color = safeCategoryColor(event.categoryColor);
      return `<a class="event-row" role="listitem" href="/events/${encodeURIComponent(event.id)}">
        <span class="event-color-mark" style="--event-color:${color}" aria-hidden="true"></span>
        <span class="event-row-main">
          <span class="event-row-title">${escapeHtml(event.title)}</span>
          <span class="event-row-meta">${escapeHtml(event.categoryName || "Event")}<span class="meta-divider">·</span>${formatEventDate(event.date)}</span>
        </span>
        <span class="event-row-time">${escapeHtml(event.startTime)} <span aria-hidden="true">→</span> ${escapeHtml(event.endTime)}</span>
        <span class="event-row-arrow" aria-hidden="true">↗</span>
      </a>`;
    }).join("")}</div>`
    : `<div class="event-empty">
        <span class="event-empty-mark" aria-hidden="true"></span>
        <span class="eyebrow">A LITTLE ROOM TO BEGIN</span>
        <h2>Your plans will find their rhythm here.</h2>
        <p>Add a class, a meal, or a moment for yourself. Your list will grow one good plan at a time.</p>
        <a class="button button-primary" href="/events/new">Create your first event <span aria-hidden="true">↗</span></a>
      </div>`;
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-page-intro">
      <div>
        <span class="eyebrow"><span class="eyebrow-dot"></span> THE SHAPE OF YOUR DAYS</span>
        <h1>Your events<span class="title-period">.</span></h1>
        <p>All the pieces you're making room for, in one place.</p>
      </div>
      <a class="button button-primary event-create-button" href="/events/new">Add an event <span aria-hidden="true">↗</span></a>
    </section>
    ${notice ? `<div class="message message-notice event-notice" role="status">${escapeHtml(notice)}</div>` : ""}
    <section class="event-list-panel" aria-label="Your events">
      <div class="event-list-heading"><span>YOUR PLANS</span><span>${sortedEvents.length} ${sortedEvents.length === 1 ? "event" : "events"}</span></div>
      ${rows}
    </section>
    <footer class="week-footer"><a href="/week">← Back to My Week</a><span>One thing at a time.</span></footer>
  </main>`;
  return shell({ title: "Your events", bodyClass: "page-events", content });
}

function renderEventFormPage({ mode, event = {}, categories = [], email, csrfToken, error, errors = {} }) {
  const isEdit = mode === "edit";
  const action = isEdit ? `/events/${encodeURIComponent(event.id)}/edit` : "/events";
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
        <h1>${isEdit ? "Shape your plan" : "Add to your week"}<span class="title-period">.</span></h1>
        <p>${isEdit ? "Plans can change. Give this one the shape it needs now." : "Give something that matters a place in your week."}</p>
        <div class="form-aside-note"><span class="reminder-dot"></span><span>Keep it simple. You can always revisit this.</span></div>
      </div>
      <section class="event-form-card" aria-label="${isEdit ? "Edit event" : "New event"}">
        <div class="event-form-card-heading"><span class="eyebrow">${isEdit ? "EDIT THE DETAILS" : "START WITH THE DETAILS"}</span><h2>${isEdit ? "A plan in progress" : "What's on your mind?"}</h2></div>
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
            <button class="button button-primary" type="submit">${isEdit ? "Save changes" : "Add event"} <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </section>
    </section>
    <footer class="week-footer"><span>Your plans are personal. Your space stays yours.</span><span>Rhythm</span></footer>
  </main>`;
  return shell({
    title: isEdit ? "Edit event" : "New event",
    bodyClass: "page-events",
    content,
    scripts: ["/assets/events.js"],
  });
}

function renderEventDetailPage({ event = {}, email, csrfToken }) {
  const color = safeCategoryColor(event.categoryColor);
  const optionalDetails = [
    event.distanceMi != null && event.distanceMi !== "" ? `<div class="detail-extra"><span>Distance</span><strong>${escapeHtml(event.distanceMi)} mi</strong></div>` : "",
    event.proteinG != null && event.proteinG !== "" ? `<div class="detail-extra"><span>Protein</span><strong>${escapeHtml(event.proteinG)} g</strong></div>` : "",
  ].filter(Boolean).join("");
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-detail-wrap">
      <a class="back-link" href="/events">← All events</a>
      <article class="event-detail-card">
        <div class="event-detail-top"><span class="category-pill" style="--event-color:${color}"><span></span>${escapeHtml(event.categoryName || "Event")}</span><span class="event-detail-id">PLAN ${escapeHtml(event.id)}</span></div>
        <h1>${escapeHtml(event.title)}<span class="title-period">.</span></h1>
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
  return shell({ title: event.title || "Event details", bodyClass: "page-events", content });
}

function renderEventDeleteConfirmationPage({ event = {}, email, csrfToken }) {
  const content = `<main class="week-shell event-shell">
    ${eventHeader({ email, csrfToken })}
    <section class="event-delete-wrap">
      <a class="back-link" href="/events/${encodeURIComponent(event.id)}">← Keep this event</a>
      <div class="event-delete-card">
        <span class="delete-mark" aria-hidden="true">!</span>
        <span class="eyebrow">A MOMENT BEFORE YOU LET GO</span>
        <h1>Are you sure?</h1>
        <p class="delete-copy">This will remove <strong>${escapeHtml(event.title)}</strong> from your plans. You won't be able to undo this.</p>
        <div class="delete-event-summary"><span class="event-color-mark" style="--event-color:${safeCategoryColor(event.categoryColor)}" aria-hidden="true"></span><span><strong>${escapeHtml(event.categoryName || "Event")}</strong><small>${formatEventDate(event.date)} · ${escapeHtml(event.startTime)}–${escapeHtml(event.endTime)}</small></span></div>
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
  renderWeekPage,
  renderEventListPage,
  renderEventFormPage,
  renderEventDetailPage,
  renderEventDeleteConfirmationPage,
};
