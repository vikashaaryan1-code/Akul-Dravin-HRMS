import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'document_records' })
export class DocumentRecordEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId!: string | null;

  @Column({ name: 'document_type', type: 'varchar', length: 80 })
  documentType!: string;

  @Column({ name: 'document_name', type: 'varchar', length: 180 })
  documentName!: string;

  @Column({ name: 'template_version', type: 'varchar', length: 30, default: 'v1' })
  templateVersion!: string;

  @Column({ type: 'varchar', length: 30, default: 'generated' })
  status!: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  fileUrl!: string | null;

  @Column({ name: 'document_payload', type: 'jsonb', default: () => "'{}'" })
  documentPayload!: Record<string, unknown>;

  @Column({ name: 'generated_at', type: 'timestamp with time zone', nullable: true })
  generatedAt!: Date | null;
}
