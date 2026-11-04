const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { createServer } = require("node:net");
const path = require("node:path");
const test = require("node:test");
const { setTimeout: delay } = require("node:timers/promises");
const { and, eq } = require("drizzle-orm");
const { hashPassword } = require("../auth");
const { db, pool } = require("../db");
const { categories, events, routineSkips, routines, stars, users } = require("../db/schema");

async function findAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => {
    probe.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

function startApp(port) {
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "test", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  return { child, get output() { return output; } };
}

async function waitForApp(appProcess, port) {
  const url = `http://127.0.0.1:${port}/login`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (appProcess.child.exitCode !== null) {
      throw new Error(`Test server exited before starting (code ${appProcess.child.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
    } catch {
      // The child server may still be starting.
    }
    await delay(100);
  }
  throw new Error(`Test server did not start in time. ${appProcess.output}`);
}

async function stopApp(appProcess) {
  if (!appProcess || appProcess.child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      appProcess.child.kill("SIGKILL");
      resolve();
    }, 3000);
    appProcess.child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    appProcess.child.kill("SIGTERM");
  });
}

function createCookieClient(baseUrl) {
  const cookies = new Map();
  return async (pathname, { method = "GET", fields } = {}) => {
    const headers = {};
    if (cookies.size) {
      headers.cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    }
    let body;
    if (fields) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(fields).toString();
    }

    const response = await fetch(new URL(pathname, baseUrl), {
      method,
      headers,
      body,
      redirect: "manual",
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator > 0) {
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
    }
    return response;
  };
}

function readCsrfToken(html) {
  const match = html.match(/name="_csrf" value="([a-f0-9]+)"/);
  assert.ok(match, "login page should include a CSRF token");
  return match[1];
}

function nextThursday() {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  const daysUntilThursday = (4 - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilThursday);
  return date.toISOString().slice(0, 10);
}

test("a user's weekly view and event list do not show another user's events", async () => {
  const createdUserIds = [];
  let appProcess;

  try {
    const [workoutCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, "Workout"))
      .limit(1);
    assert.ok(workoutCategory, "Workout category should be seeded");

    const suffix = randomUUID();
    const userAEmail = `isolation-a-${suffix}@example.test`;
    const userBEmail = `isolation-b-${suffix}@example.test`;
    const password = "data-isolation-test-password";
    const passwordHash = await hashPassword(password);
    const [userA] = await db
      .insert(users)
      .values({ email: userAEmail, passwordHash })
      .returning({ id: users.id });
    createdUserIds.push(userA.id);
    const [userB] = await db
      .insert(users)
      .values({ email: userBEmail, passwordHash })
      .returning({ id: users.id });
    createdUserIds.push(userB.id);

    const eventDate = nextThursday();
    const eventTitle = "6 mi tempo run";
    await db
      .insert(events)
      .values({
        userId: userA.id,
        categoryId: workoutCategory.id,
        title: eventTitle,
        date: eventDate,
        startTime: "06:00",
        endTime: "07:00",
        planned: true,
        completed: false,
        distanceMi: 6,
      });
    const userAEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.userId, userA.id), eq(events.title, eventTitle)));
    assert.equal(userAEvents.length, 1, "User A's planned run should exist");

    const port = await findAvailablePort();
    appProcess = startApp(port);
    await waitForApp(appProcess, port);

    const request = createCookieClient(`http://127.0.0.1:${port}`);
    const loginPage = await request("/login");
    assert.equal(loginPage.status, 200);
    const loginHtml = await loginPage.text();
    const loginResponse = await request("/login", {
      method: "POST",
      fields: {
        _csrf: readCsrfToken(loginHtml),
        email: userBEmail,
        password,
      },
    });
    assert.equal(loginResponse.status, 303, "User B should log in successfully");
    assert.equal(loginResponse.headers.get("location"), "/week");

    const weekResponse = await request(`/week?week=${eventDate}`);
    assert.equal(weekResponse.status, 200);
    const weekHtml = await weekResponse.text();
    assert.match(weekHtml, /No events are scheduled for this week\./);
    assert.doesNotMatch(weekHtml, new RegExp(eventTitle));
    assert.match(weekHtml, new RegExp(userBEmail));

    const eventsResponse = await request("/events");
    assert.equal(eventsResponse.status, 200);
    const eventsHtml = await eventsResponse.text();
    assert.match(eventsHtml, /Your plans will find their rhythm here\./);
    assert.doesNotMatch(eventsHtml, new RegExp(eventTitle));
    assert.match(eventsHtml, new RegExp(userBEmail));
  } finally {
    await stopApp(appProcess);
    for (const userId of createdUserIds) {
      await db.delete(stars).where(eq(stars.userId, userId));
      await db.delete(events).where(eq(events.userId, userId));
      await db.delete(routineSkips).where(eq(routineSkips.userId, userId));
      await db.delete(routines).where(eq(routines.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    await pool.end();
  }
});
