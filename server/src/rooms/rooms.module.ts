import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from '../prisma.service';
import { RoomsGateway } from './rooms.gateway';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, RoomsGateway],
})
export class RoomsModule {}
