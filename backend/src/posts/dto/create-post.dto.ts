import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsEnum(PostType)
  type: PostType;
}
