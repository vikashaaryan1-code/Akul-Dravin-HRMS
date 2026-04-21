import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
