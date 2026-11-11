import moment from 'moment';

interface FormatOptions {
	removePassword?: boolean;
	includeDob?: boolean;
}

type AnyObject = Record<string, any>;

export function formatDatesTime(
	data: AnyObject | AnyObject[],
	options: FormatOptions = { removePassword: false, includeDob: false }
): AnyObject | AnyObject[] {
	if (!data) return [];

	const formatSingle = (item: AnyObject): AnyObject => {
		const raw = item.dataValues ?? item;

		const formatted: AnyObject = {
			...raw,
			createdAt: raw.createdAt
				? moment(raw.createdAt).format('DD-MM-YYYY hh:mm A')
				: null,
			updatedAt: raw.updatedAt
				? moment(raw.updatedAt).format('DD-MM-YYYY hh:mm A')
				: null,
		};

		// include DOB only if enabled
		if (options.includeDob && raw.date_of_birth) {
			formatted.date_of_birth = moment(raw.date_of_birth).format('DD-MM-YYYY');
		}

		if (options.removePassword) {
			delete formatted.password;
		}

		return formatted;
	};

	if (Array.isArray(data)) {
		return data.map(formatSingle);
	}

	return formatSingle(data);
}
