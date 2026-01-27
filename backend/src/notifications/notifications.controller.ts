import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  getUnread(@GetUser('id') userId: string) {
    return this.notificationsService.getUnread(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }
}
