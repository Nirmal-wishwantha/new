import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './modules/database/database.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        CLERK_SECRET_KEY: Joi.string().required(),
        CLERK_PUBLISHABLE_KEY: Joi.string().required(),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_KEY: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().default(4000),
      }),
    }),
    DatabaseModule,
    UserModule,
    RealtimeModule,
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    console.log('DATABASE_URL:', configService.get<string>('DATABASE_URL'));
  }
}