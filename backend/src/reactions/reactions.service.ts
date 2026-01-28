import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async toggle(userId: string, dto: CreateReactionDto) {
    const post = await this.prisma.post.findUnique({ where: { id: dto.postId }});
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.$transaction(async (tx) => {
        const existing = await tx.reaction.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId: dto.postId
                }
            }
        });

        if (existing) {
            if (existing.type === dto.type) {
                // Remove (Toggle off) -> Decrement count
                await tx.reaction.delete({ where: { id: existing.id } });
                
                await tx.reactionSummary.upsert({
                    where: { postId: dto.postId },
                    create: { postId: dto.postId, [this.getCountField(existing.type)]: 0 }, 
                    update: { [this.getCountField(existing.type)]: { decrement: 1 } }
                });
                
                return { message: 'Reaction removed' };
            } else {
                // Change type -> Decrement old, Increment new
                const updated = await tx.reaction.update({
                    where: { id: existing.id },
                    data: { type: dto.type }
                });

                await tx.reactionSummary.upsert({
                    where: { postId: dto.postId },
                    create: { postId: dto.postId, [this.getCountField(dto.type)]: 1 },
                    update: {
                        [this.getCountField(existing.type)]: { decrement: 1 },
                        [this.getCountField(dto.type)]: { increment: 1 }
                    }
                });
                return updated;
            }
        }

        // New Reaction -> Increment
        const reaction = await tx.reaction.create({
            data: {
                postId: dto.postId,
                userId,
                type: dto.type
            }
        });

        await tx.reactionSummary.upsert({
            where: { postId: dto.postId },
            create: { postId: dto.postId, [this.getCountField(dto.type)]: 1 },
            update: { [this.getCountField(dto.type)]: { increment: 1 } }
        });

        if (post.authorId !== userId) {
            await this.notificationsService.create(
                post.authorId,
                'POST_REACTION',
                'Someone reacted to your post'
            );
        }

        return reaction;
    });
  }

  private getCountField(type: string): string {
    switch (type) {
        case 'LIKE': return 'likeCount';
        case 'USEFUL': return 'usefulCount';
        case 'FUNNY': return 'funnyCount';
        case 'INSIGHTFUL': return 'insightfulCount';
        default: return 'likeCount';
    }
  }
}
