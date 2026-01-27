import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendFollowRequestDto } from './dto/send-follow-request.dto';
import { FollowStatus, NotificationType } from '@prisma/client';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(senderId: string, dto: SendFollowRequestDto) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('User not found');

    // Check existing request
    const existingRequest = await this.prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId: dto.receiverId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === FollowStatus.PENDING) {
        throw new BadRequestException('Request already pending');
      } else if (existingRequest.status === FollowStatus.ACCEPTED) {
        throw new BadRequestException('Already following');
      }
      // If rejected/cancelled, maybe allow again? Assuming yes for now, or just update status
    }

    // Check blocking (omitted)

    if (receiver.isPrivate) {
      // Create pending request
      const request = await this.prisma.followRequest.upsert({
        where: { senderId_receiverId: { senderId, receiverId: dto.receiverId } },
        update: { status: FollowStatus.PENDING },
        create: {
          senderId,
          receiverId: dto.receiverId,
          status: FollowStatus.PENDING,
        },
      });
      // Send notification
       await this.prisma.notification.create({
            data: {
                type: NotificationType.FOLLOW_REQUEST,
                message: 'New follow request',
                userId: dto.receiverId
            }
        });
      return { message: 'Follow request sent', request };
    } else {
      // Auto accept
      await this.prisma.$transaction([
          this.prisma.follow.create({
              data: {
                  followerId: senderId,
                  followingId: dto.receiverId
              }
          }),
          this.prisma.followRequest.upsert({
               where: { senderId_receiverId: { senderId, receiverId: dto.receiverId } },
               update: { status: FollowStatus.ACCEPTED },
               create: {
                    senderId,
                    receiverId: dto.receiverId,
                    status: FollowStatus.ACCEPTED
               }
          }),
          this.prisma.notification.create({
            data: {
                type: NotificationType.FOLLOW_ACCEPTED,
                message: 'New follower',
                userId: dto.receiverId
            }
        })
      ]);
      
      return { message: 'Followed successfully' };
    }
  }

  async getRequests(userId: string) {
    return this.prisma.followRequest.findMany({
      where: {
        receiverId: userId,
        status: FollowStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async respondRequest(userId: string, requestId: string, accept: boolean) {
      const request = await this.prisma.followRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundException('Request not found');
      
      if (request.receiverId !== userId) {
          throw new BadRequestException('Not your request');
      }

      if (accept) {
          await this.prisma.$transaction([
              this.prisma.followRequest.update({
                  where: { id: requestId },
                  data: { status: FollowStatus.ACCEPTED }
              }),
              this.prisma.follow.create({
                  data: {
                      followerId: request.senderId,
                      followingId: userId
                  }
              }),
              this.prisma.notification.create({
                  data: {
                      type: NotificationType.FOLLOW_ACCEPTED,
                      message: 'Follow request accepted',
                      userId: request.senderId
                  }
              })
          ]);
          return { message: 'Request accepted' };
      } else {
          await this.prisma.followRequest.update({
              where: { id: requestId },
              data: { status: FollowStatus.REJECTED }
          });
          return { message: 'Request rejected' };
      }
  }

  async unfollow(followerId: string, followingId: string) {
      const follow = await this.prisma.follow.findUnique({
          where: {
              followerId_followingId: {
                  followerId,
                  followingId
              }
          }
      });
      if (!follow) throw new NotFoundException('Not following');

      await this.prisma.$transaction([
          this.prisma.follow.delete({
              where: { id: follow.id }
          }),
           // Also update request status to cancelled or deleted?
           this.prisma.followRequest.update({ // Optional but clean
               where: { senderId_receiverId: { senderId: followerId, receiverId: followingId } },
               data: { status: FollowStatus.CANCELLED }
           })
      ]);
      return { message: 'Unfollowed' };
  }
}
