import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkUser } from '../../../config/clerk.config';
import { createClerkClient, type ClerkClient } from '@clerk/backend';

interface ClerkSession {
  userId: string;
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private client: ClerkClient;

  constructor(private configService: ConfigService) {
    this.client = createClerkClient({
      secretKey: this.configService.get<string>('CLERK_SECRET_KEY')!,
    });
  }

  async createUser(data: { emailAddress: string; firstName?: string; lastName?: string; username?: string }): Promise<ClerkUser | null> {
    try {
      const user = await this.client.users.createUser({
        emailAddress: [data.emailAddress],
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      });
      return user as ClerkUser;
    } catch (error) {
      this.logger.error('Failed to create user in Clerk:', error);
      return null;
    }
  }

  async getUserById(clerkUserId: string): Promise<ClerkUser | null> {
    try {
      const user = await this.client.users.getUser(clerkUserId);
      return user as ClerkUser;
    } catch (error) {
      this.logger.error(`Failed to get user ${clerkUserId} from Clerk:`, error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<ClerkUser | null> {
    try {
      const users = await this.client.users.getUserList({
        emailAddress: [email],
      });
      return users.data.length > 0 ? (users.data[0] as ClerkUser) : null;
    } catch (error) {
      this.logger.error(`Failed to get user by email ${email} from Clerk:`, error);
      return null;
    }
  }

  async updateUser(clerkUserId: string, data: Partial<ClerkUser>): Promise<ClerkUser | null> {
    try {
      const user = await this.client.users.updateUser(clerkUserId, data);
      return user as ClerkUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${clerkUserId} in Clerk:`, error);
      return null;
    }
  }

  async deleteUser(clerkUserId: string): Promise<boolean> {
    try {
      await this.client.users.deleteUser(clerkUserId);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete user ${clerkUserId} from Clerk:`, error);
      return false;
    }
  }

  async verifySession(sessionId: string, token: string): Promise<ClerkSession | null> {
    try {
      const session = await this.client.sessions.verifySession(sessionId, token);
      return session as ClerkSession;
    } catch (error) {
      this.logger.error('Failed to verify session:', error);
      return null;
    }
  }
}