import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, dto: CreateReactionDto) {
    const post = await this.prisma.post.findUnique({ where: { id: dto.postId }});
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.reaction.findUnique({
        where: {
            userId_postId: {
                userId,
                postId: dto.postId
            }
        }
    });

    if (existing) {
        if (existing.type === dto.type) {
            // Remove if same type (toggle off)
            await this.prisma.reaction.delete({
                where: { id: existing.id }
            });
            return { message: 'Reaction removed' };
        } else {
            // Update type if different
            const updated = await this.prisma.reaction.update({
                where: { id: existing.id },
                data: { type: dto.type }
            });
            return updated;
        }
    }

    return this.prisma.reaction.create({
        data: {
            postId: dto.postId,
            userId,
            type: dto.type
        }
    });
  }
}
