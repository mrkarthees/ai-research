import { Request } from 'express';
import jwt from 'jsonwebtoken';

export const expressAuthentication = async (
	request: Request,
	securityName: string,
	scopes?: string[],
): Promise<any> => {
	if (securityName === 'BearerAuth') {
		const authHeader = (request.headers as any).authorization;
		if (!authHeader) throw new Error('Authorization header missing');

		const token = authHeader.split(' ')[1];
		if (!token) throw new Error('Token missing');

		try {
			const secret = process.env.JWT_ACCESS_SECRET || 'your-secret-key';
			const payload = jwt.verify(token, secret);

			return payload;
		} catch (err) {
			throw new Error('Invalid or expired token');
		}
	}

	throw new Error('Unsupported security method');
};
