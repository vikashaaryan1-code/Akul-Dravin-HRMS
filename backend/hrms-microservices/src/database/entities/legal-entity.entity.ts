import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('legal_entities')
export class LegalEntityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  name!: string; // e.g., "Akul Dravin Logistics Pvt Ltd"

  @Column({ unique: true })
  registrationNumber!: string; // GST/PAN/EIN

  @Column('text', { nullable: true })
  registeredAddress!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  currency!: string;

  @ManyToOne(() => LegalEntityEntity, (entity) => entity.subsidiaries, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent!: LegalEntityEntity;

  @Column({ nullable: true })
  parentId!: string;

  @OneToMany(() => LegalEntityEntity, (entity) => entity.parent)
  subsidiaries!: LegalEntityEntity[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
