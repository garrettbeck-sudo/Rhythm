# Prompt

Build only user story 3: create, read, update, delete for events.
- "Add event" form: title, category (dropdown), date, start time, end time, notes, plus distance_mi if the category is Workout and protein_g if it's Meal.
- A list page of my events, newest date first.
- A detail page for one event.
- Edit an event.
- Delete an event, with an "Are you sure?" confirmation first.
A user must only ever see and change their own events.
When done, create prompts/crud.md with this prompt and a summary.

# Summary

Implemented authenticated event creation, newest-first personal event listings, detail pages, editing, and a separate delete confirmation. Event forms save the requested details and category-specific workout distance or meal protein, while PostgreSQL assigns ownership from the logged-in user's ID and scopes event reads and changes to that user. Added event navigation from My Week, category-dependent form fields, and CSRF-protected forms without adding routines, stars, or other planned features.
