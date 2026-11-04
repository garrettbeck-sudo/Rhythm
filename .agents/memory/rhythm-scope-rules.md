---
name: Rhythm scope rules
description: The user's standing rules for feature work and personal data in Rhythm.
---

For each task, build only the feature requested. Use PostgreSQL. Every database query for events, routines, and stars must filter by the logged-in user's ID. Do not commit or switch to `main`; stay on the current branch.

**Why:** the user gave these as rules for every task.

**How to apply:** before editing, confirm the requested feature boundary, keep event/routine/star database operations scoped to the signed-in user, and preserve the current branch without committing.
