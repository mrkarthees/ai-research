import { Body, Controller, Post, Request, Route, Security, Tags } from 'tsoa';

import type { Request as ExpressRequest } from 'express';

import { ResponseDTO } from '../dtos/base.dto';
import { ResearchDTO } from '../dtos/research.dto';
import { createResearch } from '../services/research.service';

interface AuthenticatedRequest extends ExpressRequest {
	user?: {
		id: number;
		email: string;
	};
}

@Route('/research')
@Tags('Research')
@Security('BearerAuth')
export class ResearchController extends Controller {
	@Post('/')
	public async createResearch(
		@Request() request: AuthenticatedRequest,
		@Body() data: ResearchDTO,
	): Promise<ResponseDTO> {
		const userId = request.user?.id;

		if (!userId) {
			return {
				success: false,
				message: 'Authenticated user ID not found',
			};
		}

		return await createResearch(userId, data);
	}
}
