import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(Object.values(Role))
  requestedRole?: Role;
}
