# Prompt

Build only feature 12: conflict warning.
- When I save an event that overlaps in time and date with any other event on the same date and time, show a warning naming the conflicting event, with "Save anyway" and "Go back" buttons. The "Save anyway" feature will remove the conflicting event, The "Go back" feature will keep discard changes and take me back to the event input page.
- Only check against my own events. 
When done, create prompts/conflict-warning.md with this prompt and a summary.

# Summary

Event creation and editing now warn about overlapping events owned by the signed-in user and list their names and times. Save anyway replaces the confirmed conflicts, including recording a one-date skip for routine-generated events so they do not reappear; Go back returns to the form without saving or deleting anything. PostgreSQL transactions scope conflict reads and writes to the logged-in user, and the form preserves its entered values.
