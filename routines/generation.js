function buildRoutineEventValues(userId, activeRoutines, weekDays) {
  const generatedEvents = [];

  for (const day of weekDays) {
    const dayOfWeek = new Date(`${day.date}T00:00:00.000Z`).getUTCDay();
    for (const routine of activeRoutines) {
      if (!routine.active || routine.dayOfWeek !== dayOfWeek) continue;
      generatedEvents.push({
        userId,
        categoryId: routine.categoryId,
        routineId: routine.id,
        title: routine.title,
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
