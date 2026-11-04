# Prompt

Build only user story 4: validation on the event form (add and edit).
- Title, category, and date are required.
- End time must be after start time.
- Show a friendly message next to the field (e.g., "Please add a title") and keep what I already typed. Validate on both the browser and the server.
When done, create prompts/validation.md with this prompt and a summary.

# Summary

Added inline validation to both event creation and edit forms for required title, category, and date fields, plus time ordering. Browser checks display nearby messages and preserve entered values, while server checks return the same field-level errors without saving invalid data. Existing values are rendered back into the form after invalid submissions.
