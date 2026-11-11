import { Table, Column, Model, DataType, Default } from 'sequelize-typescript';

@Table({
	tableName: 'companies',
	timestamps: false,
})
export class Companies extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	// Company Information
	@Column({
		type: DataType.STRING(255),
		allowNull: false,
	})
	company_name!: string;

	@Column({
		type: DataType.STRING(500),
		allowNull: false,
		unique: true,
	})
	website_url!: string;

	@Column(DataType.STRING(150))
	industry?: string;

	@Column(DataType.TEXT)
	description?: string;

	@Column(DataType.STRING(255))
	headquarters?: string;

	// Research Information
	@Default('pending')
	@Column({
		type: DataType.ENUM('pending', 'processing', 'completed', 'failed'),
		allowNull: false,
	})
	research_status!: string;

	// Meta Information
	@Default(true)
	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
	})
	active!: boolean;

	@Default(DataType.NOW)
	@Column({
		type: DataType.DATE,
		field: 'created',
	})
	created!: Date;

	@Column(DataType.STRING(50))
	created_by?: string;

	@Default(DataType.NOW)
	@Column({
		type: DataType.DATE,
		field: 'modified',
	})
	modified!: Date;

	@Column(DataType.STRING(50))
	modified_by?: string;
}
