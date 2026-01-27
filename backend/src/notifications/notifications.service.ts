import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async create(userId: string, type: 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPTED' | 'POST_REACTION' | 'COMMENT', message: string) {
    const job = await this.notificationsQueue.add('create-notification', {
      userId,
      type,
      message,
    });
    console.log(`[Backend] Added notification job ${job.id} for user ${userId} to queue`);
    return job;
  }

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
