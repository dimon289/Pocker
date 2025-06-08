
import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query, BadRequestException, UnauthorizedException, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto} from 'src/User/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
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
  
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateUser(@Query('email') email: string, @Body() dto: UpdateUserDto) {
    if (!email) {
      throw new BadRequestException('Потрібно передати email користувача');
    }
    return this.userService.updateUser(email, dto);
  }

  @Delete()
  async DeleteUser(@Query('email') email: string, @Query('password') password: string){
    return this.userService.DeleteUser(email, password);
  }
}
