// ===== src/entities/user.entity.ts =====
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserType {
  GUEST = 'guest',
  HOST = 'host',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @ApiProperty({ description: 'Clerk user ID' })
  @Column({ unique: true })
  clerk_user_id: string;

  @ApiProperty({ description: 'Username' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ description: 'Email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'First name' })
  @Column()
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @Column()
  last_name: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @Column({ nullable: true })
  avatar_url: string;

  @ApiProperty({ description: 'User type', enum: UserType })
  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.GUEST,
  })
  user_type: UserType;

  @ApiProperty({ description: 'User status', enum: UserStatus })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({ description: 'User preferences', required: false })
  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login: Date;

  @ApiProperty({ description: 'Email verification status' })
  @Column({ default: false })
  email_verified: boolean;

  @ApiProperty({ description: 'Phone verification status' })
  @Column({ default: false })
  phone_verified: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}