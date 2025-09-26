// src/modules/realtime/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../database/supabase.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private supabaseService: SupabaseService) {
    this.setupSupabaseSubscriptions();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_user_updates')
  handleJoinUserUpdates(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined user_${userId} room`);
  }

  private setupSupabaseSubscriptions() {
    // Subscribe to user changes
    this.supabaseService.subscribeToTable('users', (payload) => {
      this.logger.log(`User table change detected: ${JSON.stringify(payload)}`);
      
      // Broadcast to all clients in the user's room
      if (payload.new?.user_id) {
        this.server.to(`user_${payload.new.user_id}`).emit('user_updated', payload);
      }
      
      // Broadcast to admin clients
      this.server.to('admin_updates').emit('user_change', payload);
    });
  }
}