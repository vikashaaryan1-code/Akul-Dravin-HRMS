import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class GeneratePayrollBatchDto {
  @ApiProperty({
    description: 'The year for which the payroll batch is generated',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'The month for which the payroll batch is generated (1 = January, 12 = December)',
    example: 7,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
