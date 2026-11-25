import bcrypt from 'bcryptjs';

import { Users } from '../models/user.model';
import { ResponseDTO } from '../dtos/base.dto';

import {
	UserCreateDTO,
	UserListDTO,
	UserLoginDTO,
	UserUpdateDTO,
} from '../dtos/user.dto';

import { generateAccessToken } from '../utils/jwt';
import { sequelize } from '../config/db.config';

// Register User
export const registerUser = async (
	userPayload: UserCreateDTO,
): Promise<ResponseDTO> => {
	try {
		const existingUser = await Users.findOne({
			where: {
				email: userPayload.email,
			},
		});

		if (existingUser) {
			return {
				success: false,
				message: 'Email already registered',
			};
		}

		if (userPayload.username) {
			const existingUsername = await Users.findOne({
				where: {
					username: userPayload.username,
				},
			});

			if (existingUsername) {
				return {
					success: false,
					message: 'Username already exists',
				};
			}
		}

		const hashedPassword = await bcrypt.hash(userPayload.password, 12);

		const user = await Users.create({
			...userPayload,
			password: hashedPassword,
			active: true,
			created: new Date(),
			created_by: null,
		});

		const { password, ...userData } = user.get({ plain: true });

		return {
			success: true,
			message: 'User registered successfully',
			data: userData,
		};
	} catch (err: any) {
		return {
			success: false,
			message: err?.message || 'Internal server error',
		};
	}
};

// Login User
export const loginUser = async (
	userPayload: UserLoginDTO,
): Promise<ResponseDTO> => {
	try {
		const user = await Users.findOne({
			where: {
				email: userPayload.email,
			},
		});

		if (!user || !user.active) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		const isPasswordValid = await bcrypt.compare(
			userPayload.password,
			user.password,
		);

		if (!isPasswordValid) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		const accessToken = await generateAccessToken({
			id: user.id,
			email: user.email,
		});

		const { password, ...userData } = user.get({ plain: true });

		return {
			success: true,
			message: 'Login successful',
			data: {
				accessToken,
				user: userData,
			},
		};
	} catch (err: any) {
		return {
			success: false,
			message: err?.message || 'Internal server error',
		};
	}
};

// Update User
export const updateUser = async (
	userId: number,
	userPayload: UserUpdateDTO,
): Promise<ResponseDTO> => {
	try {
		const user = await Users.findByPk(userId);

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		if (userPayload.username && userPayload.username !== user.username) {
			const existingUsername = await Users.findOne({
				where: {
					username: userPayload.username,
				},
			});

			if (existingUsername) {
				return {
					success: false,
					message: 'Username already exists',
				};
			}
		}

		await user.update({
			...userPayload,
			modified: new Date(),
			modified_by: userId,
		});

		const { password, ...userData } = user.get({ plain: true });

		return {
			success: true,
			message: 'User updated successfully',
			data: userData,
		};
	} catch (err: any) {
		return {
			success: false,
			message: err?.message || 'Internal server error',
		};
	}
};

// Get User By ID
export const getUserById = async (userId: number): Promise<ResponseDTO> => {
	try {
		const user = await Users.findByPk(userId);

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		const { password, ...userData } = user.get({ plain: true });

		return {
			success: true,
			message: 'User details loaded successfully',
			data: userData,
		};
	} catch (err: any) {
		return {
			success: false,
			message: err?.message || 'Internal server error',
		};
	}
};

export const getUsersList = async (
	userPayload: UserListDTO,
): Promise<ResponseDTO> => {
	try {
		const results = await sequelize.query(
			'CALL GetUsersList(:search_text, :offset_start, :rows_per_page);',
			{
				replacements: {
					search_text: userPayload?.searchText ?? '',
					offset_start: userPayload?.offsetStart ?? 1,
					rows_per_page: userPayload?.rowsPerPage ?? 10,
				},
			},
		);

		return {
			success: true,
			message: 'User list loaded successfully',
			data: results,
		};
	} catch (err: any) {
		return {
			success: false,
			message: err?.message || 'Internal server error',
		};
	}
};
