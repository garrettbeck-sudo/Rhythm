Build only user story 9: a dashboard page.
- A bar chart (Chart.js) of completed vs planned items per week for the last 4 weeks, by category.
- Three stats for the current week (Monday-Sunday):
  1. Completion rate = planned events that are completed / all planned events, as a whole percent. Unplanned events are NOT counted in this rate.
  2. Workouts completed (category Workout, completed = true, planned or unplanned).
  3. Unplanned events logged (planned = false).
- Put the calculations in their own functions so they can be tested.
When done, create prompts/dashboard.md with this prompt and a summary.

Summary:
Added a signed-in dashboard with a Chart.js weekly category chart and three Monday-through-Sunday stats. Extracted the date-range, chart aggregation, and weekly-stat calculations into separate functions and added unit tests for week boundaries, completion-rate exclusions, workout and unplanned counts, and chart series. The dashboard reads only the logged-in user's events from PostgreSQL and is linked from the main week and event navigation.
