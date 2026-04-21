import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@omnix.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Akul Dravin Enterprises' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'Akul Dravin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsString()
  industry?: string;
}
