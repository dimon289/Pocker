import { Controller, Post, Body } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto } from './rooms.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.createRoom(createRoomDto);
  }

  @Post('join')
  async joinRoom(@Body() joinRoomDto: JoinRoomDto) {
  }
  
  async getRoomByID(roomid: number) {
    return this.roomsService.findRoom(roomid)
  }
}

