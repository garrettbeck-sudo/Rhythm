const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const { eq } = require("drizzle-orm");
const { db, pool } = require("./db");
const { users } = require("./db/schema");
const { createSessionToken, hashPassword, verifyPassword, verifySessionToken } = require("./auth");
const { renderAuthPage, renderWeekPage } = require("./views/pages");

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
  const csrfToken = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, csrfToken);
  return res.status(status).type("html").send(renderAuthPage({ ...options, csrfToken }));
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
  const csrfToken = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, csrfToken);
  res.type("html").send(renderWeekPage({ email: req.currentUser.email, csrfToken }));
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
