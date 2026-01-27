import { IsNotEmpty, IsString } from 'class-validator';

export class SendFollowRequestDto {
  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
