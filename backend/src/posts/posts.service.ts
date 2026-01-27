import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: dto.content,
        type: dto.type,
        authorId: userId,
      },
    });
  }

  async getFeed(page: number = 1, limit: number = 10) {
      const skip = (page - 1) * limit;
      
      const [posts, total] = await this.prisma.$transaction([
          this.prisma.post.findMany({
              take: limit,
              skip: skip,
              orderBy: { createdAt: 'desc' },
              include: {
                  author: {
                      select: {
                          id: true,
                          name: true,
                          email: true
                      }
                  },
                  _count: {
                      select: {
                          comments: true,
                          reactions: true
                      }
                  }
              }
          }),
          this.prisma.post.count()
      ]);

      return {
          data: posts,
          meta: {
              total,
              page,
              last_page: Math.ceil(total / limit)
          }
      };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
          author: {
              select: {
                  id: true,
                  name: true
              }
          },
          comments: {
               include: {
                   user: {
                       select: { id: true, name: true }
                   }
               },
               orderBy: { createdAt: 'asc' } 
          },
          reactions: true
      }
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async remove(id: string, userId: string) {
      const post = await this.prisma.post.findUnique({ where: { id }});
      if (!post) throw new NotFoundException('Post not found');
      
      if (post.authorId !== userId) {
          throw new ForbiddenException('You can only delete your own posts');
      }

      return this.prisma.post.delete({ where: { id } });
  }
}
