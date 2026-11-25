import {
	Table,
	Column,
	Model,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript';

import { Research } from './research.model';

interface ContactDetails {
	emails: string[];
	phone_numbers: string[];
	social_links: string[];
}

interface JobOpportunity {
	title: string;
	location: string | null;
	url: string | null;
}

interface SourcePage {
	url: string;
	title: string;
	socialLinks: string[];
	careersUrl: string | null;
}

@Table({
	tableName: 'research_results',
	timestamps: false,
})
export class ResearchResults extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id!: number;

	@ForeignKey(() => Research)
	@Column({
		type: DataType.INTEGER,
		allowNull: false,
	})
	research_id!: number;

	@Column({ type: DataType.TEXT, allowNull: true })
	summary?: string | null;

	@Column({ type: DataType.STRING(255), allowNull: true })
	industry?: string | null;

	@Column({ type: DataType.JSON, allowNull: true })
	services?: string[];

	@Column({ type: DataType.STRING(100), allowNull: true })
	employee_count?: string | null;

	// Array of address / city strings.
	@Column({ type: DataType.JSON, allowNull: true })
	office_locations?: string[];

	// Object (not array): { emails, phone_numbers, social_links }
	@Column({ type: DataType.JSON, allowNull: true })
	contact_details?: ContactDetails;

	@Column({ type: DataType.STRING(1000), allowNull: true })
	careers_url?: string | null;

	@Column({ type: DataType.JSON, allowNull: true })
	job_opportunities?: JobOpportunity[];

	// Pages that were crawled.
	@Column({ type: DataType.JSON, allowNull: true })
	sources?: SourcePage[];

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

	@Column({ type: DataType.INTEGER, allowNull: true })
	created_by?: number;

	@Column({ type: DataType.DATE, allowNull: true })
	modified?: Date;

	@Column({ type: DataType.INTEGER, allowNull: true })
	modified_by?: number;

	@BelongsTo(() => Research)
	research!: Research;
}
