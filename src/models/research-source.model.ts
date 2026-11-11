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
import { Researches } from './research.model';

@Table({ tableName: 'research_sources', timestamps: false })
export class ResearchSources extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	@ForeignKey(() => Researches)
	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		field: 'research_id',
	})
	research_id!: number;

	@BelongsTo(() => Researches)
	research?: Researches;

	@ForeignKey(() => Companies)
	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		field: 'company_id',
	})
	company_id!: number;

	@BelongsTo(() => Companies)
	company?: Companies;

	@Column({
		type: DataType.STRING(1000),
		allowNull: false,
	})
	page_url!: string;

	@Column(DataType.STRING(500))
	page_title?: string;

	@Default('other')
	@Column({
		type: DataType.ENUM(
			'homepage',
			'about',
			'services',
			'contact',
			'careers',
			'other',
		),
		allowNull: false,
	})
	page_type!: string;

	@Column(DataType.TEXT)
	meta_description?: string;

	@Column(DataType.TEXT('long'))
	extracted_text?: string;

	@Default('pending')
	@Column({
		type: DataType.ENUM('pending', 'completed', 'failed', 'skipped'),
		allowNull: false,
	})
	crawl_status!: string;

	@Column(DataType.INTEGER)
	http_status?: number;

	@Column(DataType.TEXT)
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
