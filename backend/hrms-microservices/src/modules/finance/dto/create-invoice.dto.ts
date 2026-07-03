import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'The invoice number', required: false })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ description: 'The customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: 'The amount of the invoice', required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: 'The status of the invoice', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'The due date of the invoice', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
