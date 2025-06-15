import { Controller, Post,Get, Body } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto } from './rooms.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.createRoom(createRoomDto);
    return  room ;
  }

  @Post('join')
  async joinRoom(@Body() joinRoomDto: JoinRoomDto) {
  }

  @Get('all')
  async getAll(){
    return await this.roomsService.findAllRooms()
  }

  async getRoomByID(roomid: number) {
    return await this.roomsService.findRoom(roomid)
  }
}

