import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from 'src/User/user.module';


@Module({
  imports: [UserModule],
  controllers: [],
  providers: [],
})
export class AppModule  {}
