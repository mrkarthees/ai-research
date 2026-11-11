export interface CrawlPageDTO {
	page_url: string;
}

export interface CrawledSourceDTO {
	id: number;
	research_id: number;
	company_id: number;
	page_url: string;
	page_title: string | null;
	page_type: string;
	meta_description: string | null;
	extracted_text: string | null;
	crawl_status: string;
	http_status: number | null;
}

export interface CrawlPageResponseDTO {
	message: string;
	source: CrawledSourceDTO | null;
	discovered_links: string[];
}

export interface MultiPageCrawlResponseDTO {
	message: string;
	research_id: number;
	total_pages_attempted: number;
	successful_pages: number;
	failed_pages: number;
	skipped_pages: number;

	sources: {
		id: number;
		page_url: string;
		page_title: string;
		page_type: string;
		crawl_status: string;
		http_status: number | null;
	}[];

	failures: {
		page_url: string;
		error: string;
	}[];
}
