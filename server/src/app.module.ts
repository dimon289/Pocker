import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';
import { PockerModule } from './pocker/pocker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [UserModule, ConfigModule.forRoot({isGlobal: true}), PlayerModule, RoomsModule, PockerModule, ScheduleModule.forRoot(), AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule  {}
