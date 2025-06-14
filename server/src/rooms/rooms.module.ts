import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from '../prisma.service';
import { RoomsGateway } from './rooms.gateway';
import { PlayerService } from 'src/player/player.service';

@Module({
  imports:[PlayerService],
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, RoomsGateway,PlayerService],
})
export class RoomsModule {}
