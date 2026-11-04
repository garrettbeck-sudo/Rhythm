const { date, integer, pgTable, text } = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: date("created_at", { mode: "string" })
    .notNull()
    .default(sql`CURRENT_DATE`),
});

module.exports = { users };
