import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../../../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEnum(UserType)
  @IsOptional()
  user_type?: UserType;

  @IsString()
  @IsOptional()
  clerk_user_id?: string;
}