import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "../output/entities/Users";
import { UserService } from 'src/User/user.service';
import { UserController } from 'src/User/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [UserController],
  providers: [UserService],
  
})
export class UserModule {}
