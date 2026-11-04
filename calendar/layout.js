function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(value ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function layoutCalendarEvents(events) {
  const sorted = events
    .map((event) => ({
      event,
      start: timeToMinutes(event.startTime),
      end: Math.max(timeToMinutes(event.endTime), timeToMinutes(event.startTime) + 30),
    }))
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
      const height = Math.min(1440 - top, Math.max(30, item.end - item.start));
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
