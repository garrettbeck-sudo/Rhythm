function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell({ title, content, bodyClass = "" }) {
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

module.exports = { renderAuthPage, renderWeekPage };
