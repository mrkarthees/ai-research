import { Table, Column, Model, DataType, Unique } from 'sequelize-typescript';

@Table({
	tableName: 'users',
	timestamps: false,
})
export class Users extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	@Column({
		type: DataType.STRING(100),
		allowNull: false,
	})
	name!: string;

	@Unique
	@Column({
		type: DataType.STRING(150),
		allowNull: false,
	})
	email!: string;

	@Column({
		type: DataType.STRING(255),
		allowNull: false,
	})
	password!: string;

	@Column({
		type: DataType.INTEGER,
		allowNull: true,
	})
	age?: number;

	@Unique
	@Column({
		type: DataType.STRING(50),
		allowNull: true,
	})
	username?: string;

	@Column({
		type: DataType.STRING(15),
		allowNull: true,
	})
	phone_number?: string;

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	})
	active!: boolean;

	@Column({
		type: DataType.DATE,
		defaultValue: DataType.NOW,
		allowNull: false,
	})
	created!: Date;

	@Column({
		type: DataType.INTEGER,
		allowNull: true,
	})
	created_by?: number;

	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	modified?: Date;

	@Column({
		type: DataType.INTEGER,
		allowNull: true,
	})
	modified_by?: number;
}
