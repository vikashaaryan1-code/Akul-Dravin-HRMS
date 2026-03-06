import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateMarketplaceListingDto {
  @IsOptional()
  @IsIn(['public', 'private', 'partner'])
  visibility?: 'public' | 'private' | 'partner';

  @IsOptional()
  @IsIn(['active', 'inactive', 'archived'])
  status?: 'active' | 'inactive' | 'archived';

  @IsOptional()
  @IsString()
  sourceService?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
