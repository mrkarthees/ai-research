import {
	Table,
	Column,
	Model,
	DataType,
	PrimaryKey,
	AutoIncrement,
	AllowNull,
	Default,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript';

import { Researches } from './research.model';

@Table({
	tableName: 'company_research_results',
	timestamps: false,
})
export class CompanyResearchResults extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	id!: number;

	// One final result per research record
	@ForeignKey(() => Researches)
	@AllowNull(false)
	@Column({
		type: DataType.INTEGER,
		unique: true,
	})
	research_id!: number;

	@BelongsTo(() => Researches)
	research?: Researches;

	// 1. Company summary
	@AllowNull(true)
	@Column(DataType.JSON)
	company_summary?: object | null;

	// 2. Company locations
	@AllowNull(true)
	@Column(DataType.JSON)
	company_locations?: object[] | null;

	// 3. Social media links
	@AllowNull(true)
	@Column(DataType.JSON)
	social_media_links?: object | null;

	// 4. Company contact details
	@AllowNull(true)
	@Column(DataType.JSON)
	contact_details?: object | null;

	// 5. Total working members
	@AllowNull(true)
	@Column(DataType.JSON)
	total_working_members?: object | null;

	// 6. Career page URL
	@AllowNull(true)
	@Column(DataType.STRING(1000))
	career_page_url?: string | null;

	// 7. Products or services
	@AllowNull(true)
	@Column(DataType.JSON)
	products_services?: object[] | null;

	// Audit fields
	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	active!: boolean;

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	created!: Date;

	@AllowNull(true)
	@Column(DataType.STRING(100))
	created_by?: string;

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	modified!: Date;

	@AllowNull(true)
	@Column(DataType.STRING(100))
	modified_by?: string;
}
