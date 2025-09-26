import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkService } from '../services/clerk.service';
import { UserService } from '../services/user.service';

interface ClerkJwtPayload {
  sid: string;
}

interface ClerkSession {
  userId: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private clerkService: ClerkService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const sessionToken = authHeader.substring(7);

    try {
      const payload = await verifyToken(sessionToken, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY')!,
      }) as ClerkJwtPayload;

      const sessionId = payload.sid;
      const session = await this.clerkService.verifySession(sessionId, sessionToken) as ClerkSession;

      if (!session) {
        throw new UnauthorizedException('Invalid session token');
      }

      const user = await this.userService.findByClerkId(session.userId);
      await this.userService.updateLastLogin(user.user_id);
      request.user = user;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}