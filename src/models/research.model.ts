import {
	Table,
	Column,
	Model,
	DataType,
	Default,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript';

import { Companies } from './company.model';

@Table({ tableName: 'company_researches', timestamps: false })
export class Researches extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	@ForeignKey(() => Companies)
	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		field: 'company_id',
	})
	company_id!: number;

	@BelongsTo(() => Companies)
	company?: Companies;

	@Default('pending')
	@Column({
		type: DataType.ENUM('pending', 'processing', 'completed', 'failed'),
		allowNull: false,
	})
	research_status!: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	started_at?: Date;

	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	completed_at?: Date;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
	})
	error_message?: string;

	@Default(true)
	@Column({ type: DataType.BOOLEAN, allowNull: false })
	active!: boolean;

	@Default(DataType.NOW)
	@Column({ type: DataType.DATE, field: 'created' })
	created!: Date;

	@Column(DataType.STRING(50))
	created_by?: string;

	@Default(DataType.NOW)
	@Column({ type: DataType.DATE, field: 'modified' })
	modified!: Date;

	@Column(DataType.STRING(50))
	modified_by?: string;
}
