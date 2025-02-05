import { Module } from '@nestjs/common';
import { UserService } from 'src/User/user.service';
import { UserController } from 'src/User/user.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule {}
