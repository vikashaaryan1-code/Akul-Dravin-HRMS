import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// Lightweight no-op: swap for @nestjs/swagger when Swagger UI is wired up.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApiProperty(_opts?: Record<string, unknown>): PropertyDecorator {
  return () => {};
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@akuldravin.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Akul Dravin Enterprises' })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({ example: 'Akul Dravin' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  industry?: string;
}

