## Prompt

Set up the base app and build only user story 1 from PLAN.md: sign up and login.
- A visitor can create an account with email and password from inside the app, then log in and log out.
- Create the users table: id (primary key), email (text, unique), password_hash (text), created_at (date). Hash passwords; never store them in plain text.
- Every page except Sign up and Log in requires being logged in.
- After login, show a simple "My Week" page with my email and a Log out button.
When done, create prompts/auth.md containing this prompt and a 3-sentence summary of what you built.

## Summary

Rhythm supports email-and-password account creation, login, and logout, with password hashes stored in PostgreSQL. Visitors can access the sign-up and login pages, while authenticated users see a My Week page with their email and a Log out button. The `users` table stores each account’s unique email, password hash, and creation date, and the authentication forms use CSRF protection.
