import { useState } from 'react';
import type { Chore, RecurrenceRule } from '../../types';
import { useStore } from '../../store';
import { Modal } from '../shared/Modal';
import { RecurrenceEditor } from './RecurrenceEditor';

interface Props {
  chore?: Chore; // undefined = adding new
  defaultDate?: string; // ISO date, pre-filled when clicking a calendar date
  onClose: () => void;
}

function recurrenceSummary(r: RecurrenceRule | null): string {
  if (!r) return 'One-time';
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const every = r.interval === 1 ? '' : `every ${r.interval} `;
  switch (r.frequency) {
    case 'daily':
      return r.interval === 1 ? 'Daily' : `Every ${r.interval} days`;
    case 'weekly': {
      const days = (r.daysOfWeek ?? []).map((d) => DAY_LABELS[d]).join(', ');
      return `${every}week on ${days}`;
    }
    case 'monthly':
      return `${every}month on day ${r.dayOfMonth ?? 1}`;
    default:
      return 'Recurring';
  }
}

export { recurrenceSummary };

export function ChoreModal({ chore, defaultDate, onClose }: Props) {
  const { members, addChore, updateChore } = useStore();
  const isEdit = !!chore;

  const [title, setTitle] = useState(chore?.title ?? '');
  const [description, setDescription] = useState(chore?.description ?? '');
  const [assigneeId, setAssigneeId] = useState<string | null>(chore?.assigneeId ?? null);
  const [startDate, setStartDate] = useState(
    chore?.startDate ?? defaultDate ?? new Date().toISOString().slice(0, 10),
  );
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(chore?.recurrence ?? null);

  function handleSubmit() {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      startDate,
      recurrence,
    };
    if (isEdit && chore) {
      updateChore(chore.id, data);
    } else {
      addChore(data);
    }
    onClose();
  }

  return (
    <Modal
      title={isEdit ? 'Edit Chore' : 'New Chore'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? 'Save Changes' : 'Add Chore'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Empty dishwasher"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={assigneeId ?? ''}
              onChange={(e) => setAssigneeId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
        </div>
      </div>
    </Modal>
  );
}
