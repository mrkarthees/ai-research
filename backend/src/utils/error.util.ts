export interface AppError extends Error {
	statusCode?: number;
}

export function createError(
	statusCode: number = 500,
	message: string
): AppError {
	const error = new Error(message) as AppError;
	error.statusCode = statusCode;
	return error;
}
