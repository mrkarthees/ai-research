import {
	Controller,
	Route,
	Tags,
	Post,
	Put,
	Get,
	Body,
	Path,
	Security,
} from 'tsoa';

import {
	registerUser,
	loginUser,
	updateUser,
	getUserById,
	getUsersList,
} from '../services/user.service';

import {
	UserCreateDTO,
	UserLoginDTO,
	UserUpdateDTO,
	UserListDTO,
} from '../dtos/user.dto';

import { ResponseDTO } from '../dtos/base.dto';

@Route('/users')
@Tags('Users')
export class UserController extends Controller {
	// Register User
	@Post('register')
	public async register(@Body() data: UserCreateDTO): Promise<ResponseDTO> {
		const result = await registerUser(data);
		return result;
	}

	// Login User
	@Post('login')
	public async login(@Body() data: UserLoginDTO): Promise<ResponseDTO> {
		const result = await loginUser(data);
		return result;
	}

	// Update User
	@Security('BearerAuth')
	@Put('{userId}')
	public async updateUser(
		@Path() userId: number,
		@Body() data: UserUpdateDTO,
	): Promise<ResponseDTO> {
		const result = await updateUser(userId, data);
		return result;
	}

	// Get User By ID
	@Security('BearerAuth')
	@Get('{userId}')
	public async getUserById(@Path() userId: number): Promise<ResponseDTO> {
		const result = await getUserById(userId);
		return result;
	}

	// Get All Users
	@Security('BearerAuth')
	@Post('list')
	public async getAllUsers(@Body() data: UserListDTO): Promise<ResponseDTO> {
		const result = await getUsersList(data);
		return result;
	}
}
