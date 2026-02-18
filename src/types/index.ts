export interface TeamMember {
  id: string;
  name: string;
  color: string; // hex color for calendar/UI display
}

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  frequency: Frequency;
  interval: number;       // every N days/weeks/months
  daysOfWeek?: number[];  // 0=Sun … 6=Sat, for weekly
  dayOfMonth?: number;    // 1–31, for monthly
  endDate?: string;       // ISO date string, optional
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assigneeId: string | null;
  startDate: string;              // ISO date of first occurrence
  recurrence: RecurrenceRule | null; // null = one-time chore
}

export interface CompletionRecord {
  id: string;
  choreId: string;
  occurrenceDate: string; // ISO date (identifies which instance)
  completedAt: string;    // ISO datetime
  completedById: string;  // TeamMember.id
}

// Calendar event shape passed to react-big-calendar
export interface ChoreCalendarEvent {
  id: string;               // `${choreId}::${occurrenceDate}`
  choreId: string;
  occurrenceDate: string;   // ISO date
  title: string;
  start: Date;
  end: Date;
  assignee: TeamMember | null;
  isCompleted: boolean;
  completedById?: string;
}
