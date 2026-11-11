import { Controller, Get, Route, Tags } from 'tsoa';

@Route('health')
@Tags('Health')
export class HealthController extends Controller {
	@Get('/')
	public async checkHealth(): Promise<{
		success: boolean;
		message: string;
	}> {
		return {
			success: true,
			message: 'AI Job Research API is running successfully',
		};
	}
}
