import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReversePayrollBatchDto {
  @ApiProperty({
    description: 'Mandatory justification for reversing the payroll batch (audit trail requirement)',
    example: 'Incorrect tax calculation applied to department X',
    minLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  justification: string;
}
