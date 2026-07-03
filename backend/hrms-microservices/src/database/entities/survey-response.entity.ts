import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { SurveyEntity } from './survey.entity';

@Entity({ name: 'survey_responses' })
@Unique(['surveyId', 'userId'])
export class SurveyResponseEntity extends TenantScopedEntity {
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @ManyToOne(() => SurveyEntity)
  @JoinColumn({ name: 'survey_id' })
  survey!: SurveyEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'nps_score', type: 'int' })
  npsScore!: number;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;
}
