// // src/modules/user/services/auth.services.ts


import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { UserService } from './user.service';
import { ClerkService } from './clerk.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private webhook: Webhook;

    constructor(
        private configService: ConfigService,
        private userService: UserService,
        private clerkService: ClerkService,
    ) {
        this.webhook = new Webhook(
            this.configService.get<string>('CLERK_WEBHOOK_SECRET')!,
        );
    }

    async handleClerkWebhook(
        payload: Buffer,
        svixId: string,
        svixTimestamp: string,
        svixSignature: string,
    ): Promise<void> {
        let event;

        try {
            event = this.webhook.verify(payload, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        } catch (err) {
            this.logger.error('Webhook verification failed:', err);
            throw new BadRequestException('Invalid webhook signature');
        }

        this.logger.log(`Received webhook event: ${event.type}`);

        switch (event.type) {
            case 'user.created':
                await this.handleUserCreated(event.data);
                break;
            case 'user.updated':
                await this.handleUserUpdated(event.data);
                break;
            case 'user.deleted':
                await this.handleUserDeleted(event.data);
                break;
            case 'session.created':
                await this.handleSessionCreated(event.data);
                break;
            default:
                this.logger.warn(`Unhandled webhook event: ${event.type}`);
        }
    }

    private async handleUserCreated(userData: any): Promise<void> {
        try {
            await this.userService.syncUserFromClerk(userData);
            this.logger.log(`User created: ${userData.id}`);
        } catch (error) {
            this.logger.error('Failed to create user from webhook:', error);
        }
    }

    private async handleUserUpdated(userData: any): Promise<void> {
        try {
            await this.userService.syncUserFromClerk(userData);
            this.logger.log(`User updated: ${userData.id}`);
        } catch (error) {
            this.logger.error('Failed to update user from webhook:', error);
        }
    }

    private async handleUserDeleted(userData: any): Promise<void> {
        try {
            const user = await this.userService.findByClerkId(userData.id);
            await this.userService.remove(user.user_id);
            this.logger.log(`User deleted: ${userData.id}`);
        } catch (error) {
            this.logger.error('Failed to delete user from webhook:', error);
        }
    }

    private async handleSessionCreated(sessionData: any): Promise<void> {
        try {
            const user = await this.userService.findByClerkId(sessionData.user_id);
            await this.userService.updateLastLogin(user.user_id);
            this.logger.log(`Session created for user: ${sessionData.user_id}`);
        } catch (error) {
            this.logger.error('Failed to update last login:', error);
        }
    }

    async syncUserFromClerk(clerkUserId: string): Promise<void> {
        const clerkUser = await this.clerkService.getUserById(clerkUserId);
        if (clerkUser) {
            await this.userService.syncUserFromClerk(clerkUser);
        }
    }
}