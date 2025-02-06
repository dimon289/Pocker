import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from './player/player.module';
import { RoomsModule } from './rooms/rooms.module';


@Module({
  imports: [UserModule, ConfigModule.forRoot(), PlayerModule, RoomsModule],
  controllers: [],
  providers: [],
})
export class AppModule  {}
