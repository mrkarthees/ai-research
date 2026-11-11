export interface ResponseDTO {
	success: boolean;
	message: string;
	data?: any;
}

export interface ListDTO {
	searchText: string | '';
	offsetStart: number | 1;
	rowsPerPage: number | 10;
}
