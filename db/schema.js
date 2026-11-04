const {
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  pgTable,
  text,
  unique,
  uniqueIndex,
} = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: date("created_at", { mode: "string" })
    .notNull()
    .default(sql`CURRENT_DATE`),
});

const categories = pgTable("categories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  isFixed: boolean("is_fixed").notNull(),
});

const routines = pgTable(
  "routines",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    title: text("title").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    active: boolean("active").notNull(),
  },
  (table) => [
    check(
      "routines_day_of_week_range",
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
  ],
);

const events = pgTable(
  "events",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    routineId: integer("routine_id").references(() => routines.id),
    title: text("title").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    planned: boolean("planned").notNull().default(true),
    completed: boolean("completed").notNull().default(false),
    distanceMi: doublePrecision("distance_mi"),
    proteinG: doublePrecision("protein_g"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("events_routine_date_unique").on(table.routineId, table.date),
    check(
      "events_end_after_start",
      sql`${table.endTime}::time > ${table.startTime}::time`,
    ),
  ],
);

const stars = pgTable(
  "stars",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
  },
  (table) => [
    unique("stars_user_event_unique").on(table.userId, table.eventId),
  ],
);

module.exports = { users, categories, events, routines, stars };
