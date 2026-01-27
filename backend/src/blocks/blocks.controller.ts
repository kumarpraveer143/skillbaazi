import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlockUserDto } from './dto/block-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  block(@GetUser('id') userId: string, @Body() dto: BlockUserDto) {
    return this.blocksService.block(userId, dto);
  }

  @Delete(':id')
  unblock(@GetUser('id') userId: string, @Param('id') blockedId: string) {
    return this.blocksService.unblock(userId, blockedId);
  }
}
