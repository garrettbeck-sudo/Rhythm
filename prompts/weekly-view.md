Build only feature 10: a weekly calendar view, and make it the home page after login.
- A Sunday-Saturday time grid (FullCalendar is fine) with buttons for the previous and next week.
- Fixed commitments (Class, Work, Responsibility) show in gray; Workout green, Meal orange, Habit blue.
- Each planned healthy item has a checkbox that uses the existing check-off logic.
- Clicking an event opens its detail page.
When done, create prompts/weekly-view.md with this prompt and a summary.

Summary:
Replaced the My Week placeholder with a Sunday-to-Saturday time grid at the existing `/week` route, so login continues to land on the calendar. Added previous/next week navigation and a user-scoped PostgreSQL query for that week's events, using each category's seeded color and a dashed style for unplanned events. Planned Workout, Meal, and Habit items use the existing asynchronous check-off control, while event links open their detail pages.
