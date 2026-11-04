const { eq } = require("drizzle-orm");
const { db, pool } = require("./index");
const { categories } = require("./schema");

const seededCategories = [
  { name: "Workout", color: "#638c6a", isFixed: false },
  { name: "Meal", color: "#d58a59", isFixed: false },
  { name: "Habit", color: "#7798ae", isFixed: false },
  { name: "Class", color: "#829087", isFixed: true },
  { name: "Work", color: "#829087", isFixed: true },
  { name: "Responsibility", color: "#829087", isFixed: true },
];

async function seedCategories() {
  await db.transaction(async (transaction) => {
    const existingRows = await transaction
      .select({ id: categories.id, name: categories.name })
      .from(categories);
    const existingIds = new Map(existingRows.map((row) => [row.name, row.id]));

    for (const category of seededCategories) {
      const existingId = existingIds.get(category.name);
      if (existingId) {
        await transaction
          .update(categories)
          .set({ color: category.color, isFixed: category.isFixed })
          .where(eq(categories.id, existingId));
      } else {
        const [inserted] = await transaction
          .insert(categories)
          .values(category)
          .returning({ id: categories.id });
        existingIds.set(category.name, inserted.id);
      }
    }
  });
}

seedCategories()
  .then(() => console.log(`Seeded ${seededCategories.length} categories.`))
  .catch((error) => {
    console.error("Failed to seed categories:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
