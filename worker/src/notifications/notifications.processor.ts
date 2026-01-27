
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { userId, type, message } = job.data;

    if (job.name === 'create-notification') {
        try {
             await this.prisma.notification.create({
                data: {
                  userId,
                  type,
                  message,
                },
              });
              console.log(`Notification created for user ${userId}`);
        } catch (error) {
            console.error(`Failed to create notification`, error);
            throw error;
        }
    }
  }
}
