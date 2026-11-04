Build only feature 11: recurring routines.
- A "Routines" page where I can add, edit, and delete a routine: title, category, day of week, start time, end time, active.
- When I view a week, create events for each active routine on its day, with routine_id set, but ONLY if an event with that routine_id and date doesn't already exist. No duplicates.
- Editing a routine only affects future weeks that haven't been generated yet.
When done, create prompts/routines.md with this prompt and a summary.

Summary:
Added a signed-in Routines page with add, edit, and confirmed-delete flows backed by the existing PostgreSQL routines table. When a user opens a week, active routines create planned events on matching days, while a unique routine/date index prevents duplicates and existing generated events are left unchanged. Deleting a routine stops future generation and keeps previously created events in the user's plans.
