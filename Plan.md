PLAN.md: Rhythm
1. Pitch

I'm building Rhythm because between classes, work, and other responsibilities, I need one place to plan my workouts, meal prep, and healthy habits around my fixed commitments, then check off what I actually did. I'll use it every day: on Sunday to plan the week, and daily to check items off and log anything unplanned.

2. Features

User stories, numbered in the order I'll build them. Each one becomes an Issue, a branch, and a pull request.

Spine features

Sign up and login: As a new user, I want to create an account with my email and password, then log in and out, so that my schedule is private to me.
Data model: I want my events saved under categories (Workout, Meal, Habit, Class, Work, Responsibility), so that my week is organized by type.
Create / read / update / delete: I want to add an event with a title, category, date, start time, end time, and notes, see all my events in a list, open one event's detail page, edit it, and delete it after an "Are you sure?" confirmation, so that I can keep my plan accurate.
Validation: I want to see a friendly message if I leave the title, category, or date blank, or set an end time before the start time, so that I don't save broken events.
Check off: I want to check off a planned workout, meal, or habit when I finish it, so that I can track whether I stuck to my plan.
Log unplanned events: I want to log something I didn't plan (like a dinner out or a pickup basketball game) as an unplanned, completed event, so that my week reflects what really happened.
Stars: I want to star important events (like a long run or a favorite meal prep) and see them on a Starred page, so that I can find them quickly.
Find things: I want to filter events by category, planned or unplanned, and done or not done, search titles and notes, and sort by date or category, so that I can find what I'm looking for.
Dashboard: I want a chart of completed versus planned items per week, plus my weekly completion rate, workouts completed, and unplanned events logged, so that I can see how well I'm following my plan.

My 3 features

Weekly calendar view: As a student, I want a Mon–Sun time grid showing classes and work in gray and healthy items in color, each with a checkbox, so that I can see where my free time is.
Recurring routines: I want to set a routine once (e.g., "Tuesday 6:00–6:45am rower intervals") and have it appear every week, so that I don't re-enter my training plan.
Conflict warning: I want a warning when I plan a workout or meal that overlaps a class or work block, so that I don't double-book myself.
3. Database
Table	Column	Type	Notes
users	id	number	Primary key
	email	text	Unique
	password_hash	text	Never the plain password
	created_at	date	
categories	id	number	Primary key
	name	text	Workout, Meal, Habit, Class, Work, Responsibility
	color	text	Hex color for the calendar
	is_fixed	true/false	True for Class, Work, Responsibility
events (main item)	id	number	Primary key
	user_id	number	Links to users.id
	category_id	number	Links to categories.id
	routine_id	number	Links to routines.id (optional)
	title	text	Required
	date	date	Required
	start_time	text	e.g., "06:00"
	end_time	text	Must be after start_time
	planned	true/false	False = logged as unplanned
	completed	true/false	Checked off
	distance_mi	number	Optional, for runs
	protein_g	number	Optional, for meals
	notes	text	Optional
routines	id	number	Primary key
	user_id	number	Links to users.id
	category_id	number	Links to categories.id
	title	text	e.g., "Rower intervals"
	day_of_week	number	0 = Sunday … 6 = Saturday
	start_time	text	
	end_time	text	
	active	true/false	
stars	id	number	Primary key
	user_id	number	Links to users.id
	event_id	number	Links to events.id

Relationships

One user has many events, many routines, and many stars (one-to-many).
One category has many events (one-to-many).
One routine creates many events (one-to-many).
Users and events are connected through stars (many-to-many). One stars table holds everyone's stars, with one row per "this user starred this event."
users ──< events >── categories
  │         ^
  │         │
  ├──< routines
  │
  └──< stars >── events
4. Tests
Data isolation: Given User A has planned a "6 mi tempo run" on Thursday, when User B logs in and opens the weekly view, then User B sees no events.
Dashboard: Given I have 4 planned items this week, 3 of them checked off, plus 1 unplanned event, when I open the dashboard, then the completion rate shows 75%.
5. Technologies
Choice	Why
Coding agent: Replit Agent	Database, login, and hosting are built in, so I can spend my time on features instead of setup.
Database: Replit's built-in PostgreSQL	My data is relational (users, events, categories, stars), which fits a SQL database.
Sign up and login: Replit Auth (or email/password auth built by the agent)	Handles passwords securely so I don't store them myself.
Hosting: Replit Deployments	One-click redeploy after each merged PR keeps the live URL current.
Version control: GitHub	Every feature goes through an Issue, a branch, and a PR, so the history shows my process.
Libraries: Chart.js and FullCalendar	Chart.js draws the dashboard chart; FullCalendar gives me a week grid without building one from scratch.
6. Design
Look: clean and light, with lots of white space and rounded cards.
Colors: gray for fixed commitments (class, work, responsibilities), one color per healthy category: green for workouts, orange for meals, blue for habits. Unplanned events get a dashed border.
Inspiration: Google Calendar (week grid and color blocks) and Todoist (satisfying checkboxes and simple lists).
7. Risks and cuts
Least sure about: recurring routines. Generating each week's events from a routine without creating duplicates may be tricky.
Cut first: the conflict warning. If I'm still short on time, I'll cut recurring routines and enter my weekly training sessions by hand.
Never cut: the spine features, check-off, unplanned logging, and both tests.
