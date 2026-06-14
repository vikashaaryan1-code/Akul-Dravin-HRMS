import { Column, CreateDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntityWithTimestamps {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'governance_provenance_hash', type: 'varchar', length: 64, nullable: true })
  governanceProvenanceHash?: string;

  @Column({ name: 'epistemic_confidence', type: 'float', default: 1.0, nullable: true })
  epistemicConfidence?: number;
}
