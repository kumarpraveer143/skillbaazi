import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockUserDto } from './dto/block-user.dto';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, dto: BlockUserDto) {
    if (blockerId === dto.blockedId) throw new BadRequestException('Cannot block self');

    // Transaction: Block user, remove follows, remove requests
    return this.prisma.$transaction(async (tx) => {
        // Create block
        const block = await tx.block.create({
            data: {
                blockerId,
                blockedId: dto.blockedId
            }
        });

        // Remove follows (both directions)
        await tx.follow.deleteMany({
            where: {
                OR: [
                    { followerId: blockerId, followingId: dto.blockedId },
                    { followerId: dto.blockedId, followingId: blockerId }
                ]
            }
        });

        // Remove requests (both directions)
        await tx.followRequest.deleteMany({
            where: {
                OR: [
                    { senderId: blockerId, receiverId: dto.blockedId },
                    { senderId: dto.blockedId, receiverId: blockerId }
                ]
            }
        });

        return block;
    });
  }

  async unblock(blockerId: string, blockedId: string) {
      const block = await this.prisma.block.delete({
          where: {
              blockerId_blockedId: {
                  blockerId,
                  blockedId
              }
          }
      });
      return { message: 'Unblocked' };
  }
}
