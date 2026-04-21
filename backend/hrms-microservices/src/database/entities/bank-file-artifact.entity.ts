import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'bank_file_artifacts' })
export class BankFileArtifactEntity extends TenantScopedEntity {
  @Column({ name: 'batch_id', type: 'uuid' })
  @Index()
  batchId!: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 64 }) // SHA-256
  @Index()
  fileHash!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 20 }) // e.g., 'NEFT_CSV'
  fileType!: string;

  @Column({ name: 'generated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt!: Date;

  @Column({ name: 'file_content', type: 'text' })
  fileContent!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
