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
import { CompanyResearchResults } from './company-research-result.model';

@Table({
	tableName: 'research_result_evidences',
	timestamps: false,
})
export class ResearchResultEvidences extends Model {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	id!: number;

	@ForeignKey(() => Researches)
	@AllowNull(false)
	@Column(DataType.INTEGER)
	research_id!: number;

	@BelongsTo(() => Researches)
	research?: Researches;

	@ForeignKey(() => CompanyResearchResults)
	@AllowNull(false)
	@Column(DataType.INTEGER)
	result_id!: number;

	@BelongsTo(() => CompanyResearchResults)
	result?: CompanyResearchResults;

	// Example: company_summary.industry
	// Example: company_locations[0].headquarters
	// Example: products_services[0].name
	@AllowNull(false)
	@Column(DataType.STRING(200))
	field_name!: string;

	@AllowNull(false)
	@Column(DataType.STRING(1000))
	source_url!: string;

	@AllowNull(true)
	@Column(DataType.STRING(500))
	source_title?: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	evidence_text!: string;

	// Confidence range: 0.0000 to 1.0000
	@AllowNull(true)
	@Column(DataType.DECIMAL(5, 4))
	confidence?: number;

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
}
