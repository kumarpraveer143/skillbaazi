import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { SendFollowRequestDto } from './dto/send-follow-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('request')
  sendRequest(@GetUser('id') userId: string, @Body() dto: SendFollowRequestDto) {
    return this.followsService.sendRequest(userId, dto);
  }

  @Get('requests')
  getRequests(@GetUser('id') userId: string) {
    return this.followsService.getRequests(userId);
  }

  @Post('requests/:id/accept')
  acceptRequest(@GetUser('id') userId: string, @Param('id') requestId: string) {
    return this.followsService.respondRequest(userId, requestId, true);
  }

  @Post('requests/:id/reject')
  rejectRequest(@GetUser('id') userId: string, @Param('id') requestId: string) {
    return this.followsService.respondRequest(userId, requestId, false);
  }

  @Delete(':id')
  unfollow(@GetUser('id') userId: string, @Param('id') followingId: string) {
      return this.followsService.unfollow(userId, followingId);
  }
}
