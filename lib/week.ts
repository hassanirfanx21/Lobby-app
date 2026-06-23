export function getWeekLabel(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10); // Monday's date = this week's label
}

export function getPreviousWeekLabel(weekLabel: string) {
  const d = new Date(weekLabel);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}
