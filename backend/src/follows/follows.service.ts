  import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { NotificationsService } from '../notifications/notifications.service';
  import { SendFollowRequestDto } from './dto/send-follow-request.dto';
  import { FollowStatus, NotificationType } from '@prisma/client';

  @Injectable()
  export class FollowsService {
    constructor(
      private prisma: PrismaService,
      private notificationsService: NotificationsService,
    ) {}

    async sendRequest(senderId: string, dto: SendFollowRequestDto) {
      if (senderId === dto.receiverId) {
        throw new BadRequestException('Cannot follow yourself');
      }

      const receiver = await this.prisma.user.findUnique({
        where: { id: dto.receiverId },
      });
      if (!receiver) throw new NotFoundException('User not found');

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
      }

      if (receiver.isPrivate) {
        const request = await this.prisma.followRequest.upsert({
          where: { senderId_receiverId: { senderId, receiverId: dto.receiverId } },
          update: { status: FollowStatus.PENDING },
          create: {
            senderId,
            receiverId: dto.receiverId,
            status: FollowStatus.PENDING,
          },
        });
        
        await this.notificationsService.create(
          dto.receiverId,
          'FOLLOW_REQUEST',
          'New follow request'
        );
        return { message: 'Follow request sent', request };
      } else {
        await this.prisma.$transaction(async (tx) => {
            await tx.follow.create({
                data: {
                    followerId: senderId,
                    followingId: dto.receiverId
                }
            });
            await tx.followRequest.upsert({
                where: { senderId_receiverId: { senderId, receiverId: dto.receiverId } },
                update: { status: FollowStatus.ACCEPTED },
                create: {
                      senderId,
                      receiverId: dto.receiverId,
                      status: FollowStatus.ACCEPTED
                }
            });
        });
        // Notification outside transaction to avoid clutter or complex mocks
        await this.notificationsService.create(
          dto.receiverId,
          'FOLLOW_ACCEPTED',
          'New follower'
        );
        
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
            await this.prisma.$transaction(async (tx) => {
                await tx.followRequest.update({
                    where: { id: requestId },
                    data: { status: FollowStatus.ACCEPTED }
                });
                await tx.follow.create({
                    data: {
                        followerId: request.senderId,
                        followingId: userId
                    }
                });
            });
            
            await this.notificationsService.create(
              request.senderId,
              'FOLLOW_ACCEPTED',
              'Follow request accepted'
            );

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
