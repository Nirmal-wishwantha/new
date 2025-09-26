// ===== src/app.service.ts =====
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'BookingLayer API is running successfully!';
  }
}