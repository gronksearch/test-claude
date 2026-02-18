import { RRule, Weekday } from 'rrule';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import type { Chore, ChoreCalendarEvent, CompletionRecord, TeamMember } from '../types';

const RR_WEEKDAYS: Weekday[] = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];

function buildRRule(chore: Chore, rangeStart: Date, rangeEnd: Date): Date[] {
  const { recurrence, startDate } = chore;
  const dtstart = parseISO(startDate);

  if (!recurrence) {
    // One-time chore: only include if it falls in range
    const d = startOfDay(dtstart);
    if (d >= startOfDay(rangeStart) && d <= endOfDay(rangeEnd)) {
      return [d];
    }
    return [];
  }

  const options: ConstructorParameters<typeof RRule>[0] = {
    dtstart,
    interval: recurrence.interval,
    until: recurrence.endDate ? parseISO(recurrence.endDate) : undefined,
  };

  switch (recurrence.frequency) {
    case 'daily':
      options.freq = RRule.DAILY;
      break;
    case 'weekly':
      options.freq = RRule.WEEKLY;
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        options.byweekday = recurrence.daysOfWeek.map((d) => RR_WEEKDAYS[d]);
      }
      break;
    case 'monthly':
      options.freq = RRule.MONTHLY;
      if (recurrence.dayOfMonth) {
        options.bymonthday = recurrence.dayOfMonth;
      }
      break;
  }

  const rule = new RRule(options);
  return rule.between(startOfDay(rangeStart), endOfDay(rangeEnd), true);
}

export function expandChores(
  chores: Chore[],
  members: TeamMember[],
  completions: CompletionRecord[],
  rangeStart: Date,
  rangeEnd: Date,
): ChoreCalendarEvent[] {
  const completionSet = new Set(
    completions.map((c) => `${c.choreId}::${c.occurrenceDate}`),
  );
  const completionByKey = new Map(
    completions.map((c) => [`${c.choreId}::${c.occurrenceDate}`, c]),
  );
  const memberById = new Map(members.map((m) => [m.id, m]));

  const events: ChoreCalendarEvent[] = [];

  for (const chore of chores) {
    const dates = buildRRule(chore, rangeStart, rangeEnd);
    for (const date of dates) {
      const occurrenceDate = date.toISOString().slice(0, 10);
      const key = `${chore.id}::${occurrenceDate}`;
      const completion = completionByKey.get(key);
      events.push({
        id: key,
        choreId: chore.id,
        occurrenceDate,
        title: chore.title,
        start: date,
        end: date,
        assignee: chore.assigneeId ? (memberById.get(chore.assigneeId) ?? null) : null,
        isCompleted: completionSet.has(key),
        completedById: completion?.completedById,
      });
    }
  }

  return events;
}
