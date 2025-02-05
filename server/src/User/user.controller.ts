import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/User/user.dto';
import { query } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('email')
  findEmail(@Query("email") email: string){
    return this.userService.findEmail(email);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
