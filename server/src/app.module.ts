import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';
import { PockerModule } from './pocker/pocker.module';


@Module({
  imports: [UserModule, ConfigModule.forRoot(), PlayerModule, RoomsModule, PockerModule],
  controllers: [],
  providers: [],
})
export class AppModule  {}
