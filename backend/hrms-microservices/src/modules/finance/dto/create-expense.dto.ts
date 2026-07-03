import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ description: 'The category of the expense', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'The amount of the expense', required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: 'The name of the owner', required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ description: 'The status of the expense', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'The date of the expense', required: false })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}
