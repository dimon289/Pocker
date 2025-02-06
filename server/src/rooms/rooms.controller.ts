import { Controller, Get, Body, Post, ValidationPipe, UsePipes, Query, BadRequestException, UnauthorizedException, Delete } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './rooms.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }


}
