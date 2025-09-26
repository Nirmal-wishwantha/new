// src/modules/user/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  RawBody,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  @ApiHeader({ name: 'svix-id', description: 'Webhook ID' })
  @ApiHeader({ name: 'svix-timestamp', description: 'Webhook timestamp' })
  @ApiHeader({ name: 'svix-signature', description: 'Webhook signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @RawBody() payload: Buffer,
  ): Promise<{ success: boolean }> {
    try {
      await this.authService.handleClerkWebhook(
        payload,
        svixId,
        svixTimestamp,
        svixSignature,
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync user with Clerk' })
  @ApiResponse({ status: 200, description: 'User synced successfully' })
  async syncUser(@Body('clerkUserId') clerkUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.authService.syncUserFromClerk(clerkUserId);
    return {
      success: true,
      message: 'User synced successfully',
    };
  }
}