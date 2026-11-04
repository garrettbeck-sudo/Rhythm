const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const { and, asc, desc, eq, gte, ilike, lte, or } = require("drizzle-orm");
const { db, pool } = require("./db");
const { categories, events, stars, users } = require("./db/schema");
const { createSessionToken, hashPassword, verifyPassword, verifySessionToken } = require("./auth");
const {
  buildWeeklyChartData,
  calculateCurrentWeekStats,
  getDashboardDateRanges,
} = require("./dashboard/metrics");
const {
  renderAuthPage,
  renderDashboardPage,
  renderWeekPage,
  renderEventListPage,
  renderEventFormPage,
  renderEventDetailPage,
  renderEventDeleteConfirmationPage,
} = require("./views/pages");

const app = express();
const port = Number(process.env.PORT) || 5000;
const sessionSecret = process.env.SESSION_SECRET;
const sessionCookieName = "rhythm_session";
const csrfCookieName = "rhythm_csrf";

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'",
  );
  next();
});
app.use(express.urlencoded({ extended: false, limit: "8kb" }));
app.use(
  "/assets",
  express.static(path.join(__dirname, "public"), {
    index: false,
    maxAge: "1h",
  }),
);
app.use(
  "/vendor/chart.js",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"), {
    index: false,
    maxAge: "1h",
  }),
);

function setSessionCookie(res, userId) {
  const token = createSessionToken(userId, sessionSecret);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`,
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`,
  );
}

function setCsrfCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${csrfCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function csrfMatches(req) {
  const cookieToken = getCookie(req, csrfCookieName);
  const formToken = req.body?._csrf;
  if (
    typeof cookieToken !== "string" ||
    typeof formToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(cookieToken) ||
    !/^[a-f0-9]{64}$/.test(formToken)
  ) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(cookieToken, "hex"), Buffer.from(formToken, "hex"));
}

function sendAuthPage(res, options, status = 200) {
  const csrfToken = issueCsrfToken(res);
  return res.status(status).type("html").send(renderAuthPage({ ...options, csrfToken }));
}

function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, token);
  return token;
}

function requireLogin() {
  return async (req, res, next) => {
    try {
      const token = getCookie(req, sessionCookieName);
      const userId = token && verifySessionToken(token, sessionSecret);
      if (!userId) {
        clearSessionCookie(res);
        return res.redirect(303, "/login");
      }

      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        clearSessionCookie(res);
        return res.redirect(303, "/login");
      }

      req.currentUser = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const joinedEventSelection = {
  id: events.id,
  title: events.title,
  categoryId: events.categoryId,
  categoryName: categories.name,
  categoryColor: categories.color,
  date: events.date,
  startTime: events.startTime,
  endTime: events.endTime,
  notes: events.notes,
  distanceMi: events.distanceMi,
  proteinG: events.proteinG,
  planned: events.planned,
  completed: events.completed,
};

async function getEventCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      isFixed: categories.isFixed,
    })
    .from(categories)
    .orderBy(categories.id);
}

async function findEventForUser(eventId, userId) {
  const [event] = await db
    .select({ ...joinedEventSelection, starId: stars.id })
    .from(events)
    .innerJoin(categories, eq(events.categoryId, categories.id))
    .leftJoin(stars, and(eq(stars.eventId, events.id), eq(stars.userId, userId)))
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);
  return event || null;
}

function parsePositiveId(value) {
  if ((typeof value !== "string" && typeof value !== "number") || !/^[1-9]\d*$/.test(String(value))) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function eventFormValues(body = {}, existing = {}) {
  const value = (key, fallback = "") =>
    typeof body[key] === "string"
      ? body[key]
      : fallback == null
        ? ""
        : String(fallback);

  return {
    id: existing.id,
    title: value("title", existing.title),
    categoryId: value("categoryId", existing.categoryId),
    date: value("date", existing.date),
    startTime: value("startTime", existing.startTime),
    endTime: value("endTime", existing.endTime),
    notes: value("notes", existing.notes),
    distanceMi: value("distanceMi", existing.distanceMi),
    proteinG: value("proteinG", existing.proteinG),
  };
}

function parseOptionalNumber(value) {
  if (value.trim() === "") return { valid: true, value: null };
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? { valid: true, value: parsed }
    : { valid: false, value: null };
}

function parseTimeInSeconds(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,6}))?)?$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 3600
    + Number(match[2]) * 60
    + Number(match[3] || 0)
    + (match[4] ? Number(`0.${match[4]}`) : 0);
}

function isValidEventDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
  if (!startTime) errors.startTime = "Please add a start time.";
  else if (parseTimeInSeconds(startTime) === null) errors.startTime = "Please enter a valid start time.";
  if (!endTime) errors.endTime = "Please add an end time.";
  else if (parseTimeInSeconds(endTime) === null) errors.endTime = "Please enter a valid end time.";

  const startSeconds = startTime ? parseTimeInSeconds(startTime) : null;
  const endSeconds = endTime ? parseTimeInSeconds(endTime) : null;
  if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds) {
    errors.endTime = "End time must be after start time.";
  }

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
      startTime,
      endTime,
      notes: form.notes.trim() || null,
      distanceMi: distance.value,
      proteinG: protein.value,
    },
  };
}

async function sendEventForm(req, res, { mode, event, error, errors, status = 200, categories: availableCategories }) {
  const eventCategories = availableCategories || await getEventCategories();
  const csrfToken = issueCsrfToken(res);
  return res.status(status).type("html").send(
    renderEventFormPage({
      mode,
      event,
      categories: eventCategories,
      email: req.currentUser.email,
      csrfToken,
      error,
      errors,
    }),
  );
}

function sendEventNotFound(res) {
  return res.status(404).type("html").send(
    "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Event not found · Rhythm</title><body><h1>Event not found</h1><a href=\"/events\">Return to your events</a></body></html>",
  );
}

function isEventConstraintError(error) {
  return ["22003", "22007", "22P02", "23502", "23503", "23514"].includes(error.code);
}

app.get("/signup", (req, res) => sendAuthPage(res, { mode: "signup" }));
app.post("/signup", async (req, res, next) => {
  if (!csrfMatches(req)) {
    return sendAuthPage(res, { mode: "signup", error: "Refresh the page and try again." }, 403);
  }

  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendAuthPage(res, { mode: "signup", error: "Enter a valid email address." }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return sendAuthPage(
      res,
      { mode: "signup", error: "Choose a password between 8 and 128 characters." },
      400,
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ email, passwordHash });
    return res.redirect(303, "/login?created=1");
  } catch (error) {
    if (error.code === "23505") {
      return sendAuthPage(
        res,
        { mode: "signup", error: "An account with that email already exists. Log in instead." },
        409,
      );
    }
    return next(error);
  }
});

app.get("/login", (req, res) =>
  sendAuthPage(res, {
    mode: "login",
    notice: req.query.created === "1" ? "Your account is ready. Log in to continue." : "",
  }),
);
app.post("/login", async (req, res, next) => {
  if (!csrfMatches(req)) {
    return sendAuthPage(res, { mode: "login", error: "Refresh the page and try again." }, 403);
  }

  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!password || password.length > 128) {
    return sendAuthPage(res, { mode: "login", error: "That email and password don’t match." }, 401);
  }

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const passwordIsValid = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !passwordIsValid) {
      return sendAuthPage(res, { mode: "login", error: "That email and password don’t match." }, 401);
    }

    setSessionCookie(res, user.id);
    return res.redirect(303, "/week");
  } catch (error) {
    return next(error);
  }
});

app.use(requireLogin());

app.get("/", (req, res) => res.redirect(303, "/week"));
app.get("/week", (req, res) => {
  const csrfToken = issueCsrfToken(res);
  res.type("html").send(renderWeekPage({ email: req.currentUser.email, csrfToken }));
});

app.get("/dashboard", async (req, res, next) => {
  try {
    const ranges = getDashboardDateRanges();
    const [eventRows, eventCategories] = await Promise.all([
      db
        .select({
          categoryId: events.categoryId,
          categoryName: categories.name,
          date: events.date,
          planned: events.planned,
          completed: events.completed,
        })
        .from(events)
        .innerJoin(categories, eq(events.categoryId, categories.id))
        .where(and(
          eq(events.userId, req.currentUser.id),
          gte(events.date, ranges.chartStart),
          lte(events.date, ranges.currentWeekEnd),
        ))
        .orderBy(asc(events.date), asc(events.id)),
      getEventCategories(),
    ]);
    const stats = calculateCurrentWeekStats(eventRows, ranges);
    const chartData = buildWeeklyChartData(eventRows, eventCategories, ranges.weeks);
    const csrfToken = issueCsrfToken(res);
    return res.type("html").send(renderDashboardPage({
      email: req.currentUser.email,
      csrfToken,
      stats,
      chartData,
      currentWeekLabel: ranges.weeks[ranges.weeks.length - 1].label,
    }));
  } catch (error) {
    return next(error);
  }
});

app.get("/events", async (req, res, next) => {
  try {
    const eventCategories = await getEventCategories();
    const queryValue = (value) => typeof value === "string" ? value.trim() : "";
    const requestedCategory = queryValue(req.query.category);
    const categoryId = parsePositiveId(requestedCategory);
    const filters = {
      category: eventCategories.some((category) => category.id === categoryId) ? String(categoryId) : "",
      planned: ["planned", "unplanned"].includes(queryValue(req.query.planned)) ? queryValue(req.query.planned) : "",
      completed: ["done", "not-done"].includes(queryValue(req.query.completed)) ? queryValue(req.query.completed) : "",
      query: queryValue(req.query.q).slice(0, 120),
      sort: ["newest", "oldest", "category"].includes(queryValue(req.query.sort)) ? queryValue(req.query.sort) : "newest",
    };
    const conditions = [eq(events.userId, req.currentUser.id)];
    if (filters.category) conditions.push(eq(events.categoryId, Number(filters.category)));
    if (filters.planned) conditions.push(eq(events.planned, filters.planned === "planned"));
    if (filters.completed) conditions.push(eq(events.completed, filters.completed === "done"));
    if (filters.query) {
      const searchPattern = `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(or(ilike(events.title, searchPattern), ilike(events.notes, searchPattern)));
    }

    const ordering = filters.sort === "category"
      ? [asc(categories.name), desc(events.date), desc(events.startTime), desc(events.id)]
      : filters.sort === "oldest"
        ? [asc(events.date), asc(events.startTime), asc(events.id)]
        : [desc(events.date), desc(events.startTime), desc(events.id)];
    const userEvents = await db
      .select({ ...joinedEventSelection, starId: stars.id })
      .from(events)
      .innerJoin(categories, eq(events.categoryId, categories.id))
      .leftJoin(stars, and(eq(stars.eventId, events.id), eq(stars.userId, req.currentUser.id)))
      .where(and(...conditions))
      .orderBy(...ordering);
    const csrfToken = issueCsrfToken(res);
    const notice = {
      created: "Your event was added.",
      updated: "Your event was updated.",
      deleted: "Your event was deleted.",
    }[req.query.status];
    return res.type("html").send(
      renderEventListPage({
        events: userEvents,
        email: req.currentUser.email,
        csrfToken,
        notice,
        categories: eventCategories,
        filters,
      }),
    );
  } catch (error) {
    return next(error);
  }
});

app.get("/starred", async (req, res, next) => {
  try {
    const starredEvents = await db
      .select({ ...joinedEventSelection, starId: stars.id })
      .from(events)
      .innerJoin(categories, eq(events.categoryId, categories.id))
      .innerJoin(stars, and(
        eq(stars.eventId, events.id),
        eq(stars.userId, req.currentUser.id),
      ))
      .where(eq(events.userId, req.currentUser.id))
      .orderBy(desc(events.date), desc(events.startTime), desc(events.id));
    const csrfToken = issueCsrfToken(res);
    return res.type("html").send(
      renderEventListPage({
        events: starredEvents,
        email: req.currentUser.email,
        csrfToken,
        isStarredPage: true,
      }),
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/events/:id/star", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return res.status(404).json({ error: "Event not found." });
  if (!csrfMatches(req)) return res.status(403).json({ error: "This request expired. Refresh and try again." });

  const starredValue = req.body?.starred;
  if (starredValue !== "true" && starredValue !== "false") {
    return res.status(400).json({ error: "Choose a valid star state." });
  }

  try {
    const savedState = await db.transaction(async (tx) => {
      const [ownedEvent] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.userId, req.currentUser.id)))
        .for("update")
        .limit(1);
      if (!ownedEvent) return null;

      if (starredValue === "true") {
        await tx
          .insert(stars)
          .values({ userId: req.currentUser.id, eventId })
          .onConflictDoNothing();
      } else {
        await tx
          .delete(stars)
          .where(and(eq(stars.userId, req.currentUser.id), eq(stars.eventId, eventId)));
      }
      return starredValue === "true";
    });
    if (savedState === null) return res.status(404).json({ error: "Event not found." });
    return res.json({ starred: savedState });
  } catch (error) {
    return next(error);
  }
});

app.get("/events/new", async (req, res, next) => {
  try {
    return await sendEventForm(req, res, { mode: "create", event: {} });
  } catch (error) {
    return next(error);
  }
});

app.get("/events/new/unplanned", async (req, res, next) => {
  try {
    return await sendEventForm(req, res, {
      mode: "unplanned",
      event: { planned: false, completed: true },
    });
  } catch (error) {
    return next(error);
  }
});

async function handleEventCreation(req, res, next, { planned }) {
  const form = eventFormValues(req.body);
  const mode = planned ? "create" : "unplanned";
  try {
    const availableCategories = await getEventCategories();
    if (!csrfMatches(req)) {
      return await sendEventForm(req, res, {
        mode,
        event: form,
        error: "This form expired. Refresh and try again.",
        status: 403,
        categories: availableCategories,
      });
    }

    const parsed = parseEventForm(form, availableCategories);
    if (parsed.errors) {
      return await sendEventForm(req, res, {
        mode,
        event: form,
        errors: parsed.errors,
        status: 400,
        categories: availableCategories,
      });
    }
    if (parsed.error) {
      return await sendEventForm(req, res, {
        mode,
        event: form,
        error: parsed.error,
        status: 400,
        categories: availableCategories,
      });
    }

    const [created] = await db
      .insert(events)
      .values({
        ...parsed.values,
        userId: req.currentUser.id,
        planned,
        completed: !planned,
      })
      .returning({ id: events.id });
    return res.redirect(303, `/events/${created.id}`);
  } catch (error) {
    if (isEventConstraintError(error)) {
      return sendEventForm(req, res, {
        mode,
        event: form,
        error: "The event could not be saved. Check the details and try again.",
        status: 400,
      });
    }
    return next(error);
  }
}

app.post("/events", (req, res, next) => handleEventCreation(req, res, next, { planned: true }));
app.post("/events/unplanned", (req, res, next) => handleEventCreation(req, res, next, { planned: false }));

app.get("/events/:id/edit", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return sendEventNotFound(res);

  try {
    const event = await findEventForUser(eventId, req.currentUser.id);
    if (!event) return sendEventNotFound(res);
    return await sendEventForm(req, res, { mode: "edit", event });
  } catch (error) {
    return next(error);
  }
});

app.post("/events/:id/edit", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return sendEventNotFound(res);

  try {
    const existing = await findEventForUser(eventId, req.currentUser.id);
    if (!existing) return sendEventNotFound(res);
    const availableCategories = await getEventCategories();
    const form = eventFormValues(req.body, existing);

    if (!csrfMatches(req)) {
      return await sendEventForm(req, res, {
        mode: "edit",
        event: form,
        error: "This form expired. Refresh and try again.",
        status: 403,
        categories: availableCategories,
      });
    }

    const parsed = parseEventForm(form, availableCategories);
    if (parsed.errors) {
      return await sendEventForm(req, res, {
        mode: "edit",
        event: form,
        errors: parsed.errors,
        status: 400,
        categories: availableCategories,
      });
    }
    if (parsed.error) {
      return await sendEventForm(req, res, {
        mode: "edit",
        event: form,
        error: parsed.error,
        status: 400,
        categories: availableCategories,
      });
    }

    try {
      const [updated] = await db
        .update(events)
        .set(parsed.values)
        .where(and(eq(events.id, eventId), eq(events.userId, req.currentUser.id)))
        .returning({ id: events.id });
      if (!updated) return sendEventNotFound(res);
      return res.redirect(303, `/events/${eventId}`);
    } catch (error) {
      if (isEventConstraintError(error)) {
        return sendEventForm(req, res, {
          mode: "edit",
          event: form,
          error: "The event could not be saved. Check the details and try again.",
          status: 400,
          categories: availableCategories,
        });
      }
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
});

app.get("/events/:id", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return sendEventNotFound(res);

  try {
    const event = await findEventForUser(eventId, req.currentUser.id);
    if (!event) return sendEventNotFound(res);
    const csrfToken = issueCsrfToken(res);
    return res.type("html").send(
      renderEventDetailPage({ event, email: req.currentUser.email, csrfToken }),
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/events/:id/completed", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return res.status(404).json({ error: "Event not found." });
  if (!csrfMatches(req)) return res.status(403).json({ error: "This request expired. Refresh and try again." });

  const completedValue = req.body?.completed;
  if (completedValue !== "true" && completedValue !== "false") {
    return res.status(400).json({ error: "Choose a valid completion state." });
  }

  try {
    const [updated] = await db
      .update(events)
      .set({ completed: completedValue === "true" })
      .where(and(
        eq(events.id, eventId),
        eq(events.userId, req.currentUser.id),
        eq(events.planned, true),
      ))
      .returning({ completed: events.completed });
    if (!updated) return res.status(404).json({ error: "Event not found." });
    return res.json({ completed: updated.completed });
  } catch (error) {
    return next(error);
  }
});

app.get("/events/:id/delete", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return sendEventNotFound(res);

  try {
    const event = await findEventForUser(eventId, req.currentUser.id);
    if (!event) return sendEventNotFound(res);
    const csrfToken = issueCsrfToken(res);
    return res.type("html").send(
      renderEventDeleteConfirmationPage({ event, email: req.currentUser.email, csrfToken }),
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/events/:id/delete", async (req, res, next) => {
  const eventId = parsePositiveId(req.params.id);
  if (!eventId) return sendEventNotFound(res);
  if (!csrfMatches(req) || req.body.confirmDelete !== "yes") {
    return res.status(403).type("html").send(
      "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Confirmation required · Rhythm</title><body><h1>Please confirm this action</h1><a href=\"/events\">Return to your events</a></body></html>",
    );
  }

  try {
    const deleted = await db.transaction(async (tx) => {
      const [ownedEvent] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.userId, req.currentUser.id)))
        .for("update")
        .limit(1);
      if (!ownedEvent) return null;

      await tx
        .delete(stars)
        .where(and(eq(stars.userId, req.currentUser.id), eq(stars.eventId, eventId)));
      const [deletedEvent] = await tx
        .delete(events)
        .where(and(eq(events.id, eventId), eq(events.userId, req.currentUser.id)))
        .returning({ id: events.id });
      return deletedEvent || null;
    });
    if (!deleted) return sendEventNotFound(res);
    return res.redirect(303, "/events?status=deleted");
  } catch (error) {
    return next(error);
  }
});

app.post("/logout", (req, res) => {
  if (!csrfMatches(req)) {
    return res.status(403).type("html").send(
      "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Request expired · Rhythm</title><body><h1>Request expired</h1><p>Refresh your week and try again.</p><a href=\"/week\">Return to My Week</a></body></html>",
    );
  }
  clearSessionCookie(res);
  return res.redirect(303, "/login");
});

app.use((req, res) => {
  res.status(404).type("html").send(
    "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Not found · Rhythm</title><body><h1>Page not found</h1><a href=\"/week\">Return to My Week</a></body></html>",
  );
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error.code || error.name || "unknown error");
  if (res.headersSent) return next(error);
  res.status(500).type("html").send(
    "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Something went wrong · Rhythm</title><body><h1>Something went wrong</h1><a href=\"/login\">Return to log in</a></body></html>",
  );
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Rhythm is listening on port ${port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
