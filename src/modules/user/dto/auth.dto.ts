// src/modules/user/dto/auth.dto.ts


import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SyncUserDto {
  @ApiProperty({ description: 'Clerk user ID' })
  @IsString()
  @IsNotEmpty()
  clerkUserId: string;
}