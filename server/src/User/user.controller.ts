
import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query, BadRequestException, UnauthorizedException, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/User/user.dto';
import { query } from 'express';
import * as bcrypt from 'bcrypt';

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

  @Get('name')
  findName(@Query('name') name: string){
    return this.userService.findName(name)
  }

  @Get('auth')
  Auth(@Query('email') email: string, @Query('password') password: string) {
    return this.userService.Auth(email, password);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Delete()
  async DeleteUser(@Query('email') email: string, @Query('password') password: string){
    return this.userService.DeleteUser(email, password);
  }
}
