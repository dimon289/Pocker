import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';
import { PockerModule } from './pocker/pocker.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [UserModule, ConfigModule.forRoot(), PlayerModule, RoomsModule, PockerModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule  {}
