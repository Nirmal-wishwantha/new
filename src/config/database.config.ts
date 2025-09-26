// src/config/database.config.ts

import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

// database.config.ts
   export const databaseConfig = {
     type: 'postgres' as const,
     host: 'aws-0-ap-south-1.pooler.supabase.com',
     port: 5432,
     username: 'postgres.abcdefghijklmnop',
     password: 'HotelSystem2025',
     database: 'postgres',
     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
     synchronize: true, // Only for development
     ssl: true,
   };

// // For NestJS TypeORM configuration
// export const getDatabaseConfig = (configService: ConfigService) => ({
//   type: 'postgres' as const,
//   url: configService.get<string>('DATABASE_URL'),
//   entities: [User],
//   migrations: ['dist/migrations/*.js'],
//   migrationsRun: false,
//   synchronize: configService.get('NODE_ENV') === 'development',
//   logging: configService.get('NODE_ENV') === 'development',
//   ssl: {
//     rejectUnauthorized: false,
//   },
//   extra: {
//     ssl: {
//       rejectUnauthorized: false,
//     },
//   },
// });