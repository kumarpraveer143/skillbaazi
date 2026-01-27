import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, userId: string) {
    // Ensure ownership
    // updateMany is safer to ensure userId matches
    return this.prisma.notification.updateMany({
        where: {
            id,
            userId
        },
        data: { isRead: true }
    });
  }
}
