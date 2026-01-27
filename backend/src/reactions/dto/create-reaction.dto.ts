import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReactionType } from '@prisma/client';

export class CreateReactionDto {
  @IsNotEmpty()
  @IsString()
  postId: string;

  @IsEnum(ReactionType)
  type: ReactionType;
}
