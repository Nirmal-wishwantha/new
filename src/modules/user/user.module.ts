import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from '../database/database.module';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkService } from './services/clerk.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, ClerkService, ClerkAuthGuard, ConfigService, RolesGuard],
  exports: [UserService, ClerkAuthGuard],
})
export class UserModule {}