export const toCamelCase = (data: any): any => {
	if (Array.isArray(data)) {
		return data.map((item) => toCamelCase(item));
	} else if (data !== null && typeof data === 'object') {
		// If it's a Sequelize model instance, convert to plain object first
		if (typeof data.toJSON === 'function') {
			data = data.toJSON();
		}

		// If it's a Date object, return ISO string
		if (data instanceof Date) return data.toISOString();

		// If it's already a string that looks like a date, just return it
		if (typeof data === 'string' && !isNaN(Date.parse(data))) return data;

		return Object.keys(data).reduce((acc: any, key) => {
			const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
			acc[camelKey] = toCamelCase(data[key]);
			return acc;
		}, {});
	}
	return data;
};

export const toSnakeCase = (data: any): any => {
	if (data === null || data === undefined) return data;

	// keep primitives as-is
	if (typeof data !== 'object') return data;

	// keep Date as-is
	if (data instanceof Date) return data;

	// array support
	if (Array.isArray(data)) {
		return data.map(toSnakeCase);
	}

	// sequelize instance → plain object
	if (typeof data.toJSON === 'function') {
		return toSnakeCase(data.toJSON());
	}

	// plain object
	const result: any = {};
	for (const key in data) {
		const lowerKey = key
			.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
			.toLowerCase();

		result[lowerKey] = toSnakeCase(data[key]);
	}

	return result;
};
