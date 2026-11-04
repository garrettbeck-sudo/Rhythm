# Prompt

Build only user story 6: log unplanned events.
- Add a "Log unplanned" button next to "Add event".
- It opens the same form but saves the event with planned = false and completed = true.
- Unplanned events show an "Unplanned" label and a dashed border everywhere they appear.
When done, create prompts/unplanned.md with this prompt and a summary.

# Summary

Added a separate Log unplanned action that opens the existing event form, with a dedicated server route that saves events as planned=false and completed=true. Unplanned items have an Unplanned label and dashed border on the list, detail, edit, and delete-confirmation views. PostgreSQL continues to save each event under the logged-in user, and existing validation still applies.
