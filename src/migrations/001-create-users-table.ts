import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1640995200000 implements MigrationInterface {
  name = 'CreateUsersTable1640995200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create user_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_type_enum" AS ENUM ('guest', 'host', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create user_status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('active', 'suspended', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "clerk_user_id" character varying NOT NULL UNIQUE,
        "username" character varying NOT NULL UNIQUE,
        "email" character varying NOT NULL UNIQUE,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "phone" character varying,
        "avatar_url" character varying,
        "user_type" "user_type_enum" NOT NULL DEFAULT 'guest',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "preferences" jsonb,
        "last_login" TIMESTAMP WITH TIME ZONE,
        "email_verified" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_users_clerk_user_id" ON "users" ("clerk_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_type_status" ON "users" ("user_type", "status")
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column()');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE IF EXISTS "user_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "user_type_enum"');
  }
}