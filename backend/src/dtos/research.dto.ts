export class ResearchDTO {
	websiteUrl!: string;
}

export interface OrganizationData {
	name: string | null;
	description: string | null;
	employeeCount: string | null;
	addresses: string[];
	emails: string[];
	phones: string[];
	sameAs: string[];
}

export interface CrawledPage {
	url: string;
	title: string;
	description: string | null;
	content: string;
	footerText: string;
	navLinks: string[];
	socialLinks: string[];
	careersUrl: string | null;
	emails: string[];
	phoneNumbers: string[];
	addresses: string[];
	organization: OrganizationData | null;
	renderedWithBrowser: boolean;
}

export interface CrawlingResponse {
	websiteUrl: string;
	pages: CrawledPage[];
	combinedContent: string;
}
