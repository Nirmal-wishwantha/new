import { IsString, IsEnum, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { UserType, UserStatus } from '../../../entities/user.entity';

export class UserResponseDto {
  @IsString()
  user_id: string;

  @IsString()
  clerk_user_id: string;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsEnum(UserType)
  user_type: UserType;

  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  preferences?: Record<string, any>;

  @IsDate()
  @IsOptional()
  last_login?: Date;

  @IsBoolean()
  email_verified: boolean;

  @IsBoolean()
  phone_verified: boolean;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;
}