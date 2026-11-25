import { NextFunction, Request, Response } from 'express';
import { ValidateError } from 'tsoa';

/**
 * Global Error Handler (TSOA + Express)
 */
export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
): Response | void => {
	// TSOA validation error
	if (err instanceof ValidateError) {
		return res.status(400).json({
			success: false,
			message: err.message,
			errors: err.fields, // optional detailed fields
		});
	}

	// Custom thrown errors
	if (err instanceof Error) {
		return res.status(400).json({
			success: false,
			message: err.message,
		});
	}

	// Unknown error fallback
	return res.status(500).json({
		success: false,
		message: 'Internal server error',
	});
};
