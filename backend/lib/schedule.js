const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function todayBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// grade: 0=Again, 1=Hard, 2=Good, 3=Easy
function nextSchedule(card, grade, now = new Date()) {
  let { ease = 2.5, interval = 0, reps = 0, lapses = 0 } = card;
  if (grade === 0) ease -= 0.2;
  else if (grade === 1) ease -= 0.15;
  else if (grade === 3) ease += 0.15;
  ease = clamp(ease, 1.3, 3.0);

  if (grade === 0) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else if (reps === 0) {
    reps = 1;
    interval = 1;
  } else if (reps === 1) {
    reps = 2;
    interval = 6;
  } else {
    reps += 1;
    interval = Math.max(1, Math.round(interval * ease));
  }

  return { ease, interval, reps, lapses, due: addDays(now, interval), lastReviewedAt: now };
}

const MAX_REVIEW = 60;
const MAX_NEW = 20;

module.exports = { nextSchedule, todayBounds, MAX_REVIEW, MAX_NEW };
