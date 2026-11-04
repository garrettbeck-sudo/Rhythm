function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(value ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

const CALENDAR_DAY_MINUTES = 24 * 60;
const CALENDAR_START_MINUTES = 5 * 60;

function layoutCalendarEvents(events) {
  const sorted = events
    .map((event) => {
      const startMinutes = timeToMinutes(event.startTime);
      const endMinutes = timeToMinutes(event.endTime);
      const start = (startMinutes - CALENDAR_START_MINUTES + CALENDAR_DAY_MINUTES) % CALENDAR_DAY_MINUTES;
      const duration = Math.max(endMinutes - startMinutes, 30);
      return { event, start, end: start + duration };
    })
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const positioned = [];
  let cluster = [];
  let clusterEnd = -1;

  function finishCluster() {
    if (!cluster.length) return;
    const laneEnds = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      item.lane = lane;
    }
    const laneCount = laneEnds.length;
    for (const item of cluster) {
      const top = item.start;
      const height = Math.min(CALENDAR_DAY_MINUTES - top, Math.max(30, item.end - item.start));
      positioned.push({
        event: item.event,
        top,
        height,
        left: (item.lane / laneCount) * 100,
        width: 100 / laneCount,
      });
    }
    cluster = [];
    clusterEnd = -1;
  }

  for (const item of sorted) {
    if (cluster.length && item.start >= clusterEnd) finishCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  finishCluster();
  return positioned;
}

module.exports = { layoutCalendarEvents, timeToMinutes };
