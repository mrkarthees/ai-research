export interface CreateCompanyDTO {
	company_name: string;
	website_url: string;
	industry?: string;
	description?: string;
	headquarters?: string;
}

export interface UpdateCompanyDTO {
	company_name?: string;
	website_url?: string;
	industry?: string;
	description?: string;
	headquarters?: string;
}

export interface CompanyResponseDTO {
	id: number;
	company_name: string;
	website_url: string;
	industry: string | null;
	description: string | null;
	headquarters: string | null;
	research_status: string;
	active: boolean;
	created: Date;
	created_by: string | null;
	modified: Date;
	modified_by: string | null;
}

export interface CompanyListResponseDTO {
	success: boolean;
	message: string;
	data: CompanyResponseDTO[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface CompanySingleResponseDTO {
	success: boolean;
	message: string;
	data: CompanyResponseDTO;
}

export interface CompanyDeleteResponseDTO {
	success: boolean;
	message: string;
}
