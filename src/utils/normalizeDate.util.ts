export function normalizeDate(
	input: string | Date | null | undefined
): string | null {
	if (!input) return null;

	if (input instanceof Date && !isNaN(input.getTime())) {
		return input.toISOString().split('T')[0];
	}

	if (typeof input !== 'string') return null;

	const value = input.trim();

	if (!/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(value)) return null;

	const [year, month, day] = value.split(/[-/.]/).map(Number);
	const date = new Date(year, month - 1, day);

	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}

	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
		2,
		'0'
	)}`;
}
