import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from '../prisma.service';
import { RoomsGateway } from './rooms.gateway';
import { PlayerModule } from 'src/player/player.module';
import { PockerModule } from 'src/pocker/pocker.module';
import { StepModule } from 'src/step/step.module';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [PrismaService, PlayerModule, PockerModule, StepModule, UserModule],
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, RoomsGateway],
})
export class RoomsModule {}
