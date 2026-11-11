export interface CompanySummaryDTO {
	description: string | null;
	industry: string | null;
	business_model: string | null;
}

export interface CompanyLocationDTO {
	location_type: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
}

export interface SocialMediaLinksDTO {
	linkedin: string | null;
	instagram: string | null;
	facebook: string | null;
	x: string | null;
	youtube: string | null;
}

export interface ContactDetailsDTO {
	email: string | null;
	phone: string | null;
	contact_page_url: string | null;
}

export interface TotalWorkingMembersDTO {
	employee_count: number | null;
	employee_range: string | null;
	is_estimate: boolean;
	as_of_date: string | null;
}

export interface ProductServiceDTO {
	name: string;
	description: string | null;
	type: 'product' | 'service' | 'both' | 'unknown';
}

export interface CreateResearchResultDTO {
	research_id: number;
	company_summary?: CompanySummaryDTO | null;
	company_locations?: CompanyLocationDTO[] | null;
	social_media_links?: SocialMediaLinksDTO | null;
	contact_details?: ContactDetailsDTO | null;
	total_working_members?: TotalWorkingMembersDTO | null;
	career_page_url?: string | null;
	products_services?: ProductServiceDTO[] | null;
}

export interface ResearchResultResponseDTO {
	id: number;
	research_id: number;
	company_summary: CompanySummaryDTO | null;
	company_locations: CompanyLocationDTO[] | null;
	social_media_links: SocialMediaLinksDTO | null;
	contact_details: ContactDetailsDTO | null;
	total_working_members: TotalWorkingMembersDTO | null;
	career_page_url: string | null;
	products_services: ProductServiceDTO[] | null;
	created: Date;
	modified: Date;
}

export interface CreateResearchResultEvidenceDTO {
	research_id: number;
	result_id: number;
	field_name: string;
	source_url: string;
	source_title?: string | null;
	evidence_text: string;
	confidence?: number | null;
}

export interface ResearchResultEvidenceResponseDTO {
	id: number;
	research_id: number;
	result_id: number;
	field_name: string;
	source_url: string;
	source_title: string | null;
	evidence_text: string;
	confidence: number | null;
	created: Date;
}
