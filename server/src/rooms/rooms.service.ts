import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoomDto, JoinRoomDto } from './rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto) {

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        password: dto.pass ?? '',
        usersid: [dto.userID],
        status: 'Waiting'
      },
    });

    return room;
  }

  async findRoom(roomid: number) {
    const room = await this.prisma.room.findUnique({where: {id: roomid}})
    return room || false 
  }

  async findAllRoom(roomid: number) {
    const rooms = await this.prisma.room.findMany()
    return rooms|| false 
  }
  

}