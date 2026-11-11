import crypto from 'crypto';

const algorithm = 'aes-128-cbc';

const secretKey = crypto
	.createHash('md5')
	.update(process.env.INVITE_SECRET as string)
	.digest();

const iv = Buffer.alloc(16, 0);

export const encryptAES = (data: any): string => {
	const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
	let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return encrypted;
};

export const decryptAES = (encrypted: string): any => {
	const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return JSON.parse(decrypted);
};
