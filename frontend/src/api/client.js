const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

// Every backend answer looks like { success, message, data }.
export const apiPost = async (path, body, token) => {
	let response;

	try {
		response = await fetch(`${API_URL}${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token && { Authorization: `Bearer ${token}` }),
			},
			body: JSON.stringify(body),
		});
	} catch {
		throw new ApiError('Cannot reach the server. Check your connection.', 0);
	}

	const result = await response.json().catch(() => null);

	if (!response.ok || !result?.success) {
		throw new ApiError(
			result?.message || 'Something went wrong. Try again.',
			response.status,
		);
	}

	return { data: result.data, message: result.message };
};
