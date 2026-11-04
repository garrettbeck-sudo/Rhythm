# Prompt

Build only user story 8: find things, on the events list page.
- Filters: category, planned vs unplanned, done vs not done.
- A search box that matches title and notes.
- Sort: date (newest or oldest first) and category.
- Filters, search, and sort work together.
When done, create prompts/search-sort.md with this prompt and a summary.

# Summary

Added server-side category, planned/unplanned, completion, title/notes search, and date/category sorting to the events list, with all controls submitted together. Filters are applied only to the signed-in user's events and the selected values remain in the controls after results load. Added a no-results state and Clear all control without changing the Starred page or database schema.
