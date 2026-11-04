## Prompt

Build only user story 2: the data model. Create these tables exactly as in section 3 of PLAN.md:
- categories: id, name, color, is_fixed. Seed 6 rows: Workout (green, false), Meal (orange, false), Habit (blue, false), Class (gray, true), Work (gray, true), Responsibility (gray, true).
- events: id, user_id, category_id, routine_id (nullable), title, date, start_time, end_time, planned (default true), completed (default false), distance_mi (nullable), protein_g (nullable), notes.
- routines: id, user_id, category_id, title, day_of_week (0-6), start_time, end_time, active.
- stars: id, user_id, event_id, unique on (user_id, event_id).
Don't build any pages yet. Tell me if you changed anything from my plan and why.
When done, create prompts/data-model.md with this prompt and a summary.

## Summary

Added the PostgreSQL schema for categories, events, routines, and stars with the plan's fields, defaults, nullability, and relationships. Seeded the six requested categories with hex colors matching the green, orange, blue, and gray palette in Plan.md. No pages or routes were added, and the development PostgreSQL schema was updated.
