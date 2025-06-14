import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { PrismaService } from 'src/prisma.service';
import { RoomsService } from '../rooms/rooms.service'

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, PrismaService, RoomsService],
  exports: [PlayerService],
})
export class PlayerModule {}
