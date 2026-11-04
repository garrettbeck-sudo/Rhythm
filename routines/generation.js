function buildRoutineEventValues(userId, activeRoutines, weekDays, skippedRoutineDates = []) {
  const generatedEvents = [];
  const skipped = new Set(
    skippedRoutineDates.map(({ routineId, date }) => `${routineId}:${date}`),
  );

  for (const day of weekDays) {
    const dayOfWeek = new Date(`${day.date}T00:00:00.000Z`).getUTCDay();
    for (const routine of activeRoutines) {
      if (!routine.active || routine.dayOfWeek !== dayOfWeek || skipped.has(`${routine.id}:${day.date}`)) continue;
      generatedEvents.push({
        userId,
        categoryId: routine.categoryId,
        routineId: routine.id,
        title: routine.title,
        notes: routine.notes || null,
        date: day.date,
        startTime: routine.startTime,
        endTime: routine.endTime,
        planned: true,
        completed: false,
      });
    }
  }

  return generatedEvents;
}

module.exports = { buildRoutineEventValues };
