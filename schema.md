# Rhythm PostgreSQL schema

This snapshot was checked against the Replit-managed development and production PostgreSQL catalogs. Both databases currently have the same six public tables, columns, PostgreSQL types, nullability, defaults, keys, and indexes. The event-time check constraint differs between environments; that difference is noted below.

The application connects through `DATABASE_URL`, using `pg` and Drizzle ORM.

## Tables and columns

`GENERATED ALWAYS AS IDENTITY` means PostgreSQL generates the integer ID.

### `users`

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `email` | `text` | NOT NULL, unique |
| `password_hash` | `text` | NOT NULL |
| `created_at` | `date` | NOT NULL, defaults to `CURRENT_DATE` |

### `categories`

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `name` | `text` | NOT NULL |
| `color` | `text` | NOT NULL |
| `is_fixed` | `boolean` | NOT NULL |

The category names and colors are stored as rows; the database does not constrain them to a fixed list.

### `events`

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `user_id` | `integer` | NOT NULL, foreign key to `users.id` |
| `category_id` | `integer` | NOT NULL, foreign key to `categories.id` |
| `routine_id` | `integer` | NULL allowed, foreign key to `routines.id` |
| `title` | `text` | NOT NULL |
| `date` | `date` | NOT NULL |
| `start_time` | `text` | NULL allowed |
| `end_time` | `text` | NULL allowed |
| `planned` | `boolean` | NOT NULL, defaults to `true` |
| `completed` | `boolean` | NOT NULL, defaults to `false` |
| `distance_mi` | `double precision` | NULL allowed |
| `protein_g` | `double precision` | NULL allowed |
| `notes` | `text` | NULL allowed |

### `routines`

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `user_id` | `integer` | NOT NULL, foreign key to `users.id` |
| `category_id` | `integer` | NOT NULL, foreign key to `categories.id` |
| `title` | `text` | NOT NULL |
| `day_of_week` | `integer` | NOT NULL |
| `start_time` | `text` | NULL allowed |
| `end_time` | `text` | NULL allowed |
| `active` | `boolean` | NOT NULL |
| `notes` | `text` | NULL allowed |

### `routine_skips`

Records a date on which one recurring routine occurrence was skipped.

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `user_id` | `integer` | NOT NULL, foreign key to `users.id` |
| `routine_id` | `integer` | NOT NULL, foreign key to `routines.id` |
| `date` | `date` | NOT NULL |

There is a unique key on `(user_id, routine_id, date)`. Deleting a routine cascades to its skip rows.

### `stars`

| Column | PostgreSQL type | Null/default/key |
| --- | --- | --- |
| `id` | `integer` | NOT NULL, identity, primary key |
| `user_id` | `integer` | NOT NULL, foreign key to `users.id` |
| `event_id` | `integer` | NOT NULL, foreign key to `events.id` |

There is a unique key on `(user_id, event_id)`, so a user can star an event only once.

## Keys, constraints, and relationships

- Every table has an integer identity primary key named `id`.
- `users.email` is unique.
- `events` has a unique index on `(routine_id, date)`, preventing duplicate generated occurrences for a routine on one date. PostgreSQL permits multiple rows with a NULL `routine_id`.
- `routines.day_of_week` must be between 0 and 6.
- Routine times must either both be NULL or both be present with `end_time` later than `start_time`.
- Development applies the same paired-time rule to event times. Production currently has a weaker `events_end_after_start` check that only compares `end_time > start_time`; because SQL CHECK constraints accept NULL results, production can also accept a row with only one time missing. Application validation is stricter.
- Foreign keys connect events to users, categories, and optionally routines; routines to users and categories; routine skips to users and routines; and stars to users and events.
- A user has many events, routines, routine skips, and stars. A category has many events and routines. A routine can generate many events and have many skipped dates; each event may refer to zero or one routine.
- Users and events have a many-to-many relationship through `stars`: each star row joins one user to one event. The foreign keys do not themselves enforce that the starred event belongs to the same user; application queries enforce ownership.

### Text relationship diagram

```text
users 1 ──< events >── 1 categories
users 1 ──< routines >── 1 categories
routines 1 ──< events              (event.routine_id is optional)
users 1 ──< routine_skips >── 1 routines
users 1 ──< stars >── 1 events     (users ↔ events is many-to-many)
```

## Differences from `Plan.md` section 3

- The planned `users`, `categories`, `events`, `routines`, and `stars` tables exist. The actual schema also has `routine_skips`, which records a skipped routine occurrence by user, routine, and date.
- `routines.notes` is an additional nullable text column not listed in the plan.
- `events.start_time`, `events.end_time`, `routines.start_time`, and `routines.end_time` are nullable to support untimed items. In development, the time checks allow either both times blank or both present with the end after the start.
- The plan uses generic `number` types. Actual IDs and `day_of_week` are PostgreSQL `integer`; `distance_mi` and `protein_g` are `double precision`. Time values are stored as `text`, as the plan describes.
- The database enforces uniqueness for email, a user's star on an event, a routine skip date, and a routine-generated event date. The plan describes some of these behaviors but does not list all the corresponding keys and indexes.
- The schema stores category names, colors, and fixed status in rows; it does not enforce the six planned category values with an enum or check constraint.
- Production's event-time check is weaker than the development check and can accept a partially specified time pair, even though the application validates event forms.

## README reference

- **Database:** Replit-managed PostgreSQL, accessed by the app through `DATABASE_URL`.
- **Authentication:** Custom email/password authentication. Passwords use salted Node.js `scrypt` hashes; sessions use an HMAC-SHA-256 signed cookie. This app does not use Replit Auth.
- **Key libraries:** Express, Drizzle ORM, `pg` (node-postgres), and Chart.js. Drizzle Kit is used for schema tooling; tests use Node's built-in `node:test`. The weekly calendar is custom rather than FullCalendar.
- **Run the app:** `npm start` (runs `node server.js`).
- **Run the tests:** `npm test` (runs `node --test`).
