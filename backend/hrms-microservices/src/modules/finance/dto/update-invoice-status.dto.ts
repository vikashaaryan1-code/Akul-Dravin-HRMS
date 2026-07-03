import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ description: 'The new status of the invoice', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
