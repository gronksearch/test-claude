import { useState } from 'react';
import { useStore } from '../../store';
import { format } from 'date-fns';

export function HistoryLog() {
  const { completions, chores, members, removeCompletion } = useStore();
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterChoreId, setFilterChoreId] = useState('');

  const choreById = new Map(chores.map((c) => [c.id, c]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const filtered = completions
    .filter((c) => (!filterMemberId || c.completedById === filterMemberId))
    .filter((c) => (!filterChoreId || c.choreId === filterChoreId))
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const selectClass =
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterMemberId}
          onChange={(e) => setFilterMemberId(e.target.value)}
          className={selectClass}
        >
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select
          value={filterChoreId}
          onChange={(e) => setFilterChoreId(e.target.value)}
          className={selectClass}
        >
          <option value="">All chores</option>
          {chores.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {(filterMemberId || filterChoreId) && (
          <button
            onClick={() => { setFilterMemberId(''); setFilterChoreId(''); }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No completions yet</p>
          <p className="text-sm mt-1">
            {completions.length > 0 ? 'No results match your filters.' : 'Mark chores as done on the calendar to see history here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Chore</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Due date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Completed by</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Completed at</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((record) => {
                const chore = choreById.get(record.choreId);
                const member = memberById.get(record.completedById);
                return (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {chore?.title ?? <span className="text-gray-400 dark:text-gray-500 italic">Deleted chore</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.occurrenceDate}</td>
                    <td className="px-4 py-3">
                      {member ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: member.color }}
                          />
                          <span className="text-gray-700 dark:text-gray-200">{member.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {format(new Date(record.completedAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeCompletion(record.choreId, record.occurrenceDate)}
                        title="Undo completion"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
