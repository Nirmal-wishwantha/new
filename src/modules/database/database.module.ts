import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User],
      synchronize: false,
      migrations: ['src/migrations/*.ts'],
      migrationsRun: true,
      logging: true,
      ssl: { rejectUnauthorized: false },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SupabaseService],
  exports: [TypeOrmModule, SupabaseService],
})
export class DatabaseModule {}