# Prompt

Build only user story 7: stars.
- A star icon on each event (list and detail page) toggles a row in the stars table for the logged-in user.
- A "Starred" page lists only the events I starred.
- Use the single shared stars table (user_id, event_id). Don't add a starred column to events.
When done, create prompts/stars.md with this prompt and a summary.

# Summary

Added star controls to event list and detail pages and saved each user's selections in the existing shared stars table. Added an authenticated Starred page that lists only events starred by the signed-in user and owned by that user. No starred column was added to events; changing a star only changes the current user's row in stars.
