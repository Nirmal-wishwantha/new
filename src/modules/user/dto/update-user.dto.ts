import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserType } from '../../../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsEnum(UserType)
  @IsOptional()
  user_type?: UserType;
}