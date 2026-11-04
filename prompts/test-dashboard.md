# Prompt

Write ONE automated test for the dashboard completion rate:
Given I have 4 planned events this week, 3 of them completed, plus 1 unplanned event, when the dashboard stats are calculated, then the completion rate is 75%.
Tell me the command to run it, and explain the test in plain English.
When done, create prompts/test-dashboard.md with this prompt and a summary.

# Summary

The project already uses Node’s built-in test runner with `npm test`, so no additional test framework was needed. Added one dashboard test with four planned events, three completed, and one completed unplanned event, and it asserts that the completion rate is 75%. The test also checks that the unplanned event is counted separately and does not change the planned completion-rate denominator.
