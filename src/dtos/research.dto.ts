export interface CreateResearchDTO {
	company_id: number;
}

export interface ResearchResponseDTO {
	id: number;
	company_id: number;
	research_status: string;
	company?: {
		id: number;
		company_name: string;
		website_url: string;
	} | null;
	started_at: Date | null;
	completed_at: Date | null;
	error_message: string | null;
	active: boolean;
	created: Date;
	created_by: string | null;
	modified: Date;
	modified_by: string | null;
}

export interface ResearchListResponseDTO {
	success: boolean;
	message: string;
	data: ResearchResponseDTO[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface ResearchSingleResponseDTO {
	success: boolean;
	message: string;
	data: ResearchResponseDTO | null;
}

export interface ResearchDeleteResponseDTO {
	success: boolean;
	message: string;
}
