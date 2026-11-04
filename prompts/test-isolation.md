# Prompt

Set up an automated test framework if there isn't one, and write ONE test for data isolation:
Given User A has planned a "6 mi tempo run" on Thursday, when User B logs in and requests the weekly view (and the events list), then User B receives no events.
Tell me the exact command to run the tests. Then explain the test in plain English, step by step, as if to a non-programmer.
When done, create prompts/test-isolation.md with this prompt and a summary.

# Summary

The project already uses Node's built-in test runner, launched with `npm test`, so no additional test framework was needed. Added one integration test that creates a planned Thursday workout for User A, logs User B in through the app, and verifies the weekly view and events list are empty for User B. The test uses unique temporary accounts and removes their event, stars, routine data, and user rows after it runs.
