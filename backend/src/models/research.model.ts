import {
	Table,
	Column,
	Model,
	DataType,
	ForeignKey,
	BelongsTo,
	HasMany,
} from 'sequelize-typescript';

import { Users } from './user.model';
import { ResearchResults } from './researchResults.model';

@Table({
	tableName: 'research',
	timestamps: false,
})
export class Research extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	@ForeignKey(() => Users)
	@Column({
		type: DataType.INTEGER,
		allowNull: false,
	})
	user_id!: number;

	@Column({
		type: DataType.STRING(500),
		allowNull: false,
	})
	search_url!: string;

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

	// Relationship: Research belongs to User
	@BelongsTo(() => Users)
	user!: Users;

	// Relationship: Research has multiple results
	@HasMany(() => ResearchResults)
	results!: ResearchResults[];
}
