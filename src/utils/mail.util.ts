import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: Number(process.env.SMTP_PORT) === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const loadTemplate = (template: string, variables: Record<string, any>) => {
	const templatePath = path.join(__dirname, `../templates/${template}`);

	let html = fs.readFileSync(templatePath, 'utf8');

	Object.keys(variables).forEach((key) => {
		html = html.replace(new RegExp(`{{${key}}}`, 'g'), variables[key] ?? '');
	});

	return html;
};

export const sendMail = async (
	to: string,
	subject: string,
	template: string,
	variables: Record<string, any>,
) => {
	const html = loadTemplate(template, variables);

	return transporter.sendMail({
		from: `"Product name" <${process.env.SMTP_USER}>`,
		to,
		subject,
		html,
	});
};
