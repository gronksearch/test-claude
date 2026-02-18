import type { ChoreCalendarEvent } from '../../types';

interface Props {
  event: ChoreCalendarEvent;
}

export function ChoreEvent({ event }: Props) {
  return (
    <span className="flex items-center gap-1 truncate">
      {event.isCompleted && (
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className={event.isCompleted ? 'line-through opacity-75' : ''}>{event.title}</span>
    </span>
  );
}
