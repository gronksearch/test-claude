import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as startW, endOfWeek, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useStore } from '../../store';
import { expandChores } from '../../lib/recurrence';
import type { ChoreCalendarEvent, TeamMember } from '../../types';
import { ChoreEvent } from './ChoreEvent';
import { ChoreModal } from '../chores/ChoreModal';
import { Modal } from '../shared/Modal';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

type ViewType = 'month' | 'week' | 'day';

function getRangeForView(date: Date, view: ViewType): { start: Date; end: Date } {
  if (view === 'month') {
    const s = startOfMonth(date);
    const e = endOfMonth(date);
    // Expand to full calendar grid (6 weeks)
    return { start: addDays(startW(s, { weekStartsOn: 0 }), 0), end: addDays(endOfWeek(e, { weekStartsOn: 0 }), 0) };
  }
  if (view === 'week') {
    return {
      start: startOfWeek(date, { weekStartsOn: 0 }),
      end: endOfWeek(date, { weekStartsOn: 0 }),
    };
  }
  // day
  return { start: new Date(date.setHours(0, 0, 0, 0)), end: new Date(new Date(date).setHours(23, 59, 59, 999)) };
}

export function CalendarView() {
  const { members, chores, completions, recordCompletion, removeCompletion } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<ChoreCalendarEvent | null>(null);
  const [showNewChore, setShowNewChore] = useState(false);
  const [newChoreDate, setNewChoreDate] = useState<string | undefined>();

  const range = useMemo(() => getRangeForView(new Date(currentDate), view), [currentDate, view]);

  const events = useMemo(
    () => expandChores(chores, members, completions, range.start, range.end),
    [chores, members, completions, range],
  );

  const eventStyleGetter = useCallback(
    (event: ChoreCalendarEvent) => {
      const color = event.assignee?.color ?? '#6B7280';
      return {
        style: {
          backgroundColor: event.isCompleted ? `${color}99` : color,
          borderColor: color,
          color: '#fff',
          borderRadius: '4px',
        },
        className: event.isCompleted ? 'completed-event' : '',
      };
    },
    [],
  );

  function handleSelectEvent(event: ChoreCalendarEvent) {
    setSelectedEvent(event);
  }

  function handleSelectSlot(slotInfo: { start: Date }) {
    const date = slotInfo.start.toISOString().slice(0, 10);
    setNewChoreDate(date);
    setShowNewChore(true);
  }

  function handleToggleComplete(memberId: string) {
    if (!selectedEvent) return;
    if (selectedEvent.isCompleted) {
      removeCompletion(selectedEvent.choreId, selectedEvent.occurrenceDate);
    } else {
      recordCompletion({
        choreId: selectedEvent.choreId,
        occurrenceDate: selectedEvent.occurrenceDate,
        completedAt: new Date().toISOString(),
        completedById: memberId,
      });
    }
    setSelectedEvent(null);
  }

  const completionMember = selectedEvent?.completedById
    ? members.find((m) => m.id === selectedEvent.completedById)
    : null;

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <button
          onClick={() => {
            setNewChoreDate(new Date().toISOString().slice(0, 10));
            setShowNewChore(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chore
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-2">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          date={currentDate}
          view={view}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          onNavigate={setCurrentDate}
          onView={(v) => setView(v as ViewType)}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }) => <ChoreEvent event={event as ChoreCalendarEvent} />,
          }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Event detail / completion modal */}
      {selectedEvent && (
        <CompletionModal
          event={selectedEvent}
          members={members}
          completionMember={completionMember ?? null}
          onToggle={handleToggleComplete}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* New chore modal */}
      {showNewChore && (
        <ChoreModal
          defaultDate={newChoreDate}
          onClose={() => {
            setShowNewChore(false);
            setNewChoreDate(undefined);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface CompletionModalProps {
  event: ChoreCalendarEvent;
  members: TeamMember[];
  completionMember: TeamMember | null;
  onToggle: (memberId: string) => void;
  onClose: () => void;
}

function CompletionModal({ event, members, completionMember, onToggle, onClose }: CompletionModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(
    completionMember?.id ?? members[0]?.id ?? '',
  );

  return (
    <Modal
      title={event.title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {event.isCompleted ? (
            <button
              onClick={() => onToggle(selectedMemberId)}
              className="px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Mark Incomplete
            </button>
          ) : (
            <button
              onClick={() => onToggle(selectedMemberId)}
              disabled={!selectedMemberId}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark Complete
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Date</span>
          <span className="font-medium text-gray-900">{event.occurrenceDate}</span>
        </div>
        {event.assignee && (
          <div className="flex justify-between text-gray-600">
            <span>Assigned to</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-900">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: event.assignee.color }} />
              {event.assignee.name}
            </span>
          </div>
        )}
        {event.isCompleted && completionMember && (
          <div className="flex justify-between text-gray-600">
            <span>Completed by</span>
            <span className="font-medium text-green-700">{completionMember.name}</span>
          </div>
        )}

        {!event.isCompleted && members.length > 0 && (
          <div>
            <label className="block text-gray-600 mb-1">Completed by</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {event.isCompleted && (
          <p className="text-green-700 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            This chore has been completed.
          </p>
        )}
      </div>
    </Modal>
  );
}
