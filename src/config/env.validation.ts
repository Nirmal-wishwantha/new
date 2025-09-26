// src/config/env.validation.ts

import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  PORT?: number = 4000;

  @IsString()
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_ANON_KEY: string;

  @IsString()
  SUPABASE_SERVICE_KEY: string;

  @IsString()
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;

  @IsString()
  CLERK_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  CLERK_WEBHOOK_SECRET?: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '1d';

  @IsString()
  @IsOptional()
  NODE_ENV?: string = 'development';
}