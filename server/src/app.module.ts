import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';
import { PockerModule } from './pocker/pocker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { StepModule } from './step/step.module';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { StepModule } from './step/step.module';


@Module({
  imports: [UserModule, ConfigModule.forRoot({isGlobal: true}), PlayerModule, RoomsModule, PockerModule, ScheduleModule.forRoot(), AuthModule, StepModule, UsersModule],
  controllers: [],
  providers: [UsersService],
})
export class AppModule  {}
