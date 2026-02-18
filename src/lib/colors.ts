export const MEMBER_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export function nextAvailableColor(usedColors: string[]): string {
  const available = MEMBER_COLORS.find((c) => !usedColors.includes(c));
  return available ?? MEMBER_COLORS[usedColors.length % MEMBER_COLORS.length];
}
