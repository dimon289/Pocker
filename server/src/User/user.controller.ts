import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query, BadRequestException, UnauthorizedException, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto} from 'src/User/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = req.user;

    await this.userService.updateUserOnlineStatus(user.email);
    return user
  }
  
  @Get()
  findAll() {
    return this.userService.findAll();
  }
  @Get('id')
  findId(@Query("id") id: string){
    return this.userService.findId(id);
  }
  @Get('email')
  findEmail(@Query("email") email: string){
    return this.userService.findEmail(email);
  }

  @Get('name')
  findName(@Query('name') name: string){
    return this.userService.findName(name)
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
