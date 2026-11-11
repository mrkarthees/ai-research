import crypto from 'crypto';

// Tenant Code
export function generateTenantCode(): string {
	const timestamp = Date.now().toString(36);
	const random = crypto.randomBytes(4).toString('hex');
	return `T_${timestamp}${random}`;
}

// Organization ID
export function generateOrganizationCode(): string {
	const timestamp = Date.now().toString(36);
	const random = crypto.randomBytes(4).toString('hex');
	return `O_${timestamp}${random}`;
}

// User ID
export function generateUserCode(): string {
	const timestamp = Date.now().toString(36);
	const random = crypto.randomBytes(4).toString('hex');
	return `U_${timestamp}${random}`;
}
