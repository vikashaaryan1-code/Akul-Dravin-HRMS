import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMarketplaceListingDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsString()
  listingType?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'partner'])
  visibility?: 'public' | 'private' | 'partner';

  @IsOptional()
  @IsString()
  sourceService?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
