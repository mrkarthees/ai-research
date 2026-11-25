export class UserCreateDTO {
	name!: string;
	email!: string;
	password!: string;
	age?: number;
	username?: string;
	phone_number?: string;
}

export class UserLoginDTO {
	email!: string;
	password!: string;
}

export class UserUpdateDTO {
	name?: string;
	age?: number;
	username?: string;
	phone_number?: string;
}

export class UserDTO {
	id!: number;
	name!: string;
	email!: string;
	age?: number;
	username?: string;
	phone_number?: string;
	active!: boolean;
	created!: Date;
	created_by?: number;
	modified?: Date;
	modified_by?: number;
}

export class UserListDTO {
	searchText?: string;
	offsetStart?: number;
	rowsPerPage?: number;
}
