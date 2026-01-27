import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          company: true,
          skills: true,
          isPrivate: true,
          role: true,
          _count: {
              select: {
                  followers: true,
                  following: true,
                  posts: true
              }
          }
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
    });
    delete user.password;
    return user;
  }

  async getFollowers(userId: string) {
      // In a real app, adding pagination is crucial here.
      // For simplicity/requirement fulfilling i'll return list.
      return this.prisma.follow.findMany({
          where: { followingId: userId },
          include: {
              follower: {
                  select: {
                      id: true,
                      name: true,
                      email: true
                  }
              }
          }
      });
  }

  async getFollowing(userId: string) {
       return this.prisma.follow.findMany({
          where: { followerId: userId },
          include: {
              following: {
                  select: {
                      id: true,
                      name: true,
                      email: true
                  }
              }
          }
      });
  }
}
