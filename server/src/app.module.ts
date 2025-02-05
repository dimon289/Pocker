import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [UserModule, ConfigModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule  {}
