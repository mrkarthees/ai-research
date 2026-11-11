import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AccessPayload extends JwtPayload {
	userId: number;
	tenantId: number;
	organizationId: number;
	role: number;
}

export async function generateAccessToken(
	payload: AccessPayload,
): Promise<string> {
	return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1y' });
}
