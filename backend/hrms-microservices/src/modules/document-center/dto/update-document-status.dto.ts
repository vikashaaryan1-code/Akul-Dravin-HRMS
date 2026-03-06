import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDocumentStatusDto {
  @IsOptional()
  @IsString()
  @IsIn(['generated', 'pending-review', 'approved', 'rejected', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;
}
